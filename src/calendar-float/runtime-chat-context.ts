import _ from 'lodash';
import { getLatestMessageVariableTarget } from './storage';

export interface 日历运行时消息文本 {
  messageId: number;
  role: ChatMessage['role'];
  来源: 'gametxt' | 'fallback';
  原文: string;
  可扫描文本: string;
}

function 提取GameTxt块(input: string): string[] {
  const text = String(input || '');
  const matches = [...text.matchAll(/<gametxt>([\s\S]*?)<\/gametxt>/gi)];
  return matches.map(match => String(match[1] || '').trim()).filter(Boolean);
}

function 去除Think前置内容(input: string): string {
  const text = String(input || '');
  const matched = text.match(/<\/think>/i);
  if (!matched || matched.index === undefined) {
    return text;
  }
  return text.slice(matched.index + matched[0].length);
}

function 去除变量更新块(input: string): string {
  return String(input || '').replace(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/gi, '');
}

export function resolveCalendarSearchableMessageText(input: string): { 来源: 'gametxt' | 'fallback'; 文本: string } {
  const gameTxtBlocks = 提取GameTxt块(input);
  if (gameTxtBlocks.length > 0) {
    return {
      来源: 'gametxt',
      文本: gameTxtBlocks.join('\n\n').trim(),
    };
  }

  return {
    来源: 'fallback',
    文本: 去除变量更新块(去除Think前置内容(input)).trim(),
  };
}

export function readLatestCalendarTriggerMessages(depth = 2): 日历运行时消息文本[] {
  const normalizedDepth = Number.isFinite(depth) && depth > 0 ? Math.floor(depth) : 2;
  const messages = getChatMessages(`-${normalizedDepth}-{{lastMessageId}}`, {
    role: 'all',
    hide_state: 'all',
  }) as ChatMessage[];

  return messages.slice(-normalizedDepth).map(message => {
    const resolved = resolveCalendarSearchableMessageText(message.message);
    return {
      messageId: message.message_id,
      role: message.role,
      来源: resolved.来源,
      原文: String(message.message || ''),
      可扫描文本: resolved.文本,
    };
  });
}

export function readCalendarTriggerVariableContext(): Record<string, unknown> {
  const target = getLatestMessageVariableTarget();
  const messageVariables = target ? getVariables(target) : {};
  const chatVariables = getVariables({ type: 'chat' });
  return _.merge({}, chatVariables, messageVariables);
}
