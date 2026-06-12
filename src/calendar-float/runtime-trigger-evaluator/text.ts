import _ from 'lodash';

export function 规范化文本(value: unknown): string {
  return String(value ?? '').trim();
}

export function 规范化文本数组(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map(value => 规范化文本(value)).filter(Boolean);
}

function 文本包含关键字(texts: string[], keyword: string): boolean {
  if (!keyword) {
    return false;
  }
  return texts.some(text => text.includes(keyword));
}

export function 评估文本列表包含任一(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.some(keyword => 文本包含关键字(texts, keyword));
}

export function 评估文本列表包含全部(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.every(keyword => 文本包含关键字(texts, keyword));
}

export function 评估文本列表不包含任一(texts: string[], keywords: string[]): boolean {
  return keywords.length === 0 || keywords.every(keyword => !文本包含关键字(texts, keyword));
}

export function 安全字符串(value: unknown): string {
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
