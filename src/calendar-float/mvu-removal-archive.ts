import _ from 'lodash';
import { SCRIPT_NAME } from './constants';
import { getCalendarWorldTimePath } from './runtime-worldbook/config';
import { ensureMvuReady, syncArchiveFromMvuVariableDiff } from './storage';

let stopMvuUpdateListener: (() => void) | null = null;
let bootstrapToken = 0;

function readCompletedAt(variables: Record<string, any>): string {
  return String(_.get(variables, getCalendarWorldTimePath(), '') || '').trim();
}

function hasArchiveEffect(result: { archived: number; skipped: number; deleted: number; restored: number }): boolean {
  return result.archived > 0 || result.skipped > 0 || result.deleted > 0 || result.restored > 0;
}

async function bindMvuRemovalArchive(token: number): Promise<void> {
  const ready = await ensureMvuReady();
  if (!ready || token !== bootstrapToken || typeof Mvu === 'undefined') {
    return;
  }

  stopMvuUpdateListener = eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVariables, oldVariables) => {
    const result = syncArchiveFromMvuVariableDiff({
      newVariables,
      oldVariables,
      completedAt: readCompletedAt(newVariables),
    });
    if (hasArchiveEffect(result)) {
      console.info(`[${SCRIPT_NAME}] 已同步 LLM 移除的月历事件`, result);
    }
  }).stop;
}

export function bootstrapCalendarMvuRemovalArchive(): void {
  globalThis.CalendarFloatMvuRemovalArchive?.destroy();
  bootstrapToken += 1;
  const token = bootstrapToken;
  globalThis.CalendarFloatMvuRemovalArchive = {
    destroy: teardownCalendarMvuRemovalArchive,
  };
  void bindMvuRemovalArchive(token).catch(error => {
    console.warn(`[${SCRIPT_NAME}] 绑定 MVU 月历归档监听失败`, error);
  });
}

export function teardownCalendarMvuRemovalArchive(): void {
  bootstrapToken += 1;
  stopMvuUpdateListener?.();
  stopMvuUpdateListener = null;
  if (globalThis.CalendarFloatMvuRemovalArchive?.destroy === teardownCalendarMvuRemovalArchive) {
    delete globalThis.CalendarFloatMvuRemovalArchive;
  }
}

declare global {
  var CalendarFloatMvuRemovalArchive:
    | {
        destroy: () => void;
      }
    | undefined;
}
