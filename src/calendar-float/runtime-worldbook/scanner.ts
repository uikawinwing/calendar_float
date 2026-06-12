/**
 * 负责：运行时总调度。
 * 流程：读取 index -> 收集最近消息/变量 -> 判定哪些节庆/提醒命中 -> 写入运行时变量 ->
 * 仅对 worldbook 扫描类内容做 silent scan，同时对提醒做可见 injectprompt。
 */
import _ from 'lodash';
import {
  CHAT_RUNTIME_PATH,
  SCRIPT_NAME,
} from '../constants';
import { readCalendarTriggerVariableContext, readLatestCalendarTriggerMessages } from '../runtime-chat-context';
import {
  resolveCalendarContentNode,
  resolveCalendarFestivalReminder,
  resolveCalendarFestivalStageReminder,
  type CalendarRuntimeTriggerContext,
} from '../runtime-trigger-evaluator';
import { normalizeCalendarMonthAliasList } from '../runtime-month-alias';
import { readCalendarRuntimeIndex } from './loader';
import type { CalendarRuntimeContentNode, CalendarRuntimeIndex } from './types';
import { readCurrentWorldTime } from '../storage';

const RUNTIME_SCAN_PROMPT_ID = 'calendar_float_runtime_worldbook_scan';
const RUNTIME_REMINDER_PROMPT_ID = 'calendar_float_runtime_visible_reminders';
const RUNTIME_ABSTRACT_PROMPT_ID = 'calendar_float_runtime_visible_abstracts';

let lastInjectedScanContent = '';
let lastInjectedReminderContent = '';
let lastInjectedAbstractContent = '';
let runtimeScannerUninject: (() => void) | null = null;
let runtimeReminderUninject: (() => void) | null = null;
let runtimeAbstractUninject: (() => void) | null = null;
let generationHookBound = false;
let chatChangedHookBound = false;
let generationHookStop: (() => void) | null = null;
let chatChangedHookStop: (() => void) | null = null;

export interface CalendarRuntimeScanResult {
  命中关键字: string[];
  提醒未开始文本: string[];
  提醒进行中文本: string[];
  摘要文本: Array<{ 书籍id: string; 名称: string; 正文: string }>;
  警告: string[];
}

function 规范化文本(value: unknown): string {
  return String(value ?? '').trim();
}

function 取唯一文本(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values.map(item => 规范化文本(item)).filter(Boolean)) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

function 读取触发上下文(index: CalendarRuntimeIndex): CalendarRuntimeTriggerContext {
  const worldTime = readCurrentWorldTime(undefined, normalizeCalendarMonthAliasList(index.月份别名));
  const messages = readLatestCalendarTriggerMessages(2);
  return {
    当前日期: worldTime.point,
    最近消息文本: messages.map(item => item.可扫描文本).filter(Boolean),
    最近用户消息文本: messages
      .filter(item => item.role === 'user')
      .map(item => item.可扫描文本)
      .filter(Boolean),
    变量表: readCalendarTriggerVariableContext(),
  };
}

function 追加节点关键字(target: string[], node: CalendarRuntimeContentNode | null | undefined): void {
  const tokens = node?.扫描触发词 ?? [];
  for (const token of tokens.map(item => 规范化文本(item)).filter(Boolean)) {
    target.push(token);
  }
}

async function 扫描节庆介绍与全文(
  index: CalendarRuntimeIndex,
  context: CalendarRuntimeTriggerContext,
  result: CalendarRuntimeScanResult,
): Promise<void> {
  for (const festival of index.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }

    const intro = await resolveCalendarContentNode(festival.介绍, context);
    if (intro.命中) {
      追加节点关键字(result.命中关键字, festival.介绍);
    }
    result.警告.push(...intro.警告.map(message => `[节庆介绍:${festival.名称}] ${message}`));
  }

  for (const book of index.书籍 ?? []) {
    if (book.启用 === false) {
      continue;
    }
    const fulltext = await resolveCalendarContentNode(book.全文, context);
    if (fulltext.命中) {
      追加节点关键字(result.命中关键字, book.全文);
    }
    result.警告.push(...fulltext.警告.map(message => `[书籍全文:${book.名称}] ${message}`));
  }
}

async function 扫描节庆提醒(
  index: CalendarRuntimeIndex,
  context: CalendarRuntimeTriggerContext,
  result: CalendarRuntimeScanResult,
): Promise<void> {
  for (const festival of index.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }

    const reminder = await resolveCalendarFestivalReminder(festival, context);
    if (reminder.状态 === '未开始' || reminder.状态 === '进行中') {
      追加节点关键字(result.命中关键字, festival.提醒);
      if (festival.提醒?.输出?.模式 !== 'silent_scan') {
        if (reminder.状态 === '未开始') {
          result.提醒未开始文本.push(reminder.正文);
        } else {
          result.提醒进行中文本.push(reminder.正文);
        }
      }
    }
    result.警告.push(...reminder.警告.map(message => `[节庆提醒:${festival.名称}] ${message}`));

    for (const stage of festival.阶段 ?? []) {
      const stageReminder = await resolveCalendarFestivalStageReminder(festival, stage, context);
      if (stageReminder.状态 === '未开始' || stageReminder.状态 === '进行中') {
        追加节点关键字(result.命中关键字, stage.提醒);
        if (stage.提醒?.输出?.模式 !== 'silent_scan') {
          if (stageReminder.状态 === '未开始') {
            result.提醒未开始文本.push(stageReminder.正文);
          } else {
            result.提醒进行中文本.push(stageReminder.正文);
          }
        }
      }
      result.警告.push(...stageReminder.警告.map(message => `[节庆阶段提醒:${festival.名称}/${stage.名称}] ${message}`));
    }
  }
}

function buildRuntimeScanPromptContent(keywords: string[]): string {
  return 取唯一文本(keywords).join('\n');
}

function buildXmlWrappedPromptContent(tagName: string, content: string): string {
  const normalizedContent = 规范化文本(content);
  if (!normalizedContent) {
    return '';
  }
  return `<${tagName}>\n${normalizedContent}\n</${tagName}>`;
}

function buildReminderPromptContent(result: CalendarRuntimeScanResult): string {
  return buildXmlWrappedPromptContent(
    'festival_reminder',
    [...取唯一文本(result.提醒未开始文本), ...取唯一文本(result.提醒进行中文本)].join('\n\n'),
  );
}

function clearPromptById(id: string, uninjectRef: (() => void) | null): void {
  if (uninjectRef) {
    uninjectRef();
  }
  uninjectPrompts([id]);
}

function clearRuntimePrompts(): void {
  clearPromptById(RUNTIME_SCAN_PROMPT_ID, runtimeScannerUninject);
  clearPromptById(RUNTIME_REMINDER_PROMPT_ID, runtimeReminderUninject);
  clearPromptById(RUNTIME_ABSTRACT_PROMPT_ID, runtimeAbstractUninject);
  runtimeScannerUninject = null;
  runtimeReminderUninject = null;
  runtimeAbstractUninject = null;
  lastInjectedScanContent = '';
  lastInjectedReminderContent = '';
  lastInjectedAbstractContent = '';
}

function handleGenerationAfterCommands(): void {
  void applyCalendarRuntimeWorldbookScan().catch(error => {
    console.warn(`[${SCRIPT_NAME}] runtime worldbook generation scan 失败`, error);
  });
}

function handleChatChanged(): void {
  void applyCalendarRuntimeWorldbookScan().catch(error => {
    console.warn(`[${SCRIPT_NAME}] runtime worldbook chat scan 失败`, error);
  });
}

function applySilentScanPrompt(content: string): void {
  clearPromptById(RUNTIME_SCAN_PROMPT_ID, runtimeScannerUninject);
  runtimeScannerUninject = null;
  if (!content) {
    lastInjectedScanContent = '';
    return;
  }

  runtimeScannerUninject = injectPrompts(
    [
      {
        id: RUNTIME_SCAN_PROMPT_ID,
        position: 'none',
        depth: 0,
        role: 'system',
        content,
        should_scan: true,
      },
    ],
    { once: false },
  ).uninject;
  lastInjectedScanContent = content;
}

function applyVisiblePrompt(
  id: string,
  content: string,
  depth: number,
  assign: (value: (() => void) | null) => void,
): void {
  const currentUninject = id === RUNTIME_REMINDER_PROMPT_ID ? runtimeReminderUninject : runtimeAbstractUninject;
  clearPromptById(id, currentUninject);
  assign(null);
  if (!content) {
    if (id === RUNTIME_REMINDER_PROMPT_ID) {
      lastInjectedReminderContent = '';
    } else {
      lastInjectedAbstractContent = '';
    }
    return;
  }

  const uninject = injectPrompts(
    [
      {
        id,
        position: 'in_chat',
        depth,
        role: 'system',
        content,
        should_scan: false,
      },
    ],
    { once: false },
  ).uninject;
  assign(uninject);
  if (id === RUNTIME_REMINDER_PROMPT_ID) {
    lastInjectedReminderContent = content;
  } else {
    lastInjectedAbstractContent = content;
  }
}

function writeRuntimeScanVariables(result: CalendarRuntimeScanResult): void {
  const comingSoon = 取唯一文本(result.提醒未开始文本).join('\n\n');
  const active = 取唯一文本(result.提醒进行中文本).join('\n\n');
  const summaries = result.摘要文本.map(item => `【${item.名称}】\n${item.正文}`).join('\n\n');
  const payload = {
    reminder_comingsoon: comingSoon,
    reminder_active: active,
    book_abstracts: summaries,
    matched_keywords: 取唯一文本(result.命中关键字),
    warnings: 取唯一文本(result.警告),
    updated_at: new Date().toISOString(),
  };

  updateVariablesWith(
    variables => {
      _.set(variables, CHAT_RUNTIME_PATH, payload);
      return variables;
    },
    { type: 'chat' },
  );
}

export async function scanCalendarRuntimeWorldbook(): Promise<CalendarRuntimeScanResult> {
  const indexResult = await readCalendarRuntimeIndex();
  const index: CalendarRuntimeIndex | null = indexResult.索引;
  const result: CalendarRuntimeScanResult = {
    命中关键字: [],
    提醒未开始文本: [],
    提醒进行中文本: [],
    摘要文本: [],
    警告: [...indexResult.警告],
  };

  if (!index) {
    return result;
  }

  const context = 读取触发上下文(index);
  await 扫描节庆介绍与全文(index, context, result);
  await 扫描节庆提醒(index, context, result);
  result.命中关键字 = 取唯一文本(result.命中关键字);
  result.提醒未开始文本 = 取唯一文本(result.提醒未开始文本);
  result.提醒进行中文本 = 取唯一文本(result.提醒进行中文本);
  result.警告 = 取唯一文本(result.警告);
  return result;
}

export async function applyCalendarRuntimeWorldbookScan(): Promise<void> {
  const result = await scanCalendarRuntimeWorldbook();
  writeRuntimeScanVariables(result);

  const scanContent = buildRuntimeScanPromptContent(result.命中关键字);
  if (scanContent !== lastInjectedScanContent) {
    applySilentScanPrompt(scanContent);
  }

  const reminderContent = buildReminderPromptContent(result);
  if (reminderContent !== lastInjectedReminderContent) {
    applyVisiblePrompt(RUNTIME_REMINDER_PROMPT_ID, reminderContent, 0, value => {
      runtimeReminderUninject = value;
    });
  }

  if (lastInjectedAbstractContent) {
    clearPromptById(RUNTIME_ABSTRACT_PROMPT_ID, runtimeAbstractUninject);
    runtimeAbstractUninject = null;
    lastInjectedAbstractContent = '';
  }

  if (result.警告.length > 0) {
    console.info(`[${SCRIPT_NAME}] runtime worldbook scan warnings`, result.警告);
  }
}

function bindGenerationHook(): void {
  if (generationHookBound) {
    return;
  }
  generationHookBound = true;
  generationHookStop = eventOn(tavern_events.GENERATION_AFTER_COMMANDS, handleGenerationAfterCommands).stop;
}

function bindChatChangedHook(): void {
  if (chatChangedHookBound) {
    return;
  }
  chatChangedHookBound = true;
  chatChangedHookStop = eventOn(tavern_events.CHAT_CHANGED, handleChatChanged).stop;
}

export function bootstrapCalendarRuntimeWorldbookScanner(): void {
  globalThis.CalendarFloatRuntimeWorldbookScanner?.destroy();
  bindGenerationHook();
  bindChatChangedHook();
  void applyCalendarRuntimeWorldbookScan().catch(error => {
    console.warn(`[${SCRIPT_NAME}] 初始化 runtime worldbook scanner 失败`, error);
  });
  globalThis.CalendarFloatRuntimeWorldbookScanner = {
    destroy: teardownCalendarRuntimeWorldbookScanner,
  };
}

export function teardownCalendarRuntimeWorldbookScanner(): void {
  generationHookStop?.();
  chatChangedHookStop?.();
  generationHookStop = null;
  chatChangedHookStop = null;
  generationHookBound = false;
  chatChangedHookBound = false;
  clearRuntimePrompts();
  if (globalThis.CalendarFloatRuntimeWorldbookScanner?.destroy === teardownCalendarRuntimeWorldbookScanner) {
    delete globalThis.CalendarFloatRuntimeWorldbookScanner;
  }
}

declare global {
  var CalendarFloatRuntimeWorldbookScanner:
    | {
        destroy: () => void;
      }
    | undefined;
}
