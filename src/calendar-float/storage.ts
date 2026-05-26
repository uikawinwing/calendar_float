import _ from 'lodash';
import {
  CHAT_ARCHIVE_PATH,
  CHAT_RUNTIME_PATH,
  CHAT_TICKET_ALPHA_STORE_PATH,
  LEGACY_CHAT_BOOK_ABSTRACTS_KEY,
  LEGACY_CHAT_ARCHIVE_KEY,
  LEGACY_CHAT_REMINDER_ACTIVE_KEY,
  LEGACY_CHAT_REMINDER_COMINGSOON_KEY,
  LEGACY_CHAT_RUNTIME_KEY,
  LEGACY_TICKET_ALPHA_LATEST_KEY,
  LEGACY_TICKET_ALPHA_STORE_KEY,
  MESSAGE_TICKET_ALPHA_LATEST_PATH,
  MVU_MESSAGE_TARGET,
  MVU_REPEAT_PATH,
  MVU_ROOT_PATH,
  MVU_TEMP_PATH,
  PRESET_TAG_OPTIONS,
  SCRIPT_NAME,
} from './constants';
import { formatDateKey, parseWorldDateAnchor } from './date';
import {
  sanitizeActiveCalendarBuckets,
  sanitizeBucketRecords,
  sanitizeRawEvent,
  sanitizeTagList,
} from './event-normalizer';
import { getCalendarWorldLocationPath, getCalendarWorldTimePath } from './runtime-config';
import type {
  ActiveCalendarBuckets,
  ArchivedCalendarEvent,
  CalendarArchiveStore,
  CalendarBucketType,
  CalendarEventColorStyle,
  CalendarSourceConfig,
  CalendarSuggestionSet,
  CalendarTagOption,
  DatePoint,
  RawCalendarEvent,
} from './types';

function createEmptyBuckets(): ActiveCalendarBuckets {
  return { 临时: {}, 重复: {} };
}

function createEmptySourceConfig(): CalendarSourceConfig {
  return {
    useChatBoundWorldbook: true,
    extraWorldbooks: [],
    devWorldbooks: [],
  };
}

function createEmptyArchivePolicy(): CalendarArchiveStore['policy'] {
  return {
    archiveOnActiveRemoval: true,
    skipArchiveTags: [],
    autoDeleteTags: [],
    protectedTags: ['收藏', '星标', 'favorite', 'favourite', 'starred'],
    customTags: [],
    tagColors: {
      主线: { background: '#dcecff', text: '#305d97', border: 'rgba(95, 148, 216, 0.22)' },
      支线: { background: '#e9e2ff', text: '#5c4a98', border: 'rgba(119, 98, 190, 0.22)' },
      课程: { background: '#dff4e8', text: '#2f7048', border: 'rgba(77, 158, 103, 0.22)' },
      约会: { background: '#ffe1eb', text: '#9a3d61', border: 'rgba(194, 91, 129, 0.22)' },
      节庆: { background: '#ffe6a6', text: '#895710', border: 'rgba(201, 145, 40, 0.24)' },
      旅行: { background: '#dff2f3', text: '#2d6f73', border: 'rgba(75, 155, 160, 0.22)' },
      比赛: { background: '#ffe3cf', text: '#9a4b20', border: 'rgba(207, 111, 54, 0.22)' },
      限时: { background: '#f1e6d8', text: '#73583c', border: 'rgba(139, 105, 67, 0.2)' },
      纪念: { background: '#fff0c9', text: '#7a5916', border: 'rgba(191, 143, 68, 0.24)' },
    },
  };
}

const MVU_READY_TIMEOUT_MS = 1200;
let hasWarnedMvuFallback = false;

function hasMvuReadApi(): boolean {
  return typeof Mvu !== 'undefined' && typeof Mvu.getMvuData === 'function';
}

function hasMvuWriteApi(): boolean {
  return hasMvuReadApi() && typeof Mvu.replaceMvuData === 'function';
}

function warnMvuFallback(reason: string, error?: unknown): void {
  if (hasWarnedMvuFallback) {
    return;
  }
  hasWarnedMvuFallback = true;
  if (typeof error === 'undefined') {
    console.warn(`[${SCRIPT_NAME}] ${reason}`);
    return;
  }
  console.warn(`[${SCRIPT_NAME}] ${reason}`, error);
}

function readMessageVariableData(): Record<string, any> {
  if (hasMvuReadApi()) {
    return Mvu.getMvuData(MVU_MESSAGE_TARGET) || {};
  }
  return getVariables({ type: 'message' });
}

function ensureActiveBucketShape(data: Record<string, any>): void {
  if (!_.isPlainObject(_.get(data, MVU_ROOT_PATH))) {
    _.set(data, MVU_ROOT_PATH, createEmptyBuckets());
  }
  if (!_.isPlainObject(_.get(data, MVU_TEMP_PATH))) {
    _.set(data, MVU_TEMP_PATH, {});
  }
  if (!_.isPlainObject(_.get(data, MVU_REPEAT_PATH))) {
    _.set(data, MVU_REPEAT_PATH, {});
  }
}

function sanitizeWorldbookNameList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => String(item ?? '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function sanitizeSourceConfig(value: unknown): CalendarSourceConfig {
  const defaults = createEmptySourceConfig();
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const extraWorldbooks = sanitizeWorldbookNameList(source.extraWorldbooks);
  const devWorldbooks = sanitizeWorldbookNameList(source.devWorldbooks);
  return {
    useChatBoundWorldbook: source.useChatBoundWorldbook !== false,
    extraWorldbooks,
    devWorldbooks: devWorldbooks.length ? devWorldbooks : defaults.devWorldbooks,
  };
}

function sanitizeArchivePolicy(value: unknown): CalendarArchiveStore['policy'] {
  const defaults = createEmptyArchivePolicy();
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const skipArchiveTags = sanitizeTagList(source.skipArchiveTags);
  const protectedTags = sanitizeTagList(source.protectedTags);
  return {
    archiveOnActiveRemoval: source.archiveOnActiveRemoval !== false,
    skipArchiveTags,
    autoDeleteTags: sanitizeTagList(source.autoDeleteTags),
    protectedTags: protectedTags.length
      ? protectedTags
      : skipArchiveTags.length
        ? skipArchiveTags
        : defaults.protectedTags,
    customTags: sanitizeTagList(source.customTags),
    tagColors: sanitizeTagColorMap(source.tagColors, defaults.tagColors),
  };
}

function sanitizeColorValue(value: unknown): string {
  const text = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(text) ? text : '';
}

function sanitizeTagColorMap(
  value: unknown,
  defaults: Record<string, CalendarEventColorStyle>,
): Record<string, CalendarEventColorStyle> {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const output: Record<string, CalendarEventColorStyle> = { ...defaults };
  Object.entries(source).forEach(([tag, color]) => {
    if (!_.isPlainObject(color)) {
      return;
    }
    const raw = color as Record<string, unknown>;
    const background = sanitizeColorValue(raw.background);
    const text = sanitizeColorValue(raw.text);
    const border = sanitizeColorValue(raw.border);
    const normalizedTag = String(tag || '').trim();
    if (!normalizedTag || !background || !text) {
      return;
    }
    output[normalizedTag] = {
      background,
      text,
      ...(border ? { border } : {}),
    };
  });
  return output;
}

function cloneBucketsSnapshot(buckets: ActiveCalendarBuckets): ActiveCalendarBuckets {
  return {
    临时: sanitizeBucketRecords(buckets.临时, '临时'),
    重复: sanitizeBucketRecords(buckets.重复, '重复'),
  };
}

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

  if (!hasUsableValue(_.get(variables, CHAT_ARCHIVE_PATH)) && hasUsableValue(variables[LEGACY_CHAT_ARCHIVE_KEY])) {
    _.set(variables, CHAT_ARCHIVE_PATH, variables[LEGACY_CHAT_ARCHIVE_KEY]);
    changed = true;
  }

  if (!hasUsableValue(_.get(variables, CHAT_RUNTIME_PATH))) {
    if (hasUsableValue(variables[LEGACY_CHAT_RUNTIME_KEY])) {
      _.set(variables, CHAT_RUNTIME_PATH, variables[LEGACY_CHAT_RUNTIME_KEY]);
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
      changed = true;
    }
  }

  if (
    !hasUsableValue(_.get(variables, CHAT_TICKET_ALPHA_STORE_PATH)) &&
    hasUsableValue(variables[LEGACY_TICKET_ALPHA_STORE_KEY])
  ) {
    _.set(variables, CHAT_TICKET_ALPHA_STORE_PATH, variables[LEGACY_TICKET_ALPHA_STORE_KEY]);
    changed = true;
  }

  [
    LEGACY_CHAT_ARCHIVE_KEY,
    LEGACY_CHAT_RUNTIME_KEY,
    LEGACY_CHAT_REMINDER_COMINGSOON_KEY,
    LEGACY_CHAT_REMINDER_ACTIVE_KEY,
    LEGACY_CHAT_BOOK_ABSTRACTS_KEY,
    LEGACY_TICKET_ALPHA_STORE_KEY,
  ].forEach(key => {
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
  const variables = getVariables({ type: 'message', message_id: -1 });
  if (!hasUsableValue(variables[LEGACY_TICKET_ALPHA_LATEST_KEY])) {
    return false;
  }

  if (!hasUsableValue(_.get(variables, MESSAGE_TICKET_ALPHA_LATEST_PATH))) {
    _.set(variables, MESSAGE_TICKET_ALPHA_LATEST_PATH, variables[LEGACY_TICKET_ALPHA_LATEST_KEY]);
  }
  _.unset(variables, LEGACY_TICKET_ALPHA_LATEST_KEY);
  replaceVariables(variables, { type: 'message', message_id: -1 });
  return true;
}

function hasCalendarBucketPath(variables: Record<string, any>): boolean {
  return _.has(variables, MVU_ROOT_PATH) || _.has(variables, MVU_TEMP_PATH) || _.has(variables, MVU_REPEAT_PATH);
}

function readBucketsFromMvuVariables(variables: Record<string, any>): ActiveCalendarBuckets {
  return sanitizeActiveCalendarBuckets(_.get(variables, MVU_ROOT_PATH, {}));
}

function hasActiveEventId(buckets: ActiveCalendarBuckets, id: string): boolean {
  return Boolean(buckets.临时[id] || buckets.重复[id]);
}

function sanitizeArchiveStore(value: unknown): CalendarArchiveStore {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const completedSource = _.isPlainObject(source.completed) ? (source.completed as Record<string, unknown>) : {};
  const completed = Object.fromEntries(
    Object.entries(completedSource).map(([id, event]) => {
      const raw = _.isPlainObject(event) ? (event as Record<string, unknown>) : {};
      const type: CalendarBucketType = raw.type === '重复' ? '重复' : '临时';
      const archived: ArchivedCalendarEvent = {
        id,
        type,
        archived_at: String(raw.archived_at ?? ''),
        completed_at: String(raw.completed_at ?? ''),
        tags: Array.isArray(raw.tags) ? raw.tags.map(tag => String(tag)).filter(Boolean) : [],
        preserved_for_player: true,
        archive_reason: ['completed', 'auto_cleanup', 'manual_delete', 'memory'].includes(
          String(raw.archive_reason ?? ''),
        )
          ? (String(raw.archive_reason) as ArchivedCalendarEvent['archive_reason'])
          : 'completed',
        ...sanitizeRawEvent(raw, type),
      };
      return [id, archived];
    }),
  ) as Record<string, ArchivedCalendarEvent>;
  const snapshotSource = _.isPlainObject(source.lastActiveSnapshot)
    ? (source.lastActiveSnapshot as Record<string, unknown>)
    : {};

  return {
    completed,
    dismissedFestivalReminderKeys: Array.isArray(source.dismissedFestivalReminderKeys)
      ? source.dismissedFestivalReminderKeys.map(value => String(value)).filter(Boolean)
      : [],
    dismissedUserReminderKeys: Array.isArray(source.dismissedUserReminderKeys)
      ? source.dismissedUserReminderKeys.map(value => String(value)).filter(Boolean)
      : [],
    sources: sanitizeSourceConfig(source.sources),
    policy: sanitizeArchivePolicy(source.policy),
    lastActiveSnapshot: {
      临时: sanitizeBucketRecords(snapshotSource.临时, '临时'),
      重复: sanitizeBucketRecords(snapshotSource.重复, '重复'),
    },
  };
}

export async function ensureMvuReady(timeoutMs = MVU_READY_TIMEOUT_MS): Promise<boolean> {
  if (hasMvuWriteApi()) {
    return true;
  }
  if (typeof waitGlobalInitialized !== 'function') {
    if (!hasMvuReadApi()) {
      warnMvuFallback('waitGlobalInitialized 不可用，改为直接读取 message 变量');
    }
    return hasMvuReadApi();
  }

  try {
    const ready = await Promise.race([
      waitGlobalInitialized('Mvu').then(() => true),
      new Promise<boolean>(resolve => {
        setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
    if (!ready && !hasMvuReadApi()) {
      warnMvuFallback(`Mvu 未在 ${timeoutMs}ms 内完成初始化，改为直接读取 message 变量`);
      return false;
    }
  } catch (error) {
    warnMvuFallback('等待 Mvu 初始化失败，改为直接读取 message 变量', error);
    return false;
  }

  return hasMvuReadApi();
}

export async function readActiveBuckets(): Promise<ActiveCalendarBuckets> {
  await ensureMvuReady();
  const data = readMessageVariableData();
  ensureActiveBucketShape(data);

  const temp = sanitizeBucketRecords(_.get(data, MVU_TEMP_PATH, {}), '临时');
  const repeat = sanitizeBucketRecords(_.get(data, MVU_REPEAT_PATH, {}), '重复');
  return {
    临时: temp,
    重复: repeat,
  };
}

export async function replaceActiveBuckets(nextBuckets: ActiveCalendarBuckets): Promise<void> {
  const isMvuReady = await ensureMvuReady();
  const data = readMessageVariableData();
  ensureActiveBucketShape(data);
  _.set(data, MVU_TEMP_PATH, nextBuckets.临时);
  _.set(data, MVU_REPEAT_PATH, nextBuckets.重复);

  if (isMvuReady && hasMvuWriteApi()) {
    await Mvu.replaceMvuData(data as Mvu.MvuData, MVU_MESSAGE_TARGET);
    return;
  }

  replaceVariables(data, { type: 'message' });
}

export function readArchiveStore(): CalendarArchiveStore {
  const variables = getVariables({ type: 'chat' });
  return sanitizeArchiveStore(_.get(variables, CHAT_ARCHIVE_PATH, variables[LEGACY_CHAT_ARCHIVE_KEY]));
}

export function replaceArchiveStore(nextStore: CalendarArchiveStore): void {
  const variables = getVariables({ type: 'chat' });
  _.set(variables, CHAT_ARCHIVE_PATH, sanitizeArchiveStore(nextStore));
  _.unset(variables, LEGACY_CHAT_ARCHIVE_KEY);
  replaceVariables(variables, { type: 'chat' });
}

export function readCalendarSourceConfig(): CalendarSourceConfig {
  return readArchiveStore().sources;
}

export function replaceCalendarSourceConfig(nextConfig: CalendarSourceConfig): CalendarSourceConfig {
  const archive = readArchiveStore();
  archive.sources = sanitizeSourceConfig(nextConfig);
  replaceArchiveStore(archive);
  return archive.sources;
}

export function readCalendarArchivePolicy(): CalendarArchiveStore['policy'] {
  return readArchiveStore().policy;
}

export function replaceCalendarArchivePolicy(
  nextPolicy: Partial<CalendarArchiveStore['policy']>,
): CalendarArchiveStore['policy'] {
  const archive = readArchiveStore();
  archive.policy = sanitizeArchivePolicy({
    ...archive.policy,
    ...nextPolicy,
  });
  replaceArchiveStore(archive);
  return archive.policy;
}

export function getChatBoundCalendarWorldbookName(): string {
  const binding = getCharWorldbookNames('current');
  const primary = String(binding.primary || '').trim();
  if (primary) {
    return primary;
  }
  return String(getChatWorldbookName('current') || '').trim();
}

export function getAvailableCalendarWorldbooks(): string[] {
  return [...getWorldbookNames(), ...getGlobalWorldbookNames()]
    .map(name => String(name || '').trim())
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function resolveArchiveReason(raw: RawCalendarEvent): ArchivedCalendarEvent['archive_reason'] {
  return raw.完成后 === '自动清理'
    ? 'auto_cleanup'
    : raw.完成后 === '转回忆' || raw.类型 === '回忆'
      ? 'memory'
      : 'completed';
}

function hasAnyPolicyTag(id: string, raw: RawCalendarEvent, tags: string[]): boolean {
  if (!tags.length) {
    return false;
  }
  const eventTags = collectEventTags(id, raw);
  return eventTags.some(tag => tags.includes(tag));
}

export function resolveCalendarEventPolicyAction(
  id: string,
  raw: RawCalendarEvent,
  policy: CalendarArchiveStore['policy'] = readArchiveStore().policy,
): 'archive' | 'delete' | 'protect' {
  if (hasAnyPolicyTag(id, raw, [...policy.protectedTags, ...policy.skipArchiveTags])) {
    return 'protect';
  }
  if (hasAnyPolicyTag(id, raw, policy.autoDeleteTags)) {
    return 'delete';
  }
  return 'archive';
}

export function resolveCalendarEventColor(
  id: string,
  raw: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>,
  policy: CalendarArchiveStore['policy'] = readArchiveStore().policy,
): CalendarEventColorStyle | undefined {
  const tags = collectEventTags(id, raw);
  for (const tag of tags) {
    const color = policy.tagColors[tag];
    if (color) {
      return color;
    }
  }
  return undefined;
}

function shouldSkipArchiveByPolicy(args: {
  id: string;
  raw: RawCalendarEvent;
  policy: CalendarArchiveStore['policy'];
}): boolean {
  return resolveCalendarEventPolicyAction(args.id, args.raw, args.policy) !== 'archive';
}

function writeArchivedEvent(args: {
  archive: CalendarArchiveStore;
  id: string;
  type: '临时' | '重复';
  raw: RawCalendarEvent;
  completedAt?: string;
  archiveReason?: ArchivedCalendarEvent['archive_reason'];
}): boolean {
  const normalizedRaw = sanitizeRawEvent(args.raw, args.type);
  if (shouldSkipArchiveByPolicy({ id: args.id, raw: normalizedRaw, policy: args.archive.policy })) {
    return false;
  }

  args.archive.completed[args.id] = {
    id: args.id,
    type: args.type,
    archived_at: new Date().toISOString(),
    completed_at: args.completedAt ?? '',
    tags: collectEventTags(args.id, normalizedRaw),
    preserved_for_player: true,
    archive_reason: args.archiveReason ?? resolveArchiveReason(normalizedRaw),
    ...normalizedRaw,
  };
  return true;
}

export async function archiveCompletedEvent(params: {
  id: string;
  type: '临时' | '重复';
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const sourceBucket = params.type === '重复' ? buckets.重复 : buckets.临时;
  const raw = sourceBucket[params.id];
  if (!raw) {
    return 'missing';
  }

  const archive = readArchiveStore();
  const policyAction = resolveCalendarEventPolicyAction(params.id, raw, archive.policy);
  if (policyAction === 'protect') {
    return 'protected';
  }
  if (policyAction === 'archive') {
    writeArchivedEvent({
      archive,
      id: params.id,
      type: params.type,
      raw,
      completedAt: params.completedAt,
    });
  }

  delete sourceBucket[params.id];
  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
  return policyAction === 'delete' ? 'deleted' : 'archived';
}

export async function removeActiveEventWithPolicy(params: {
  id: string;
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const type: CalendarBucketType | null = buckets.重复[params.id] ? '重复' : buckets.临时[params.id] ? '临时' : null;
  if (!type) {
    return 'missing';
  }
  const sourceBucket = type === '重复' ? buckets.重复 : buckets.临时;
  const raw = sourceBucket[params.id];
  const archive = readArchiveStore();
  const policyAction = resolveCalendarEventPolicyAction(params.id, raw, archive.policy);

  if (policyAction === 'protect') {
    return 'protected';
  }
  if (policyAction === 'archive') {
    writeArchivedEvent({
      archive,
      id: params.id,
      type,
      raw,
      completedAt: params.completedAt,
      archiveReason: 'manual_delete',
    });
  }

  delete sourceBucket[params.id];
  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
  return policyAction === 'delete' ? 'deleted' : 'archived';
}

export async function syncArchiveOnActiveRemoval(completedAt?: string): Promise<{
  archived: number;
  skipped: number;
  deleted: number;
  restored: number;
}> {
  const buckets = await readActiveBuckets();
  const archive = readArchiveStore();
  const previous = archive.lastActiveSnapshot;
  let archived = 0;
  let skipped = 0;
  let deleted = 0;
  let restored = 0;

  (['临时', '重复'] as const).forEach(bucketType => {
    const previousBucket = previous[bucketType] || {};
    const currentBucket = buckets[bucketType] || {};
    Object.entries(previousBucket).forEach(([id, raw]) => {
      if (hasActiveEventId(buckets, id)) {
        return;
      }
      if (archive.completed[id]) {
        return;
      }

      const policyAction = resolveCalendarEventPolicyAction(id, raw, archive.policy);
      if (policyAction === 'protect') {
        currentBucket[id] = raw;
        restored += 1;
        return;
      }
      if (policyAction === 'delete') {
        deleted += 1;
        return;
      }
      if (!archive.policy.archiveOnActiveRemoval) {
        skipped += 1;
        return;
      }
      if (
        writeArchivedEvent({
          archive,
          id,
          type: bucketType,
          raw,
          completedAt,
        })
      ) {
        archived += 1;
        return;
      }
      skipped += 1;
    });
  });

  if (restored > 0) {
    await replaceActiveBuckets(buckets);
  }

  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  return { archived, skipped, deleted, restored };
}

export function syncArchiveFromMvuVariableDiff(params: {
  newVariables: Record<string, any>;
  oldVariables: Record<string, any>;
  completedAt?: string;
}): {
  archived: number;
  skipped: number;
  deleted: number;
  restored: number;
} {
  if (!hasCalendarBucketPath(params.oldVariables) && !hasCalendarBucketPath(params.newVariables)) {
    return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
  }

  const previous = readBucketsFromMvuVariables(params.oldVariables);
  const current = readBucketsFromMvuVariables(params.newVariables);
  const archive = readArchiveStore();
  let archived = 0;
  let skipped = 0;
  let deleted = 0;
  let restored = 0;

  (['临时', '重复'] as const).forEach(bucketType => {
    const previousBucket = previous[bucketType] || {};
    const currentBucket = current[bucketType] || {};
    Object.entries(previousBucket).forEach(([id, raw]) => {
      if (hasActiveEventId(current, id)) {
        return;
      }
      if (archive.completed[id]) {
        return;
      }

      const policyAction = resolveCalendarEventPolicyAction(id, raw, archive.policy);
      if (policyAction === 'protect') {
        currentBucket[id] = raw;
        restored += 1;
        return;
      }
      if (policyAction === 'delete') {
        deleted += 1;
        return;
      }
      if (!archive.policy.archiveOnActiveRemoval) {
        skipped += 1;
        return;
      }
      if (
        writeArchivedEvent({
          archive,
          id,
          type: bucketType,
          raw,
          completedAt: params.completedAt,
        })
      ) {
        archived += 1;
        return;
      }
      skipped += 1;
    });
  });

  if (restored > 0) {
    _.set(params.newVariables, MVU_TEMP_PATH, current.临时);
    _.set(params.newVariables, MVU_REPEAT_PATH, current.重复);
  }

  archive.lastActiveSnapshot = cloneBucketsSnapshot(current);
  replaceArchiveStore(archive);
  return { archived, skipped, deleted, restored };
}

export async function restoreArchivedEvent(id: string): Promise<void> {
  const archive = readArchiveStore();
  const archived = archive.completed[id];
  if (!archived) {
    return;
  }

  const buckets = await readActiveBuckets();
  const targetBucket = archived.type === '重复' ? buckets.重复 : buckets.临时;
  targetBucket[id] = sanitizeRawEvent(archived, archived.type);
  delete archive.completed[id];

  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
}

export function purgeArchivedEventWithPolicy(id: string): 'deleted' | 'protected' | 'missing' {
  const archive = readArchiveStore();
  const archived = archive.completed[id];
  if (!archived) {
    return 'missing';
  }
  if (resolveCalendarEventPolicyAction(id, archived, archive.policy) === 'protect') {
    return 'protected';
  }
  delete archive.completed[id];
  replaceArchiveStore(archive);
  return 'deleted';
}

export function purgeAutoDeleteArchivedEvents(): { deleted: number; protected: number } {
  const archive = readArchiveStore();
  let deleted = 0;
  let protectedCount = 0;
  Object.entries(archive.completed).forEach(([id, event]) => {
    const action = resolveCalendarEventPolicyAction(id, event, archive.policy);
    if (action === 'protect') {
      protectedCount += 1;
      return;
    }
    if (action === 'delete') {
      delete archive.completed[id];
      deleted += 1;
    }
  });
  replaceArchiveStore(archive);
  return { deleted, protected: protectedCount };
}

export function readCurrentWorldTime(path = getCalendarWorldTimePath()): {
  text: string;
  point: DatePoint | null;
  anchor: { dateKey: string; weekday: number } | null;
} {
  const messageData = readMessageVariableData();
  const text = String(_.get(messageData, path, '') || '');
  const parsed = parseWorldDateAnchor(text);
  return {
    text,
    point: parsed?.point ?? null,
    anchor:
      parsed && typeof parsed.weekday === 'number'
        ? {
            dateKey: formatDateKey(parsed.point),
            weekday: parsed.weekday,
          }
        : null,
  };
}

function formatWorldLocationValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatWorldLocationValue).filter(Boolean).join(' / ');
  }
  if (_.isPlainObject(value)) {
    return Object.values(value as Record<string, unknown>)
      .map(formatWorldLocationValue)
      .filter(Boolean)
      .join(' / ');
  }
  return String(value ?? '').trim();
}

export function readCurrentWorldLocation(path = getCalendarWorldLocationPath()): string {
  const messageData = readMessageVariableData();
  return formatWorldLocationValue(_.get(messageData, path, ''));
}

export function buildSuggestionSet(args: {
  activeBuckets: ActiveCalendarBuckets;
  archive: CalendarArchiveStore;
}): CalendarSuggestionSet {
  const titlePool = new Set<string>();
  const tagMap = new Map<string, CalendarTagOption>();
  const idPool = new Set<string>();

  PRESET_TAG_OPTIONS.forEach(option => tagMap.set(option.value, option));
  args.archive.policy.customTags.forEach(tag => {
    if (!tagMap.has(tag)) {
      tagMap.set(tag, { value: tag, label: tag, source: 'custom' });
    }
  });

  const collect = (id: string, event: RawCalendarEvent | ArchivedCalendarEvent): void => {
    if (id) {
      idPool.add(id);
    }
    if (event.标题) {
      titlePool.add(event.标题);
    }
    collectEventTags(id, event).forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { value: tag, label: tag, source: 'history' });
      }
    });
  };

  Object.entries(args.activeBuckets.临时).forEach(([id, event]) => collect(id, event));
  Object.entries(args.activeBuckets.重复).forEach(([id, event]) => collect(id, event));
  Object.entries(args.archive.completed).forEach(([id, event]) => collect(id, event));

  return {
    idCandidates: Array.from(idPool).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    titleCandidates: Array.from(titlePool).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    tagCandidates: Array.from(tagMap.values()).sort((left, right) => left.label.localeCompare(right.label, 'zh-CN')),
  };
}

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
