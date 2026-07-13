import { clamp, set } from 'lodash';
import {
  MONTH_EVENT_ROW_LIMIT,
  buildDailyAgenda,
  buildFestivalMonthChipEventsForRange,
  buildMonthAgenda,
  buildMonthCells,
  buildReminderState,
} from '../calendar-view-model';
import { INSTANCE_KEY, MESSAGE_KNOWN_TAGS_PATH, ROOT_ID, SCRIPT_NAME, STYLE_ID } from '../constants';
import { addDays, compareDatePoint, extractClockTimeText, formatDateKey } from '../date';
import { buildFestivalTagPreviewMarker } from '../festival-visual';
import type { CalendarFloatLifecycleToken } from '../lifecycle';
import {
  createEmptyFixedEventIndexTemplateInCharacterWorldbook,
  loadFixedEventIndexEditorPreview,
  renderFixedEventIndexEditorPreview,
  saveFixedEventIndexYamlToWorldbook,
} from '../fixed-event-index-editor';
import { saveCalendarForm } from '../form-service';
import { getActiveCalendarProfile, isCalendarAddonEnabled } from '../profile';
import { loadCalendarDatasetFromRuntimeWorldbook } from '../runtime-ui-dataset';
import { getCalendarWorldLocationPath, getCalendarWorldTimePath } from '../runtime-worldbook/config';
import { buildSelectedDayDetail, fallbackDateLabel } from './day-detail';
import { renderFormHtml } from './form-render';
import { getContrastRatio, isValidHexColor, TAG_COLOR_PALETTE } from './helpers/color';
import { createRenderMarkdownContent, escapeHtml } from './helpers/markdown';
import { renderUtilityIcon } from './icons';
import {
  archiveCompletedEvent,
  ensureCalendarLatestMessageVariableStore,
  ensureMvuReady,
  getAvailableCalendarWorldbooks,
  getLatestMessageVariableTarget,
  purgeArchivedEventWithPolicy,
  purgeAutoDeleteArchivedEvents,
  readArchiveStore,
  readCurrentWorldTime,
  clearCalendarRuntimePathSettings,
  removeActiveEventWithPolicy,
  readCalendarRuntimePathSettings,
  replaceCalendarArchivePolicy,
  replaceCalendarRuntimePathSettings,
  restoreArchivedEvent,
  syncArchiveOnActiveRemoval,
} from '../storage';
import type {
  CalendarArchivePolicy,
  CalendarDataset,
  CalendarEventColorStyle,
  CalendarEventRecord,
  CalendarMonthAliasRecord,
  DailyAgendaGroup,
  DailyAgendaItem,
  DatePoint,
  DateRange,
  MonthDayCell,
  ReminderState,
  WidgetRefs,
  WidgetState,
} from '../types';
import type { WidgetAction } from './actions';
import { bindCalendarWidgetEvents } from './events';
import { formatWorldTimeForPoint, parseDateKeyPoint } from './date-actions';
import { shouldShowCalendarDeveloperTools } from './developer-mode';
import {
  buildDirtyEditorCloseDecision,
  buildDirtyEditorReloadDecision,
  type WidgetConfirmDecision,
  type WidgetNoticeDecision,
} from './dialog-policy';
import {
  buildActiveDeleteDecision,
  buildArchiveCleanupDecision,
  buildArchiveCleanupResultNotice,
  buildArchivePurgeDecision,
  buildFavoriteProtectedNotice,
  buildFormSaveFailureNotice,
  buildInvalidColorNotice,
  buildQuickInputMissingNotice,
} from './event-action-policy';
import { buildFixedEventEditorRenameDecision, type WidgetInputDecision } from './fixed-event-editor-rename-policy';
import {
  bindFixedEventIndexEditorDialogEvents,
  syncFixedEventEditorRecurrenceFields,
  type FixedEventEditorBindingIntent,
} from './fixed-event-editor-bindings';
import {
  createFixedEventEditorSession,
  type FixedEventEditorSession,
  type FixedEventEditorSessionState,
} from './fixed-event-editor-session';
import {
  readFixedEventIndexEditorScrollSnapshot,
  restoreFixedEventIndexEditorScrollSnapshot,
} from './fixed-event-editor-scroll';
import { getViewportSize, isDesktopViewport } from './layout';
import { buildLocalFestivalSearchTerms, isFestivalVisibleInLocalScope } from './local-festival-scope';
import {
  buildManagedWorldbookSummaryLines,
  filterWorldbookPickerNames,
  getConnectivityButtonCopy,
} from './managed-worldbook/dialog-model';
import {
  createManagedWorldbookFlow,
  type ManagedWorldbookFlow,
  type ManagedWorldbookFlowCommand,
} from './managed-worldbook/flow';
import type { WidgetToastNotice } from './managed-worldbook/notices';
import {
  renderAgendaPanel as renderAgendaPanelExternal,
  renderAgendaResults,
  renderArchivePanel as renderArchivePanelExternal,
  renderBookMainView as renderBookMainViewExternal,
  renderCalendarMonthView,
  renderDetailPanel as renderDetailPanelExternal,
  type RenderAgendaOptions,
} from './render';
import type { AgendaSortMode, FestivalScopeMode, SidebarTab } from './event-binding/types';
import { ensureCalendarWidgetStyle } from './style';
import {
  getCalendarManagedWorldbookDiagnostics,
  installCalendarManagedEntriesToExternalWorldbook,
  installCalendarManagedWorldbookEntries,
  listCalendarWorldbookMoveCandidates,
  refreshCalendarManagedWorldbookRuntimeDiagnostics,
  refreshCalendarManagedWorldbookSourceDiagnostics,
  uninstallCalendarManagedWorldbookEntries,
  CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME,
} from '../worldbook-manager';
import { hydrateFixedEventIndexMonthAliasesFromRuntime } from './fixed-event-editor-host';

const hostWindow =
  window.parent && window.parent !== window && window.parent.document
    ? (window.parent as Window & typeof globalThis)
    : window;
const hostDocument = hostWindow.document;
let uiWindow = window as Window & typeof globalThis;
let uiDocument = window.document;
const renderMarkdownContent = createRenderMarkdownContent(hostWindow, SCRIPT_NAME);
type ElliaAddonModule = typeof import('../dlc_ellia');
let elliaAddon: ElliaAddonModule | null = null;

function isElliaAddonEnabled(): boolean {
  return isCalendarAddonEnabled('dlc_ellia') && Boolean(elliaAddon);
}

function showWidgetNotice(notice: WidgetToastNotice): void {
  if (notice.level === 'success') {
    toastr.success(notice.message, notice.title);
    return;
  }
  if (notice.level === 'info') {
    toastr.info(notice.message, notice.title);
    return;
  }
  if (notice.level === 'warning') {
    toastr.warning(notice.message, notice.title);
    return;
  }
  toastr.error(notice.message, notice.title);
}

function showDecisionNotice(decision: WidgetNoticeDecision): void {
  showWidgetNotice({
    level: decision.level,
    title: decision.title,
    message: decision.message,
    delivery: decision.delivery,
    blocking: decision.blocking,
  });
}

function showWidgetConfirm(
  decision: WidgetConfirmDecision,
  onConfirm: () => void | Promise<void>,
  onCancel?: () => void | Promise<void>,
): void {
  void uiState.pendingConfirm?.onCancel?.();
  uiState.pendingTextInput = null;
  uiState.pendingConfirm = {
    title: decision.title,
    message: decision.message,
    confirmLabel: decision.confirmLabel,
    cancelLabel: decision.cancelLabel,
    onConfirm,
    onCancel,
  };
  renderShell();
}

function showWidgetTextInput(decision: WidgetInputDecision, onSubmit: (value: string) => void | Promise<void>): void {
  void uiState.pendingConfirm?.onCancel?.();
  uiState.pendingConfirm = null;
  uiState.pendingTextInput = {
    title: decision.title,
    message: decision.message,
    initialValue: decision.initialValue,
    confirmLabel: decision.confirmLabel,
    cancelLabel: decision.cancelLabel,
    onSubmit,
  };
  renderShell();
}

async function ensureProfileAddonsLoaded(): Promise<void> {
  if (!isCalendarAddonEnabled('dlc_ellia')) {
    elliaAddon = null;
    return;
  }
  elliaAddon ??= await import('../dlc_ellia');
}

interface PendingWidgetConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface PendingWidgetTextInput {
  title: string;
  message: string;
  initialValue: string;
  confirmLabel: string;
  cancelLabel: string;
  onSubmit: (value: string) => void | Promise<void>;
}

const refs: WidgetRefs = {
  iframe: null,
  root: null,
  ball: null,
  panel: null,
  monthGrid: null,
  agendaList: null,
  detailPanel: null,
  formPanel: null,
  sourcePanel: null,
};

const state: WidgetState = {
  open: false,
  destroyed: false,
  currentMonth: getTodayPoint(),
  selectedDateKey: '',
  reminder: createEmptyReminder(),
  dataset: null,
  filterKeyword: '',
  showArchived: false,
  formMode: 'create',
  editingEventId: null,
};

let monthAliases: CalendarMonthAliasRecord[] = [];

const BALL_POSITION_VAR_KEY = 'calendar_float_ball_position';
const BALL_DEFAULT_SIZE = 60;
const BALL_VIEWPORT_MARGIN = 8;
const BALL_DRAG_CLICK_THRESHOLD = 4;
const uiState = {
  sidebarTab: 'detail' as SidebarTab,
  panelLeft: null as number | null,
  panelTop: null as number | null,
  panelFullscreen: false,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragOriginLeft: 0,
  dragOriginTop: 0,
  ballLeft: null as number | null,
  ballTop: null as number | null,
  ballDragging: false,
  ballMoved: false,
  ballSuppressNextClick: false,
  ballDragStartX: 0,
  ballDragStartY: 0,
  ballDragOriginLeft: 0,
  ballDragOriginTop: 0,
  openedBookId: null as string | null,
  openedBookPageIndex: 0,
  theme: 'light' as 'light' | 'dark',
  agendaSort: 'date-asc' as AgendaSortMode,
  festivalScopeMode: 'local' as FestivalScopeMode,
  mobileSideOpen: false,
  tagColorDialogOpen: false,
  selectedTagColorTag: '主线',
  tagColorFeedback: '',
  mvuPathSettingsFeedback: '',
  pendingConfirm: null as PendingWidgetConfirm | null,
  pendingTextInput: null as PendingWidgetTextInput | null,
};

let fixedEventEditorSession: FixedEventEditorSession | null = null;
let fixedEventEditorSessionUnsubscribe: (() => void) | null = null;
let managedWorldbookFlow: ManagedWorldbookFlow | null = null;
let managedWorldbookFlowUnsubscribe: (() => void) | null = null;

function shouldRenderFixedEventEditorSessionTransition(
  previous: Readonly<FixedEventEditorSessionState>,
  next: Readonly<FixedEventEditorSessionState>,
): boolean {
  return (
    previous.open !== next.open ||
    previous.model?.loading !== next.model?.loading ||
    previous.model?.saving !== next.model?.saving
  );
}

function initializeFixedEventEditorSession(): FixedEventEditorSession {
  fixedEventEditorSessionUnsubscribe?.();
  fixedEventEditorSession = createFixedEventEditorSession({
    load: async () =>
      hydrateFixedEventIndexMonthAliasesFromRuntime(await loadFixedEventIndexEditorPreview(), monthAliases),
    save: saveFixedEventIndexYamlToWorldbook,
    createTemplate: createEmptyFixedEventIndexTemplateInCharacterWorldbook,
    confirmDiscard: reason =>
      new Promise<boolean>(resolve => {
        showWidgetConfirm(
          reason === 'close' ? buildDirtyEditorCloseDecision() : buildDirtyEditorReloadDecision(),
          () => resolve(true),
          () => resolve(false),
        );
      }),
  });
  let previous = fixedEventEditorSession.getSnapshot();
  fixedEventEditorSessionUnsubscribe = fixedEventEditorSession.subscribe(snapshot => {
    const shouldRender = shouldRenderFixedEventEditorSessionTransition(previous, snapshot);
    previous = snapshot;
    if (shouldRender) {
      renderShell();
    }
  });
  return fixedEventEditorSession;
}

function getFixedEventEditorSession(): FixedEventEditorSession {
  return fixedEventEditorSession ?? initializeFixedEventEditorSession();
}

function destroyFixedEventEditorSession(): void {
  const pending = uiState.pendingConfirm;
  uiState.pendingConfirm = null;
  uiState.pendingTextInput = null;
  void pending?.onCancel?.();
  fixedEventEditorSessionUnsubscribe?.();
  fixedEventEditorSessionUnsubscribe = null;
  fixedEventEditorSession = null;
}

function createProductionManagedWorldbookFlow(): ManagedWorldbookFlow {
  return createManagedWorldbookFlow({
    readDiagnostics: getCalendarManagedWorldbookDiagnostics,
    refreshDiagnostics: async () => {
      try {
        await refreshCalendarManagedWorldbookRuntimeDiagnostics();
        await refreshCalendarManagedWorldbookSourceDiagnostics();
      } catch (error) {
        console.warn(`[${SCRIPT_NAME}] 刷新世界书 runtime 状态失败`, error);
        throw error;
      }
    },
    listMoveCandidates: listCalendarWorldbookMoveCandidates,
    listAvailableTargetNames: getAvailableCalendarWorldbooks,
    reinstall: installCalendarManagedWorldbookEntries,
    uninstall: uninstallCalendarManagedWorldbookEntries,
    moveToExternal: installCalendarManagedEntriesToExternalWorldbook,
  });
}

function initializeManagedWorldbookFlow(): ManagedWorldbookFlow {
  managedWorldbookFlowUnsubscribe?.();
  managedWorldbookFlow = createProductionManagedWorldbookFlow();
  managedWorldbookFlowUnsubscribe = managedWorldbookFlow.subscribe(() => {
    if (state.destroyed) {
      return;
    }
    updateManagedWorldbookButton();
    renderManagedWorldbookDialog();
  });
  return managedWorldbookFlow;
}

function getManagedWorldbookFlow(): ManagedWorldbookFlow {
  return managedWorldbookFlow ?? initializeManagedWorldbookFlow();
}

function destroyManagedWorldbookFlow(): void {
  managedWorldbookFlowUnsubscribe?.();
  managedWorldbookFlowUnsubscribe = null;
  const flow = managedWorldbookFlow;
  managedWorldbookFlow = null;
  void flow?.dispatch({ type: 'close' });
}

async function runManagedWorldbookCommand(command: ManagedWorldbookFlowCommand): Promise<void> {
  const notice = await getManagedWorldbookFlow().dispatch(command);
  if (notice && !state.destroyed) {
    showWidgetNotice(notice);
  }
}

function getTodayPoint(): DatePoint {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function createEmptyReminder(): ReminderState {
  return {
    hasUpcoming: false,
    maxLevel: 'none',
    reasons: [],
  };
}

function isDesktopMode(): boolean {
  return isDesktopViewport(uiWindow);
}

function getThemeStorageKey(): string {
  return `${SCRIPT_NAME}:theme`;
}

function getPreferredTheme(): 'light' | 'dark' {
  try {
    if (hostWindow.matchMedia && hostWindow.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取系统主题失败`, error);
  }
  return 'light';
}

function applyTheme(): void {
  if (!refs.root) {
    return;
  }
  refs.root.dataset.theme = uiState.theme;
  const toggle = refs.root.querySelector<HTMLButtonElement>('[data-action="toggle-theme"]');
  if (toggle) {
    const nextTitle = uiState.theme === 'dark' ? '切换到白天主题' : '切换到夜晚主题';
    toggle.textContent = uiState.theme === 'dark' ? '切换到白天主题' : '切换到夜晚主题';
    toggle.title = nextTitle;
    toggle.setAttribute('aria-label', nextTitle);
  }
}

function loadTheme(): void {
  let nextTheme = getPreferredTheme();
  try {
    const saved = hostWindow.localStorage?.getItem(getThemeStorageKey());
    if (saved === 'light' || saved === 'dark') {
      nextTheme = saved;
    }
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取主题存档失败`, error);
  }
  uiState.theme = nextTheme;
  applyTheme();
}

function saveTheme(): void {
  try {
    hostWindow.localStorage?.setItem(getThemeStorageKey(), uiState.theme);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 保存主题存档失败`, error);
  }
}

function toggleTheme(): void {
  uiState.theme = uiState.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  saveTheme();
}

function ensureIframe(): void {
  if (refs.iframe?.contentDocument?.body) {
    uiWindow = refs.iframe.contentWindow as Window & typeof globalThis;
    uiDocument = refs.iframe.contentDocument;
    return;
  }

  const iframe = hostDocument.createElement('iframe');
  iframe.id = `${ROOT_ID}-frame`;
  iframe.setAttribute('script_id', getScriptId());
  iframe.setAttribute('title', '月历悬浮球');
  iframe.setAttribute('aria-label', '月历悬浮球');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.style.position = 'fixed';
  iframe.style.inset = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  iframe.style.backgroundColor = 'transparent';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '99999';
  hostDocument.body.appendChild(iframe);

  const frameDocument = iframe.contentDocument;
  const frameWindow = iframe.contentWindow as (Window & typeof globalThis) | null;
  if (!frameDocument || !frameWindow) {
    throw new Error('无法创建月历悬浮界面的隔离 iframe');
  }

  frameDocument.open();
  frameDocument.write(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;background-color:transparent!important;}body{overflow:hidden!important;}</style></head><body></body></html>',
  );
  frameDocument.close();
  frameDocument.documentElement.style.setProperty('margin', '0', 'important');
  frameDocument.documentElement.style.setProperty('padding', '0', 'important');
  frameDocument.documentElement.style.setProperty('background', 'transparent', 'important');
  frameDocument.documentElement.style.setProperty('background-color', 'transparent', 'important');
  frameDocument.body.style.setProperty('margin', '0', 'important');
  frameDocument.body.style.setProperty('padding', '0', 'important');
  frameDocument.body.style.setProperty('background', 'transparent', 'important');
  frameDocument.body.style.setProperty('background-color', 'transparent', 'important');
  frameDocument.body.style.setProperty('overflow', 'hidden', 'important');

  refs.iframe = iframe;
  uiWindow = frameWindow;
  uiDocument = frameDocument;
}

function syncIframePointerEvents(): void {
  if (!refs.iframe) {
    return;
  }

  refs.iframe.style.pointerEvents = 'auto';
  if (state.open || uiState.ballDragging) {
    refs.iframe.style.clipPath = 'inset(0)';
    return;
  }

  const ballRect = refs.ball?.getBoundingClientRect();
  const viewport = getViewportSize({ hostWindow, hostDocument });
  if (!ballRect || viewport.width <= 0 || viewport.height <= 0) {
    refs.iframe.style.clipPath = 'inset(0)';
    return;
  }

  const margin = 10;
  const top = Math.max(0, Math.floor(ballRect.top - margin));
  const right = Math.max(0, Math.floor(viewport.width - ballRect.right - margin));
  const bottom = Math.max(0, Math.floor(viewport.height - ballRect.bottom - margin));
  const left = Math.max(0, Math.floor(ballRect.left - margin));
  refs.iframe.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
}

function translateHostPointToUi(clientX: number, clientY: number): { clientX: number; clientY: number } {
  const rect = refs.iframe?.getBoundingClientRect();
  if (!rect) {
    return { clientX, clientY };
  }
  return {
    clientX: clientX - rect.left,
    clientY: clientY - rect.top,
  };
}

function ensureStyle(): void {
  ensureCalendarWidgetStyle(uiDocument);
  if (isElliaAddonEnabled()) {
    elliaAddon?.ensureElliaBetaTicketStyle(uiDocument);
  }
}

function ensureRoot(): void {
  if (refs.root) {
    return;
  }

  const root = uiDocument.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('script_id', getScriptId());
  root.dataset.open = 'false';
  root.dataset.hasUpcoming = 'false';
  root.dataset.tab = uiState.sidebarTab;
  root.dataset.selectedDate = 'false';
  root.dataset.theme = uiState.theme;
  root.dataset.mobileSideOpen = 'false';
  root.dataset.panelFullscreen = 'false';
  root.dataset.tagColorOpen = 'false';
  root.dataset.externalHost = 'false';
  root.dataset.managedWorldbookConnectivity = 'unknown';
  const developerToolsHidden = shouldShowCalendarDeveloperTools(getActiveCalendarProfile())
    ? ''
    : ' hidden aria-hidden="true"';
  root.innerHTML = `
    <button type="button" class="th-calendar-ball" aria-label="打开月历">📅</button>
    <section class="th-calendar-panel" aria-label="月历悬浮面板">
      <div class="th-window-actions" aria-label="窗口操作">
        <details class="th-tools-menu th-tools-menu--window">
          <summary class="th-btn th-menu-status-btn" title="设置菜单" aria-label="设置菜单">
            <span class="th-menu-bars" aria-hidden="true">
              <span class="th-menu-bar th-menu-bar-1"></span>
              <span class="th-menu-bar th-menu-bar-2"></span>
              <span class="th-menu-bar th-menu-bar-3"></span>
            </span>
          </summary>
          <div class="th-tool-menu-panel" role="menu" aria-label="设置菜单">
            <button type="button" class="th-tool-menu-item" data-action="toggle-theme" role="menuitem">主题颜色</button>
            <button type="button" class="th-tool-menu-item" data-action="open-tag-color-panel" role="menuitem">标签颜色</button>
            <button type="button" class="th-tool-menu-item" data-action="open-fixed-event-index-editor" data-role="developer-tool-menu-item" role="menuitem"${developerToolsHidden}>固定事件索引</button>
            <button type="button" class="th-tool-menu-item th-connectivity-button" data-action="open-mvu-settings" data-role="developer-tool-menu-item" data-state="unknown" role="menuitem" aria-label="MVU设定"${developerToolsHidden}>
              <span class="th-connectivity-text">MVU设定</span>
            </button>
          </div>
        </details>
        <button type="button" class="th-btn" data-action="toggle-panel-fullscreen" title="全屏" aria-label="全屏" aria-pressed="false">${renderUtilityIcon('maximize')}</button>
        <button type="button" class="th-btn" data-action="reload" title="刷新" aria-label="刷新">${renderUtilityIcon('reload')}</button>
        <button type="button" class="th-btn" data-action="close" title="关闭" aria-label="关闭">${renderUtilityIcon('close')}</button>
      </div>
      <div class="th-calendar-shell">
        <section class="th-calendar-main">
          <div class="th-main-head" data-drag-handle="panel">
          </div>
          <div data-role="month-grid"></div>
        </section>
        <aside class="th-calendar-side">
          <div class="th-side-head">
            <div class="th-side-head-copy">
              <div class="th-side-title">本月事件</div>
            </div>
            <button type="button" class="th-btn th-mobile-side-close" data-action="close-mobile-side" aria-label="返回月历">返回月历</button>
          </div>
          <div class="th-sidebar-tabs">
            <button type="button" class="th-tab-button" data-action="switch-tab" data-tab="detail">日期详情</button>
            <button type="button" class="th-tab-button" data-action="switch-tab" data-tab="archive">归档</button>
            <button type="button" class="th-btn th-side-search-btn" data-action="focus-agenda-filter" aria-label="搜索事件" title="搜索事件">🔍</button>
            <button type="button" class="th-tab-button th-primary-btn th-tab-add-button" data-action="open-create-form" data-role="sidebar-create-entry" aria-label="新增事件" title="新增事件">+</button>
          </div>
          <div class="th-side-body">
            <div class="th-side-panel is-detail" data-role="detail-panel"></div>
            <div class="th-side-panel is-form" data-role="form-panel"></div>
          </div>
        </aside>
        <button type="button" class="th-btn th-fab-list" data-action="open-mobile-agenda" aria-label="打开本月列表">≡</button>
        <button type="button" class="th-btn th-fab-add" data-action="open-create-form" aria-label="新增事件">+</button>
      </div>
    </section>
    <dialog class="th-managed-worldbook-dialog-layer" data-role="managed-worldbook-dialog-layer" aria-hidden="true"></dialog>
    <dialog class="th-managed-worldbook-dialog-layer" data-role="tag-color-dialog-layer" aria-hidden="true"></dialog>
    <dialog class="th-managed-worldbook-dialog-layer" data-role="fixed-event-index-editor-layer" aria-hidden="true"></dialog>
    <dialog class="th-managed-worldbook-dialog-layer" data-role="widget-confirm-dialog-layer" aria-hidden="true"></dialog>
    <dialog class="th-managed-worldbook-dialog-layer" data-role="widget-text-input-dialog-layer" aria-hidden="true"></dialog>
  `;

  uiDocument.body.appendChild(root);

  refs.root = root;
  refs.ball = root.querySelector<HTMLButtonElement>('.th-calendar-ball');
  refs.panel = root.querySelector<HTMLElement>('.th-calendar-panel');
  refs.monthGrid = root.querySelector<HTMLElement>('[data-role="month-grid"]');
  refs.agendaList = null;
  refs.detailPanel = root.querySelector<HTMLElement>('[data-role="detail-panel"]');
  refs.formPanel = root.querySelector<HTMLElement>('[data-role="form-panel"]');
  restoreBallPosition();
}

function isCalendarDeveloperModeEnabled(): boolean {
  return shouldShowCalendarDeveloperTools(getActiveCalendarProfile());
}

function syncDeveloperToolMenuItems(): void {
  if (!refs.root) {
    return;
  }
	  const showDeveloperTools = isCalendarDeveloperModeEnabled();
	  refs.root.querySelectorAll<HTMLElement>('[data-role="developer-tool-menu-item"]').forEach(item => {
	    item.hidden = !showDeveloperTools;
	    item.classList.toggle('is-hidden', !showDeveloperTools);
	    item.setAttribute('aria-hidden', showDeveloperTools ? 'false' : 'true');
	  });
	}

function getEditingRecord() {
  if (!state.dataset || !state.editingEventId) {
    return null;
  }
  return (
    [...state.dataset.activeEvents, ...state.dataset.archivedEvents].find(item => item.id === state.editingEventId) ??
    null
  );
}

function buildFormEditingNotice(): string {
  return '';
}

function syncStateAnchors(): void {
  if (state.dataset?.nowDate) {
    state.currentMonth = {
      year: state.dataset.nowDate.year,
      month: state.dataset.nowDate.month,
      day: 1,
    };
  }
}

function clampBallPosition(left: number, top: number): { left: number; top: number } {
  const viewport = getViewportSize({ hostWindow: uiWindow, hostDocument: uiDocument });
  const ballWidth = refs.ball?.offsetWidth || BALL_DEFAULT_SIZE;
  const ballHeight = refs.ball?.offsetHeight || BALL_DEFAULT_SIZE;
  return {
    left: clamp(
      left,
      BALL_VIEWPORT_MARGIN,
      Math.max(BALL_VIEWPORT_MARGIN, viewport.width - ballWidth - BALL_VIEWPORT_MARGIN),
    ),
    top: clamp(
      top,
      BALL_VIEWPORT_MARGIN,
      Math.max(BALL_VIEWPORT_MARGIN, viewport.height - ballHeight - BALL_VIEWPORT_MARGIN),
    ),
  };
}

function getDefaultBallPosition(): { left: number; top: number } {
  const viewport = getViewportSize({ hostWindow: uiWindow, hostDocument: uiDocument });
  const ballWidth = refs.ball?.offsetWidth || BALL_DEFAULT_SIZE;
  return clampBallPosition(viewport.width - ballWidth - 18, Math.round(viewport.height * 0.32));
}

function readSavedBallPosition(): { left: number; top: number } | null {
  try {
    const raw = getVariables({ type: 'global' })?.[BALL_POSITION_VAR_KEY];
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const left = Number(value?.left);
    const top = Number(value?.top);
    return Number.isFinite(left) && Number.isFinite(top) ? { left, top } : null;
  } catch (_) {
    return null;
  }
}

function saveBallPosition(): void {
  if (uiState.ballLeft == null || uiState.ballTop == null) {
    return;
  }
  try {
    insertOrAssignVariables(
      {
        [BALL_POSITION_VAR_KEY]: JSON.stringify({ left: uiState.ballLeft, top: uiState.ballTop }),
      },
      { type: 'global' },
    );
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 保存悬浮按钮位置失败`, error);
  }
}

function applyBallPosition(): void {
  if (!refs.ball) {
    return;
  }
  if (uiState.ballLeft == null || uiState.ballTop == null) {
    const position = getDefaultBallPosition();
    uiState.ballLeft = position.left;
    uiState.ballTop = position.top;
  }
  const position = clampBallPosition(uiState.ballLeft, uiState.ballTop);
  uiState.ballLeft = position.left;
  uiState.ballTop = position.top;
  refs.ball.style.left = `${position.left}px`;
  refs.ball.style.top = `${position.top}px`;
  refs.ball.style.right = 'auto';
  syncIframePointerEvents();
}

function restoreBallPosition(): void {
  const position = readSavedBallPosition() ?? getDefaultBallPosition();
  const clampedPosition = clampBallPosition(position.left, position.top);
  uiState.ballLeft = clampedPosition.left;
  uiState.ballTop = clampedPosition.top;
  applyBallPosition();
}

function applyPanelPosition(): void {
  if (!refs.panel || !isDesktopMode()) {
    return;
  }
  if (uiState.panelFullscreen) {
    refs.panel.style.left = '';
    refs.panel.style.top = '';
    return;
  }
  refs.panel.style.left = `${uiState.panelLeft}px`;
  refs.panel.style.top = `${uiState.panelTop}px`;
}

function updatePanelFullscreenButton(): void {
  const button = refs.root?.querySelector<HTMLButtonElement>('[data-action="toggle-panel-fullscreen"]');
  if (!button) {
    return;
  }
  const fullscreen = uiState.panelFullscreen;
  button.innerHTML = renderUtilityIcon(fullscreen ? 'minimize' : 'maximize');
  button.title = fullscreen ? '还原窗口' : '全屏';
  button.setAttribute('aria-label', fullscreen ? '还原窗口' : '全屏');
  button.setAttribute('aria-pressed', fullscreen ? 'true' : 'false');
}

function setPanelFullscreen(fullscreen: boolean): void {
  if (!isDesktopMode()) {
    uiState.panelFullscreen = false;
    return;
  }
  uiState.panelFullscreen = fullscreen;
  if (fullscreen && refs.panel) {
    refs.panel.style.left = '';
    refs.panel.style.top = '';
  }
  renderShell();
}

function updateManagedWorldbookButton(): void {
  if (!refs.root) {
    return;
  }
  const snapshot = getManagedWorldbookFlow().getSnapshot();
  const diagnostics = snapshot.diagnostics;
  const button = refs.root.querySelector<HTMLButtonElement>('[data-action="open-mvu-settings"]');
  refs.root.dataset.managedWorldbookConnectivity = diagnostics.connectivity;
  if (!button) {
    return;
  }
  const copy = getConnectivityButtonCopy(diagnostics, { busy: snapshot.busy });
  button.dataset.state = diagnostics.connectivity;
  button.disabled = snapshot.busy || diagnostics.connectivity === 'checking';
  button.title = copy.title;
  button.setAttribute('aria-label', copy.title);
  const textNode = button.querySelector<HTMLElement>('.th-connectivity-text');
  if (textNode) {
    textNode.textContent = copy.text;
  }
}

function syncDialogLayerOpen(layer: HTMLElement, open: boolean): void {
  layer.dataset.open = open ? 'true' : 'false';
  layer.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (!(layer instanceof uiWindow.HTMLDialogElement)) {
    return;
  }
  try {
    if (open && !layer.open) {
      layer.showModal();
    } else if (!open && layer.open) {
      layer.close();
    }
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 同步弹窗 top-layer 状态失败`, error);
  }
}

function closeManagedWorldbookDialog(): void {
  uiState.mvuPathSettingsFeedback = '';
  void getManagedWorldbookFlow().dispatch({ type: 'close' });
}

function closeWidgetConfirmDialog(): void {
  const pending = uiState.pendingConfirm;
  uiState.pendingConfirm = null;
  renderShell();
  void pending?.onCancel?.();
}

async function confirmWidgetConfirmDialog(): Promise<void> {
  const pending = uiState.pendingConfirm;
  if (!pending) {
    return;
  }
  uiState.pendingConfirm = null;
  renderShell();
  await pending.onConfirm();
}

function renderWidgetConfirmDialog(): void {
  if (!refs.root) {
    return;
  }
  const layer = refs.root.querySelector<HTMLElement>('[data-role="widget-confirm-dialog-layer"]');
  if (!layer) {
    return;
  }
  const pending = uiState.pendingConfirm;
  if (!pending) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  layer.innerHTML = `
    <div class="th-managed-worldbook-dialog-backdrop"></div>
    <section class="th-managed-worldbook-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(pending.title)}">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">${escapeHtml(pending.title)}</div>
        <div class="th-managed-worldbook-dialog-desc">${escapeHtml(pending.message)}</div>
      </div>
      <div class="th-managed-worldbook-dialog-actions">
        <div class="th-managed-worldbook-action-row is-primary">
          <button type="button" class="th-btn th-primary-btn th-managed-worldbook-dialog-btn" data-action="widget-confirm-accept">${escapeHtml(pending.confirmLabel)}</button>
          <button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="widget-confirm-cancel">${escapeHtml(pending.cancelLabel)}</button>
        </div>
      </div>
    </section>
  `;
  syncDialogLayerOpen(layer, true);

  const bindClick = (selector: string, handler: () => void | Promise<void>) => {
    const element = layer.querySelector<HTMLElement>(selector);
    if (element) {
      element.onclick = () => {
        void handler();
      };
    }
  };
  bindClick('.th-managed-worldbook-dialog-backdrop', closeWidgetConfirmDialog);
  bindClick('[data-action="widget-confirm-cancel"]', closeWidgetConfirmDialog);
  bindClick('[data-action="widget-confirm-accept"]', confirmWidgetConfirmDialog);
}

function closeWidgetTextInputDialog(): void {
  uiState.pendingTextInput = null;
  renderShell();
}

async function submitWidgetTextInputDialog(layer: HTMLElement): Promise<void> {
  const pending = uiState.pendingTextInput;
  if (!pending) {
    return;
  }
  const input = layer.querySelector<HTMLInputElement>('[data-role="widget-text-input"]');
  const value = String(input?.value ?? pending.initialValue);
  uiState.pendingTextInput = null;
  renderShell();
  await pending.onSubmit(value);
}

function renderWidgetTextInputDialog(): void {
  if (!refs.root) {
    return;
  }
  const layer = refs.root.querySelector<HTMLElement>('[data-role="widget-text-input-dialog-layer"]');
  if (!layer) {
    return;
  }
  const pending = uiState.pendingTextInput;
  if (!pending) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  layer.innerHTML = `
    <div class="th-managed-worldbook-dialog-backdrop"></div>
    <section class="th-managed-worldbook-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(pending.title)}">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">${escapeHtml(pending.title)}</div>
        <div class="th-managed-worldbook-dialog-desc">${escapeHtml(pending.message)}</div>
      </div>
      <div class="th-mvu-path-settings">
        <label>
          <span>新 id</span>
          <input type="text" data-role="widget-text-input" value="${escapeHtml(pending.initialValue)}" autocomplete="off" />
        </label>
      </div>
      <div class="th-managed-worldbook-dialog-actions">
        <div class="th-managed-worldbook-action-row is-primary">
          <button type="button" class="th-btn th-primary-btn th-managed-worldbook-dialog-btn" data-action="widget-text-input-submit">${escapeHtml(pending.confirmLabel)}</button>
          <button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="widget-text-input-cancel">${escapeHtml(pending.cancelLabel)}</button>
        </div>
      </div>
    </section>
  `;
  syncDialogLayerOpen(layer, true);

  const input = layer.querySelector<HTMLInputElement>('[data-role="widget-text-input"]');
  input?.focus();
  input?.select();
  if (input) {
    input.onkeydown = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void submitWidgetTextInputDialog(layer);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeWidgetTextInputDialog();
      }
    };
  }

  const bindClick = (selector: string, handler: () => void | Promise<void>) => {
    const element = layer.querySelector<HTMLElement>(selector);
    if (element) {
      element.onclick = () => {
        void handler();
      };
    }
  };
  bindClick('.th-managed-worldbook-dialog-backdrop', closeWidgetTextInputDialog);
  bindClick('[data-action="widget-text-input-cancel"]', closeWidgetTextInputDialog);
  bindClick('[data-action="widget-text-input-submit"]', () => submitWidgetTextInputDialog(layer));
}

function buildMvuPathSettingsPanelHtml(): string {
  const saved = readCalendarRuntimePathSettings();
  const effectiveTimePath = getCalendarWorldTimePath();
  const effectiveLocationPath = getCalendarWorldLocationPath();
  const feedbackHtml = uiState.mvuPathSettingsFeedback
    ? `<div class="th-tag-color-feedback">${escapeHtml(uiState.mvuPathSettingsFeedback)}</div>`
    : '';
  return `
    <div class="th-mvu-path-dialog">
      <div class="th-managed-worldbook-dialog-title">MVU 路径</div>
      <div class="th-managed-worldbook-dialog-desc">只影响当前聊天；留空时使用固定事件索引或 Profile 默认值。</div>
      ${feedbackHtml}
      <div class="th-mvu-path-form">
        <label>
          <span>时间路径</span>
          <input type="text" data-role="mvu-path-time" value="${escapeHtml(saved.mvuTimePath ?? '')}" placeholder="${escapeHtml(effectiveTimePath)}" autocomplete="off" />
          <small>当前生效：${escapeHtml(effectiveTimePath)}</small>
        </label>
        <label>
          <span>地点路径</span>
          <input type="text" data-role="mvu-path-location" value="${escapeHtml(saved.mvuLocationPath ?? '')}" placeholder="${escapeHtml(effectiveLocationPath)}" autocomplete="off" />
          <small>当前生效：${escapeHtml(effectiveLocationPath)}</small>
        </label>
      </div>
      <div class="th-managed-worldbook-action-row is-primary">
        <button type="button" class="th-btn" data-action="reset-mvu-path-settings">清除自定义</button>
        <button type="button" class="th-btn th-primary-btn" data-action="save-mvu-path-settings">保存路径</button>
      </div>
    </div>
  `;
}

function renderManagedWorldbookDialog(): void {
  if (!refs.root) {
    return;
  }

  const layer = refs.root.querySelector<HTMLElement>('[data-role="managed-worldbook-dialog-layer"]');
  if (!layer) {
    return;
  }

  const snapshot = getManagedWorldbookFlow().getSnapshot();
  const dialog = snapshot.dialog;
  if (!dialog) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  const diagnostics = snapshot.diagnostics;
  const summaryHtml = buildManagedWorldbookSummaryLines(diagnostics)
    .map(line => `<li class="th-managed-worldbook-dialog-summary-item">${escapeHtml(line)}</li>`)
    .join('');
  const uninstallDisabled = diagnostics.managedEntryCount <= 0;

  let title = 'MVU设定';
  let description =
    '这里检查月历需要的两条基础规则，也可以调整当前聊天读取 MVU 时间和地点的路径。';
  let bodyHtml = buildMvuPathSettingsPanelHtml();
  let actionHtml = [
    '<details class="th-mvu-maintenance-details">',
    '<summary><span>高级维护</span><small>搬运、重装或卸载托管规则</small></summary>',
    '<div class="th-mvu-maintenance-body">',
    '<div class="th-mvu-action-group th-mvu-action-group--tools">',
    '<div class="th-mvu-action-copy"><strong>世界书工具</strong><span>把托管规则和索引内容搬到其他世界书。</span></div>',
    '<div class="th-managed-worldbook-action-row th-mvu-action-buttons">',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-menu-export-external">搬运到其他世界书</button>',
    '</div>',
    '</div>',
    '<div class="th-mvu-action-group th-mvu-action-group--danger">',
    '<div class="th-mvu-action-copy"><strong>规则维护</strong><span>重装会覆盖托管规则；卸载会移除月历脚本写入的两条规则。</span></div>',
    '<div class="th-managed-worldbook-action-row th-mvu-action-buttons">',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-menu-reinstall">重装这两条规则</button>',
    `<button type="button" class="th-btn th-managed-worldbook-dialog-btn is-danger" data-action="managed-worldbook-menu-uninstall" ${uninstallDisabled ? 'disabled' : ''}>卸载这两条规则</button>`,
    '</div>',
    '</div>',
    '</div>',
    '</details>',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn th-mvu-close-btn" data-action="managed-worldbook-dialog-return">关闭</button>',
  ].join('');

  if (dialog.mode === 'confirm-uninstall') {
    title = '确认卸载';
    description = '确定要卸载吗？只会删除月历脚本托管的两条基础规则，不会删除节庆、读物或正文来源。';
    bodyHtml = '';
    actionHtml = [
      '<div class="th-managed-worldbook-action-row is-secondary">',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn is-danger" data-action="managed-worldbook-confirm-uninstall">确认卸载</button>',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">取消</button>',
      '</div>',
    ].join('');
  } else if (dialog.mode === 'confirm-reinstall') {
    title = '确认重装';
    description = `会重置两条基础规则：月历变量更新规则、${CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME}。确定要继续吗？`;
    bodyHtml = '';
    actionHtml = [
      '<div class="th-managed-worldbook-action-row is-primary">',
      '<button type="button" class="th-btn th-primary-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-confirm-reinstall">确认重装</button>',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">取消</button>',
      '</div>',
    ].join('');
  } else if (dialog.mode === 'export-external') {
    const diagnosticsWorldbookName = String(diagnostics.worldbookName || '').trim();
    const availableNames = dialog.availableTargetNames
      .map(name => String(name || '').trim())
      .filter(Boolean);
    const suggestedName = availableNames.find(name => name !== diagnosticsWorldbookName) ?? `${SCRIPT_NAME}-基础规则`;
    const worldbookListHtml = availableNames.length
      ? availableNames
          .map(
            name =>
              `<button type="button" class="th-worldbook-picker-item" data-action="managed-worldbook-pick-export-target" data-worldbook-name="${escapeHtml(name)}"><span>${escapeHtml(name)}</span>${name === diagnosticsWorldbookName ? '<em>当前规则位置</em>' : ''}</button>`,
          )
          .join('')
      : '<div class="th-worldbook-picker-empty">没有读到可复用的世界书；可以直接在上方输入新名称创建。</div>';
    const moveCandidateHtml = dialog.moveCandidates.length
      ? dialog.moveCandidates
          .map(
            candidate => `
              <label class="th-worldbook-move-item">
                <input type="checkbox" data-role="managed-worldbook-move-candidate" value="${escapeHtml(candidate.id)}" ${candidate.selectedByDefault ? 'checked' : ''} />
                <span>
                  <b>${escapeHtml(candidate.label)}</b>
                  <small>${escapeHtml(candidate.sourceWorldbookName)} / ${escapeHtml(candidate.entryName)}</small>
                </span>
              </label>
            `,
          )
          .join('')
      : '<div class="th-worldbook-picker-empty">没有找到可搬运的索引或正文条目；仍可只搬运基础规则。</div>';
    const warningHtml = dialog.moveWarnings.length
      ? '<div class="th-worldbook-picker-meta">有来源读取提示，已写入控制台，不在这里展开整本世界书。</div>'
      : '';
    title = '搬运到其他世界书';
    description = '先选目标世界书，再勾选要搬运的条目。基础规则会一起列出；节庆和读物只显示被索引引用到的条目。';
    bodyHtml = `
      <div class="th-worldbook-export-panel">
        <label class="th-worldbook-export-field">
          <span>目标世界书</span>
          <input type="text" data-role="managed-worldbook-export-target" value="${escapeHtml(suggestedName)}" placeholder="搜索或输入世界书名称" autocomplete="off" />
        </label>
        <div class="th-worldbook-picker-list" data-role="managed-worldbook-export-list">${worldbookListHtml}</div>
        <div class="th-worldbook-move-panel">
          <div class="th-worldbook-move-head">
            <span>搬运内容</span>
            <span>
              <button type="button" class="th-text-btn" data-action="managed-worldbook-select-all-move-candidates">全选</button>
              <button type="button" class="th-text-btn" data-action="managed-worldbook-clear-move-candidates">全不选</button>
            </span>
          </div>
          <div class="th-worldbook-move-list">${moveCandidateHtml}</div>
          <label class="th-worldbook-move-option">
            <input type="checkbox" data-role="managed-worldbook-remove-source" checked />
            <span>搬运后从原来源删除已选索引和正文条目，避免多个打开的世界书重复注入；脚本内置基础规则不会从原处删除。</span>
          </label>
        </div>
        ${warningHtml}
      </div>
    `;
    actionHtml = [
      '<div class="th-managed-worldbook-action-row is-primary">',
      '<button type="button" class="th-btn th-primary-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-confirm-export-external">搬运 / 创建</button>',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">取消</button>',
      '</div>',
    ].join('');
  }

  layer.innerHTML = `
    <div class="th-managed-worldbook-dialog-backdrop"></div>
    <section class="th-managed-worldbook-dialog th-mvu-settings-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">${escapeHtml(title)}</div>
        <div class="th-managed-worldbook-dialog-desc">${escapeHtml(description)}</div>
      </div>
      <ul class="th-managed-worldbook-dialog-summary">${summaryHtml}</ul>
      ${bodyHtml}
      <div class="th-managed-worldbook-dialog-actions">${actionHtml}</div>
    </section>
  `;
  syncDialogLayerOpen(layer, true);

  const bindClick = (selector: string, handler: () => void) => {
    const element = layer.querySelector<HTMLElement>(selector);
    if (element) {
      element.onclick = () => {
        handler();
      };
    }
  };

  bindClick('.th-managed-worldbook-dialog-backdrop', closeManagedWorldbookDialog);
  bindClick('[data-action="managed-worldbook-dialog-return"]', closeManagedWorldbookDialog);
  bindClick('[data-action="managed-worldbook-menu-uninstall"]', () => {
    void runManagedWorldbookCommand({ type: 'request-uninstall' });
  });
  bindClick('[data-action="managed-worldbook-menu-reinstall"]', () => {
    void runManagedWorldbookCommand({ type: 'request-reinstall' });
  });
  bindClick('[data-action="managed-worldbook-menu-export-external"]', () => {
    void runManagedWorldbookCommand({ type: 'request-external-move' });
  });
  bindClick('[data-action="managed-worldbook-confirm-uninstall"]', () => {
    void runManagedWorldbookCommand({ type: 'confirm-uninstall' });
  });
  bindClick('[data-action="managed-worldbook-confirm-reinstall"]', () => {
    void runManagedWorldbookCommand({ type: 'confirm-reinstall' });
  });
  bindClick('[data-action="managed-worldbook-confirm-export-external"]', () => {
    void confirmExternalManagedWorldbookInstall(layer);
  });
  bindClick('[data-action="reset-mvu-path-settings"]', resetMvuPathSettingsDialog);
  bindClick('[data-action="save-mvu-path-settings"]', () => {
    saveMvuPathSettingsDialog(layer);
  });
  bindClick('[data-action="managed-worldbook-select-all-move-candidates"]', () => {
    setExternalWorldbookMoveCandidateChecks(layer, true);
  });
  bindClick('[data-action="managed-worldbook-clear-move-candidates"]', () => {
    setExternalWorldbookMoveCandidateChecks(layer, false);
  });

  const exportTargetInput = layer.querySelector<HTMLInputElement>('[data-role="managed-worldbook-export-target"]');
  const exportList = layer.querySelector<HTMLElement>('[data-role="managed-worldbook-export-list"]');
  if (exportTargetInput && exportList) {
    exportTargetInput.oninput = () => {
      filterExternalWorldbookPicker(layer);
    };
    exportList.querySelectorAll<HTMLElement>('[data-action="managed-worldbook-pick-export-target"]').forEach(button => {
      button.onclick = () => {
        exportTargetInput.value = String(button.getAttribute('data-worldbook-name') || '').trim();
        filterExternalWorldbookPicker(layer);
        exportTargetInput.focus();
      };
    });
    filterExternalWorldbookPicker(layer);
  }
}

function collectKnownTagLabels(dataset: CalendarDataset | null = state.dataset): string[] {
  const archive = readArchiveStore();
  const values = [
    ...(dataset?.suggestions.tagCandidates.map(option => option.label) ?? []),
    ...archive.policy.customTags,
    ...Object.keys(archive.policy.tagColors),
  ];
  return values
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function syncKnownTagsVariable(dataset: CalendarDataset | null = state.dataset): void {
  const target = getLatestMessageVariableTarget();
  if (!target) {
    return;
  }
  try {
    const variables = getVariables(target) || {};
    set(variables, MESSAGE_KNOWN_TAGS_PATH, collectKnownTagLabels(dataset));
    replaceVariables(variables, target);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 同步月历标签索引失败`, error);
  }
}

function getKnownTagLabels(): string[] {
  return collectKnownTagLabels();
}

function rememberCustomTags(tags: string[]): void {
  const normalized = tags
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index);
  if (!normalized.length) {
    return;
  }
  const policy = readArchiveStore().policy;
  const nextTags = [...policy.customTags, ...normalized].filter((tag, index, array) => array.indexOf(tag) === index);
  replaceCalendarArchivePolicy({ customTags: nextTags });
  syncKnownTagsVariable();
}

function closeTagColorDialog(): void {
  uiState.tagColorDialogOpen = false;
  renderShell();
}

function openTagColorDialog(): void {
  uiState.tagColorDialogOpen = true;
  uiState.selectedTagColorTag = uiState.selectedTagColorTag || getKnownTagLabels()[0] || '主线';
  uiState.tagColorFeedback = '';
  renderShell();
}

function renderTagColorPreviewIcon(svg: string, color: CalendarEventColorStyle): string {
  const rawSvg = String(svg || '').trim();
  const iconHtml =
    rawSvg.startsWith('<svg') && rawSvg.endsWith('</svg>')
      ? rawSvg
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace('<svg ', '<svg class="th-tag-color-preview-svg" aria-hidden="true" focusable="false" ')
      : '<span class="th-tag-color-preview-dot" aria-hidden="true"></span>';
  return `<span class="th-tag-color-preview-icon" style="--th-chip-text: ${escapeHtml(color.text)};">${iconHtml}</span>`;
}

function renderTagColorDialog(): void {
  if (!refs.root) {
    return;
  }
  const layer = refs.root.querySelector<HTMLElement>('[data-role="tag-color-dialog-layer"]');
  if (!layer) {
    return;
  }
  if (!uiState.tagColorDialogOpen) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  const policy = readArchiveStore().policy;
  const knownTags = getKnownTagLabels();
  const selectedTag = knownTags.includes(uiState.selectedTagColorTag)
    ? uiState.selectedTagColorTag
    : knownTags[0] || '主线';
  uiState.selectedTagColorTag = selectedTag;
  const selectedColor = policy.tagColors[selectedTag] ?? TAG_COLOR_PALETTE[0];
  const previewMarker = buildFestivalTagPreviewMarker(selectedTag, selectedColor);
  const contrastRatio = getContrastRatio(selectedColor.background, selectedColor.text);
  const contrastWarning =
    contrastRatio !== null && contrastRatio < 4.5
      ? '<div class="th-tag-color-warning">当前背景色和文字色对比偏低，手机屏幕上可能不清楚。</div>'
      : '';
  const feedbackHtml = uiState.tagColorFeedback
    ? `<div class="th-tag-color-feedback">${escapeHtml(uiState.tagColorFeedback)}</div>`
    : '';
  const tagButtons = knownTags
    .map(
      tag =>
        `<button type="button" class="th-tag-color-tag ${tag === selectedTag ? 'is-active' : ''}" data-action="select-tag-color" data-tag-value="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
    )
    .join('');
  const paletteButtons = TAG_COLOR_PALETTE.map(
    color =>
      `<button type="button" class="th-color-swatch" data-action="apply-tag-color-palette" data-background="${escapeHtml(color.background)}" data-text="${escapeHtml(color.text)}" data-border="${escapeHtml(color.border || color.background)}" style="--th-swatch-bg: ${escapeHtml(color.background)}; --th-swatch-text: ${escapeHtml(color.text)}; --th-swatch-border: ${escapeHtml(color.border || color.background)};" title="${escapeHtml(color.name)}"><span>${escapeHtml(color.name)}</span></button>`,
  ).join('');

  layer.innerHTML = `
    <div class="th-managed-worldbook-dialog-backdrop" data-action="close-tag-color-panel"></div>
    <section class="th-managed-worldbook-dialog th-tag-color-dialog" role="dialog" aria-modal="true" aria-label="标签颜色">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">标签颜色</div>
        <div class="th-managed-worldbook-dialog-desc">选择标签后点色板即可保存；需要精细调整时再改 hex。</div>
      </div>
      ${feedbackHtml}
      <div class="th-tag-color-toolbar">
        <input type="text" data-action="tag-color-search-input" placeholder="搜索标签，或输入新标签" />
        <button type="button" class="th-btn" data-action="add-color-tag">新增标签</button>
      </div>
      <div class="th-tag-color-body">
        <div class="th-tag-color-tag-list" data-role="tag-color-tag-list">${tagButtons}</div>
        <div class="th-tag-color-editor">
          <div class="th-tag-color-current">
            <span class="th-tag-color-preview" style="--th-chip-bg: ${escapeHtml(selectedColor.background)}; --th-chip-text: ${escapeHtml(selectedColor.text)}; --th-chip-border: ${escapeHtml(selectedColor.border || selectedColor.background)};">
              ${renderTagColorPreviewIcon(previewMarker.iconSvg, selectedColor)}
              <span>${escapeHtml(selectedTag)}</span>
            </span>
            <span class="th-tag-color-preview-note">日历图标会跟随这个标签主题色</span>
          </div>
          ${contrastWarning}
          <div class="th-color-palette">${paletteButtons}</div>
          <div class="th-color-hex-grid">
            <label>背景 hex<input data-tag-color-field="background" value="${escapeHtml(selectedColor.background)}" placeholder="#dcecff" /></label>
            <label>文字 hex<input data-tag-color-field="text" value="${escapeHtml(selectedColor.text)}" placeholder="#305d97" /></label>
            <label>边框 hex<input data-tag-color-field="border" value="${escapeHtml(selectedColor.border || selectedColor.background)}" placeholder="#a8c7ed" /></label>
          </div>
        </div>
      </div>
      <div class="th-managed-worldbook-dialog-actions">
        <button type="button" class="th-btn is-danger" data-action="reset-tag-color">移除颜色</button>
        <button type="button" class="th-btn th-primary-btn" data-action="save-tag-color-hex">保存 hex</button>
        <button type="button" class="th-btn" data-action="close-tag-color-panel">关闭</button>
      </div>
    </section>
  `;
  syncDialogLayerOpen(layer, true);
}

function readMvuPathSettingsInputs(layer: HTMLElement): { mvuTimePath: string; mvuLocationPath: string } {
  return {
    mvuTimePath: String(layer.querySelector<HTMLInputElement>('[data-role="mvu-path-time"]')?.value || '').trim(),
    mvuLocationPath: String(layer.querySelector<HTMLInputElement>('[data-role="mvu-path-location"]')?.value || '').trim(),
  };
}

function saveMvuPathSettingsDialog(layer: HTMLElement): void {
  replaceCalendarRuntimePathSettings(readMvuPathSettingsInputs(layer));
  uiState.mvuPathSettingsFeedback = '已保存到当前聊天';
  renderShell();
  void refreshDataset();
}

function resetMvuPathSettingsDialog(): void {
  clearCalendarRuntimePathSettings();
  uiState.mvuPathSettingsFeedback = '已清除自定义路径';
  renderShell();
  void refreshDataset();
}

async function handleFixedEventEditorBindingIntent(intent: FixedEventEditorBindingIntent): Promise<void> {
  const session = getFixedEventEditorSession();
  if (intent.type === 'rename-request') {
    await session.dispatch({ type: 'apply-structured', edits: intent.edits });
    showWidgetTextInput(buildFixedEventEditorRenameDecision(intent.input), async newId => {
      await session.dispatch({ type: 'rename', input: { ...intent.input, newId } });
      renderShell();
    });
    return;
  }

  const layer = refs.root?.querySelector<HTMLElement>('[data-role="fixed-event-index-editor-layer"]');
  const scrollSnapshot =
    intent.render === 'selection' && layer ? readFixedEventIndexEditorScrollSnapshot(layer) : null;
  for (const command of intent.commands) {
    await session.dispatch(command);
  }
  if (intent.render === 'none') {
    return;
  }
  renderShell();
  if (scrollSnapshot && layer) {
    restoreFixedEventIndexEditorScrollSnapshot(layer, { ...scrollSnapshot, detailTop: 0 }, callback => {
      uiWindow.requestAnimationFrame(callback);
    });
  }
}

function renderFixedEventIndexEditorDialog(): void {
  if (!refs.root) {
    return;
  }
  const layer = refs.root.querySelector<HTMLElement>('[data-role="fixed-event-index-editor-layer"]');
  if (!layer) {
    return;
  }
  const snapshot = fixedEventEditorSession?.getSnapshot();
  if (!snapshot?.open || !snapshot.model) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  layer.innerHTML = renderFixedEventIndexEditorPreview(snapshot.model, snapshot.selection);
  syncDialogLayerOpen(layer, true);
  syncFixedEventEditorRecurrenceFields(layer);
  bindFixedEventIndexEditorDialogEvents(layer, {
    onIntent: handleFixedEventEditorBindingIntent,
  });
}

function switchSidebarTab(tab: SidebarTab): void {
  uiState.sidebarTab = tab;
  if (uiState.sidebarTab === 'form' && !state.editingEventId) {
    state.formMode = 'create';
  }
  if (uiState.sidebarTab !== 'form') {
    state.editingEventId = null;
    state.formMode = 'create';
  }
  if (refs.root) {
    refs.root.dataset.tab = uiState.sidebarTab;
    refs.root.querySelectorAll<HTMLElement>('[data-action="switch-tab"]').forEach(button => {
      button.classList.toggle('is-active', button.getAttribute('data-tab') === uiState.sidebarTab);
    });
    refs.root.querySelectorAll<HTMLElement>('[data-role="sidebar-create-entry"]').forEach(button => {
      const isActive = uiState.sidebarTab === 'form';
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }
  if (uiState.sidebarTab === 'form') {
    renderFormSection();
  } else {
    renderShell();
  }
}

function revealSidebarOnMobile(): void {
  if (isDesktopMode()) {
    return;
  }
  uiState.mobileSideOpen = true;
  if (refs.root) {
    refs.root.dataset.mobileSideOpen = 'true';
  }
  const sideBody = refs.root?.querySelector<HTMLElement>('.th-side-body');
  if (!sideBody) {
    return;
  }
  uiWindow.requestAnimationFrame(() => {
    sideBody.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function hideSidebarOnMobile(): void {
  if (isDesktopMode()) {
    return;
  }
  uiState.mobileSideOpen = false;
  if (refs.root) {
    refs.root.dataset.mobileSideOpen = 'false';
  }
}

function readFormValue(field: string): string {
  return String(
    refs.formPanel?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[data-form-field="${field}"]`,
    )?.value || '',
  ).trim();
}

function readFormInteger(field: string, min: number, max: number): number | null {
  const value = Number(readFormValue(field));
  if (!Number.isInteger(value) || value < min || value > max) {
    return null;
  }
  return value;
}

function buildRepeatFormSchedule(): { rule: string; start: string; end: string; error?: string } {
  const rule = readFormValue('rule') || '每月';
  if (rule === '每天') {
    return { rule, start: '每天', end: '' };
  }
  if (rule === '仅工作日') {
    return { rule, start: '每个工作日', end: '' };
  }
  if (rule === '每周') {
    const weekdays = readFormValue('repeat_weekdays')
      .split(/[，,、\s]+/)
      .map(value => value.trim())
      .filter(Boolean);
    if (!weekdays.length) {
      return { rule, start: '', end: '', error: '重复事件需要选择至少一个星期。' };
    }
    return { rule, start: `每周${weekdays.join('、')}`, end: '' };
  }
  if (rule === '每月') {
    const mode = readFormValue('repeat_month_mode') === 'period' ? 'period' : 'day';
    if (mode === 'period') {
      const startDay = readFormInteger('repeat_month_start_day', 1, 31);
      const endDay = readFormInteger('repeat_month_end_day', 1, 31);
      if (!startDay || !endDay) {
        return { rule, start: '', end: '', error: '每月重复需要填写 1-31 之间的日期。' };
      }
      return { rule, start: `每月${startDay}日`, end: `每月${endDay}日` };
    }
    const day = readFormInteger('repeat_month_day', 1, 31);
    if (!day) {
      return { rule, start: '', end: '', error: '每月重复需要填写 1-31 之间的日期。' };
    }
    return { rule, start: `每月${day}日`, end: '' };
  }
  if (rule === '每年') {
    const mode = readFormValue('repeat_year_mode') === 'period' ? 'period' : 'day';
    if (mode === 'period') {
      const startMonth = readFormInteger('repeat_year_start_month', 1, 12);
      const startDay = readFormInteger('repeat_year_start_day', 1, 31);
      const endMonth = readFormInteger('repeat_year_end_month', 1, 12);
      const endDay = readFormInteger('repeat_year_end_day', 1, 31);
      if (!startMonth || !startDay || !endMonth || !endDay) {
        return { rule, start: '', end: '', error: '每年重复需要填写有效的月日。' };
      }
      return { rule, start: `每年${startMonth}月${startDay}日`, end: `每年${endMonth}月${endDay}日` };
    }
    const month = readFormInteger('repeat_year_month', 1, 12);
    const day = readFormInteger('repeat_year_day', 1, 31);
    if (!month || !day) {
      return { rule, start: '', end: '', error: '每年重复需要填写有效的月日。' };
    }
    return { rule, start: `每年${month}月${day}日`, end: '' };
  }
  return { rule: '每月', start: '', end: '', error: '请选择有效的重复规则。' };
}

function readFormTags(): string[] {
  return parseTagListInput(readFormValue('tags'));
}

function ensureFormTagOption(tag: string): void {
  const list = refs.formPanel?.querySelector<HTMLElement>('[data-role="tag-option-list"]');
  if (!list) {
    return;
  }
  const exists = Array.from(list.querySelectorAll<HTMLElement>('[data-action="toggle-form-tag"]')).some(
    button => String(button.getAttribute('data-tag-value') || '') === tag,
  );
  if (exists) {
    return;
  }
  const button = uiDocument.createElement('button');
  button.type = 'button';
  button.className = 'th-tag-option';
  button.dataset.action = 'toggle-form-tag';
  button.dataset.tagValue = tag;
  button.textContent = tag;
  list.appendChild(button);
}

function writeFormTags(tags: string[]): void {
  const normalized = tags
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index);
  const hidden = refs.formPanel?.querySelector<HTMLInputElement>('[data-form-field="tags"]');
  if (hidden) {
    hidden.value = normalized.join(', ');
  }
  const selectedList = refs.formPanel?.querySelector<HTMLElement>('[data-role="selected-tag-list"]');
  if (selectedList) {
    selectedList.innerHTML = normalized.length
      ? normalized
          .map(
            tag =>
              `<button type="button" class="th-form-tag-chip" data-action="remove-form-tag" data-tag-value="${escapeHtml(tag)}">${escapeHtml(tag)} ×</button>`,
          )
          .join('')
      : '<span class="th-tag-picker-empty">未选择标签</span>';
  }
  refs.formPanel?.querySelectorAll<HTMLElement>('[data-action="toggle-form-tag"]').forEach(button => {
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    const active = normalized.includes(tag);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function filterFormTagOptions(keyword: string): void {
  const normalized = keyword.trim().toLowerCase();
  refs.formPanel?.querySelectorAll<HTMLElement>('[data-action="toggle-form-tag"]').forEach(button => {
    const tag = String(button.getAttribute('data-tag-value') || '').toLowerCase();
    button.hidden = Boolean(normalized && !tag.includes(normalized));
  });
}

function toggleFormTag(tag: string): void {
  const current = readFormTags();
  writeFormTags(current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
}

function addCustomFormTag(): void {
  const input = refs.formPanel?.querySelector<HTMLInputElement>('[data-action="tag-search-input"]');
  const tags = parseTagListInput(input?.value || '');
  if (!tags.length) {
    return;
  }
  tags.forEach(ensureFormTagOption);
  writeFormTags([...readFormTags(), ...tags]);
  rememberCustomTags(tags);
  if (input) {
    input.value = '';
  }
  filterFormTagOptions('');
}

function getPolicyTagPicker(field: string): HTMLElement | null {
  return (
    refs.detailPanel?.querySelector<HTMLElement>(`[data-role="policy-tag-picker"][data-policy-tag-field="${field}"]`) ??
    null
  );
}

function readPolicyTags(field: string): string[] {
  const picker = getPolicyTagPicker(field);
  return parseTagListInput(
    String(picker?.querySelector<HTMLInputElement>(`[data-policy-field="${field}"]`)?.value || ''),
  );
}

function ensurePolicyTagOption(field: string, tag: string): void {
  const picker = getPolicyTagPicker(field);
  const list = picker?.querySelector<HTMLElement>('[data-role="policy-tag-option-list"]');
  if (!list) {
    return;
  }
  const exists = Array.from(list.querySelectorAll<HTMLElement>('[data-action="toggle-policy-tag"]')).some(
    button => String(button.getAttribute('data-tag-value') || '') === tag,
  );
  if (exists) {
    return;
  }
  const button = uiDocument.createElement('button');
  button.type = 'button';
  button.className = 'th-tag-option';
  button.dataset.action = 'toggle-policy-tag';
  button.dataset.policyTagField = field;
  button.dataset.tagValue = tag;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<span class="th-tag-option-check" aria-hidden="true"></span><span>${escapeHtml(tag)}</span>`;
  list.appendChild(button);
}

function sortPolicyTagOptionButtons(picker: HTMLElement | null, selectedTags: string[], keyword = ''): void {
  const list = picker?.querySelector<HTMLElement>('[data-role="policy-tag-option-list"]');
  if (!list) {
    return;
  }
  const normalizedKeyword = keyword.trim().toLowerCase();
  const buttons = Array.from(list.querySelectorAll<HTMLElement>('[data-action="toggle-policy-tag"]'));
  buttons
    .sort((left, right) => {
      const leftTag = String(left.getAttribute('data-tag-value') || '').trim();
      const rightTag = String(right.getAttribute('data-tag-value') || '').trim();
      const selectedRank = Number(selectedTags.includes(rightTag)) - Number(selectedTags.includes(leftTag));
      return selectedRank || leftTag.localeCompare(rightTag, 'zh-CN');
    })
    .forEach(button => {
      const tag = String(button.getAttribute('data-tag-value') || '').trim();
      button.hidden = Boolean(normalizedKeyword && !tag.toLowerCase().includes(normalizedKeyword));
      list.appendChild(button);
    });
  const empty = list.querySelector<HTMLElement>('[data-role="policy-tag-empty"]');
  if (empty) {
    empty.hidden = buttons.some(button => !button.hidden);
  }
}

function writePolicyTags(field: string, tags: string[]): void {
  const picker = getPolicyTagPicker(field);
  const normalized = tags
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index);
  const hidden = picker?.querySelector<HTMLInputElement>(`[data-policy-field="${field}"]`);
  if (hidden) {
    hidden.value = normalized.join(', ');
  }
  const meta = picker?.querySelector<HTMLElement>('.th-policy-tag-meta');
  if (meta) {
    meta.textContent = `已选 ${normalized.length} 个；展开列表可直接勾选`;
  }
  picker?.querySelectorAll<HTMLElement>('[data-action="toggle-policy-tag"]').forEach(button => {
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    const active = normalized.includes(tag);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    const check = button.querySelector<HTMLElement>('.th-tag-option-check');
    if (check) {
      check.textContent = active ? '✓' : '';
    }
  });
  const keyword = String(
    picker?.querySelector<HTMLInputElement>('[data-action="policy-tag-search-input"]')?.value || '',
  );
  sortPolicyTagOptionButtons(picker ?? null, normalized, keyword);
}

function filterPolicyTagOptions(field: string, keyword: string): void {
  const picker = getPolicyTagPicker(field);
  const selected = readPolicyTags(field);
  sortPolicyTagOptionButtons(picker, selected, keyword);
  const list = picker?.querySelector<HTMLElement>('[data-role="policy-tag-option-list"]');
  const arrow = picker?.querySelector<HTMLElement>('[data-action="toggle-policy-tag-list"]');
  if (keyword.trim() && list) {
    list.hidden = false;
    arrow?.setAttribute('aria-expanded', 'true');
    arrow?.classList.add('is-open');
  }
}

function togglePolicyTagList(field: string): void {
  const picker = getPolicyTagPicker(field);
  const list = picker?.querySelector<HTMLElement>('[data-role="policy-tag-option-list"]');
  const arrow = picker?.querySelector<HTMLElement>('[data-action="toggle-policy-tag-list"]');
  if (!list) {
    return;
  }
  const open = list.hidden === true;
  list.hidden = !open;
  arrow?.setAttribute('aria-expanded', open ? 'true' : 'false');
  arrow?.classList.toggle('is-open', open);
  sortPolicyTagOptionButtons(
    picker,
    readPolicyTags(field),
    String(picker?.querySelector<HTMLInputElement>('[data-action="policy-tag-search-input"]')?.value || ''),
  );
}

function togglePolicyTag(field: string, tag: string): void {
  const current = readPolicyTags(field);
  writePolicyTags(field, current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
}

function addPolicyTag(field: string): void {
  const picker = getPolicyTagPicker(field);
  const input = picker?.querySelector<HTMLInputElement>('[data-action="policy-tag-search-input"]');
  const tags = parseTagListInput(input?.value || '');
  if (!tags.length) {
    return;
  }
  tags.forEach(tag => ensurePolicyTagOption(field, tag));
  writePolicyTags(field, [...readPolicyTags(field), ...tags]);
  rememberCustomTags(tags);
  if (input) {
    input.value = '';
  }
  filterPolicyTagOptions(field, '');
  const list = picker?.querySelector<HTMLElement>('[data-role="policy-tag-option-list"]');
  const arrow = picker?.querySelector<HTMLElement>('[data-action="toggle-policy-tag-list"]');
  if (list) {
    list.hidden = false;
    arrow?.setAttribute('aria-expanded', 'true');
    arrow?.classList.add('is-open');
  }
}

function normalizeEventIdSeed(value: string): string {
  const ascii = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
  return ascii || 'event';
}

function generateEventId(title: string): string {
  const knownIds = new Set<string>([
    ...(state.dataset?.suggestions.idCandidates ?? []),
    ...Object.keys(readArchiveStore().completed),
  ]);
  const base = normalizeEventIdSeed(title);
  let candidate = base;
  let index = 1;
  while (knownIds.has(candidate)) {
    index += 1;
    candidate = `${base}_${index}`;
  }
  return candidate;
}

function getCurrentMonthAlias(): string {
  return String(monthAliases.find(item => item.month === state.currentMonth.month)?.label || '').trim();
}

function getVisibleCalendarDataset(): CalendarDataset | null {
  if (!state.dataset) {
    return null;
  }
  const archivePolicy = readArchiveStore().policy;
  const autoVisibleArchiveTags = new Set([...archivePolicy.protectedTags, ...archivePolicy.skipArchiveTags]);
  const archivedEvents = state.showArchived
    ? state.dataset.archivedEvents
    : state.dataset.archivedEvents
        .filter(event => event.tags.some(tag => autoVisibleArchiveTags.has(tag)))
        .map(event => ({
          ...event,
          metadata: {
            ...event.metadata,
            archiveVisibleByPolicy: true,
          },
        }));
  const dataset = {
    ...state.dataset,
    archivedEvents,
  };
  if (uiState.festivalScopeMode === 'none') {
    return {
      ...dataset,
      festivals: [],
    };
  }
  if (uiState.festivalScopeMode === 'all') {
    return dataset;
  }
  const localTerms = buildLocalFestivalSearchTerms(dataset);
  if (!localTerms.length) {
    return dataset;
  }
  return {
    ...dataset,
    festivals: dataset.festivals.filter(festival => isFestivalVisibleInLocalScope(festival, localTerms)),
  };
}

function getLocalFestivalIds(dataset: CalendarDataset): Set<string> {
  const localTerms = buildLocalFestivalSearchTerms(dataset);
  if (!localTerms.length) {
    return new Set(dataset.festivals.map(festival => festival.id));
  }
  return new Set(
    dataset.festivals
      .filter(festival => isFestivalVisibleInLocalScope(festival, localTerms))
      .map(festival => festival.id),
  );
}

function getMonthBarDataset(visibleDataset: CalendarDataset): CalendarDataset {
  if (!state.dataset || uiState.festivalScopeMode !== 'all') {
    return visibleDataset;
  }
  const localFestivalIds = getLocalFestivalIds(state.dataset);
  return {
    ...visibleDataset,
    festivals: visibleDataset.festivals.filter(festival => localFestivalIds.has(festival.id)),
  };
}

function getVisibleRangeDayLength(range: DateRange): number {
  let length = 1;
  let cursor = range.start;
  while (compareDatePoint(cursor, range.end) < 0) {
    length += 1;
    cursor = addDays(cursor, 1);
  }
  return length;
}

function compareCompactFestivalBars(left: CalendarEventRecord, right: CalendarEventRecord): number {
  if (left.range && right.range) {
    const lengthOrder = getVisibleRangeDayLength(right.range) - getVisibleRangeDayLength(left.range);
    if (lengthOrder !== 0) {
      return lengthOrder;
    }
    const startOrder = compareDatePoint(left.range.start, right.range.start);
    if (startOrder !== 0) {
      return startOrder;
    }
  }
  return left.title.localeCompare(right.title, 'zh-CN') || left.id.localeCompare(right.id);
}

function findWeekCellIndex(week: MonthDayCell[], point: DatePoint): number {
  return week.findIndex(cell => cell.year === point.year && cell.month === point.month && cell.day === point.day);
}

function rangesOverlap(left: DateRange, right: DateRange): boolean {
  return compareDatePoint(left.start, right.end) <= 0 && compareDatePoint(left.end, right.start) >= 0;
}

function clampRangeToBoundary(range: DateRange, boundary: DateRange): DateRange | null {
  if (!rangesOverlap(range, boundary)) {
    return null;
  }
  return {
    start: compareDatePoint(range.start, boundary.start) < 0 ? boundary.start : range.start,
    end: compareDatePoint(range.end, boundary.end) > 0 ? boundary.end : range.end,
  };
}

function incrementOverflowForBlockedSpan(
  week: MonthDayCell[],
  rowOccupancy: boolean[][],
  startIndex: number,
  endIndex: number,
): void {
  let incremented = false;
  for (let index = startIndex; index <= endIndex; index += 1) {
    if (rowOccupancy.every(row => row[index])) {
      week[index].overflowCount += 1;
      incremented = true;
    }
  }
  if (!incremented) {
    week[startIndex].overflowCount += 1;
  }
}

function addCompactFestivalBars(cells: MonthDayCell[], events: CalendarEventRecord[]): void {
  if (!cells.length || !events.length) {
    return;
  }

  for (let weekStart = 0; weekStart < cells.length; weekStart += 7) {
    const week = cells.slice(weekStart, weekStart + 7);
    const first = week[0];
    const last = week[week.length - 1];
    if (!first || !last) {
      continue;
    }

    const weekRange: DateRange = {
      start: { year: first.year, month: first.month, day: first.day },
      end: { year: last.year, month: last.month, day: last.day },
    };
    const rowOccupancy = Array.from({ length: MONTH_EVENT_ROW_LIMIT }, () => Array(week.length).fill(false));
    week.forEach((cell, cellIndex) => {
      cell.chips.forEach(chip => {
        if (chip.row >= 0 && chip.row < MONTH_EVENT_ROW_LIMIT) {
          rowOccupancy[chip.row][cellIndex] = true;
        }
      });
    });

    events
      .filter(event => event.range && rangesOverlap(event.range, weekRange))
      .sort(compareCompactFestivalBars)
      .forEach(event => {
        if (!event.range) {
          return;
        }
        const clamped = clampRangeToBoundary(event.range, weekRange);
        if (!clamped) {
          return;
        }
        const startIndex = findWeekCellIndex(week, clamped.start);
        const endIndex = findWeekCellIndex(week, clamped.end);
        if (startIndex < 0 || endIndex < startIndex) {
          return;
        }
        const row = rowOccupancy.findIndex(occupied => occupied.slice(startIndex, endIndex + 1).every(value => !value));
        if (row < 0) {
          incrementOverflowForBlockedSpan(week, rowOccupancy, startIndex, endIndex);
          return;
        }

        for (let index = startIndex; index <= endIndex; index += 1) {
          rowOccupancy[row][index] = true;
          const cell = week[index];
          cell.chips.push({
            id: event.id,
            title: event.title,
            label: typeof event.metadata.monthChipLabel === 'string' ? event.metadata.monthChipLabel : undefined,
            row,
            startOffset: 0,
            endOffset: 0,
            isStart: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.start) === 0,
            isEnd: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.end) === 0,
            source: event.source,
            colorToken: 'festival',
            color: event.color,
            displayKind: event.metadata.monthChipKind === 'stage-bubble' ? 'stage-bubble' : 'bar',
          });
        }
      });
  }

  cells.forEach(cell => {
    cell.chips.sort((left, right) => left.row - right.row || left.title.localeCompare(right.title, 'zh-CN'));
  });
}

function addCompactFestivalChips(
  cells: MonthDayCell[],
  markerDataset: CalendarDataset,
  barDataset: CalendarDataset,
): void {
  if (!cells.length) {
    return;
  }
  const barFestivalIds = new Set(barDataset.festivals.map(festival => festival.id));
  const compactFestivals = markerDataset.festivals.filter(festival => !barFestivalIds.has(festival.id));
  if (!compactFestivals.length) {
    return;
  }

  const range: DateRange = {
    start: { year: cells[0].year, month: cells[0].month, day: cells[0].day },
    end: {
      year: cells[cells.length - 1].year,
      month: cells[cells.length - 1].month,
      day: cells[cells.length - 1].day,
    },
  };
  const compactEvents = buildFestivalMonthChipEventsForRange(compactFestivals, range);
  addCompactFestivalBars(cells, compactEvents);
}

function renderMonthView(cells: MonthDayCell[], visibleDataset: CalendarDataset): string {
  return renderCalendarMonthView({
    cells,
    currentMonth: {
      year: state.currentMonth.year,
      month: state.currentMonth.month,
      alias: getCurrentMonthAlias(),
      eraName: getActiveCalendarProfile().date.eraName,
    },
    festivalScope: {
      mode: uiState.festivalScopeMode,
      currentLocationText: state.dataset?.currentLocationText ?? '',
      visibleFestivalCount: visibleDataset.festivals.length,
      allFestivalCount: state.dataset?.festivals.length ?? visibleDataset.festivals.length,
    },
  });
}

function renderBookMainView(bookId: string): string {
  if (isElliaAddonEnabled() && Boolean(elliaAddon?.isElliaBetaTicketBookId(bookId))) {
    return elliaAddon?.renderElliaBetaTicketBookView(bookId) ?? '';
  }

  return renderBookMainViewExternal({
    book: state.dataset?.books[bookId] ?? null,
    currentPageIndex: uiState.openedBookPageIndex,
    renderMarkdownContent,
  });
}

function quickInputBookTrigger(triggerText: string): void {
  const text = String(triggerText || '').trim();
  if (!text) {
    return;
  }
  const input = hostDocument.querySelector<HTMLTextAreaElement | HTMLInputElement>(
    '#send_textarea, textarea[name="send_textarea"], textarea#send_textarea',
  );
  if (!input) {
    showDecisionNotice(buildQuickInputMissingNotice(text));
    return;
  }
  input.value = text;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();
}

function getCurrentMonthAgendaGroups(dataset: CalendarDataset | null): DailyAgendaGroup[] {
  if (!dataset) {
    return [];
  }
  return buildMonthAgenda(dataset, state.currentMonth);
}

function buildAgendaRenderOptions(groups: DailyAgendaGroup[]): RenderAgendaOptions {
  return {
    groups,
    filterKeyword: state.filterKeyword,
    showArchived: state.showArchived,
    agendaSort: uiState.agendaSort,
    editingEventId: state.editingEventId,
  };
}

function renderAgendaPanel(groups: DailyAgendaGroup[]): string {
  return renderAgendaPanelExternal(buildAgendaRenderOptions(groups));
}

function renderAgendaResultsInPlace(): void {
  const target = refs.root?.querySelector<HTMLElement>('[data-role="agenda-results"]');
  const visibleDataset = getVisibleCalendarDataset();
  if (!target || !visibleDataset) {
    return;
  }
  target.innerHTML = renderAgendaResults(buildAgendaRenderOptions(getCurrentMonthAgendaGroups(visibleDataset)));
}

function renderDetailPanel(selectedLabel: string, selectedItems: DailyAgendaItem[]): string {
  if (!state.dataset) {
    return '<div class="th-empty">数据加载中…</div>';
  }

  const openedBook = uiState.openedBookId ? (state.dataset.books[uiState.openedBookId] ?? null) : null;
  if (
    uiState.openedBookId &&
    !openedBook &&
    !(isElliaAddonEnabled() && Boolean(elliaAddon?.isElliaBetaTicketBookId(uiState.openedBookId)))
  ) {
    uiState.openedBookId = null;
  }

  const addonHtml =
    state.selectedDateKey && isElliaAddonEnabled()
      ? (elliaAddon?.renderElliaTicketAddOnForDate(state.selectedDateKey) ?? '')
      : '';

  return renderDetailPanelExternal({
    selectedLabel,
    selectedItems,
    openedBook,
    openedBookPageIndex: uiState.openedBookPageIndex,
    booksById: state.dataset.books,
    editingEventId: state.editingEventId,
    renderMarkdownContent,
    addonHtml,
  });
}

function renderArchivePanel(): string {
  if (!state.dataset) {
    return '<div class="th-empty">数据加载中…</div>';
  }
  return renderArchivePanelExternal({
    archivedEvents: state.dataset.archivedEvents,
    filterKeyword: state.filterKeyword,
    policy: readArchiveStore().policy,
    tagCandidates: getKnownTagLabels(),
  });
}

function getLatestWorldTimeContext(): { nowText: string; anchor: CalendarDataset['calendarAnchor'] } {
  const worldTime = readCurrentWorldTime();
  return {
    nowText: worldTime.text || state.dataset?.nowText || '',
    anchor: worldTime.anchor ?? state.dataset?.calendarAnchor,
  };
}

function formatSelectedDateForForm(dateKey: string): string {
  const point = parseDateKeyPoint(dateKey);
  const context = getLatestWorldTimeContext();
  if (!point || !context.nowText) {
    return dateKey;
  }
  return formatWorldTimeForPoint(point, context);
}

function normalizeFormTimeInput(value: string): string {
  const text = String(value || '').trim();
  const point = parseDateKeyPoint(text);
  const context = getLatestWorldTimeContext();
  if (!point || !context.nowText || text.includes('年')) {
    return text;
  }
  const inputClock = extractClockTimeText(text);
  return formatWorldTimeForPoint(point, {
    nowText: inputClock
      ? context.nowText.replace(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/, `-${inputClock}`)
      : context.nowText,
    anchor: context.anchor,
  });
}

function renderFormSection(): void {
  if (!refs.formPanel || !state.dataset) {
    return;
  }
  const editing = getEditingRecord();
  const latestWorldTime = getLatestWorldTimeContext();
  const defaultStart = state.selectedDateKey
    ? formatSelectedDateForForm(state.selectedDateKey)
    : latestWorldTime.nowText || state.dataset.nowText || '';
  refs.formPanel.innerHTML = `${buildFormEditingNotice()}${renderFormHtml({
    nowText: latestWorldTime.nowText || state.dataset.nowText || fallbackDateLabel(state.selectedDateKey),
    titleCandidates: state.dataset.suggestions.titleCandidates,
    idCandidates: state.dataset.suggestions.idCandidates,
    tagCandidates: state.dataset.suggestions.tagCandidates.map(option => option.label),
    values: editing
      ? {
          type: editing.type,
          id: editing.id,
          title: editing.title,
          tags: editing.tags.join(', '),
          content: editing.content,
          start: editing.startText,
          end: editing.endText,
          rule: editing.repeatRule,
          visibility: editing.raw?.可见性 ?? '玩家与LLM',
        }
      : {
          type: '临时',
          start: defaultStart,
          rule: '无',
          visibility: '玩家与LLM',
        },
    editing: Boolean(editing),
  })}`;
}

function scrollActiveBookPageTabIntoView(): void {
  if (!refs.root || !uiState.openedBookId) {
    return;
  }
  uiWindow.requestAnimationFrame(() => {
    const tabList = refs.root?.querySelector<HTMLElement>('.th-book-page-tabs');
    const activeTab = tabList?.querySelector<HTMLElement>('.th-book-page-tab.is-active');
    if (!tabList || !activeTab) {
      return;
    }

    const currentLeft = tabList.scrollLeft;
    const tabCenter = activeTab.offsetLeft + activeTab.offsetWidth / 2;
    const nextLeft = Math.max(0, Math.round(tabCenter - tabList.clientWidth / 2));
    if (Math.abs(currentLeft - nextLeft) < 2) {
      return;
    }

    try {
      tabList.scrollTo({ left: nextLeft, behavior: 'smooth' });
    } catch {
      tabList.scrollLeft = nextLeft;
    }
  });
}

function renderShell(): void {
  if (!refs.root || !refs.monthGrid || !refs.detailPanel || !refs.formPanel) {
    return;
  }

  syncIframePointerEvents();
  const visibleDataset = getVisibleCalendarDataset();
  const activeReminder = visibleDataset ? buildReminderState(visibleDataset) : state.reminder;
  refs.root.dataset.open = state.open ? 'true' : 'false';
  refs.root.dataset.hasUpcoming = activeReminder.hasUpcoming ? 'true' : 'false';
  refs.root.dataset.tab = uiState.sidebarTab;
  refs.root.dataset.selectedDate = state.selectedDateKey ? 'true' : 'false';
  refs.root.dataset.readingBook = uiState.openedBookId ? 'true' : 'false';
  refs.root.dataset.mobileSideOpen = !isDesktopMode() && uiState.mobileSideOpen ? 'true' : 'false';
  refs.root.dataset.panelFullscreen = isDesktopMode() && uiState.panelFullscreen ? 'true' : 'false';
  refs.root.dataset.tagColorOpen = uiState.tagColorDialogOpen ? 'true' : 'false';
  refs.root.dataset.ballDragging = uiState.ballDragging ? 'true' : 'false';
  applyBallPosition();
  applyTheme();
  updatePanelFullscreenButton();
  syncDeveloperToolMenuItems();
  updateManagedWorldbookButton();
  renderManagedWorldbookDialog();
  renderTagColorDialog();
  renderFixedEventIndexEditorDialog();
  renderWidgetConfirmDialog();
  renderWidgetTextInputDialog();
  refs.root.querySelectorAll<HTMLElement>('[data-action="switch-tab"]').forEach(button => {
    const tab = button.getAttribute('data-tab') || '';
    button.classList.toggle('is-active', tab === refs.root?.dataset.tab);
  });
  refs.root.querySelectorAll<HTMLElement>('[data-role="sidebar-create-entry"]').forEach(button => {
    const isActive = uiState.sidebarTab === 'form';
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (!state.dataset || !visibleDataset) {
    refs.monthGrid.innerHTML = '<div class="th-empty">数据加载中…</div>';
    refs.detailPanel.innerHTML = '<div class="th-empty">数据加载中…</div>';
    refs.formPanel.innerHTML = '<div class="th-empty">数据加载中…</div>';
    return;
  }

  const monthBarDataset = getMonthBarDataset(visibleDataset);
  const cells = buildMonthCells({
    month: state.currentMonth,
    selectedDateKey: state.selectedDateKey,
    dataset: monthBarDataset,
  });
  addCompactFestivalChips(cells, visibleDataset, monthBarDataset);
  const elliaTicketEvents = isElliaAddonEnabled()
    ? (elliaAddon?.buildElliaBetaTicketCalendarEventsForMonth(cells.map(cell => cell.key)) ?? [])
    : [];
  if (elliaTicketEvents.length) {
    const cellsByKey = new Map(cells.map(cell => [cell.key, cell]));
    elliaTicketEvents.forEach(event => {
      const dateKey = event.range ? formatDateKey(event.range.start) : '';
      const cell = cellsByKey.get(dateKey);
      if (!cell) {
        return;
      }
      const usedRows = new Set(cell.chips.map(chip => chip.row));
      const row = Array.from({ length: MONTH_EVENT_ROW_LIMIT }, (_, index) => index).find(
        rowIndex => !usedRows.has(rowIndex),
      );
      if (row === undefined) {
        cell.overflowCount += 1;
        return;
      }
      cell.chips = [
        ...cell.chips,
        {
          id: event.id,
          title: event.title,
          row,
          startOffset: 0,
          endOffset: 0,
          isStart: true,
          isEnd: true,
          source: event.source,
          colorToken: 'user' as const,
          color: event.color,
        },
      ].sort((left, right) => left.row - right.row || left.title.localeCompare(right.title, 'zh-CN'));
    });
  }
  const monthAgendaGroups = getCurrentMonthAgendaGroups(visibleDataset);
  const selectedAgendaGroups = state.selectedDateKey ? buildDailyAgenda(visibleDataset, state.selectedDateKey, 1) : [];
  const detail = buildSelectedDayDetail({
    dateKey: state.selectedDateKey,
    cells,
    agendaGroups: selectedAgendaGroups,
  });
  const selectedLabel = detail.agenda?.label ?? fallbackDateLabel(state.selectedDateKey);

  refs.monthGrid.innerHTML = uiState.openedBookId
    ? renderBookMainView(uiState.openedBookId)
    : renderMonthView(cells, visibleDataset);
  const showingMonthAgenda = !state.selectedDateKey && uiState.sidebarTab === 'detail';
  refs.detailPanel.innerHTML =
    uiState.sidebarTab === 'archive'
      ? renderArchivePanel()
      : showingMonthAgenda
        ? renderAgendaPanel(monthAgendaGroups)
        : renderDetailPanel(selectedLabel, detail.agenda?.items ?? []);
  const sideTitle = refs.root.querySelector<HTMLElement>('.th-side-title');
  if (sideTitle) {
    sideTitle.textContent =
      uiState.sidebarTab === 'archive'
        ? '归档与规则'
        : uiState.sidebarTab === 'form'
          ? state.editingEventId
            ? '编辑事件'
            : '新增事件'
          : showingMonthAgenda
            ? `${state.currentMonth.month}月事件`
            : selectedLabel || '日期详情';
  }
  if (uiState.sidebarTab === 'form') {
    renderFormSection();
  } else {
    refs.formPanel.innerHTML = '';
  }
  scrollActiveBookPageTabIntoView();
  applyPanelPosition();
}

async function refreshDataset(): Promise<void> {
  await ensureCalendarLatestMessageVariableStore();
  const dataset = await loadCalendarDatasetFromRuntimeWorldbook();
  await syncArchiveOnActiveRemoval(dataset.nowText || '');
  monthAliases = dataset.monthAliases ?? [];
  state.dataset = dataset;
  state.reminder = buildReminderState(dataset);
  syncStateAnchors();
  syncKnownTagsVariable(dataset);
  renderShell();
}

function setOpen(open: boolean): void {
  state.open = open;
  if (!open) {
    uiState.mobileSideOpen = false;
    void getManagedWorldbookFlow().dispatch({ type: 'close' });
    uiState.tagColorDialogOpen = false;
    uiState.mvuPathSettingsFeedback = '';
  }
  renderShell();
  if (open) {
    void refreshDataset();
  }
}

function startCreateForm(): void {
  state.formMode = 'create';
  state.editingEventId = null;
  uiState.openedBookId = null;
  switchSidebarTab('form');
  revealSidebarOnMobile();
}

function startEditForm(eventId: string): void {
  state.formMode = 'edit';
  state.editingEventId = eventId;
  switchSidebarTab('form');
  revealSidebarOnMobile();
}

async function saveForm(): Promise<void> {
  const editing = getEditingRecord();
  const title = readFormValue('title');
  const id = readFormValue('id') || editing?.id || generateEventId(title);
  const formType = readFormValue('type') === '重复' ? '重复' : '临时';
  const repeatSchedule = formType === '重复' ? buildRepeatFormSchedule() : null;
  if (repeatSchedule?.error) {
    showDecisionNotice(buildFormSaveFailureNotice(repeatSchedule.error));
    return;
  }
  const result = await saveCalendarForm({
    type: formType,
    id,
    title,
    tags: readFormValue('tags')
      .split(/[，,]/)
      .map(value => value.trim())
      .filter(Boolean),
    content: readFormValue('content'),
    start: repeatSchedule ? repeatSchedule.start : normalizeFormTimeInput(readFormValue('start')),
    end: repeatSchedule ? repeatSchedule.end : normalizeFormTimeInput(readFormValue('end')),
    rule: repeatSchedule ? repeatSchedule.rule : '无',
    visibility: readFormValue('visibility') === '仅玩家' ? '仅玩家' : '玩家与LLM',
    editingRecord: editing ? { id: editing.id } : null,
  });

  if (!result.ok) {
    showDecisionNotice(buildFormSaveFailureNotice(result.message));
    return;
  }

  state.formMode = 'create';
  state.editingEventId = null;
  switchSidebarTab('detail');
  await refreshDataset();
}

async function deleteEvent(eventId: string): Promise<void> {
  const active = state.dataset?.activeEvents.find(item => item.id === eventId);
  if (!active) {
    return;
  }
  showWidgetConfirm(buildActiveDeleteDecision({ title: active.title }), async () => {
    await deleteEventAfterConfirm(eventId);
  });
}

async function deleteEventAfterConfirm(eventId: string): Promise<void> {
  const result = await removeActiveEventWithPolicy({ id: eventId, completedAt: state.dataset?.nowText || '' });
  if (result === 'protected') {
    showDecisionNotice(buildFavoriteProtectedNotice('delete'));
    return;
  }
  await refreshDataset();
}

async function purgeArchived(eventId: string): Promise<void> {
  const archive = readArchiveStore();
  if (!archive.completed[eventId]) {
    return;
  }
  showWidgetConfirm(buildArchivePurgeDecision({ eventId }), async () => {
    await purgeArchivedAfterConfirm(eventId);
  });
}

async function purgeArchivedAfterConfirm(eventId: string): Promise<void> {
  const result = purgeArchivedEventWithPolicy(eventId);
  if (result === 'protected') {
    showDecisionNotice(buildFavoriteProtectedNotice('purge'));
    return;
  }
  await refreshDataset();
}

function parseTagListInput(value: string): string[] {
  return String(value || '')
    .split(/[，,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function readPolicyInputValue(name: string): string {
  return String(
    refs.detailPanel?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-policy-field="${name}"]`)?.value ||
      '',
  );
}

async function saveArchivePolicy(): Promise<void> {
  const archiveOnActiveRemoval = Boolean(
    refs.detailPanel?.querySelector<HTMLInputElement>('[data-policy-field="archive-on-active-removal"]')?.checked,
  );
  const nextPolicy: Partial<CalendarArchivePolicy> = {
    archiveOnActiveRemoval,
    autoDeleteTags: parseTagListInput(readPolicyInputValue('auto-delete-tags')),
    protectedTags: parseTagListInput(readPolicyInputValue('protected-tags')),
  };
  replaceCalendarArchivePolicy(nextPolicy);
  await refreshDataset();
}

function filterTagColorOptions(keyword: string): void {
  const normalized = keyword.trim().toLowerCase();
  refs.root?.querySelectorAll<HTMLElement>('[data-action="select-tag-color"]').forEach(button => {
    const tag = String(button.getAttribute('data-tag-value') || '').toLowerCase();
    button.hidden = Boolean(normalized && !tag.includes(normalized));
  });
}

function addTagFromColorDialog(): void {
  const input = refs.root?.querySelector<HTMLInputElement>('[data-action="tag-color-search-input"]');
  const tags = parseTagListInput(input?.value || '');
  if (!tags.length) {
    return;
  }
  rememberCustomTags(tags);
  uiState.selectedTagColorTag = tags[0];
  if (input) {
    input.value = '';
  }
  renderShell();
}

function selectTagColor(tag: string): void {
  uiState.selectedTagColorTag = tag;
  uiState.tagColorFeedback = '';
  renderShell();
}

async function saveTagColor(color: CalendarEventColorStyle): Promise<void> {
  const tag = uiState.selectedTagColorTag.trim();
  if (!tag) {
    return;
  }
  const policy = readArchiveStore().policy;
  replaceCalendarArchivePolicy({
    tagColors: {
      ...policy.tagColors,
      [tag]: color,
    },
  });
  const ratio = getContrastRatio(color.background, color.text);
  uiState.tagColorFeedback =
    ratio !== null && ratio < 4.5 ? `已应用「${tag}」，但文字对比偏低。` : `已应用「${tag}」颜色。`;
  await refreshDataset();
}

async function saveTagColorHex(): Promise<void> {
  const readColorField = (name: string): string =>
    String(refs.root?.querySelector<HTMLInputElement>(`[data-tag-color-field="${name}"]`)?.value || '').trim();
  const background = readColorField('background');
  const text = readColorField('text');
  const border = readColorField('border');
  if (!isValidHexColor(background) || !isValidHexColor(text) || (border && !isValidHexColor(border))) {
    showDecisionNotice(buildInvalidColorNotice());
    return;
  }
  await saveTagColor({ background, text, ...(border ? { border } : {}) });
}

async function resetSelectedTagColor(): Promise<void> {
  const tag = uiState.selectedTagColorTag.trim();
  if (!tag) {
    return;
  }
  const policy = readArchiveStore().policy;
  const nextColors = { ...policy.tagColors };
  delete nextColors[tag];
  replaceCalendarArchivePolicy({ tagColors: nextColors });
  uiState.tagColorFeedback = `已移除「${tag}」的自定义颜色。`;
  await refreshDataset();
}

async function purgeAutoDeleteArchive(): Promise<void> {
  showWidgetConfirm(buildArchiveCleanupDecision(), async () => {
    await purgeAutoDeleteArchiveAfterConfirm();
  });
}

async function purgeAutoDeleteArchiveAfterConfirm(): Promise<void> {
  const result = purgeAutoDeleteArchivedEvents();
  showDecisionNotice(buildArchiveCleanupResultNotice({ purged: result.deleted, protectedCount: result.protected }));
  await refreshDataset();
}

async function fillNowTime(): Promise<void> {
  await ensureMvuReady();
  const worldTime = readCurrentWorldTime();
  const input = refs.formPanel?.querySelector<HTMLInputElement>('[data-form-field="start"]');
  if (input) {
    input.value = worldTime.text || '';
  }
}

function readExternalWorldbookTargetName(layer: HTMLElement): string {
  return String(
    layer.querySelector<HTMLInputElement>('[data-role="managed-worldbook-export-target"]')?.value || '',
  ).trim();
}

function filterExternalWorldbookPicker(layer: HTMLElement): void {
  const keyword = readExternalWorldbookTargetName(layer);
  const buttons = Array.from(
    layer.querySelectorAll<HTMLElement>('[data-action="managed-worldbook-pick-export-target"]'),
  );
  const models = filterWorldbookPickerNames(
    buttons.map(button => String(button.getAttribute('data-worldbook-name') || '').trim()),
    keyword,
  );
  const visibleNames = new Set(models.map(model => model.name));
  const selectedNames = new Set(models.filter(model => model.selected).map(model => model.name));
  buttons.forEach(button => {
    const name = String(button.getAttribute('data-worldbook-name') || '').trim();
    button.hidden = !visibleNames.has(name);
    button.classList.toggle('is-selected', selectedNames.has(name));
  });

  const hasVisibleButton = buttons.some(button => !button.hidden);
  const list = layer.querySelector<HTMLElement>('[data-role="managed-worldbook-export-list"]');
  const empty = list?.querySelector<HTMLElement>('[data-role="managed-worldbook-export-filter-empty"]');
  if (!list) {
    return;
  }
  if (!hasVisibleButton && buttons.length > 0 && !empty) {
    list.insertAdjacentHTML(
      'beforeend',
      '<div class="th-worldbook-picker-empty" data-role="managed-worldbook-export-filter-empty">列表里没有匹配项；继续点击“搬运 / 创建”会用当前输入创建新世界书。</div>',
    );
  } else if ((hasVisibleButton || buttons.length === 0) && empty) {
    empty.remove();
  }
}

function readExternalWorldbookMoveCandidateIds(layer: HTMLElement): string[] {
  return Array.from(layer.querySelectorAll<HTMLInputElement>('[data-role="managed-worldbook-move-candidate"]'))
    .filter(input => input.checked)
    .map(input => String(input.value || '').trim())
    .filter(Boolean);
}

function shouldRemoveExternalWorldbookMoveSources(layer: HTMLElement): boolean {
  return Boolean(layer.querySelector<HTMLInputElement>('[data-role="managed-worldbook-remove-source"]')?.checked);
}

function setExternalWorldbookMoveCandidateChecks(layer: HTMLElement, checked: boolean): void {
  layer.querySelectorAll<HTMLInputElement>('[data-role="managed-worldbook-move-candidate"]').forEach(input => {
    input.checked = checked;
  });
}

async function confirmExternalManagedWorldbookInstall(layer: HTMLElement): Promise<void> {
  await runManagedWorldbookCommand({
    type: 'confirm-external-move',
    targetName: readExternalWorldbookTargetName(layer),
    candidateIds: readExternalWorldbookMoveCandidateIds(layer),
    removeFromSource: shouldRemoveExternalWorldbookMoveSources(layer),
  });
}

function resetPanelPosition(): void {
  if (!isDesktopMode()) {
    uiState.panelLeft = null;
    uiState.panelTop = null;
    uiState.panelFullscreen = false;
    if (refs.panel) {
      refs.panel.style.left = '';
      refs.panel.style.top = '';
    }
    return;
  }
  uiState.panelFullscreen = false;
  const viewport = getViewportSize({ hostWindow: uiWindow, hostDocument: uiDocument });
  if (!refs.panel) {
    return;
  }
  const width = refs.panel.offsetWidth || Math.min(1560, viewport.width * 0.96);
  const height = refs.panel.offsetHeight || Math.min(960, viewport.height * 0.94);
  uiState.panelLeft = Math.round((viewport.width - width) / 2);
  uiState.panelTop = Math.round((viewport.height - height) / 2);
  applyPanelPosition();
}

function handlePanelDragStart(event: MouseEvent): void {
  if (!isDesktopMode() || uiState.panelFullscreen || !refs.panel) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (!target || target.closest('button, input, textarea, select, label')) {
    return;
  }
  const panelRect = refs.panel.getBoundingClientRect();
  uiState.dragging = true;
  uiState.dragStartX = event.clientX;
  uiState.dragStartY = event.clientY;
  uiState.dragOriginLeft = panelRect.left;
  uiState.dragOriginTop = panelRect.top;
  event.preventDefault();
}

function handlePanelDragMove(event: MouseEvent): void {
  if (!uiState.dragging || !refs.panel) {
    return;
  }
  const viewport = getViewportSize({ hostWindow: uiWindow, hostDocument: uiDocument });
  const panelWidth = refs.panel.offsetWidth;
  const panelHeight = refs.panel.offsetHeight;
  const nextLeft = clamp(
    uiState.dragOriginLeft + (event.clientX - uiState.dragStartX),
    8,
    viewport.width - panelWidth - 8,
  );
  const nextTop = clamp(
    uiState.dragOriginTop + (event.clientY - uiState.dragStartY),
    8,
    viewport.height - panelHeight - 8,
  );
  uiState.panelLeft = nextLeft;
  uiState.panelTop = nextTop;
  applyPanelPosition();
}

function handlePanelDragEnd(): void {
  uiState.dragging = false;
}

function handleBallDragStart(clientX: number, clientY: number): void {
  if (!refs.ball || state.open) {
    return;
  }
  const point = translateHostPointToUi(clientX, clientY);
  const rect = refs.ball.getBoundingClientRect();
  uiState.ballDragging = true;
  uiState.ballMoved = false;
  uiState.ballDragStartX = point.clientX;
  uiState.ballDragStartY = point.clientY;
  uiState.ballDragOriginLeft = rect.left;
  uiState.ballDragOriginTop = rect.top;
  refs.root?.setAttribute('data-ball-dragging', 'true');
  syncIframePointerEvents();
}

function handleBallDragMove(clientX: number, clientY: number): void {
  if (!uiState.ballDragging) {
    return;
  }
  const point = translateHostPointToUi(clientX, clientY);
  const deltaX = point.clientX - uiState.ballDragStartX;
  const deltaY = point.clientY - uiState.ballDragStartY;
  if (Math.hypot(deltaX, deltaY) > BALL_DRAG_CLICK_THRESHOLD) {
    uiState.ballMoved = true;
  }
  const position = clampBallPosition(uiState.ballDragOriginLeft + deltaX, uiState.ballDragOriginTop + deltaY);
  uiState.ballLeft = position.left;
  uiState.ballTop = position.top;
  applyBallPosition();
}

function handleBallDragEnd(): void {
  if (!uiState.ballDragging) {
    return;
  }
  uiState.ballDragging = false;
  refs.root?.setAttribute('data-ball-dragging', 'false');
  syncIframePointerEvents();
  if (uiState.ballMoved) {
    uiState.ballSuppressNextClick = true;
    saveBallPosition();
  }
}

async function dispatchWidgetAction(action: WidgetAction): Promise<void> {
  switch (action.type) {
    case 'panel/toggle':
      if (uiState.ballSuppressNextClick) {
        uiState.ballSuppressNextClick = false;
        return;
      }
      if (!state.open) {
        uiState.openedBookId = null;
        uiState.openedBookPageIndex = 0;
        switchSidebarTab('detail');
      }
      setOpen(!state.open);
      return;
    case 'panel/close':
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      setOpen(false);
      return;
    case 'panel/reload':
      await refreshDataset();
      return;
    case 'panel/toggle-fullscreen':
      setPanelFullscreen(!uiState.panelFullscreen);
      return;
    case 'theme/toggle':
      toggleTheme();
      return;
    case 'festival/toggle-scope':
      uiState.festivalScopeMode =
        uiState.festivalScopeMode === 'all' ? 'local' : uiState.festivalScopeMode === 'local' ? 'none' : 'all';
      renderShell();
      return;
    case 'calendar/pick-day':
      state.selectedDateKey = action.dateKey;
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
      return;
    case 'calendar/month-prev':
      state.currentMonth = {
        year: state.currentMonth.month === 1 ? state.currentMonth.year - 1 : state.currentMonth.year,
        month: state.currentMonth.month === 1 ? 12 : state.currentMonth.month - 1,
        day: 1,
      };
      state.selectedDateKey = '';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
      return;
    case 'calendar/month-next':
      state.currentMonth = {
        year: state.currentMonth.month === 12 ? state.currentMonth.year + 1 : state.currentMonth.year,
        month: state.currentMonth.month === 12 ? 1 : state.currentMonth.month + 1,
        day: 1,
      };
      state.selectedDateKey = '';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
      return;
    case 'calendar/month-today':
      if (state.dataset?.nowDate) {
        state.currentMonth = {
          year: state.dataset.nowDate.year,
          month: state.dataset.nowDate.month,
          day: 1,
        };
        state.selectedDateKey = '';
        uiState.openedBookId = null;
        switchSidebarTab('detail');
      }
      renderShell();
      return;
    case 'sidebar/switch':
      switchSidebarTab(action.tab);
      return;
    case 'agenda/filter':
      state.filterKeyword = action.keyword;
      if (uiState.sidebarTab === 'detail' && !state.selectedDateKey) {
        renderAgendaResultsInPlace();
        return;
      }
      renderShell();
      return;
    case 'agenda/toggle-archived':
      state.showArchived = action.checked;
      renderShell();
      return;
    case 'agenda/sort':
      uiState.agendaSort = action.mode;
      renderShell();
      return;
    case 'agenda/open-date':
      state.selectedDateKey = action.dateKey;
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
      return;
    case 'book/open':
      if (
        !state.dataset?.books[action.bookId] &&
        !(isElliaAddonEnabled() && Boolean(elliaAddon?.isElliaBetaTicketBookId(action.bookId)))
      ) {
        return;
      }
      uiState.openedBookId = action.bookId;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      return;
    case 'book/open-page':
      uiState.openedBookPageIndex = Math.max(0, action.pageIndex);
      renderShell();
      return;
    case 'book/prev-page':
      uiState.openedBookPageIndex = Math.max(0, uiState.openedBookPageIndex - 1);
      renderShell();
      return;
    case 'book/next-page':
      uiState.openedBookPageIndex += 1;
      renderShell();
      return;
    case 'book/quick-input':
      quickInputBookTrigger(action.triggerText);
      return;
    case 'book/close':
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      renderShell();
      return;
    case 'form/open-create':
      startCreateForm();
      return;
    case 'form/cancel':
      state.editingEventId = null;
      state.formMode = 'create';
      switchSidebarTab('detail');
      return;
    case 'form/fill-now':
      await fillNowTime();
      return;
    case 'form/save':
      await saveForm();
      return;
    case 'event/edit':
      startEditForm(action.eventId);
      return;
    case 'event/complete': {
      const result = await archiveCompletedEvent({
        id: action.eventId,
        type: action.eventType,
        completedAt: state.dataset?.nowText || '',
      });
      if (result === 'protected') {
        showDecisionNotice(buildFavoriteProtectedNotice('complete'));
        return;
      }
      await refreshDataset();
      return;
    }
    case 'event/delete':
      await deleteEvent(action.eventId);
      return;
    case 'event/restore':
      await restoreArchivedEvent(action.eventId);
      await refreshDataset();
      return;
    case 'event/purge':
      await purgeArchived(action.eventId);
      return;
    case 'archive/save-policy':
      await saveArchivePolicy();
      return;
    case 'archive/purge-auto-delete':
      await purgeAutoDeleteArchive();
      return;
    case 'tag/search':
      filterFormTagOptions(action.keyword);
      return;
    case 'tag/toggle-form':
      toggleFormTag(action.tag);
      return;
    case 'tag/remove-form':
      writeFormTags(readFormTags().filter(item => item !== action.tag));
      return;
    case 'tag/add-custom':
      addCustomFormTag();
      return;
    case 'tag-color/open':
      openTagColorDialog();
      return;
    case 'tag-color/close':
      closeTagColorDialog();
      return;
    case 'tag-color/search':
      filterTagColorOptions(action.keyword);
      return;
    case 'tag-color/add':
      addTagFromColorDialog();
      return;
    case 'tag-color/select':
      selectTagColor(action.tag);
      return;
    case 'tag-color/apply-palette':
      await saveTagColor(action.color);
      return;
    case 'tag-color/save-hex':
      saveTagColorHex();
      return;
    case 'tag-color/reset':
      resetSelectedTagColor();
      return;
    case 'policy-tag/search':
      filterPolicyTagOptions(action.field, action.keyword);
      return;
    case 'policy-tag/toggle':
      togglePolicyTag(action.field, action.tag);
      return;
    case 'policy-tag/remove':
      writePolicyTags(
        action.field,
        readPolicyTags(action.field).filter(item => item !== action.tag),
      );
      return;
    case 'policy-tag/add':
      addPolicyTag(action.field);
      return;
    case 'policy-tag/toggle-list':
      togglePolicyTagList(action.field);
      return;
    case 'managed-worldbook/open':
      if (!isCalendarDeveloperModeEnabled()) {
        return;
      }
      await runManagedWorldbookCommand({ type: 'open' });
      return;
    case 'fixed-event-editor/open':
      if (!isCalendarDeveloperModeEnabled()) {
        return;
      }
      await getFixedEventEditorSession().dispatch({ type: 'open' });
      return;
    case 'mobile/open-agenda':
      state.selectedDateKey = '';
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
      return;
    case 'mobile/close-side':
      hideSidebarOnMobile();
      return;
    case 'layout/panel-drag-start':
      handlePanelDragStart(action.event);
      return;
    case 'layout/panel-drag-move':
      handlePanelDragMove(action.event);
      return;
    case 'layout/panel-drag-end':
      handlePanelDragEnd();
      return;
    case 'layout/ball-drag-start':
      handleBallDragStart(action.clientX, action.clientY);
      return;
    case 'layout/ball-drag-move':
      handleBallDragMove(action.clientX, action.clientY);
      return;
    case 'layout/ball-drag-end':
      handleBallDragEnd();
      return;
    case 'layout/window-resize':
      applyBallPosition();
      if (!isDesktopMode()) {
        uiState.panelLeft = null;
        uiState.panelTop = null;
        uiState.panelFullscreen = false;
        if (refs.panel) {
          refs.panel.style.left = '';
          refs.panel.style.top = '';
        }
        return;
      }
      renderShell();
      return;
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled widget action: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

function bindEvents(): void {
  bindCalendarWidgetEvents({
    refs,
    hostWindow,
    dispatch: dispatchWidgetAction,
  });
}

function destroy(reason?: string): void {
  if (state.destroyed) {
    return;
  }
  state.destroyed = true;
  destroyFixedEventEditorSession();
  destroyManagedWorldbookFlow();
  if (refs.ball) {
    $(refs.ball).off('.calendar-float');
  }
  if (refs.root) {
    $(refs.root).off('.calendar-float');
    refs.root.remove();
  }
  $(uiDocument).off('.calendar-float-panel-drag');
  $(uiDocument).off('.calendar-float-ball-drag');
  $(uiDocument).off('.calendar-float-tools-menu');
  $(uiWindow).off('.calendar-float-window');
  $(hostWindow).off('.calendar-float-window');
  uiDocument.getElementById(STYLE_ID)?.remove();
  refs.iframe?.remove();
  refs.iframe = null;
  uiWindow = window as Window & typeof globalThis;
  uiDocument = window.document;
  refs.root = null;
  refs.ball = null;
  refs.panel = null;
  refs.monthGrid = null;
  refs.agendaList = null;
  refs.detailPanel = null;
  refs.formPanel = null;
  if (reason && reason !== 'reload') {
    console.info(`[${SCRIPT_NAME}] 已销毁: ${reason}`);
  }
  delete hostWindow[INSTANCE_KEY];
  if (window !== hostWindow) {
    delete window[INSTANCE_KEY];
  }
}

async function reload(): Promise<void> {
  await refreshDataset();
}

function scheduleInitialDatasetRefreshRetries(): void {
  [600, 1800].forEach(delay => {
    uiWindow.setTimeout(() => {
      if (!state.destroyed) {
        void refreshDataset();
      }
    }, delay);
  });
}

function setExternalHostMode(enabled: boolean): void {
  if (refs.root) {
    refs.root.dataset.externalHost = enabled ? 'true' : 'false';
  }
  syncIframePointerEvents();
}

export interface CalendarWidgetBootstrapDependencies {
  ensureProfileAddonsLoaded(): Promise<void>;
}

const DEFAULT_BOOTSTRAP_DEPENDENCIES: CalendarWidgetBootstrapDependencies = {
  ensureProfileAddonsLoaded,
};

export async function bootstrapCalendarWidget(
  lifecycle: CalendarFloatLifecycleToken,
  dependencies: CalendarWidgetBootstrapDependencies = DEFAULT_BOOTSTRAP_DEPENDENCIES,
): Promise<void> {
  lifecycle.throwIfStale();
  hostWindow[INSTANCE_KEY]?.destroy('reload');
  await dependencies.ensureProfileAddonsLoaded();
  lifecycle.throwIfStale();
  state.destroyed = false;
  initializeFixedEventEditorSession();
  initializeManagedWorldbookFlow();
  ensureIframe();
  ensureStyle();
  ensureRoot();
  loadTheme();
  bindEvents();
  resetPanelPosition();
  renderShell();
  void refreshDataset();
  scheduleInitialDatasetRefreshRetries();
  hostWindow[INSTANCE_KEY] = {
    destroy,
    open: () => setOpen(true),
    close: () => setOpen(false),
    reload,
    setExternalHostMode,
  };
  if (window !== hostWindow) {
    window[INSTANCE_KEY] = hostWindow[INSTANCE_KEY];
  }
}
