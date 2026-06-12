import { SCRIPT_NAME } from '../constants';

const MVU_READY_TIMEOUT_MS = 1200;

let hasWarnedMvuFallback = false;
let hasWarnedMessageVariableUnavailable = false;

function hasMvuReadApi(): boolean {
  return typeof Mvu !== 'undefined' && typeof Mvu.getMvuData === 'function';
}

export function hasMvuWriteApi(): boolean {
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

export function warnMessageVariableUnavailable(reason: string, error?: unknown): void {
  if (hasWarnedMessageVariableUnavailable) {
    return;
  }
  hasWarnedMessageVariableUnavailable = true;
  if (typeof error === 'undefined') {
    console.warn(`[${SCRIPT_NAME}] ${reason}`);
    return;
  }
  console.warn(`[${SCRIPT_NAME}] ${reason}`, error);
}

export function getLatestMessageVariableTarget(): VariableOption | null {
  try {
    const messageId = getLastMessageId();
    if (Number.isInteger(messageId) && messageId >= 0) {
      return { type: 'message', message_id: messageId };
    }
  } catch (error) {
    warnMessageVariableUnavailable('读取最新消息楼层号失败，暂时跳过消息变量读取', error);
  }
  return null;
}

export function readMessageVariableData(): Record<string, any> {
  const target = getLatestMessageVariableTarget();
  if (!target) {
    return {};
  }
  if (hasMvuReadApi()) {
    try {
      return Mvu.getMvuData(target) || {};
    } catch (error) {
      warnMvuFallback('读取最新消息 MVU 变量失败，改为直接读取 message 变量', error);
    }
  }
  try {
    return getVariables(target);
  } catch (error) {
    warnMessageVariableUnavailable('读取最新消息变量失败，暂时使用空变量表', error);
    return {};
  }
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
