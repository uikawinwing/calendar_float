import _ from 'lodash';
import {
  compareDatePoint,
  getRelativeDayDistance,
  isPointInsideRange,
} from '../date';
import type {
  CalendarRuntimeAtomicCondition,
  CalendarRuntimeVariableCondition,
  CalendarRuntimeDateWindowCondition,
  CalendarRuntimeTriggerMap,
  CalendarRuntimeLogicCondition,
} from '../runtime-worldbook/types';
import type {
  CalendarRuntimeTriggerContext,
  CalendarRuntimeTriggerResult,
} from './types';
import { 构建日期窗口 } from './date-window';
import {
  安全字符串,
  规范化文本,
  规范化文本数组,
  评估文本列表不包含任一,
  评估文本列表包含任一,
  评估文本列表包含全部,
} from './text';

function 评估变量条件(condition: CalendarRuntimeVariableCondition, variables: Record<string, unknown>): boolean {
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

function 评估日期条件(condition: CalendarRuntimeDateWindowCondition, context: CalendarRuntimeTriggerContext): boolean {
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

function 校验日期条件(
  condition: CalendarRuntimeDateWindowCondition | null | undefined,
  context: CalendarRuntimeTriggerContext,
  label: string,
): string[] {
  if (!condition) {
    return [];
  }

  const warnings: string[] = [];
  if (condition.路径) {
    const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
    const value = _.get(variables, condition.路径);
    if (value === undefined || value === null || value === '') {
      warnings.push(`${label}引用的日期路径没有值：${condition.路径}`);
    }
  }
  if (!规范化文本(condition.开始)) {
    warnings.push(`${label}缺少开始日期`);
  }
  if (规范化文本(condition.开始) && !构建日期窗口(condition, context)) {
    warnings.push(`${label}日期窗口无法解析`);
  }
  return warnings;
}

function 校验变量条件(
  condition: CalendarRuntimeVariableCondition,
  variables: Record<string, unknown>,
  label: string,
): string[] {
  const path = 规范化文本(condition.路径);
  if (!path) {
    return [`${label}缺少变量路径`];
  }
  const value = _.get(variables, path);
  if (value === undefined || value === null || value === '') {
    return [`${label}引用的变量路径没有值：${path}`];
  }
  return [];
}

function 校验原子条件(
  condition: CalendarRuntimeAtomicCondition | null | undefined,
  context: CalendarRuntimeTriggerContext,
  label: string,
): string[] {
  if (!condition) {
    return [`${label}为空`];
  }

  const warnings: string[] = [];
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  if (condition.日期窗口) {
    warnings.push(...校验日期条件(condition.日期窗口, context, `${label}.日期窗口`));
  }
  if ((condition.来源 === 'mvu变量' || condition.来源 === '变量' || condition.路径) && !condition.日期窗口) {
    warnings.push(...校验变量条件(condition as CalendarRuntimeVariableCondition, variables, label));
  }
  if (condition.正则) {
    try {
      new RegExp(condition.正则);
    } catch {
      warnings.push(`${label}正则无法解析：${condition.正则}`);
    }
  }
  return warnings;
}

function 校验逻辑条件(
  condition: CalendarRuntimeLogicCondition | null | undefined,
  context: CalendarRuntimeTriggerContext,
  label: string,
): string[] {
  if (!condition) {
    return [];
  }

  const warnings: string[] = [];
  if (condition.条件) {
    warnings.push(...校验原子条件(condition.条件, context, `${label}.条件`));
  }
  (['全部满足', '任一满足', '都不满足'] as const).forEach(key => {
    const nodes = condition[key];
    if (nodes !== undefined && !Array.isArray(nodes)) {
      warnings.push(`${label}.${key} 必须是条件数组`);
      return;
    }
    nodes?.forEach((node, index) => {
      warnings.push(...校验逻辑条件(node, context, `${label}.${key}[${index}]`));
    });
  });
  if (!condition.条件 && !condition.全部满足?.length && !condition.任一满足?.length && !condition.都不满足?.length) {
    warnings.push(`${label}没有可执行条件`);
  }
  return warnings;
}

function validateCalendarRuntimeTrigger(
  trigger: CalendarRuntimeTriggerMap,
  context: CalendarRuntimeTriggerContext,
): string[] {
  const warnings: string[] = [];
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  if (trigger.默认逻辑 && !['全部满足', '任一满足'].includes(trigger.默认逻辑)) {
    warnings.push(`默认逻辑无效：${trigger.默认逻辑}`);
  }
  trigger.变量条件?.forEach((condition, index) => {
    warnings.push(...校验变量条件(condition, variables, `变量条件[${index}]`));
  });
  warnings.push(...校验日期条件(trigger.日期条件, context, '日期条件'));
  warnings.push(...校验逻辑条件(trigger.完整逻辑, context, '完整逻辑'));
  return warnings;
}

function 评估原子条件(condition: CalendarRuntimeAtomicCondition, context: CalendarRuntimeTriggerContext): boolean {
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

function 评估逻辑条件(condition: CalendarRuntimeLogicCondition, context: CalendarRuntimeTriggerContext): boolean {
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

export function evaluateCalendarRuntimeTrigger(
  trigger: CalendarRuntimeTriggerMap | null | undefined,
  context: CalendarRuntimeTriggerContext,
): CalendarRuntimeTriggerResult {
  if (!trigger || trigger.启用 === false) {
    return { 命中: true, 原因: ['未配置触发或触发已禁用，按默认命中处理'] };
  }

  const messages = 规范化文本数组(context.最近消息文本);
  const userMessages = 规范化文本数组(context.最近用户消息文本);
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  const logic = trigger.默认逻辑 ?? '任一满足';
  const validationWarnings = validateCalendarRuntimeTrigger(trigger, context);
  if (validationWarnings.length > 0) {
    return {
      命中: false,
      原因: validationWarnings.map(warning => `触发条件无效：${warning}`),
    };
  }
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
