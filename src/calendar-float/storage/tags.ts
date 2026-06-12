import type { RawCalendarEvent } from '../types';

export function collectEventTags(id: string, event: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>): string[] {
  const values = new Set<string>();
  const normalizedId = String(id || '').toLowerCase();
  const text = `${event.标题 || ''} ${event.内容 || ''}`;

  (event.标签 || []).forEach(tag => {
    const normalized = String(tag || '').trim();
    if (normalized) {
      values.add(normalized);
    }
  });

  if (/祭|节|庆典/.test(text)) {
    values.add('节庆');
  }
  if (/比赛|大赛|竞赛/.test(text) || /contest|tournament/i.test(text)) {
    values.add('比赛');
  }
  if (/旅行|旅程|观光|巡游/.test(text)) {
    values.add('旅行');
  }
  if (/课程|上课|讲座/.test(text)) {
    values.add('课程');
  }
  if (/约会|邂逅/.test(text)) {
    values.add('约会');
  }
  if (/主线/.test(text) || normalizedId.includes('main')) {
    values.add('主线');
  }
  if (/支线/.test(text) || normalizedId.includes('side')) {
    values.add('支线');
  }
  if (values.size === 0) {
    values.add('限时');
  }

  return Array.from(values);
}
