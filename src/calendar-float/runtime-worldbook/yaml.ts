import { parse as parseYaml } from 'yaml';

export function 解析Yaml文本<T>(content: string, context: string, warnings: string[]): T | null {
  const normalizedContent = String(content || '').trim();
  if (!normalizedContent) {
    warnings.push(`${context} 正文为空`);
    return null;
  }

  try {
    return parseYaml(normalizedContent) as T;
  } catch (error) {
    warnings.push(`${context} YAML 解析失败：${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
