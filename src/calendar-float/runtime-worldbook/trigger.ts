import {
  是否对象,
  读取对象字段,
  规范化单值或字符串数组,
  规范化布尔值,
  规范化等于值,
  规范化名称,
  规范化数字,
} from './normalizers';
import type {
  日历运行时原子条件,
  日历运行时变量条件,
  日历运行时日期窗口条件,
  日历运行时触发映射,
  日历运行时逻辑条件,
} from './types';

function 规范化日期条件(value: unknown): 日历运行时日期窗口条件 | null {
  if (!是否对象(value)) {
    return null;
  }

  const window = 是否对象(读取对象字段(value, ['日期窗口', 'window']))
    ? (读取对象字段(value, ['日期窗口', 'window']) as Record<string, unknown>)
    : value;
  const 路径 = 规范化名称(读取对象字段(value, ['路径', 'path']) ?? 读取对象字段(window, ['路径', 'path']));
  const 开始 = 规范化名称(读取对象字段(window, ['开始', 'start']));
  const 结束 = 规范化名称(读取对象字段(window, ['结束', 'end']) ?? 读取对象字段(window, ['开始', 'start']));
  const 提前天数 = 规范化数字(
    读取对象字段(window, ['提前天数', 'start_prepare', 'prepare_days']) ??
      读取对象字段(value, ['提前天数', 'start_prepare', 'prepare_days']),
  );
  const 延后天数 = 规范化数字(
    读取对象字段(window, ['延后天数', 'end_delay', 'delay_days']) ??
      读取对象字段(value, ['延后天数', 'end_delay', 'delay_days']),
  );
  const 仅进行中 =
    读取对象字段(value, ['仅进行中', 'only_active']) === true ||
    读取对象字段(window, ['仅进行中', 'only_active']) === true;

  if (!路径 && !开始 && !结束 && 提前天数 === undefined && 延后天数 === undefined && !仅进行中) {
    return null;
  }

  const output: 日历运行时日期窗口条件 = {};
  if (路径) {
    output.路径 = 路径;
  }
  if (开始) {
    output.开始 = 开始;
  }
  if (结束) {
    output.结束 = 结束;
  }
  if (提前天数 !== undefined) {
    output.提前天数 = 提前天数;
  }
  if (延后天数 !== undefined) {
    output.延后天数 = 延后天数;
  }
  if (仅进行中) {
    output.仅进行中 = true;
  }
  return output;
}

function 规范化变量条件(value: unknown): 日历运行时变量条件 | null {
  if (!是否对象(value)) {
    return null;
  }

  const 路径 = 规范化名称(读取对象字段(value, ['路径', 'path']));
  if (!路径) {
    return null;
  }

  const output: 日历运行时变量条件 = { 路径 };
  const 包含任一 = 规范化单值或字符串数组(读取对象字段(value, ['包含任一', 'includes_any']));
  const 包含全部 = 规范化单值或字符串数组(读取对象字段(value, ['包含全部', 'includes_all']));
  const 不包含任一 = 规范化单值或字符串数组(读取对象字段(value, ['不包含任一', 'excludes_any']));
  const 等于 = 规范化等于值(读取对象字段(value, ['等于', 'equals']));
  const 正则 = 规范化名称(读取对象字段(value, ['正则', 'regex']));
  const 为空时视为未命中 = 规范化布尔值(读取对象字段(value, ['为空时视为未命中', 'missing_is_miss']));

  if (包含任一.length > 0) {
    output.包含任一 = 包含任一;
  }
  if (包含全部.length > 0) {
    output.包含全部 = 包含全部;
  }
  if (不包含任一.length > 0) {
    output.不包含任一 = 不包含任一;
  }
  if (等于 !== undefined) {
    output.等于 = 等于;
  }
  if (正则) {
    output.正则 = 正则;
  }
  if (为空时视为未命中 !== undefined) {
    output.为空时视为未命中 = 为空时视为未命中;
  }
  return output;
}

function 是否原子条件对象(value: unknown): boolean {
  if (!是否对象(value)) {
    return false;
  }
  return [
    '来源',
    'source',
    '路径',
    'path',
    '包含任一',
    '包含全部',
    '不包含任一',
    '等于',
    '正则',
    '日期窗口',
    'window',
    '为空时视为未命中',
  ].some(key => key in value);
}

function 规范化原子条件(value: unknown): 日历运行时原子条件 | null {
  if (!是否对象(value)) {
    return null;
  }

  const 来源 = 规范化名称(读取对象字段(value, ['来源', 'source']));
  const 路径 = 规范化名称(读取对象字段(value, ['路径', 'path']));
  const 包含任一 = 规范化单值或字符串数组(读取对象字段(value, ['包含任一', 'includes_any']));
  const 包含全部 = 规范化单值或字符串数组(读取对象字段(value, ['包含全部', 'includes_all']));
  const 不包含任一 = 规范化单值或字符串数组(读取对象字段(value, ['不包含任一', 'excludes_any']));
  const 等于 = 规范化等于值(读取对象字段(value, ['等于', 'equals']));
  const 正则 = 规范化名称(读取对象字段(value, ['正则', 'regex']));
  const 日期窗口 = 规范化日期条件(读取对象字段(value, ['日期窗口', 'window']) ?? value);
  const 为空时视为未命中 = 规范化布尔值(读取对象字段(value, ['为空时视为未命中', 'missing_is_miss']));

  if (
    !来源 &&
    !路径 &&
    包含任一.length === 0 &&
    包含全部.length === 0 &&
    不包含任一.length === 0 &&
    等于 === undefined &&
    !正则 &&
    !日期窗口
  ) {
    return null;
  }

  const output: 日历运行时原子条件 = {};
  if (来源) {
    output.来源 = 来源 as 日历运行时原子条件['来源'];
  }
  if (路径) {
    output.路径 = 路径;
  }
  if (包含任一.length > 0) {
    output.包含任一 = 包含任一;
  }
  if (包含全部.length > 0) {
    output.包含全部 = 包含全部;
  }
  if (不包含任一.length > 0) {
    output.不包含任一 = 不包含任一;
  }
  if (等于 !== undefined) {
    output.等于 = 等于;
  }
  if (正则) {
    output.正则 = 正则;
  }
  if (日期窗口) {
    output.日期窗口 = 日期窗口;
  }
  if (为空时视为未命中 !== undefined) {
    output.为空时视为未命中 = 为空时视为未命中;
  }
  return output;
}

function 规范化逻辑条件(value: unknown): 日历运行时逻辑条件 | null {
  if (!是否对象(value)) {
    return null;
  }

  const output: 日历运行时逻辑条件 = {};
  const 条件 = 是否对象(读取对象字段(value, ['条件', 'condition']))
    ? 规范化原子条件(读取对象字段(value, ['条件', 'condition']))
    : 是否原子条件对象(value)
      ? 规范化原子条件(value)
      : null;

  if (条件) {
    output.条件 = 条件;
  }

  for (const [canonical, aliases] of [
    ['全部满足', ['全部满足', 'all']],
    ['任一满足', ['任一满足', 'any']],
    ['都不满足', ['都不满足', 'none']],
  ] as const) {
    const source = 读取对象字段(value, aliases);
    if (!Array.isArray(source)) {
      continue;
    }
    const items: 日历运行时逻辑条件[] = [];
    for (const item of source) {
      const normalized = 规范化逻辑条件(item);
      if (normalized) {
        items.push(normalized);
      }
    }
    if (items.length > 0) {
      output[canonical] = items;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

export function 规范化触发映射(value: unknown): 日历运行时触发映射 | null {
  if (!是否对象(value)) {
    return null;
  }

  const output: 日历运行时触发映射 = {};
  const 默认逻辑 = 规范化名称(读取对象字段(value, ['默认逻辑', 'logic']));
  const 消息关键词 = 规范化单值或字符串数组(读取对象字段(value, ['消息关键词', 'keywords']));
  const 用户消息包含 = 规范化单值或字符串数组(读取对象字段(value, ['用户消息包含', 'user_keywords', 'userKeywords']));
  const 日期条件 = 规范化日期条件(读取对象字段(value, ['日期条件', 'date']) ?? null);
  const 完整逻辑 = 规范化逻辑条件(读取对象字段(value, ['完整逻辑', 'logic_tree']) ?? null);

  if (默认逻辑 === '全部满足' || 默认逻辑 === '任一满足') {
    output.默认逻辑 = 默认逻辑;
  }
  if (消息关键词.length > 0) {
    output.消息关键词 = 消息关键词;
  }
  if (用户消息包含.length > 0) {
    output.用户消息包含 = 用户消息包含;
  }
  if (日期条件) {
    output.日期条件 = 日期条件;
  }
  if (完整逻辑) {
    output.完整逻辑 = 完整逻辑;
  }

  const rawVarConditions = 读取对象字段(value, ['变量条件', 'vars']);
  if (Array.isArray(rawVarConditions)) {
    const conditions: 日历运行时变量条件[] = [];
    for (const item of rawVarConditions) {
      const normalized = 规范化变量条件(item);
      if (normalized) {
        conditions.push(normalized);
      }
    }
    if (conditions.length > 0) {
      output.变量条件 = conditions;
    }
  }

  if (读取对象字段(value, ['启用', 'enabled']) === false) {
    output.启用 = false;
  }

  return Object.keys(output).length > 0 ? output : null;
}

function 构建触发逻辑节点(trigger: 日历运行时触发映射 | null | undefined): 日历运行时逻辑条件 | null {
  if (!trigger || trigger.启用 === false) {
    return null;
  }

  const 节点列表: 日历运行时逻辑条件[] = [];
  if (trigger.完整逻辑) {
    节点列表.push(trigger.完整逻辑);
  }
  if (trigger.消息关键词 && trigger.消息关键词.length > 0) {
    节点列表.push({
      条件: {
        来源: '消息',
        包含任一: trigger.消息关键词,
      },
    });
  }
  if (trigger.用户消息包含 && trigger.用户消息包含.length > 0) {
    节点列表.push({
      条件: {
        来源: '用户消息',
        包含任一: trigger.用户消息包含,
      },
    });
  }
  if (trigger.变量条件 && trigger.变量条件.length > 0) {
    const 变量节点列表 = trigger.变量条件.map(condition => ({
      条件: {
        来源: 'mvu变量' as const,
        路径: condition.路径,
        包含任一: condition.包含任一,
        包含全部: condition.包含全部,
        不包含任一: condition.不包含任一,
        等于: condition.等于,
        正则: condition.正则,
        为空时视为未命中: condition.为空时视为未命中,
      },
    }));
    节点列表.push(变量节点列表.length === 1 ? 变量节点列表[0] : { 全部满足: 变量节点列表 });
  }
  if (trigger.日期条件) {
    节点列表.push({
      条件: {
        来源: 'mvu变量',
        路径: trigger.日期条件.路径,
        日期窗口: trigger.日期条件,
      },
    });
  }

  if (节点列表.length === 0) {
    return null;
  }
  if (节点列表.length === 1) {
    return 节点列表[0];
  }
  return trigger.默认逻辑 === '全部满足' ? { 全部满足: 节点列表 } : { 任一满足: 节点列表 };
}

export function 合并触发映射(
  logic: '全部满足' | '任一满足',
  triggers: Array<日历运行时触发映射 | null | undefined>,
): 日历运行时触发映射 | null {
  const nodes = triggers
    .map(item => 构建触发逻辑节点(item))
    .filter((item): item is 日历运行时逻辑条件 => Boolean(item));
  if (nodes.length === 0) {
    return null;
  }
  if (nodes.length === 1) {
    const matchedTrigger = triggers.find(
      (item): item is 日历运行时触发映射 => Boolean(item) && Boolean(构建触发逻辑节点(item)),
    );
    return matchedTrigger ?? null;
  }
  return {
    完整逻辑: logic === '全部满足' ? { 全部满足: nodes } : { 任一满足: nodes },
  };
}
