/**
 * 负责：统一判断节庆/书籍/提醒/任意内容节点是否命中触发条件。
 * 也负责：节庆日期窗口计算、提醒默认文案、书籍摘要可否暴露给 LLM 的判定。
 * 不负责：worldbook 原始读取，也不负责最终注入执行。
 */
import _ from 'lodash';
import { compareDatePoint, getRelativeDayDistance, isPointInsideRange, parseMonthDayWithYear } from './date';
import { resolveCalendarRuntimeNodeText } from './runtime-worldbook-resolver';
import type {
  日历运行时书籍条目,
  日历运行时内容节点,
  日历运行时原子条件,
  日历运行时变量条件,
  日历运行时提醒状态,
  日历运行时日期窗口条件,
  日历运行时节庆阶段条目,
  日历运行时节庆条目,
  日历运行时触发映射,
  日历运行时逻辑条件,
} from './runtime-worldbook-types';
import { readCurrentWorldTime } from './storage';
import type { DatePoint } from './types';

export interface 日历运行时触发上下文 {
  当前日期?: DatePoint | null;
  最近消息文本?: string[];
  最近用户消息文本?: string[];
  变量表?: Record<string, unknown>;
}

export interface 日历运行时触发结果 {
  命中: boolean;
  原因: string[];
}

export interface 日历运行时节庆窗口结果 {
  开始: DatePoint;
  结束: DatePoint;
  距离开始天数: number;
  是否进行中: boolean;
  是否在提醒窗口: boolean;
}

export interface 日历运行时提醒解析结果 {
  正文: string;
  状态: '未命中' | '未开始' | '进行中';
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}

export interface 日历运行时书籍摘要解析结果 {
  正文: string;
  可提供给LLM: boolean;
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}

function 规范化文本(value: unknown): string {
  return String(value ?? '').trim();
}

function 规范化文本数组(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map(value => 规范化文本(value)).filter(Boolean);
}

function 推断年份(now: DatePoint, month: number): number {
  if (month + 6 < now.month) {
    return now.year + 1;
  }
  if (month - 6 > now.month) {
    return now.year - 1;
  }
  return now.year;
}

function 解析周期举办年份(year: number, intervalYears?: number, lastYear?: number): number {
  const interval = Math.floor(Number(intervalYears));
  const last = Math.floor(Number(lastYear));
  if (!Number.isFinite(interval) || interval <= 1 || !Number.isFinite(last)) {
    return year;
  }
  const remainder = (((year - last) % interval) + interval) % interval;
  const previous = year - remainder;
  const next = previous + interval;
  return Math.abs(year - previous) <= Math.abs(next - year) ? previous : next;
}

function 解析节庆日期范围(festival: 日历运行时节庆条目, now: DatePoint): { 开始: DatePoint; 结束: DatePoint } | null {
  const 开始文本 = 规范化文本(festival.开始);
  const 结束文本 = 规范化文本(festival.结束 || festival.开始);
  if (!开始文本 || !结束文本) {
    return null;
  }

  const 开始月份 = Number(开始文本.split('-')[0]);
  const 举办年份 = 解析周期举办年份(推断年份(now, 开始月份), festival.周期?.每隔年, festival.周期?.上次年份);
  const 开始 = parseMonthDayWithYear(开始文本, 举办年份);
  let 结束 = parseMonthDayWithYear(结束文本, 举办年份);
  if (!开始 || !结束) {
    return null;
  }
  if (compareDatePoint(结束, 开始) < 0) {
    结束 = parseMonthDayWithYear(结束文本, 举办年份 + 1);
    if (!结束) {
      return null;
    }
  }

  return compareDatePoint(开始, 结束) <= 0 ? { 开始, 结束 } : { 开始: 结束, 结束: 开始 };
}

function 文本包含关键字(texts: string[], keyword: string): boolean {
  if (!keyword) {
    return false;
  }
  return texts.some(text => text.includes(keyword));
}

function 评估文本列表包含任一(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.some(keyword => 文本包含关键字(texts, keyword));
}

function 评估文本列表包含全部(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.every(keyword => 文本包含关键字(texts, keyword));
}

function 评估文本列表不包含任一(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.every(keyword => !文本包含关键字(texts, keyword));
}

function 安全字符串(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(item => 安全字符串(item)).join('\n');
  }
  if (_.isPlainObject(value)) {
    return JSON.stringify(value);
  }
  return 规范化文本(value);
}

function 尝试解析日期点(value: unknown, fallbackYear?: number): DatePoint | null {
  if (!value) {
    return null;
  }
  if (_.isPlainObject(value)) {
    const year = Number((value as Record<string, unknown>).year);
    const month = Number((value as Record<string, unknown>).month);
    const day = Number((value as Record<string, unknown>).day);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  }

  const text = 规范化文本(value);
  if (!text) {
    return null;
  }

  const full = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (full) {
    return {
      year: Number(full[1]),
      month: Number(full[2]),
      day: Number(full[3]),
    };
  }

  const fantasy = text.match(/(?:复兴纪元)?\s*(\d+)\s*年[-/ ]?(\d{1,2})\s*月[-/ ]?(\d{1,2})\s*日/);
  if (fantasy) {
    return {
      year: Number(fantasy[1]),
      month: Number(fantasy[2]),
      day: Number(fantasy[3]),
    };
  }

  const monthDay = text.match(/(\d{1,2})[-/月](\d{1,2})日?/);
  if (monthDay) {
    const year = fallbackYear ?? new Date().getFullYear();
    return parseMonthDayWithYear(`${monthDay[1]}-${monthDay[2]}`, year);
  }

  return null;
}

function 解析当前日期(context: 日历运行时触发上下文, path?: string): DatePoint | null {
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  if (path) {
    const fromVariable = 尝试解析日期点(_.get(variables, path), context.当前日期?.year);
    if (fromVariable) {
      return fromVariable;
    }
  }
  if (context.当前日期) {
    return context.当前日期;
  }
  return readCurrentWorldTime().point ?? null;
}

function 评估变量条件(condition: 日历运行时变量条件, variables: Record<string, unknown>): boolean {
  const path = 规范化文本(condition.路径);
  if (!path) {
    return true;
  }

  const value = _.get(variables, path);
  if ((value === undefined || value === null || value === '') && condition.为空时视为未命中 !== false) {
    return false;
  }

  const actualText = 安全字符串(value);
  if (condition.等于 !== undefined) {
    return actualText === 安全字符串(condition.等于);
  }
  if (condition.正则) {
    try {
      if (!new RegExp(condition.正则).test(actualText)) {
        return false;
      }
    } catch {
      return false;
    }
  }
  if (condition.包含全部 && condition.包含全部.length > 0) {
    if (!condition.包含全部.every(keyword => actualText.includes(keyword))) {
      return false;
    }
  }
  if (condition.包含任一 && condition.包含任一.length > 0) {
    if (!condition.包含任一.some(keyword => actualText.includes(keyword))) {
      return false;
    }
  }
  if (condition.不包含任一 && condition.不包含任一.length > 0) {
    if (!condition.不包含任一.every(keyword => !actualText.includes(keyword))) {
      return false;
    }
  }
  return true;
}

function 构建日期窗口(
  condition: 日历运行时日期窗口条件,
  context: 日历运行时触发上下文,
): {
  当前日期: DatePoint;
  开始: DatePoint;
  结束: DatePoint;
  提前天数: number;
  延后天数: number;
} | null {
  const 当前日期 = 解析当前日期(context, condition.路径);
  if (!当前日期) {
    return null;
  }

  const 开始文本 = 规范化文本(condition.开始);
  const 结束文本 = 规范化文本(condition.结束 || condition.开始);
  if (!开始文本 || !结束文本) {
    return null;
  }

  const 开始月份 = Number(开始文本.split('-')[0]);
  const 举办年份 = 解析周期举办年份(推断年份(当前日期, 开始月份), condition.每隔年, condition.上次年份);
  const 开始 = parseMonthDayWithYear(开始文本, 举办年份);
  let 结束 = parseMonthDayWithYear(结束文本, 举办年份);
  if (!开始 || !结束) {
    return null;
  }
  if (compareDatePoint(结束, 开始) < 0) {
    结束 = parseMonthDayWithYear(结束文本, 举办年份 + 1);
    if (!结束) {
      return null;
    }
  }

  return {
    当前日期,
    开始: compareDatePoint(开始, 结束) <= 0 ? 开始 : 结束,
    结束: compareDatePoint(开始, 结束) <= 0 ? 结束 : 开始,
    提前天数: Math.max(0, Number(condition.提前天数 ?? 0)),
    延后天数: Math.max(0, Number(condition.延后天数 ?? 0)),
  };
}

function 评估日期条件(condition: 日历运行时日期窗口条件, context: 日历运行时触发上下文): boolean {
  const window = 构建日期窗口(condition, context);
  if (!window) {
    return false;
  }

  const 距离开始天数 = getRelativeDayDistance(window.当前日期, window.开始);
  const 是否进行中 = isPointInsideRange(window.当前日期, { start: window.开始, end: window.结束 });
  const 在延后范围内 =
    compareDatePoint(window.当前日期, window.结束) > 0
      ? getRelativeDayDistance(window.结束, window.当前日期) <= window.延后天数
      : true;

  if (condition.仅进行中) {
    return 是否进行中 && 在延后范围内;
  }

  const 是否临近 = window.提前天数 > 0 && 距离开始天数 > 0 && 距离开始天数 <= window.提前天数;
  return (是否进行中 || 是否临近) && 在延后范围内;
}

function 评估原子条件(condition: 日历运行时原子条件, context: 日历运行时触发上下文): boolean {
  const messages = 规范化文本数组(context.最近消息文本);
  const userMessages = 规范化文本数组(context.最近用户消息文本);
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  const checks: boolean[] = [];

  if (condition.日期窗口) {
    checks.push(评估日期条件(condition.日期窗口, context));
  }

  const source = condition.来源 ?? (condition.路径 ? 'mvu变量' : '消息');
  if (source === '消息' || source === '用户消息') {
    const texts = source === '用户消息' ? userMessages : messages;
    if (condition.包含任一 && condition.包含任一.length > 0) {
      checks.push(评估文本列表包含任一(texts, condition.包含任一));
    }
    if (condition.包含全部 && condition.包含全部.length > 0) {
      checks.push(评估文本列表包含全部(texts, condition.包含全部));
    }
    if (condition.不包含任一 && condition.不包含任一.length > 0) {
      checks.push(评估文本列表不包含任一(texts, condition.不包含任一));
    }
    if (condition.等于 !== undefined) {
      checks.push(texts.some(text => text === 安全字符串(condition.等于)));
    }
    if (condition.正则) {
      try {
        const regex = new RegExp(condition.正则);
        checks.push(texts.some(text => regex.test(text)));
      } catch {
        checks.push(false);
      }
    }
  } else {
    const path = 规范化文本(condition.路径);
    const value = path ? _.get(variables, path) : undefined;
    if (
      (value === undefined || value === null || value === '') &&
      condition.为空时视为未命中 !== false &&
      !condition.日期窗口
    ) {
      checks.push(false);
    } else {
      const actualText = 安全字符串(value);
      if (condition.包含任一 && condition.包含任一.length > 0) {
        checks.push(condition.包含任一.some(keyword => actualText.includes(keyword)));
      }
      if (condition.包含全部 && condition.包含全部.length > 0) {
        checks.push(condition.包含全部.every(keyword => actualText.includes(keyword)));
      }
      if (condition.不包含任一 && condition.不包含任一.length > 0) {
        checks.push(condition.不包含任一.every(keyword => !actualText.includes(keyword)));
      }
      if (condition.等于 !== undefined) {
        checks.push(actualText === 安全字符串(condition.等于));
      }
      if (condition.正则) {
        try {
          checks.push(new RegExp(condition.正则).test(actualText));
        } catch {
          checks.push(false);
        }
      }
    }
  }

  return checks.every(Boolean);
}

function 评估逻辑条件(condition: 日历运行时逻辑条件, context: 日历运行时触发上下文): boolean {
  const results: boolean[] = [];

  if (condition.条件) {
    results.push(评估原子条件(condition.条件, context));
  }
  if (condition.全部满足 && condition.全部满足.length > 0) {
    results.push(condition.全部满足.every(item => 评估逻辑条件(item, context)));
  }
  if (condition.任一满足 && condition.任一满足.length > 0) {
    results.push(condition.任一满足.some(item => 评估逻辑条件(item, context)));
  }
  if (condition.都不满足 && condition.都不满足.length > 0) {
    results.push(condition.都不满足.every(item => !评估逻辑条件(item, context)));
  }

  return results.every(Boolean);
}

function 按逻辑合并结果(logic: '全部满足' | '任一满足', values: boolean[]): boolean {
  if (values.length === 0) {
    return true;
  }
  return logic === '全部满足' ? values.every(Boolean) : values.some(Boolean);
}

export function buildCalendarFestivalWindow(
  festival: 日历运行时节庆条目,
  now: DatePoint = readCurrentWorldTime().point ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  },
  reminderDays = 0,
): 日历运行时节庆窗口结果 | null {
  const range = 解析节庆日期范围(festival, now);
  if (!range) {
    return null;
  }

  const 提前天数 = Math.max(0, Number(reminderDays || 0));
  const 距离开始天数 = getRelativeDayDistance(now, range.开始);
  const 是否进行中 = isPointInsideRange(now, { start: range.开始, end: range.结束 });
  const 是否即将开始 = 提前天数 > 0 && 距离开始天数 > 0 && 距离开始天数 <= 提前天数;

  return {
    开始: range.开始,
    结束: range.结束,
    距离开始天数,
    是否进行中,
    是否在提醒窗口: 是否进行中 || 是否即将开始,
  };
}

export function evaluateCalendarRuntimeTrigger(
  trigger: 日历运行时触发映射 | null | undefined,
  context: 日历运行时触发上下文,
): 日历运行时触发结果 {
  if (!trigger || trigger.启用 === false) {
    return { 命中: true, 原因: ['未配置触发或触发已禁用，按默认命中处理'] };
  }

  const messages = 规范化文本数组(context.最近消息文本);
  const userMessages = 规范化文本数组(context.最近用户消息文本);
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  const logic = trigger.默认逻辑 ?? '任一满足';
  const checks: Array<{ label: string; hit: boolean }> = [];

  if (trigger.完整逻辑) {
    checks.push({ label: '完整逻辑', hit: 评估逻辑条件(trigger.完整逻辑, context) });
  }
  if (trigger.消息关键词 && trigger.消息关键词.length > 0) {
    checks.push({ label: '消息关键词', hit: 评估文本列表包含任一(messages, trigger.消息关键词) });
  }
  if (trigger.用户消息包含 && trigger.用户消息包含.length > 0) {
    checks.push({ label: '用户消息包含', hit: 评估文本列表包含任一(userMessages, trigger.用户消息包含) });
  }
  if (trigger.变量条件 && trigger.变量条件.length > 0) {
    checks.push({ label: '变量条件', hit: trigger.变量条件.every(condition => 评估变量条件(condition, variables)) });
  }
  if (trigger.日期条件) {
    checks.push({ label: '日期条件', hit: 评估日期条件(trigger.日期条件, context) });
  }

  if (checks.length === 0) {
    return { 命中: true, 原因: ['未配置任何限制条件'] };
  }

  if (trigger.完整逻辑) {
    const otherChecks = checks.filter(item => item.label !== '完整逻辑');
    const logicCheck = checks.find(item => item.label === '完整逻辑');
    const otherResult =
      otherChecks.length > 0
        ? 按逻辑合并结果(
            logic,
            otherChecks.map(item => item.hit),
          )
        : true;
    const hit = Boolean(logicCheck?.hit) && otherResult;
    return {
      命中: hit,
      原因: hit
        ? checks.filter(item => item.hit).map(item => `${item.label}命中`)
        : checks.filter(item => !item.hit).map(item => `${item.label}未命中`),
    };
  }

  const hit = 按逻辑合并结果(
    logic,
    checks.map(item => item.hit),
  );
  return {
    命中: hit,
    原因: hit
      ? checks.filter(item => item.hit).map(item => `${item.label}命中`)
      : checks.filter(item => !item.hit).map(item => `${item.label}未命中`),
  };
}

function 渲染提醒模板(template: string, festival: 日历运行时节庆条目, window: 日历运行时节庆窗口结果): string {
  return template
    .replaceAll('${节庆名}', festival.名称)
    .replaceAll('${剩余天数}', String(Math.max(0, window.距离开始天数)))
    .replaceAll('${开始日期}', festival.开始)
    .replaceAll('${结束日期}', festival.结束 || festival.开始);
}

function buildDefaultReminderText(
  festival: 日历运行时节庆条目,
  window: 日历运行时节庆窗口结果,
  node: 日历运行时内容节点 | null | undefined,
): { 状态: 日历运行时提醒状态; 正文: string } {
  const defaults = _.isPlainObject(node?.元数据?.提醒默认值)
    ? (node?.元数据?.提醒默认值 as { 缺省模板?: Partial<Record<日历运行时提醒状态, string>> })
    : {};

  const 状态: 日历运行时提醒状态 = window.是否进行中 ? '进行中' : '未开始';
  const custom = 规范化文本(node?.状态正文?.[状态]);
  if (custom) {
    return {
      状态,
      正文: 渲染提醒模板(custom, festival, window),
    };
  }

  const fallback = 规范化文本(defaults.缺省模板?.[状态]);
  if (fallback) {
    return {
      状态,
      正文: 渲染提醒模板(fallback, festival, window),
    };
  }

  return {
    状态,
    正文:
      状态 === '进行中'
        ? `【进行中】${festival.名称}（${festival.开始}${festival.结束 && festival.结束 !== festival.开始 ? ` ~ ${festival.结束}` : ''}）`
        : `【即将开始】${festival.名称}（还有 ${window.距离开始天数} 天，开始于 ${festival.开始}）`,
  };
}

export async function resolveCalendarFestivalReminder(
  festival: 日历运行时节庆条目,
  context: 日历运行时触发上下文,
): Promise<日历运行时提醒解析结果> {
  const now = context.当前日期 ?? readCurrentWorldTime().point ?? null;
  if (!now) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: ['当前没有可用世界时间，无法解析提醒'],
    };
  }

  const 日期条件 = festival.提醒?.触发?.日期条件 ?? { 开始: festival.开始, 结束: festival.结束 };
  const 提前天数 = Number(日期条件?.提前天数 ?? 0);
  const window = buildCalendarFestivalWindow(festival, now, 提前天数);
  if (!window || !window.是否在提醒窗口) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const triggerResult = evaluateCalendarRuntimeTrigger(festival.提醒?.触发, { ...context, 当前日期: now });
  if (!triggerResult.命中) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: triggerResult.原因,
    };
  }

  const fallback = buildDefaultReminderText(festival, window, festival.提醒);
  if (festival.提醒?.输出?.模式 === 'silent_scan') {
    return {
      正文: fallback.正文,
      状态: fallback.状态,
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const resolved = await resolveCalendarRuntimeNodeText({ node: festival.提醒 });
  return {
    正文: resolved.正文 || fallback.正文,
    状态: fallback.状态,
    来源条目名: resolved.来源条目名,
    文本库键: resolved.文本库键,
    警告: resolved.正文 ? resolved.警告 : [...resolved.警告, '提醒正文缺失，已回退到模板文本'],
  };
}

export async function resolveCalendarFestivalStageReminder(
  festival: 日历运行时节庆条目,
  stage: 日历运行时节庆阶段条目,
  context: 日历运行时触发上下文,
): Promise<日历运行时提醒解析结果> {
  if (stage.启用 === false || !stage.提醒) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  return resolveCalendarFestivalReminder(
    {
      ...festival,
      id: `${festival.id}:${stage.id}`,
      名称: `${festival.名称}·${stage.名称}`,
      开始: stage.开始,
      结束: stage.结束 || stage.开始,
      周期: stage.周期 ?? festival.周期,
      提醒: stage.提醒,
    },
    context,
  );
}

export async function resolveCalendarBookAbstract(
  book: 日历运行时书籍条目,
  context: 日历运行时触发上下文,
): Promise<日历运行时书籍摘要解析结果> {
  if (!book.摘要) {
    return {
      正文: '',
      可提供给LLM: false,
      来源条目名: null,
      文本库键: null,
      警告: ['未配置摘要节点，默认不提供给 LLM'],
    };
  }

  const triggerResult = evaluateCalendarRuntimeTrigger(book.摘要.触发, context);
  if (!triggerResult.命中) {
    return {
      正文: '',
      可提供给LLM: false,
      来源条目名: null,
      文本库键: null,
      警告: triggerResult.原因,
    };
  }

  const resolved = await resolveCalendarRuntimeNodeText({ node: book.摘要 });
  return {
    正文: resolved.正文,
    可提供给LLM: Boolean(resolved.正文),
    来源条目名: resolved.来源条目名,
    文本库键: resolved.文本库键,
    警告: resolved.正文 ? resolved.警告 : [...resolved.警告, '摘要为空，默认不向 LLM 暴露摘要'],
  };
}

export async function resolveCalendarContentNode(
  node: 日历运行时内容节点 | null | undefined,
  context: 日历运行时触发上下文,
  options: { ignoreTrigger?: boolean } = {},
): Promise<{ 命中: boolean; 正文: string; 警告: string[] }> {
  if (!node || node.启用 === false) {
    return { 命中: false, 正文: '', 警告: [] };
  }

  if (!options.ignoreTrigger) {
    const triggerResult = evaluateCalendarRuntimeTrigger(node.触发, context);
    if (!triggerResult.命中) {
      return {
        命中: false,
        正文: '',
        警告: triggerResult.原因,
      };
    }
  }

  const resolved = await resolveCalendarRuntimeNodeText({ node });
  return {
    命中: true,
    正文: resolved.正文,
    警告: resolved.警告,
  };
}
