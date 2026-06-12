export function 规范化名称(value: unknown): string {
  return String(value ?? '').trim();
}

export function 是否对象(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function 读取对象字段(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }
  return undefined;
}

export function 读取对象(value: unknown, keys: string[]): Record<string, unknown> | null {
  if (!是否对象(value)) {
    return null;
  }
  const matched = 读取对象字段(value, keys);
  return 是否对象(matched) ? matched : null;
}

export function 规范化对象数组(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(是否对象);
  }
  return 是否对象(value) ? [value] : [];
}

export function 规范化字符串数组(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(item => 规范化名称(item)).filter(Boolean);
}

export function 规范化单值或字符串数组(value: unknown): string[] {
  if (Array.isArray(value)) {
    return 规范化字符串数组(value);
  }
  const text = 规范化名称(value);
  return text ? [text] : [];
}

export function 规范化数字(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function 规范化布尔值(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function 规范化等于值(value: unknown): string | number | boolean | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

export function 读取条目名(value: unknown): string {
  if (typeof value === 'string') {
    return 规范化名称(value);
  }
  if (!是否对象(value)) {
    return '';
  }
  return 规范化名称(读取对象字段(value, ['条目名', '世界书条目名称', 'entryname', 'entryName']));
}

export function 条目名是否匹配(实际值: unknown, 期望值: unknown): boolean {
  const actual = 规范化名称(实际值);
  const expected = 规范化名称(期望值);
  if (!actual || !expected) {
    return false;
  }
  return actual === expected || actual.endsWith(expected);
}
