import { 读取对象字段 } from './normalizers';

export const RUNTIME_FIELD_ALIASES = {
  id: ['id'],
  name: ['名称', 'name', 'title'],
  start: ['开始', 'start'],
  end: ['结束', 'end'],
  enabled: ['启用', 'enabled'],
  groups: ['固定事件分组'],
  festivals: ['固定事件'],
  materials: ['补充资料'],
  stages: ['阶段', '阶段列表', 'stages', 'phases'],
  reminder: ['提醒', 'reminder'],
  intro: ['介绍', 'event', 'intro'],
  fulltext: ['全文', 'fulltext', 'fullText'],
  summary: ['摘要', '摘要内容', 'book_abstract_content', '摘要正文', 'abstract_content', 'abstractContent', '正文'],
} as const;

export type RuntimeFieldAliasKey = keyof typeof RUNTIME_FIELD_ALIASES;

export function readRuntimeField(source: Record<string, unknown>, key: RuntimeFieldAliasKey): unknown {
  return 读取对象字段(source, RUNTIME_FIELD_ALIASES[key]);
}
