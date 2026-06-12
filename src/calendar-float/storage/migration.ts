import _ from 'lodash';

import {
  CHAT_ARCHIVE_PATH,
  CHAT_RUNTIME_PATH,
  CHAT_TICKET_ALPHA_STORE_PATH,
  LEGACY_CHAT_ARCHIVE_KEY,
  LEGACY_CHAT_BOOK_ABSTRACTS_KEY,
  LEGACY_CHAT_REMINDER_ACTIVE_KEY,
  LEGACY_CHAT_REMINDER_COMINGSOON_KEY,
  LEGACY_CHAT_RUNTIME_KEY,
  LEGACY_TICKET_ALPHA_LATEST_KEY,
  LEGACY_TICKET_ALPHA_STORE_KEY,
  MESSAGE_TICKET_ALPHA_LATEST_PATH,
} from '../constants';
import { getLatestMessageVariableTarget, warnMessageVariableUnavailable } from './message-variable';

function hasUsableValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (_.isPlainObject(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return value !== undefined && value !== null && value !== '';
}

export function migrateCalendarChatVariableStore(): boolean {
  const variables = getVariables({ type: 'chat' });
  let changed = false;
  const migratedLegacyKeys = new Set<string>();

  if (!hasUsableValue(_.get(variables, CHAT_ARCHIVE_PATH)) && hasUsableValue(variables[LEGACY_CHAT_ARCHIVE_KEY])) {
    _.set(variables, CHAT_ARCHIVE_PATH, variables[LEGACY_CHAT_ARCHIVE_KEY]);
    migratedLegacyKeys.add(LEGACY_CHAT_ARCHIVE_KEY);
    changed = true;
  }

  if (!hasUsableValue(_.get(variables, CHAT_RUNTIME_PATH))) {
    if (hasUsableValue(variables[LEGACY_CHAT_RUNTIME_KEY])) {
      _.set(variables, CHAT_RUNTIME_PATH, variables[LEGACY_CHAT_RUNTIME_KEY]);
      migratedLegacyKeys.add(LEGACY_CHAT_RUNTIME_KEY);
      changed = true;
    } else if (
      hasUsableValue(variables[LEGACY_CHAT_REMINDER_COMINGSOON_KEY]) ||
      hasUsableValue(variables[LEGACY_CHAT_REMINDER_ACTIVE_KEY]) ||
      hasUsableValue(variables[LEGACY_CHAT_BOOK_ABSTRACTS_KEY])
    ) {
      _.set(variables, CHAT_RUNTIME_PATH, {
        reminder_comingsoon: String(variables[LEGACY_CHAT_REMINDER_COMINGSOON_KEY] ?? ''),
        reminder_active: String(variables[LEGACY_CHAT_REMINDER_ACTIVE_KEY] ?? ''),
        book_abstracts: String(variables[LEGACY_CHAT_BOOK_ABSTRACTS_KEY] ?? ''),
        matched_keywords: [],
        warnings: [],
        updated_at: '',
      });
      migratedLegacyKeys.add(LEGACY_CHAT_REMINDER_COMINGSOON_KEY);
      migratedLegacyKeys.add(LEGACY_CHAT_REMINDER_ACTIVE_KEY);
      migratedLegacyKeys.add(LEGACY_CHAT_BOOK_ABSTRACTS_KEY);
      changed = true;
    }
  }

  if (
    !hasUsableValue(_.get(variables, CHAT_TICKET_ALPHA_STORE_PATH)) &&
    hasUsableValue(variables[LEGACY_TICKET_ALPHA_STORE_KEY])
  ) {
    _.set(variables, CHAT_TICKET_ALPHA_STORE_PATH, variables[LEGACY_TICKET_ALPHA_STORE_KEY]);
    migratedLegacyKeys.add(LEGACY_TICKET_ALPHA_STORE_KEY);
    changed = true;
  }

  migratedLegacyKeys.forEach(key => {
    if (_.has(variables, key)) {
      _.unset(variables, key);
      changed = true;
    }
  });

  if (changed) {
    replaceVariables(variables, { type: 'chat' });
  }
  return changed;
}

export function migrateCalendarLatestMessageVariableStore(): boolean {
  const target = getLatestMessageVariableTarget();
  if (!target) {
    return false;
  }

  let variables: Record<string, any>;
  try {
    variables = getVariables(target);
  } catch (error) {
    warnMessageVariableUnavailable('迁移最新消息变量失败，当前聊天暂时没有可用消息楼层', error);
    return false;
  }

  if (!hasUsableValue(variables[LEGACY_TICKET_ALPHA_LATEST_KEY])) {
    return false;
  }

  if (!hasUsableValue(_.get(variables, MESSAGE_TICKET_ALPHA_LATEST_PATH))) {
    _.set(variables, MESSAGE_TICKET_ALPHA_LATEST_PATH, variables[LEGACY_TICKET_ALPHA_LATEST_KEY]);
    _.unset(variables, LEGACY_TICKET_ALPHA_LATEST_KEY);
    replaceVariables(variables, target);
    return true;
  }

  return false;
}
