/**
 * 负责：从角色 worldbook / 额外 worldbook 中读取 runtime 索引、文本库与条目来源。
 * 不负责：触发逻辑判定，也不负责 UI dataset 组装。
 * 下游：[`resolveCalendarRuntimeNodeText()`](src/calendar-float/runtime-worldbook/resolver.ts:1)、[`readCalendarRuntimeIndex()`](src/calendar-float/runtime-worldbook/loader.ts:1)、[`scanCalendarRuntimeWorldbook()`](src/calendar-float/runtime-worldbook/scanner.ts:1)。
 */
import { applyCalendarRuntimeDefaults, DEFAULT_MVU_LOCATION_PATH, DEFAULT_MVU_TIME_PATH } from '../runtime-config';
import {
  构建可见注入输出,
  构建静默扫描输出,
  规范化书籍默认值,
  规范化提醒默认值,
  规范化默认设置,
} from './defaults';
import {
  是否对象,
  读取对象,
  读取对象字段,
  读取条目名,
  条目名是否匹配,
  规范化单值或字符串数组,
  规范化名称,
  规范化对象数组,
  规范化数字,
} from './normalizers';
import { resolveCalendarRuntimeWorldbookSources } from './source';
import { 合并触发映射, 规范化触发映射 } from './trigger';
import { 解析Yaml文本 } from './yaml';
import {
  type 日历世界书引用,
  type 日历世界书文本库读取结果,
  type 日历世界书来源条目,
  type 日历世界书索引读取结果,
  type 日历文本库引用,
  type 日历运行时书籍条目,
  type 日历运行时书籍默认值,
  type 日历运行时内容节点,
  type 日历运行时变量条件,
  type 日历运行时提醒默认值,
  type 日历运行时文本库,
  type 日历运行时索引,
  type 日历运行时节庆阶段条目,
  type 日历运行时节庆条目,
  type 日历运行时触发映射,
  type 日历运行时逻辑条件,
  type 日历运行时默认设置,
} from './types';
import { readCalendarSourceConfig } from '../storage';
import type { CalendarSourceConfig, ResolvedCalendarWorldbookSource } from '../types';

export { resolveCalendarRuntimeWorldbookSources } from './source';

const 默认索引条目名候选 = [
  '[fixed_event_index]',
  'fixed_event_index',
  '[固定事件_索引]',
  '固定事件_索引',
  '[节庆_索引]',
  '节庆_索引',
  '[节庆.索引]',
  '节庆.索引',
  'index.yaml',
  'calendar_index',
  'calendar_float_index',
];

function 提取文本库映射(data: unknown): 日历运行时文本库 {
  if (!是否对象(data)) {
    return {};
  }

  const directEntries = Object.entries(data).filter(([, value]) => typeof value === 'string');
  if (directEntries.length > 0) {
    return Object.fromEntries(directEntries.map(([key, value]) => [规范化名称(key), String(value ?? '')]));
  }

  const rawList = Array.isArray(data.条目) ? data.条目 : Array.isArray(data.文本) ? data.文本 : [];
  const mappedList = rawList
    .map(item => {
      if (!是否对象(item)) {
        return null;
      }
      const key = 规范化名称(item.键 ?? item.id ?? item.ID ?? item.名称 ?? item.name);
      const text = item.文本 ?? item.content ?? item.内容 ?? item.text;
      if (!key || typeof text !== 'string') {
        return null;
      }
      return [key, text] as const;
    })
    .filter((item): item is readonly [string, string] => Boolean(item));

  return Object.fromEntries(mappedList);
}

function 规范化月份别名(value: unknown): NonNullable<日历运行时索引['月份别名']> {
  const output: NonNullable<日历运行时索引['月份别名']> = [];
  if (!Array.isArray(value)) {
    return output;
  }

  for (const item of value) {
    if (!是否对象(item)) {
      continue;
    }
    const 月份 = 规范化数字(读取对象字段(item, ['月份', 'month']));
    const 名称 = 规范化名称(读取对象字段(item, ['名称', 'name']));
    if (!月份 || !名称) {
      continue;
    }
    output.push({
      月份,
      名称,
      季节: 规范化名称(读取对象字段(item, ['季节', 'season'])) || undefined,
    });
  }
  return output;
}

function 读取共享地点关键词(item: Record<string, unknown>): string[] {
  return 规范化单值或字符串数组(
    读取对象字段(item, ['地点关键词', '地点', 'location_keywords', 'locationKeywords', 'locations']),
  );
}

function 读取节庆开始前天数(item: Record<string, unknown>): number | undefined {
  const reminder = 读取对象(item, ['提醒', 'reminder']);
  return 规范化数字(
    读取对象字段(item, ['开始前提醒天数', '提前天数', 'start_prepare', 'prepare_days']) ??
      (reminder ? 读取对象字段(reminder, ['开始前提醒天数', '提前天数', 'start_prepare', 'prepare_days']) : undefined),
  );
}

function 读取节庆周期(item: Record<string, unknown>): { 每隔年: number; 上次年份: number } | undefined {
  const source = 读取对象(item, ['周期', '举办周期', 'recurrence']) ?? item;
  const 每隔年 = 规范化数字(读取对象字段(source, ['每隔年', '每X年', '间隔年数', 'intervalYears', 'interval_years']));
  const 上次年份 = 规范化数字(读取对象字段(source, ['上次年份', '上次举办年份', 'lastYear', 'last_year']));
  if (!每隔年 || 每隔年 <= 1 || !上次年份) {
    return undefined;
  }
  return { 每隔年: Math.floor(每隔年), 上次年份: Math.floor(上次年份) };
}

type 运行时固定事件分组 = {
  id: string;
  名称: string;
  图标?: string;
  事件: string[];
};

function 规范化固定事件分组列表(value: unknown): 运行时固定事件分组[] {
  return 规范化对象数组(value)
    .map((item): 运行时固定事件分组 | null => {
      const id = 规范化名称(读取对象字段(item, ['id', '分组id', 'group_id', 'groupId']));
      const 名称 = 规范化名称(读取对象字段(item, ['名称', 'name', 'title'])) || id;
      if (!id || !名称) {
        return null;
      }
      return {
        id,
        名称,
        图标: 规范化名称(读取对象字段(item, ['图标', 'icon', 'iconSvgFilename', 'icon_svg_filename'])) || undefined,
        事件: 取唯一文本(
          规范化单值或字符串数组(读取对象字段(item, ['事件', '固定事件', 'eventIds', 'event_ids', 'events'])),
        ),
      };
    })
    .filter((item): item is 运行时固定事件分组 => Boolean(item));
}

function 建立事件分组映射(groups: 运行时固定事件分组[]): Map<string, string> {
  const output = new Map<string, string>();
  for (const group of groups) {
    for (const eventId of group.事件) {
      if (!output.has(eventId)) {
        output.set(eventId, group.id);
      }
    }
  }
  return output;
}

function 读取消息关键词(value: unknown, aliases: readonly string[]): string[] {
  if (!是否对象(value)) {
    return [];
  }
  return aliases.flatMap(alias => 规范化单值或字符串数组(读取对象字段(value, [alias]))).filter(Boolean);
}

function 收集次要关键字组(value: unknown): Array<{ 逻辑: string; 关键字: string[] }> {
  if (!是否对象(value)) {
    return [];
  }

  const output: Array<{ 逻辑: string; 关键字: string[] }> = [];
  for (const [key, rawGroup] of Object.entries(value)) {
    if (!/^次要关键字\d+$/.test(key) || !是否对象(rawGroup)) {
      continue;
    }
    const 关键字 = 规范化单值或字符串数组(读取对象字段(rawGroup, ['关键字', 'keywords']));
    if (关键字.length === 0) {
      continue;
    }
    output.push({
      逻辑: 规范化名称(读取对象字段(rawGroup, ['逻辑', 'logic'])) || '与任意',
      关键字,
    });
  }
  return output;
}

function 构建关键字节点(
  来源: '消息' | '用户消息',
  模式: '包含任一' | '包含全部' | '不包含任一',
  关键字: string[],
): 日历运行时逻辑条件 | null {
  const normalized = 取唯一文本(关键字);
  if (normalized.length === 0) {
    return null;
  }
  return {
    条件: {
      来源,
      [模式]: normalized,
    },
  };
}

function 构建关键字组逻辑(
  主关键字: string[],
  次要关键字组: Array<{ 逻辑: string; 关键字: string[] }>,
  来源: '消息' | '用户消息',
): 日历运行时逻辑条件 | null {
  const andNodes: 日历运行时逻辑条件[] = [];
  const orNodes: 日历运行时逻辑条件[] = [];

  const 主节点 = 构建关键字节点(来源, '包含任一', 主关键字);
  if (主节点) {
    andNodes.push(主节点);
  }

  for (const group of 次要关键字组) {
    const 原始逻辑 = 规范化名称(group.逻辑);
    const 逻辑 = 原始逻辑.toLowerCase();
    const 关键字 = 取唯一文本(group.关键字);
    if (关键字.length === 0) {
      continue;
    }

    if (['与任意', 'and', 'and_any'].includes(原始逻辑) || ['and', 'and_any'].includes(逻辑)) {
      const node = 构建关键字节点(来源, '包含任一', 关键字);
      if (node) {
        andNodes.push(node);
      }
      continue;
    }

    if (['与全部', 'and_all'].includes(原始逻辑) || ['and_all'].includes(逻辑)) {
      const node = 构建关键字节点(来源, '包含全部', 关键字);
      if (node) {
        andNodes.push(node);
      }
      continue;
    }

    if (['非任意', 'not', 'not_any'].includes(原始逻辑) || ['not', 'not_any'].includes(逻辑)) {
      const node = 构建关键字节点(来源, '不包含任一', 关键字);
      if (node) {
        andNodes.push(node);
      }
      continue;
    }

    const node = 构建关键字节点(来源, '包含任一', 关键字);
    if (node) {
      orNodes.push(node);
    }
  }

  const andLogic =
    andNodes.length === 0
      ? null
      : andNodes.length === 1
        ? andNodes[0]
        : ({ 全部满足: andNodes } satisfies 日历运行时逻辑条件);
  const orLogic =
    orNodes.length === 0
      ? null
      : orNodes.length === 1
        ? orNodes[0]
        : ({ 任一满足: orNodes } satisfies 日历运行时逻辑条件);

  if (andLogic && orLogic) {
    return { 任一满足: [andLogic, orLogic] };
  }
  return andLogic ?? orLogic;
}

function 构建关键字组触发映射(
  value: unknown,
  primaryAliases: readonly string[],
  来源: '消息' | '用户消息',
): 日历运行时触发映射 | null {
  if (!是否对象(value)) {
    return null;
  }
  const 主关键字 = 取唯一文本(读取消息关键词(value, primaryAliases));
  const 次要关键字组 = 收集次要关键字组(value);
  const 完整逻辑 = 构建关键字组逻辑(主关键字, 次要关键字组, 来源);
  return 完整逻辑 ? { 完整逻辑 } : null;
}

function 取唯一文本(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values.map(item => 规范化名称(item)).filter(Boolean)) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

function 使用模板生成关键词(template: string, bookName: string, entryName?: string): string[] {
  const normalizedTemplate = 规范化名称(template);
  const normalizedEntryName = 规范化名称(entryName);
  const fallbackKeyword = normalizedEntryName || bookName;
  if (!normalizedTemplate) {
    return fallbackKeyword ? [fallbackKeyword] : [];
  }
  const rendered = normalizedTemplate
    .replaceAll('${bookname}', bookName)
    .replaceAll('${bookName}', bookName)
    .replaceAll('${entryname}', normalizedEntryName)
    .replaceAll('${entryName}', normalizedEntryName);
  const normalizedRendered = 规范化名称(rendered);
  if (normalizedRendered) {
    return [normalizedRendered];
  }
  return fallbackKeyword ? [fallbackKeyword] : [];
}

function 规范化节点对象(value: unknown): Record<string, unknown> | null {
  if (是否对象(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return { 条目名: value };
  }
  return null;
}

function 构建节庆共享触发映射(
  item: Record<string, unknown>,
  defaults: 日历运行时默认设置 | undefined,
  开始: string,
  结束: string,
  周期?: { 每隔年: number; 上次年份: number },
): 日历运行时触发映射 | null {
  const 显式条件 = 规范化触发映射(
    读取对象字段(item, ['场景条件', '共享条件', '共通条件', '自动条件', 'common_condition', 'commonCondition']),
  );
  if (显式条件) {
    return 显式条件;
  }

  const 变量条件: 日历运行时变量条件[] = [];
  const 地点关键词 = 读取共享地点关键词(item);
  const mvu地点路径 = defaults?.mvu地点路径 || DEFAULT_MVU_LOCATION_PATH;
  const mvu时间路径 = defaults?.mvu时间路径 || DEFAULT_MVU_TIME_PATH;
  const 提前天数 = 读取节庆开始前天数(item);

  if (地点关键词.length > 0) {
    变量条件.push({
      路径: mvu地点路径,
      包含任一: 地点关键词,
    });
  }

  const output: 日历运行时触发映射 = {
    默认逻辑: '全部满足',
    日期条件: {
      路径: mvu时间路径,
      开始,
      结束,
      ...(提前天数 !== undefined ? { 提前天数 } : {}),
      ...(周期 ? { 每隔年: 周期.每隔年, 上次年份: 周期.上次年份 } : {}),
    },
  };

  if (变量条件.length > 0) {
    output.变量条件 = 变量条件;
  }

  return output;
}

function 构建旁路触发映射(消息关键词: string[], 用户消息包含: string[]): 日历运行时触发映射 | null {
  const normalizedMessages = 取唯一文本(消息关键词);
  const normalizedUsers = 取唯一文本(用户消息包含);
  if (normalizedMessages.length === 0 && normalizedUsers.length === 0) {
    return null;
  }
  return {
    默认逻辑: '任一满足',
    ...(normalizedMessages.length > 0 ? { 消息关键词: normalizedMessages } : {}),
    ...(normalizedUsers.length > 0 ? { 用户消息包含: normalizedUsers } : {}),
  };
}

function 读取提醒状态正文(source: Record<string, unknown> | null, status: '未开始' | '进行中'): string | null {
  if (!source) {
    return null;
  }

  const raw = 读取对象字段(source, [status]);
  if (raw === false || raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'boolean') {
    return null;
  }
  if (Array.isArray(raw)) {
    const joined = raw
      .map(item => 规范化名称(item))
      .filter(Boolean)
      .join('\n');
    return joined || null;
  }
  if (是否对象(raw)) {
    const nestedContent = 读取对象字段(raw, ['内容', '內容', 'content', '正文', 'text']);
    if (Array.isArray(nestedContent)) {
      const joined = nestedContent
        .map(item => 规范化名称(item))
        .filter(Boolean)
        .join('\n');
      return joined || null;
    }
    const text = 规范化名称(nestedContent);
    return text || null;
  }
  return null;
}

function 规范化节庆介绍节点(
  festivalId: string,
  festivalName: string,
  value: unknown,
  节庆共享触发: 日历运行时触发映射 | null,
): 日历运行时内容节点 | null {
  const source = 规范化节点对象(value);
  if (!source) {
    return null;
  }

  const 条目名 = 读取条目名(source);
  const 简介 = 规范化名称(读取对象字段(source, ['简介', '摘要', 'summary', 'uiSummary', 'ui_summary']));
  const 显式触发 = 规范化触发映射(读取对象字段(source, ['条件', '触发', 'trigger']));
  const 关键字组触发 = 构建关键字组触发映射(source, ['关键字', '消息关键词', 'event消息关键词'], '消息');
  const 用户消息包含 = 读取消息关键词(source, ['用户消息包含', 'user_keywords']);
  const 旁路触发 = 构建旁路触发映射([], 用户消息包含);
  const 继承共享条件 = 读取对象字段(source, ['继承共享条件', '继承场景条件', 'inherit_common']) !== false;
  const 触发 = 合并触发映射('任一满足', [继承共享条件 ? 节庆共享触发 : null, 显式触发, 关键字组触发, 旁路触发]);

  return {
    id: `${festivalId}:intro`,
    名称: `${festivalName} 介绍`,
    类型: '节庆介绍',
    启用: 读取对象字段(source, ['启用', 'enabled']) === false ? false : true,
    条目: 条目名 ? { 条目名 } : null,
    触发,
    扫描触发词: (() => {
      const tokens = 规范化单值或字符串数组(读取对象字段(source, ['专属触发词', 'scan_tokens', 'scanTokens']));
      if (tokens.length > 0) {
        return tokens;
      }
      return 条目名 ? [条目名] : [];
    })(),
    输出: 构建静默扫描输出(),
    元数据: {
      条目名: 条目名 || undefined,
      简介: 简介 || undefined,
      原始类型: 规范化名称(读取对象字段(source, ['类型', 'type'])) || '节庆介绍',
      共享条件已继承: 继承共享条件,
    },
  };
}

function 渲染节庆提醒宏触发词(template: string | undefined, festivalId: string, festivalName: string): string {
  const normalizedTemplate = 规范化名称(template) || '[[_${id}_reminder_]]';
  return 规范化名称(
    normalizedTemplate
      .replaceAll('${id}', festivalId)
      .replaceAll('${festivalId}', festivalId)
      .replaceAll('${节庆id}', festivalId)
      .replaceAll('${name}', festivalName)
      .replaceAll('${festivalName}', festivalName)
      .replaceAll('${节庆名}', festivalName),
  );
}

function 规范化节庆提醒节点(
  festivalId: string,
  festivalName: string,
  value: unknown,
  defaults: 日历运行时提醒默认值,
  节庆共享触发: 日历运行时触发映射 | null,
): 日历运行时内容节点 | null {
  const source = 规范化节点对象(value);
  if (!source) {
    return null;
  }

  const 自定义正文对象 =
    读取对象(source, ['自定义正文']) ??
    读取对象(source, ['自定义提醒']) ??
    读取对象(source, ['开启自定义提醒']) ??
    null;
  const 显式触发 = 规范化触发映射(读取对象字段(source, ['条件', '触发', 'trigger']));
  const 关键字组触发 = 构建关键字组触发映射(source, ['关键字', '消息关键词'], '消息');
  const 用户消息包含 = 读取消息关键词(source, ['用户消息包含', 'user_keywords']);
  const 旁路触发 = 构建旁路触发映射([], 用户消息包含);
  const 继承共享条件 = 读取对象字段(source, ['继承共享条件', '继承场景条件', 'inherit_common']) !== false;
  const 触发 = 合并触发映射('任一满足', [继承共享条件 ? 节庆共享触发 : null, 显式触发, 关键字组触发, 旁路触发]);
  const 输出模式 = 规范化名称(读取对象字段(source, ['注入方式', 'mode', 'output_mode']));
  const 宏触发词 =
    规范化名称(读取对象字段(source, ['宏触发词', 'macro', 'macro_token', 'macroToken'])) ||
    渲染节庆提醒宏触发词(
      规范化名称(读取对象字段(source, ['宏触发词模板', 'macro_template', 'macroTemplate'])) || defaults.宏触发词模板,
      festivalId,
      festivalName,
    );
  const 使用静默扫描 = 输出模式 ? 输出模式 !== 'injectprompt' : defaults.注入方式 !== 'injectprompt';

  return {
    id: `${festivalId}:reminder`,
    名称: `${festivalName} 提醒`,
    类型: '节庆提醒',
    启用: 读取对象字段(source, ['启用', 'enabled']) === false ? false : true,
    条目: null,
    正文: null,
    状态正文: {
      未开始: 读取提醒状态正文(自定义正文对象, '未开始'),
      进行中: 读取提醒状态正文(自定义正文对象, '进行中'),
    },
    触发,
    扫描触发词: 使用静默扫描 && 宏触发词 ? [宏触发词] : [],
    输出: 使用静默扫描 ? 构建静默扫描输出() : 构建可见注入输出(defaults.注入深度 ?? 0),
    元数据: {
      原始类型: 规范化名称(读取对象字段(source, ['类型', 'type'])) || '节庆提醒',
      提醒默认值: defaults,
      共享条件已继承: 继承共享条件,
      宏触发词: 宏触发词 || undefined,
    },
  };
}

function 是否内联提醒配置(item: Record<string, unknown>): boolean {
  return Boolean(
    读取节庆开始前天数(item) !== undefined ||
      读取对象字段(item, ['未开始', '进行中', '注入方式', 'mode', '宏触发词', 'macro']) !== undefined ||
      读取对象(item, ['自定义正文']) ||
      读取对象(item, ['自定义提醒']) ||
      读取对象(item, ['开启自定义提醒']),
  );
}

function 规范化节庆阶段列表(
  festivalId: string,
  festivalName: string,
  festivalItem: Record<string, unknown>,
  reminderDefaults: 日历运行时提醒默认值,
  runtimeDefaults: 日历运行时默认设置 | undefined,
  festivalCycle: { 每隔年: number; 上次年份: number } | undefined,
): 日历运行时节庆阶段条目[] {
  const stages = 规范化对象数组(读取对象字段(festivalItem, ['阶段', '阶段列表', 'stages', 'phases']));
  const output: 日历运行时节庆阶段条目[] = [];

  stages.forEach((stageItem, index) => {
    const stageId = 规范化名称(读取对象字段(stageItem, ['id', '阶段id', 'phase_id', 'phaseId'])) || `stage_${index + 1}`;
    const stageName =
      规范化名称(读取对象字段(stageItem, ['名称', '阶段名', 'name', 'title'])) || `阶段 ${index + 1}`;
    const 开始 = 规范化名称(读取对象字段(stageItem, ['开始', 'start']));
    const 结束 = 规范化名称(读取对象字段(stageItem, ['结束', 'end']) ?? 读取对象字段(stageItem, ['开始', 'start']));
    if (!stageId || !stageName || !开始 || !结束) {
      return;
    }

    const 周期 = 读取节庆周期(stageItem) ?? festivalCycle;
    const mergedStageItem = {
      ...festivalItem,
      ...stageItem,
      开始,
      结束,
    };
    const 阶段共享触发 = 构建节庆共享触发映射(mergedStageItem, runtimeDefaults, 开始, 结束, 周期);
    const 原始提醒 = 读取对象字段(stageItem, ['提醒', 'reminder']);
    const 提醒源 = 原始提醒 ?? (是否内联提醒配置(stageItem) ? stageItem : null);
    const 提醒 = 规范化节庆提醒节点(
      `${festivalId}:${stageId}`,
      `${festivalName}·${stageName}`,
      提醒源,
      reminderDefaults,
      阶段共享触发,
    );

    output.push({
      id: stageId,
      名称: stageName,
      开始,
      结束,
      周期,
      启用: 读取对象字段(stageItem, ['启用', 'enabled']) === false ? false : true,
      提醒,
      元数据: {
        ...(阶段共享触发 ? { 共享条件: 阶段共享触发 } : {}),
        ...(周期 ? { 周期 } : {}),
        ...(读取节庆开始前天数(stageItem) !== undefined
          ? { 开始前提醒天数: 读取节庆开始前天数(stageItem) }
          : {}),
      },
    });
  });

  return output;
}

function 补全内置节庆阶段列表(
  stages: 日历运行时节庆阶段条目[],
  festivalId: string,
  festivalName: string,
  festivalItem: Record<string, unknown>,
  reminderDefaults: 日历运行时提醒默认值,
  runtimeDefaults: 日历运行时默认设置 | undefined,
  festivalCycle: { 每隔年: number; 上次年份: number } | undefined,
): 日历运行时节庆阶段条目[] {
  if (stages.length > 0 || (festivalId !== 'goddess_beauty_contest' && festivalName !== '倾国倾城祭')) {
    return stages;
  }

  return 规范化节庆阶段列表(
    festivalId,
    festivalName,
    {
      ...festivalItem,
      阶段: [
        {
          id: 'first_bloom',
          名称: '第一阶段·初绽海选',
          开始: '02-01',
          结束: '02-04',
          reminder: {
            注入方式: 'injectprompt',
            开始前提醒天数: 2,
            开启自定义提醒: {
              未开始: '倾国倾城祭第一阶段「初绽」即将开始，银帆城街道、喷泉旁与酒馆外会陆续出现无门槛街头展演',
              进行中: '倾国倾城祭第一阶段「初绽」正在进行，参赛者在街头展示才艺并争取初始选票，02-04 午夜将统计晋级名单',
            },
          },
        },
        {
          id: 'parade_day',
          名称: '第二阶段·海滨巡游',
          开始: '02-12',
          结束: '02-12',
          reminder: {
            注入方式: 'injectprompt',
            开始前提醒天数: 1,
            开启自定义提醒: {
              未开始: '倾国倾城祭第二阶段的海滨巡游日即将到来，参赛者的花车与随行团队会在银帆城海滨大道亮相',
              进行中: '倾国倾城祭第二阶段「海滨巡游」正在进行，观众会向游行队伍投掷辉光花并完成第二轮大规模投票',
            },
          },
        },
        {
          id: 'final_bloom',
          名称: '第三阶段·怒放决赛',
          开始: '02-14',
          结束: '02-14',
          reminder: {
            注入方式: 'injectprompt',
            开始前提醒天数: 1,
            开启自定义提醒: {
              未开始: '倾国倾城祭第三阶段「怒放」终焉决赛即将开始，最终入围者将在苍籁剧院进行毫无保留的终极展示',
              进行中: '倾国倾城祭第三阶段「怒放」正在苍籁剧院进行，百人核心评审团与满座权贵观众将见证本年度阿芙罗黛蒂加冕',
            },
          },
        },
      ],
    },
    reminderDefaults,
    runtimeDefaults,
    festivalCycle,
  );
}

function 规范化书籍摘要节点(
  bookId: string,
  bookName: string,
  value: unknown,
  defaults: 日历运行时书籍默认值,
  节庆共享触发: 日历运行时触发映射 | null,
): 日历运行时内容节点 | null {
  const source = 规范化节点对象(value);
  if (!source) {
    return null;
  }

  const 条目名 = 读取条目名(source);
  const 正文 =
    typeof source.正文 === 'string'
      ? String(source.正文)
      : typeof 读取对象字段(source, [
            '摘要内容',
            'book_abstract_content',
            '摘要正文',
            'abstract_content',
            'abstractContent',
          ]) === 'string'
        ? String(
            读取对象字段(source, [
              '摘要内容',
              'book_abstract_content',
              '摘要正文',
              'abstract_content',
              'abstractContent',
            ]),
          )
        : null;
  if (!条目名 && !正文) {
    return null;
  }

  const 显式触发 = 规范化触发映射(读取对象字段(source, ['条件', '触发', 'trigger']));
  const 关键字组触发 = 构建关键字组触发映射(
    source,
    ['关键字', '消息关键词', 'book消息关键词(abstract)', 'book_abstract_keywords', 'abstract_keywords'],
    '消息',
  );
  const 用户消息包含 = 读取消息关键词(source, ['用户消息包含']);
  const 旁路触发 = 构建旁路触发映射([], 用户消息包含);
  const 继承共享条件 = 读取对象字段(source, ['继承共享条件', '继承场景条件', 'inherit_common']) !== false;
  const 触发 = 合并触发映射('任一满足', [继承共享条件 ? 节庆共享触发 : null, 显式触发, 关键字组触发, 旁路触发]);

  return {
    id: `${bookId}:abstract`,
    名称: `${bookName} 摘要`,
    类型: '读物摘要',
    启用: 读取对象字段(source, ['启用', 'enabled']) === false ? false : true,
    条目: 条目名 ? { 条目名 } : null,
    正文,
    触发,
    扫描触发词: [],
    输出: 构建可见注入输出(defaults.摘要注入深度 ?? 4),
    元数据: {
      原始类型: 规范化名称(读取对象字段(source, ['类型', 'type'])) || '读物摘要',
      共享条件已继承: 继承共享条件,
    },
  };
}

function 规范化书籍全文节点(
  bookId: string,
  bookName: string,
  value: unknown,
  festivalTextEntryByBookId: Map<string, string>,
  节庆共享触发: 日历运行时触发映射 | null,
  默认设置: 日历运行时默认设置 | undefined,
): 日历运行时内容节点 | null {
  const source = 规范化节点对象(value);
  if (!source) {
    return null;
  }

  const 原始条目名 = 读取条目名(source);
  const 节庆文本条目名 = festivalTextEntryByBookId.get(bookId) ?? '';
  const 实际条目名 = 节庆文本条目名 || 原始条目名;
  if (!实际条目名) {
    return null;
  }

  const 默认模板 = 默认设置?.书籍全文默认关键词模板 || '[[打开《${bookname}》]]';
  const 默认全文关键词 = 使用模板生成关键词(默认模板, bookName, 实际条目名);
  const 显式触发 = 规范化触发映射(读取对象字段(source, ['条件', '触发', 'trigger']));
  const 显式全文关键字 = 取唯一文本(
    读取消息关键词(source, [
      '全文关键字',
      '关键字',
      '用户消息包含',
      'book消息关键词(fulltxt)',
      'book_fulltext_keywords',
      'fulltext_keywords',
    ]),
  );
  const 关键字组源: Record<string, unknown> = {
    ...source,
    关键字: 显式全文关键字.length > 0 ? 显式全文关键字 : 默认全文关键词,
  };
  const 关键字组触发 = 构建关键字组触发映射(关键字组源, ['关键字'], '用户消息');
  const 消息关键词 = 读取消息关键词(source, ['消息关键词']);
  const 旁路触发 = 构建旁路触发映射(消息关键词, []);
  const 继承共享条件 = 读取对象字段(source, ['继承共享条件', '继承场景条件', 'inherit_common']) !== false;
  const 触发 = 合并触发映射('任一满足', [继承共享条件 ? 节庆共享触发 : null, 显式触发, 关键字组触发, 旁路触发]);

  return {
    id: `${bookId}:fulltext`,
    名称: `${bookName} 全文`,
    类型: '读物全文',
    启用: 读取对象字段(source, ['启用', 'enabled']) === false ? false : true,
    条目: { 条目名: 实际条目名 },
    内容ID: 规范化名称(读取对象字段(source, ['内容ID', 'content_id', 'contentId'])) || undefined,
    触发,
    扫描触发词: [实际条目名],
    输出: 构建静默扫描输出(),
    元数据: {
      原始类型: 规范化名称(读取对象字段(source, ['类型', 'type'])) || '读物全文',
      原始条目名: 原始条目名 || undefined,
      节庆文本条目名: 节庆文本条目名 || undefined,
      共享条件已继承: 继承共享条件,
    },
  };
}

function 读取书籍摘要源(rawBook: Record<string, unknown>): unknown {
  const nestedSummary = 读取对象(rawBook, ['摘要']);
  if (nestedSummary) {
    return nestedSummary;
  }
  const inlineSummary = 读取对象字段(rawBook, [
    '摘要',
    '摘要内容',
    'book_abstract_content',
    '摘要正文',
    'abstract_content',
    'abstractContent',
    '正文',
  ]);
  return inlineSummary === undefined ? null : rawBook;
}

function 收集节庆文本映射(rawFestivals: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const festival of 规范化对象数组(rawFestivals)) {
    const oldTexts = 规范化对象数组(读取对象字段(festival, ['文本']));
    for (const textNode of oldTexts) {
      const 书籍id = 规范化名称(读取对象字段(textNode, ['书籍id', 'book_id', 'bookId', 'id']));
      const 条目名 = 读取条目名(textNode);
      if (书籍id && 条目名 && !map.has(书籍id)) {
        map.set(书籍id, 条目名);
      }
    }

    const nestedBooks = 规范化对象数组(读取对象字段(festival, ['补充资料', '书籍', 'materials', 'material', 'book', 'books']));
    nestedBooks.forEach((bookNode, index) => {
      const 节庆id = 规范化名称(读取对象字段(festival, ['id']));
      const 书名 = 规范化名称(读取对象字段(bookNode, ['书名', '名称', 'bookname', 'name']));
      const id =
        规范化名称(读取对象字段(bookNode, ['id', '书籍id', 'book_id', 'bookId'])) ||
        (书名 ? `${节庆id}_${书名}` : `${节庆id}__book_${index + 1}`);
      const 条目名 = 读取条目名(bookNode);
      if (id && 条目名 && !map.has(id)) {
        map.set(id, 条目名);
      }
    });
  }
  return map;
}

function 合并书籍(target: Map<string, 日历运行时书籍条目>, book: 日历运行时书籍条目): void {
  const existing = target.get(book.id);
  if (!existing) {
    target.set(book.id, book);
    return;
  }
  target.set(book.id, {
    ...existing,
    ...book,
    名称: book.名称 || existing.名称,
    启用: existing.启用 === false || book.启用 === false ? false : true,
    摘要: book.摘要 ?? existing.摘要,
    全文: book.全文 ?? existing.全文,
    元数据: {
      ...(existing.元数据 ?? {}),
      ...(book.元数据 ?? {}),
    },
  });
}

function 规范化节庆与内嵌书籍(
  value: unknown,
  reminderDefaults: 日历运行时提醒默认值,
  bookDefaults: 日历运行时书籍默认值,
  runtimeDefaults: 日历运行时默认设置 | undefined,
  festivalTextEntryByBookId: Map<string, string>,
  groupById: Map<string, 运行时固定事件分组>,
  groupIdByEventId: Map<string, string>,
): { 节庆: 日历运行时节庆条目[]; 内嵌书籍: 日历运行时书籍条目[] } {
  const 节庆列表: 日历运行时节庆条目[] = [];
  const 书籍映射 = new Map<string, 日历运行时书籍条目>();

  for (const item of 规范化对象数组(value)) {
    const id = 规范化名称(读取对象字段(item, ['id']));
    const 名称 = 规范化名称(读取对象字段(item, ['名称', 'name']));
    const 开始 = 规范化名称(读取对象字段(item, ['开始', 'start']));
    const 结束 = 规范化名称(读取对象字段(item, ['结束', 'end']) ?? 读取对象字段(item, ['开始', 'start']));
    if (!id || !名称 || !开始 || !结束) {
      continue;
    }

    const 周期 = 读取节庆周期(item);
    const 节庆共享触发 = 构建节庆共享触发映射(item, runtimeDefaults, 开始, 结束, 周期);
    const 分组 = 规范化名称(读取对象字段(item, ['分组', 'group', 'groupId', 'group_id'])) || groupIdByEventId.get(id) || '';
    const 分组信息 = 分组 ? groupById.get(分组) : undefined;
    const 相关书籍: string[] = [];
    const 节庆文本节点: 日历运行时内容节点[] = [];

    相关书籍.push(
      ...规范化单值或字符串数组(
        读取对象字段(item, ['相关资料', '相关书籍', 'relatedMaterials', 'related_materials', 'relatedBooks', 'related_books']),
      ),
    );

    const nestedBooks = 规范化对象数组(读取对象字段(item, ['补充资料', '书籍', 'materials', 'material', 'book', 'books']));
    nestedBooks.forEach((rawBook, index) => {
      const bookName = 规范化名称(读取对象字段(rawBook, ['书名', '名称', 'bookname', 'name']));
      const bookId =
        规范化名称(读取对象字段(rawBook, ['id', '书籍id', 'book_id', 'bookId'])) ||
        (bookName ? `${id}_${bookName}` : `${id}__book_${index + 1}`);
      if (!bookId || !bookName) {
        return;
      }

      const 摘要源 = 读取书籍摘要源(rawBook);
      const 摘要节点 = 规范化书籍摘要节点(bookId, bookName, 摘要源, bookDefaults, 节庆共享触发);
      const 全文源 = 读取对象(rawBook, ['全文']) ?? rawBook;
      const 全文节点 = 规范化书籍全文节点(
        bookId,
        bookName,
        全文源,
        festivalTextEntryByBookId,
        节庆共享触发,
        runtimeDefaults,
      );
      if (!全文节点 && !摘要节点) {
        return;
      }

      相关书籍.push(bookId);
      if (全文节点) {
        节庆文本节点.push(全文节点);
      }
      合并书籍(书籍映射, {
        id: bookId,
        名称: bookName,
        启用: 读取对象字段(rawBook, ['启用', 'enabled']) === false ? false : true,
        摘要: 摘要节点,
        全文: 全文节点,
        元数据: {
          festivalId: id,
          festivalName: 名称,
          source: 'festival_nested',
          关联事件: [id],
        },
      });
    });

    const oldTexts = 规范化对象数组(读取对象字段(item, ['文本']));
    for (const textItem of oldTexts) {
      const 书籍id = 规范化名称(读取对象字段(textItem, ['书籍id', 'book_id', 'bookId', 'id']));
      if (书籍id) {
        相关书籍.push(书籍id);
      }
    }

    const 地点关键词 = 读取共享地点关键词(item);
    const 阶段 = 补全内置节庆阶段列表(
      规范化节庆阶段列表(id, 名称, item, reminderDefaults, runtimeDefaults, 周期),
      id,
      名称,
      item,
      reminderDefaults,
      runtimeDefaults,
      周期,
    );
    const festival: 日历运行时节庆条目 = {
      id,
      名称,
      开始,
      结束,
      周期,
      启用: 读取对象字段(item, ['启用', 'enabled']) === false ? false : true,
      ...(地点关键词.length > 0 ? { 地点关键词 } : {}),
      介绍: 规范化节庆介绍节点(id, 名称, 读取对象字段(item, ['介绍', 'event']), 节庆共享触发),
      文本: 节庆文本节点,
      提醒: 规范化节庆提醒节点(id, 名称, 读取对象字段(item, ['提醒', 'reminder']), reminderDefaults, 节庆共享触发),
      阶段,
      相关书籍: 取唯一文本(相关书籍),
      元数据: {
        ...(节庆共享触发 ? { 共享条件: 节庆共享触发 } : {}),
        ...(周期 ? { 周期 } : {}),
        ...(读取节庆开始前天数(item) !== undefined ? { 开始前提醒天数: 读取节庆开始前天数(item) } : {}),
        ...(地点关键词.length > 0 ? { 地点关键词 } : {}),
        ...(分组 ? { 分组 } : {}),
        ...(分组信息?.名称 ? { 分组名称: 分组信息.名称 } : {}),
        ...(分组信息?.图标 ? { 分组图标: 分组信息.图标 } : {}),
      },
    };
    节庆列表.push(festival);
  }

  return {
    节庆: 节庆列表,
    内嵌书籍: [...书籍映射.values()],
  };
}

function 规范化顶层书籍列表(
  value: unknown,
  bookDefaults: 日历运行时书籍默认值,
  festivalTextEntryByBookId: Map<string, string>,
  runtimeDefaults: 日历运行时默认设置 | undefined,
): 日历运行时书籍条目[] {
  const output: 日历运行时书籍条目[] = [];

  for (const item of 规范化对象数组(value)) {
    const id = 规范化名称(读取对象字段(item, ['id']));
    const 名称 = 规范化名称(读取对象字段(item, ['书名', '名称', 'name', 'bookname']));
    if (!id || !名称) {
      continue;
    }

    const 摘要 = 规范化书籍摘要节点(id, 名称, 读取书籍摘要源(item), bookDefaults, null);
    const 全文 = 规范化书籍全文节点(
      id,
      名称,
      读取对象(item, ['全文']) ?? item,
      festivalTextEntryByBookId,
      null,
      runtimeDefaults,
    );

    output.push({
      id,
      名称,
      启用: 读取对象字段(item, ['启用', 'enabled']) === false ? false : true,
      摘要,
      全文,
      元数据: {
        source: 'top_level_book',
        关联事件: 规范化单值或字符串数组(
          读取对象字段(item, ['关联事件', '相关事件', 'eventIds', 'event_ids', 'events']),
        ),
      },
    });
  }

  return output;
}

function 规范化运行时索引(data: unknown, warnings: string[]): 日历运行时索引 | null {
  if (!是否对象(data)) {
    warnings.push('索引解析结果不是对象');
    return null;
  }

  const 默认设置 = 规范化默认设置({
    ...data,
    ...(是否对象(data.默认设置) ? data.默认设置 : {}),
  });
  const 提醒默认值 = 规范化提醒默认值(读取对象字段(data, ['提醒默认值']));
  const 书籍默认值 = 规范化书籍默认值(读取对象字段(data, ['书籍默认值']));
  const 原始节庆列表 = 读取对象字段(data, ['节庆', '固定事件', 'fixed_events', 'fixedEvents', 'festival', 'festivals']);
  const 固定事件分组 = 规范化固定事件分组列表(
    读取对象字段(data, ['固定事件分组', '分组', 'event_groups', 'eventGroups', 'groups']),
  );
  const 分组映射 = new Map(固定事件分组.map(group => [group.id, group] as const));
  const 事件分组映射 = 建立事件分组映射(固定事件分组);
  const 节庆文本映射 = 收集节庆文本映射(原始节庆列表);
  const 节庆与书籍 = 规范化节庆与内嵌书籍(
    原始节庆列表,
    提醒默认值,
    书籍默认值,
    默认设置,
    节庆文本映射,
    分组映射,
    事件分组映射,
  );
  const 顶层书籍 = 规范化顶层书籍列表(
    读取对象字段(data, ['补充资料', '书籍', 'materials', 'material', 'book', 'books']),
    书籍默认值,
    节庆文本映射,
    默认设置,
  );

  const 合并后书籍 = new Map<string, 日历运行时书籍条目>();
  节庆与书籍.内嵌书籍.forEach(book => 合并书籍(合并后书籍, book));
  顶层书籍.forEach(book => 合并书籍(合并后书籍, book));

  return {
    版本: 规范化数字(读取对象字段(data, ['版本', 'version'])),
    说明: 规范化名称(读取对象字段(data, ['说明', 'description'])) || undefined,
    索引条目名: 规范化名称(读取对象字段(data, ['索引条目名', 'index_entry'])) || undefined,
    默认值: 是否对象(读取对象字段(data, ['默认值']))
      ? (读取对象字段(data, ['默认值']) as Record<string, unknown>)
      : undefined,
    默认设置,
    内容仓库: 是否对象(读取对象字段(data, ['内容仓库']))
      ? (读取对象字段(data, ['内容仓库']) as Record<string, unknown>)
      : undefined,
    条目命名约定: 是否对象(读取对象字段(data, ['条目命名约定']))
      ? (读取对象字段(data, ['条目命名约定']) as Record<string, unknown>)
      : undefined,
    提醒默认值,
    书籍默认值,
    月份别名: 规范化月份别名(读取对象字段(data, ['月份别名'])),
    节庆: 节庆与书籍.节庆,
    书籍: [...合并后书籍.values()],
  };
}

function 收集内容节点引用(node: 日历运行时内容节点 | null | undefined, target: 日历世界书引用[]): void {
  if (!node || node.启用 === false) {
    return;
  }
  if (node.条目) {
    target.push(node.条目);
  }
  if (node.文本库) {
    target.push(node.文本库);
  }
}

function 收集索引正文引用(index: 日历运行时索引 | null): 日历世界书引用[] {
  const refs: 日历世界书引用[] = [];
  if (!index) {
    return refs;
  }

  for (const festival of index.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }
    收集内容节点引用(festival.介绍, refs);
    收集内容节点引用(festival.提醒, refs);
    for (const textNode of festival.文本 ?? []) {
      收集内容节点引用(textNode, refs);
    }
  }
  for (const book of index.书籍 ?? []) {
    if (book.启用 === false) {
      continue;
    }
    收集内容节点引用(book.摘要, refs);
    收集内容节点引用(book.全文, refs);
  }

  return refs;
}

function resolveCalendarRuntimeContentWorldbookNames(
  entries: 日历世界书来源条目[],
  index: 日历运行时索引 | null,
  fallbackWorldbookName: string | null,
): string[] {
  const refs = 收集索引正文引用(index);
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | null | undefined): void => {
    const normalized = 规范化名称(name);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    names.push(normalized);
  };

  for (const ref of refs) {
    add(findCalendarRuntimeEntryByReference(entries, ref)?.世界书名);
  }
  if (names.length === 0 && ((index?.节庆?.length ?? 0) > 0 || (index?.书籍?.length ?? 0) > 0)) {
    add(fallbackWorldbookName);
  }
  return names;
}

export async function readCalendarRuntimeWorldbookEntries(
  sourceConfig: CalendarSourceConfig = readCalendarSourceConfig(),
): Promise<{ 来源: ResolvedCalendarWorldbookSource[]; 条目: 日历世界书来源条目[]; 警告: string[] }> {
  const 来源 = resolveCalendarRuntimeWorldbookSources(sourceConfig);
  const warnings: string[] = [];
  const entries: 日历世界书来源条目[] = [];

  if (来源.length === 0) {
    warnings.push('runtime worldbook 来源为空：当前 sourceConfig 没有可读取的 worldbook');
  }

  for (const source of 来源) {
    try {
      const worldbookEntries = await getWorldbook(source.name);
      const entryNames = worldbookEntries.map(entry => 规范化名称(entry.name)).filter(Boolean);
      warnings.push(
        `runtime worldbook 已读取「${source.name}」(${source.kind})：${worldbookEntries.length} 条；条目名：${
          entryNames.length > 0 ? entryNames.join('、') : '（空）'
        }`,
      );
      for (const entry of worldbookEntries) {
        entries.push({ 世界书名: source.name, 条目: entry });
      }
    } catch (error) {
      warnings.push(`读取 worldbook「${source.name}」失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { 来源, 条目: entries, 警告: warnings };
}

export function findCalendarRuntimeEntryByReference(
  entries: 日历世界书来源条目[],
  reference: 日历世界书引用 | null | undefined,
): 日历世界书来源条目 | null {
  if (!reference) {
    return null;
  }

  const targetName = 规范化名称(reference.条目名);
  const targetWorldbook = 规范化名称(reference.世界书);
  if (!targetName) {
    return null;
  }

  for (const entry of entries) {
    if (targetWorldbook && entry.世界书名 !== targetWorldbook) {
      continue;
    }
    if (条目名是否匹配(entry.条目.name, targetName)) {
      return entry;
    }
  }

  return null;
}

function listCalendarRuntimeIndexEntryMatches(entries: 日历世界书来源条目[]): 日历世界书来源条目[] {
  const matches: 日历世界书来源条目[] = [];
  const seen = new Set<string>();
  for (const candidate of 默认索引条目名候选) {
    for (const entry of entries) {
      if (!条目名是否匹配(entry.条目.name, candidate)) {
        continue;
      }
      const key = `${entry.世界书名}::${规范化名称(entry.条目.name)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matches.push(entry);
    }
  }
  return matches;
}

function findCalendarRuntimeIndexEntry(entries: 日历世界书来源条目[]): 日历世界书来源条目 | null {
  return listCalendarRuntimeIndexEntryMatches(entries)[0] ?? null;
}

function 追加多索引候选警告(matches: 日历世界书来源条目[], warnings: string[]): void {
  const selected = matches[0];
  if (!selected || matches.length <= 1) {
    return;
  }
  const others = matches.slice(1);
  warnings.push(
    `检测到多个 runtime 索引候选，当前使用「${selected.世界书名}」/${selected.条目.name}；其他候选：${others
      .map(item => `「${item.世界书名}」/${item.条目.name}`)
      .join('、')}`,
  );
}

export interface CalendarRuntimeIndexSourceCandidate {
  worldbookName: string;
  entryName: string;
}

export interface CalendarRuntimeIndexSourceEntry {
  worldbookName: string;
  entryName: string;
  content: string;
  sourceWorldbooks: string[];
  candidates: CalendarRuntimeIndexSourceCandidate[];
  warnings: string[];
}

export async function readCalendarRuntimeIndexSourceEntry(): Promise<CalendarRuntimeIndexSourceEntry | null> {
  const { 来源, 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntryMatches = listCalendarRuntimeIndexEntryMatches(条目);
  const indexEntry = indexEntryMatches[0] ?? null;
  追加多索引候选警告(indexEntryMatches, 警告);

  if (!indexEntry) {
    return null;
  }

  return {
    worldbookName: indexEntry.世界书名,
    entryName: indexEntry.条目.name,
    content: indexEntry.条目.content,
    sourceWorldbooks: 来源.map(item => item.name),
    candidates: indexEntryMatches.map(item => ({
      worldbookName: item.世界书名,
      entryName: item.条目.name,
    })),
    warnings: 警告,
  };
}

export async function readCalendarRuntimeIndex(): Promise<日历世界书索引读取结果> {
  const { 来源, 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntryMatches = listCalendarRuntimeIndexEntryMatches(条目);
  const indexEntry = indexEntryMatches[0] ?? null;
  if (!indexEntry) {
    const 已读取条目名 = 条目.map(item => `「${item.世界书名}」/${规范化名称(item.条目.name) || '（空名）'}`);
    return {
      索引: null,
      来源世界书: 来源.map(item => item.name),
      命中世界书名: null,
      命中条目名: null,
      警告: [
        ...警告,
        `未找到索引条目，已尝试：${默认索引条目名候选.join('、')}`,
        `本次实际读取来源：${来源.length > 0 ? 来源.map(item => `「${item.name}」(${item.kind})`).join('、') : '（无）'}`,
        `本次实际读取条目：${已读取条目名.length > 0 ? 已读取条目名.join('、') : '（无）'}`,
      ],
    };
  }
  追加多索引候选警告(indexEntryMatches, 警告);

  const parsed = 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告);
  const normalized = parsed ? 规范化运行时索引(parsed, 警告) : null;
  applyCalendarRuntimeDefaults(normalized?.默认设置);
  if (!normalized) {
    return {
      索引: null,
      来源世界书: 来源.map(item => item.name),
      命中世界书名: indexEntry.世界书名,
      命中条目名: indexEntry.条目.name,
      警告,
    };
  }

  return {
    索引: normalized,
    来源世界书: 来源.map(item => item.name),
    命中世界书名: indexEntry.世界书名,
    命中条目名: indexEntry.条目.name,
    警告,
  };
}

export interface 日历运行时世界书摘要 {
  来源世界书: string[];
  索引世界书: string | null;
  正文世界书: string[];
  警告: string[];
}

export interface CalendarRuntimeWorldbookMoveCandidate {
  id: string;
  label: string;
  kind: 'runtime_index' | 'runtime_content';
  sourceWorldbookName: string;
  entryName: string;
  entry: WorldbookEntry;
  selectedByDefault: boolean;
}

function 构建运行时搬运候选ID(
  kind: CalendarRuntimeWorldbookMoveCandidate['kind'],
  worldbookName: string,
  entryName: string,
): string {
  return `${kind}::${worldbookName}::${entryName}`;
}

function 添加运行时搬运候选(
  target: Map<string, CalendarRuntimeWorldbookMoveCandidate>,
  args: Omit<CalendarRuntimeWorldbookMoveCandidate, 'id' | 'selectedByDefault'> & { selectedByDefault?: boolean },
): void {
  const entryName = 规范化名称(args.entryName || args.entry.name);
  const worldbookName = 规范化名称(args.sourceWorldbookName);
  if (!entryName || !worldbookName) {
    return;
  }
  const id = 构建运行时搬运候选ID(args.kind, worldbookName, entryName);
  if (target.has(id)) {
    return;
  }
  target.set(id, {
    ...args,
    id,
    sourceWorldbookName: worldbookName,
    entryName,
    selectedByDefault: args.selectedByDefault !== false,
  });
}

function 添加内容节点搬运候选(
  target: Map<string, CalendarRuntimeWorldbookMoveCandidate>,
  entries: 日历世界书来源条目[],
  node: 日历运行时内容节点 | null | undefined,
  labelPrefix: string,
): void {
  if (!node || node.启用 === false) {
    return;
  }
  const refs = [node.条目, node.文本库].filter(Boolean) as 日历世界书引用[];
  refs.forEach(ref => {
    const matched = findCalendarRuntimeEntryByReference(entries, ref);
    if (!matched) {
      return;
    }
    添加运行时搬运候选(target, {
      label: `${labelPrefix} / ${node.名称 || ref.条目名}`,
      kind: 'runtime_content',
      sourceWorldbookName: matched.世界书名,
      entryName: matched.条目.name,
      entry: matched.条目,
    });
  });
}

export async function listCalendarRuntimeWorldbookMoveCandidates(): Promise<{
  candidates: CalendarRuntimeWorldbookMoveCandidate[];
  warnings: string[];
}> {
  const { 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const candidates = new Map<string, CalendarRuntimeWorldbookMoveCandidate>();
  const indexEntry = findCalendarRuntimeIndexEntry(条目);
  if (!indexEntry) {
    return { candidates: [], warnings: 警告 };
  }

  添加运行时搬运候选(candidates, {
    label: `运行时索引：${indexEntry.条目.name}`,
    kind: 'runtime_index',
    sourceWorldbookName: indexEntry.世界书名,
    entryName: indexEntry.条目.name,
    entry: indexEntry.条目,
  });

  const parsed = 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告);
  const normalized = parsed ? 规范化运行时索引(parsed, 警告) : null;
  if (!normalized) {
    return { candidates: [...candidates.values()], warnings: 警告 };
  }

  for (const festival of normalized.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }
    添加内容节点搬运候选(candidates, 条目, festival.介绍, `节庆：${festival.名称}`);
    添加内容节点搬运候选(candidates, 条目, festival.提醒, `节庆提醒：${festival.名称}`);
    for (const textNode of festival.文本 ?? []) {
      添加内容节点搬运候选(candidates, 条目, textNode, `节庆文本：${festival.名称}`);
    }
  }
  for (const book of normalized.书籍 ?? []) {
    if (book.启用 === false) {
      continue;
    }
    添加内容节点搬运候选(candidates, 条目, book.摘要, `读物摘要：${book.名称}`);
    添加内容节点搬运候选(candidates, 条目, book.全文, `读物全文：${book.名称}`);
  }

  return { candidates: [...candidates.values()], warnings: 警告 };
}

export async function inspectCalendarRuntimeWorldbookSummary(): Promise<日历运行时世界书摘要> {
  const { 来源, 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntry = findCalendarRuntimeIndexEntry(条目);
  if (!indexEntry) {
    return {
      来源世界书: 来源.map(item => item.name),
      索引世界书: null,
      正文世界书: [],
      警告,
    };
  }

  const parsed = 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告);
  const normalized = parsed ? 规范化运行时索引(parsed, 警告) : null;
  return {
    来源世界书: 来源.map(item => item.name),
    索引世界书: indexEntry.世界书名,
    正文世界书: resolveCalendarRuntimeContentWorldbookNames(条目, normalized, indexEntry.世界书名),
    警告,
  };
}

export async function readCalendarRuntimeTextLibrary(
  reference: 日历文本库引用 | null | undefined,
): Promise<日历世界书文本库读取结果> {
  if (!reference) {
    return {
      文本库: {},
      来源: null,
      命中条目名: null,
      警告: [],
    };
  }

  const { 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const matchedEntry = findCalendarRuntimeEntryByReference(条目, reference);
  if (!matchedEntry) {
    return {
      文本库: {},
      来源: reference,
      命中条目名: null,
      警告: [
        ...警告,
        `未找到文本库条目「${reference.条目名}」${reference.世界书 ? `（世界书：${reference.世界书}）` : ''}`,
      ],
    };
  }

  const parsed = 解析Yaml文本<unknown>(matchedEntry.条目.content, `文本库条目「${matchedEntry.条目.name}」`, 警告);

  return {
    文本库: parsed ? 提取文本库映射(parsed) : {},
    来源: reference,
    命中条目名: matchedEntry.条目.name,
    警告,
  };
}
