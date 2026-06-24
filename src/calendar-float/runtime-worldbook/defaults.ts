import { 是否对象, 读取对象, 读取对象字段, 规范化名称, 规范化数字 } from './normalizers';
import type {
  CalendarRuntimeBookDefaults,
  CalendarRuntimeContentNode,
  CalendarRuntimeReminderDefaults,
  CalendarRuntimeDefaults,
} from './types';

export function 构建静默扫描输出(): CalendarRuntimeContentNode['输出'] {
  return {
    模式: 'silent_scan',
    位置: 'none',
    深度: 0,
    角色: 'system',
    作为扫描文本: true,
  };
}

export function 构建可见注入输出(depth: number): CalendarRuntimeContentNode['输出'] {
  return {
    模式: 'injectprompt',
    位置: 'in_chat',
    深度: depth,
    角色: 'system',
    作为扫描文本: false,
  };
}

export function 规范化提醒默认值(value: unknown): CalendarRuntimeReminderDefaults {
  const fallback: CalendarRuntimeReminderDefaults = {
    注入方式: 'silent_scan',
    注入深度: 0,
    禁用递归: true,
    禁用触发词: true,
    宏触发词模板: '[[_${id}_reminder_]]',
    缺省模板: {
      未开始: '${固定事件} 将在 ${剩余天数} 天后开始。',
      进行中: '${固定事件} 正在举行。',
    },
  };

  if (!是否对象(value)) {
    return fallback;
  }

  const 模板对象 = 读取对象(value, ['缺省模板', 'template']) ?? {};
  const 注入方式 = 规范化名称(读取对象字段(value, ['注入方式', 'mode', 'output_mode']));
  const 宏触发词模板 = 规范化名称(
    读取对象字段(value, ['宏触发词模板', 'macro_template', 'macroTemplate', '提醒宏模板']),
  );
  return {
    注入方式: 注入方式 === 'injectprompt' ? 'injectprompt' : 'silent_scan',
    注入深度: 规范化数字(读取对象字段(value, ['注入深度', 'depth'])) ?? fallback.注入深度,
    禁用递归: 读取对象字段(value, ['禁用递归', 'disable_recursive']) !== false,
    禁用触发词: 读取对象字段(value, ['禁用触发词', 'disable_keywords']) !== false,
    宏触发词模板: 宏触发词模板 || fallback.宏触发词模板,
    缺省模板: {
      未开始: 规范化名称(读取对象字段(模板对象, ['未开始', 'upcoming'])) || fallback.缺省模板?.未开始,
      进行中: 规范化名称(读取对象字段(模板对象, ['进行中', 'active'])) || fallback.缺省模板?.进行中,
    },
  };
}

export function 规范化书籍默认值(value: unknown): CalendarRuntimeBookDefaults {
  const fallback: CalendarRuntimeBookDefaults = {
    摘要注入方式: 'injectprompt',
    摘要注入深度: 4,
  };
  if (!是否对象(value)) {
    return fallback;
  }
  return {
    摘要注入方式: 'injectprompt',
    摘要注入深度: 规范化数字(读取对象字段(value, ['摘要注入深度', 'abstract_depth'])) ?? fallback.摘要注入深度,
  };
}

export function 规范化默认设置(value: unknown): CalendarRuntimeDefaults | undefined {
  if (!是否对象(value)) {
    return undefined;
  }

  const mvu时间路径 = 规范化名称(读取对象字段(value, ['mvu时间路径', 'path_for_mvu_time', 'time_path', 'timePath']));
  const mvu地点路径 = 规范化名称(
    读取对象字段(value, ['mvu地点路径', 'path_for_mvu_location', 'location_path', 'locationPath']),
  );
  const 书籍全文默认关键词模板 = 规范化名称(
    读取对象字段(value, [
      '书籍全文默认关键词模板',
      'book消息关键词(fulltxt)',
      'book_fulltext_keyword_template',
      'bookFulltextKeywordTemplate',
    ]),
  );

  if (!mvu时间路径 && !mvu地点路径 && !书籍全文默认关键词模板) {
    return undefined;
  }

  return {
    ...(mvu时间路径 ? { mvu时间路径 } : {}),
    ...(mvu地点路径 ? { mvu地点路径 } : {}),
    ...(书籍全文默认关键词模板 ? { 书籍全文默认关键词模板 } : {}),
  };
}
