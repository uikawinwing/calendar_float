import { DEFAULT_MVU_LOCATION_PATH, DEFAULT_MVU_TIME_PATH } from './config';
import { readRuntimeField } from './aliases';
import { 构建可见注入输出, 构建静默扫描输出 } from './defaults';
import {
  是否对象,
  读取对象,
  读取对象字段,
  读取条目名,
  规范化单值或字符串数组,
  规范化名称,
  规范化对象数组,
  规范化数字,
} from './normalizers';
import { 合并触发映射, 规范化触发映射 } from './trigger';
import type {
  CalendarRuntimeBookDefaults,
  CalendarRuntimeContentNode,
  CalendarRuntimeDefaults,
  CalendarRuntimeFestivalStageEntry,
  CalendarRuntimeLogicCondition,
  CalendarRuntimeReminderDefaults,
  CalendarRuntimeTriggerMap,
  CalendarRuntimeVariableCondition,
} from './types';

export function 读取共享地点关键词(item: Record<string, unknown>): string[] {
  return 规范化单值或字符串数组(
    读取对象字段(item, ['地点关键词', '地点', 'location_keywords', 'locationKeywords', 'locations']),
  );
}

export function 读取节庆开始前天数(item: Record<string, unknown>): number | undefined {
  const reminder = 读取对象(item, ['提醒', 'reminder']);
  return 规范化数字(
    读取对象字段(item, ['开始前提醒天数', '提前天数', 'start_prepare', 'prepare_days']) ??
      (reminder ? 读取对象字段(reminder, ['开始前提醒天数', '提前天数', 'start_prepare', 'prepare_days']) : undefined),
  );
}

export function 读取节庆周期(item: Record<string, unknown>): { 每隔年: number; 上次年份: number } | undefined {
  const source = 读取对象(item, ['周期', '举办周期', 'recurrence']) ?? item;
  const 每隔年 = 规范化数字(读取对象字段(source, ['每隔年', '每X年', '间隔年数', 'intervalYears', 'interval_years']));
  const 上次年份 = 规范化数字(读取对象字段(source, ['上次年份', '上次举办年份', 'lastYear', 'last_year']));
  if (!每隔年 || 每隔年 <= 1 || !上次年份) {
    return undefined;
  }
  return { 每隔年: Math.floor(每隔年), 上次年份: Math.floor(上次年份) };
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
): CalendarRuntimeLogicCondition | null {
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
): CalendarRuntimeLogicCondition | null {
  const andNodes: CalendarRuntimeLogicCondition[] = [];
  const orNodes: CalendarRuntimeLogicCondition[] = [];

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
        : ({ 全部满足: andNodes } satisfies CalendarRuntimeLogicCondition);
  const orLogic =
    orNodes.length === 0
      ? null
      : orNodes.length === 1
        ? orNodes[0]
        : ({ 任一满足: orNodes } satisfies CalendarRuntimeLogicCondition);

  if (andLogic && orLogic) {
    return { 任一满足: [andLogic, orLogic] };
  }
  return andLogic ?? orLogic;
}

function 构建关键字组触发映射(
  value: unknown,
  primaryAliases: readonly string[],
  来源: '消息' | '用户消息',
): CalendarRuntimeTriggerMap | null {
  if (!是否对象(value)) {
    return null;
  }
  const 主关键字 = 取唯一文本(读取消息关键词(value, primaryAliases));
  const 次要关键字组 = 收集次要关键字组(value);
  const 完整逻辑 = 构建关键字组逻辑(主关键字, 次要关键字组, 来源);
  return 完整逻辑 ? { 完整逻辑 } : null;
}

export function 取唯一文本(values: string[]): string[] {
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

export function 构建节庆共享触发映射(
  item: Record<string, unknown>,
  defaults: CalendarRuntimeDefaults | undefined,
  开始: string,
  结束: string,
  周期?: { 每隔年: number; 上次年份: number },
): CalendarRuntimeTriggerMap | null {
  const 显式条件 = 规范化触发映射(
    读取对象字段(item, ['场景条件', '共享条件', '共通条件', '自动条件', 'common_condition', 'commonCondition']),
  );
  if (显式条件) {
    return 显式条件;
  }

  const 变量条件: CalendarRuntimeVariableCondition[] = [];
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

  const output: CalendarRuntimeTriggerMap = {
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

function 构建旁路触发映射(消息关键词: string[], 用户消息包含: string[]): CalendarRuntimeTriggerMap | null {
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

export function 规范化节庆介绍节点(
  festivalId: string,
  festivalName: string,
  value: unknown,
  节庆共享触发: CalendarRuntimeTriggerMap | null,
): CalendarRuntimeContentNode | null {
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
      .replaceAll('${节庆名}', festivalName)
      .replaceAll('${固定事件}', festivalName),
  );
}

export function 规范化节庆提醒节点(
  festivalId: string,
  festivalName: string,
  value: unknown,
  defaults: CalendarRuntimeReminderDefaults,
  节庆共享触发: CalendarRuntimeTriggerMap | null,
): CalendarRuntimeContentNode | null {
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

export function 规范化节庆阶段列表(
  festivalId: string,
  festivalName: string,
  festivalItem: Record<string, unknown>,
  reminderDefaults: CalendarRuntimeReminderDefaults,
  runtimeDefaults: CalendarRuntimeDefaults | undefined,
  festivalCycle: { 每隔年: number; 上次年份: number } | undefined,
): CalendarRuntimeFestivalStageEntry[] {
  const stages = 规范化对象数组(readRuntimeField(festivalItem, 'stages'));
  const output: CalendarRuntimeFestivalStageEntry[] = [];

  stages.forEach((stageItem, index) => {
    const stageId = 规范化名称(读取对象字段(stageItem, ['id', '阶段id', 'phase_id', 'phaseId'])) || `stage_${index + 1}`;
    const stageName =
      规范化名称(读取对象字段(stageItem, ['名称', '阶段名', 'name', 'title'])) || `阶段 ${index + 1}`;
    const 开始 = 规范化名称(readRuntimeField(stageItem, 'start'));
    const 结束 = 规范化名称(readRuntimeField(stageItem, 'end') ?? readRuntimeField(stageItem, 'start'));
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

export function 规范化书籍摘要节点(
  bookId: string,
  bookName: string,
  value: unknown,
  defaults: CalendarRuntimeBookDefaults,
  节庆共享触发: CalendarRuntimeTriggerMap | null,
): CalendarRuntimeContentNode | null {
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

export function 规范化书籍全文节点(
  bookId: string,
  bookName: string,
  value: unknown,
  festivalTextEntryByBookId: Map<string, string>,
  节庆共享触发: CalendarRuntimeTriggerMap | null,
  默认设置: CalendarRuntimeDefaults | undefined,
): CalendarRuntimeContentNode | null {
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

export function 读取书籍摘要源(rawBook: Record<string, unknown>): unknown {
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
