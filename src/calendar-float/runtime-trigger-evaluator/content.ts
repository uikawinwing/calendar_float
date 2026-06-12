import { resolveCalendarRuntimeNodeText } from '../runtime-worldbook/resolver';
import type {
  日历运行时书籍条目,
  日历运行时内容节点,
} from '../runtime-worldbook/types';
import { evaluateCalendarRuntimeTrigger } from './conditions';
import type {
  日历运行时书籍摘要解析结果,
  日历运行时触发上下文,
} from './types';

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
