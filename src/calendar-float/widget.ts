import { clamp } from 'lodash';
import {
  buildElliaBetaTicketCalendarEventsForMonth,
  ensureElliaBetaTicketStyle,
  isElliaBetaTicketBookId,
  renderElliaBetaTicketBookView,
  renderElliaTicketAddOnForDate,
} from '../dlc_ellia';
import {
  MONTH_EVENT_ROW_LIMIT,
  buildDailyAgenda,
  buildFestivalEventsForRange,
  buildMonthAgenda,
  buildMonthCells,
  buildReminderState,
} from './calendar-view-model';
import { INSTANCE_KEY, ROOT_ID, SCRIPT_NAME, STYLE_ID } from './constants';
import { addDays, compareDatePoint, extractClockTimeText, formatDateKey, getWeekdayFromAnchor } from './date';
import { getFestivalLocationKeywords } from './festival-visual';
import { saveCalendarForm } from './form-service';
import { buildSelectedDayDetail, fallbackDateLabel, renderFormHtml } from './render';
import { loadCalendarDatasetFromRuntimeWorldbook } from './runtime-ui-dataset';
import {
  archiveCompletedEvent,
  ensureMvuReady,
  getAvailableCalendarWorldbooks,
  purgeArchivedEventWithPolicy,
  purgeAutoDeleteArchivedEvents,
  readArchiveStore,
  readCurrentWorldTime,
  removeActiveEventWithPolicy,
  replaceCalendarArchivePolicy,
  restoreArchivedEvent,
  syncArchiveOnActiveRemoval,
} from './storage';
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
  FestivalRecord,
  MonthDayCell,
  ReminderState,
  WidgetRefs,
  WidgetState,
} from './types';
import { bindCalendarWidgetEvents } from './widget-events';
import { getViewportSize, isDesktopViewport } from './widget-layout';
import {
  renderAgendaPanel as renderAgendaPanelExternal,
  renderArchivePanel as renderArchivePanelExternal,
  renderBookMainView as renderBookMainViewExternal,
  renderCalendarMonthView,
  renderDetailPanel as renderDetailPanelExternal,
  type AgendaSortMode,
  type FestivalScopeMode,
} from './widget-render';
import { ensureCalendarWidgetStyle } from './widget-style';
import {
  getCalendarManagedWorldbookDiagnostics,
  installCalendarManagedEntriesToExternalWorldbook,
  installCalendarManagedWorldbookEntries,
  listCalendarWorldbookMoveCandidates,
  refreshCalendarManagedWorldbookRuntimeDiagnostics,
  refreshCalendarManagedWorldbookSourceDiagnostics,
  uninstallCalendarManagedWorldbookEntries,
  type CalendarManagedWorldbookDiagnostics,
  type CalendarWorldbookMoveCandidate,
} from './worldbook-backend-manager';

const hostWindow =
  window.parent && window.parent !== window && window.parent.document
    ? (window.parent as Window & typeof globalThis)
    : window;
const hostDocument = hostWindow.document;
let uiWindow = window as Window & typeof globalThis;
let uiDocument = window.document;
const showdownConverterCtor = (() => {
  const maybeShowdown = (
    hostWindow as unknown as {
      showdown?: {
        Converter?: new (options?: Record<string, unknown>) => { makeHtml(input: string): string };
      };
    }
  ).showdown;
  return maybeShowdown?.Converter ?? null;
})();
const markdownConverter = showdownConverterCtor
  ? new showdownConverterCtor({
      simpleLineBreaks: true,
      strikethrough: true,
      tables: true,
      ghCompatibleHeaderId: true,
      openLinksInNewWindow: true,
    })
  : null;

type SidebarTab = 'detail' | 'form' | 'archive';
type ManagedWorldbookDialogMode = 'menu' | 'confirm-uninstall' | 'confirm-reinstall' | 'export-external';

const TAG_COLOR_PALETTE: Array<CalendarEventColorStyle & { name: string }> = [
  { name: '天空蓝', background: '#dcecff', text: '#305d97', border: '#a8c7ed' },
  { name: '薰衣草', background: '#e9e2ff', text: '#5c4a98', border: '#c8bbf4' },
  { name: '薄荷绿', background: '#dff4e8', text: '#2f7048', border: '#a9d9b9' },
  { name: '玫瑰粉', background: '#ffe1eb', text: '#9a3d61', border: '#efadc2' },
  { name: '蜜糖黄', background: '#ffe6a6', text: '#895710', border: '#e8bf59' },
  { name: '湖水青', background: '#dff2f3', text: '#2d6f73', border: '#a7d4d7' },
  { name: '珊瑚橙', background: '#ffe3cf', text: '#9a4b20', border: '#efb186' },
  { name: '暖灰褐', background: '#f1e6d8', text: '#73583c', border: '#d3bea6' },
  { name: '石榴红', background: '#ffd8d2', text: '#9b2f2f', border: '#ee9e96' },
  { name: '墨绿', background: '#d8efe2', text: '#276153', border: '#9fcfba' },
  { name: '靛蓝', background: '#dfe6ff', text: '#3d4c93', border: '#aebcf0' },
  { name: '银雾', background: '#e8edf2', text: '#4d5c6b', border: '#bdc7d1' },
];

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
  showArchived: true,
  formMode: 'create',
  editingEventId: null,
};

let monthAliases: CalendarMonthAliasRecord[] = [];

const BALL_POSITION_VAR_KEY = 'calendar_float_ball_position';
const BALL_DEFAULT_SIZE = 68;
const BALL_VIEWPORT_MARGIN = 8;
const BALL_DRAG_CLICK_THRESHOLD = 4;
const WORLD_WEEKDAY_TEXT = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

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
  managedWorldbookBusy: false,
  managedWorldbookDialogOpen: false,
  managedWorldbookDialogMode: null as ManagedWorldbookDialogMode | null,
  managedWorldbookDialogDiagnostics: null as CalendarManagedWorldbookDiagnostics | null,
  managedWorldbookMoveCandidates: [] as CalendarWorldbookMoveCandidate[],
  managedWorldbookMoveWarnings: [] as string[],
  tagColorDialogOpen: false,
  selectedTagColorTag: '主线',
  tagColorFeedback: '',
};

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

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(value.trim());
}

function expandHexColor(value: string): string {
  const text = value.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(text)) {
    return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
  }
  return text;
}

function getHexRgb(value: string): { red: number; green: number; blue: number } | null {
  if (!isValidHexColor(value)) {
    return null;
  }
  const hex = expandHexColor(value).slice(1);
  return {
    red: parseInt(hex.slice(0, 2), 16),
    green: parseInt(hex.slice(2, 4), 16),
    blue: parseInt(hex.slice(4, 6), 16),
  };
}

function getRelativeLuminance(value: string): number | null {
  const rgb = getHexRgb(value);
  if (!rgb) {
    return null;
  }
  const convert = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(rgb.red) + 0.7152 * convert(rgb.green) + 0.0722 * convert(rgb.blue);
}

function getContrastRatio(background: string, text: string): number | null {
  const backgroundLuminance = getRelativeLuminance(background);
  const textLuminance = getRelativeLuminance(text);
  if (backgroundLuminance === null || textLuminance === null) {
    return null;
  }
  const lighter = Math.max(backgroundLuminance, textLuminance);
  const darker = Math.min(backgroundLuminance, textLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function stripDangerousMarkdownHtml(html: string): string {
  return html
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

function renderBasicMarkdownContent(text: string): string {
  const blocks = text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);
  if (!blocks.length) {
    return '<p>（暂无内容）</p>';
  }
  return blocks
    .map(block => {
      const heading = block.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = Math.min(heading[1].length, 6);
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      const lines = block
        .split(/\n/)
        .map(line => line.trim())
        .filter(Boolean);
      if (lines.length && lines.every(line => /^[-*+]\s+/.test(line))) {
        return `<ul>${lines.map(line => `<li>${escapeHtml(line.replace(/^[-*+]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (lines.length && lines.every(line => /^\d+[.)]\s+/.test(line))) {
        return `<ol>${lines.map(line => `<li>${escapeHtml(line.replace(/^\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      }
      if (lines.length && lines.every(line => /^>\s?/.test(line))) {
        return `<blockquote>${lines.map(line => escapeHtml(line.replace(/^>\s?/, ''))).join('<br>')}</blockquote>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

function renderMarkdownContent(markdown: string): string {
  const text = String(markdown || '').trim();
  if (!text) {
    return '<p>（暂无内容）</p>';
  }

  if (markdownConverter) {
    try {
      return stripDangerousMarkdownHtml(markdownConverter.makeHtml(text));
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] showdown Markdown 渲染失败`, error);
    }
  }

  return renderBasicMarkdownContent(text);
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
  ensureElliaBetaTicketStyle(uiDocument);
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
  root.dataset.theme = uiState.theme;
  root.dataset.mobileSideOpen = 'false';
  root.dataset.panelFullscreen = 'false';
  root.dataset.tagColorOpen = 'false';
  root.dataset.externalHost = 'false';
  root.dataset.managedWorldbookConnectivity = 'unknown';
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
            <button type="button" class="th-tool-menu-item th-connectivity-button" data-action="managed-worldbook-connectivity" data-state="unknown" role="menuitem" aria-label="侦错模式">
              <span class="th-connectivity-text">侦错模式</span>
            </button>
          </div>
        </details>
        <button type="button" class="th-btn" data-action="toggle-panel-fullscreen" title="全屏" aria-label="全屏" aria-pressed="false">□</button>
        <button type="button" class="th-btn" data-action="reload" title="刷新" aria-label="刷新">↻</button>
        <button type="button" class="th-btn" data-action="close" title="关闭" aria-label="关闭">×</button>
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
  return clampBallPosition(viewport.width - BALL_DEFAULT_SIZE - 18, Math.round(viewport.height * 0.32));
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
  button.textContent = fullscreen ? '↙' : '□';
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

function buildManagedWorldbookSummaryLines(diagnostics: CalendarManagedWorldbookDiagnostics): string[] {
  return [
    `当前后端目标：${diagnostics.worldbookName || '（未绑定）'}`,
    `基础条目：${diagnostics.managedEntryCount}/${diagnostics.expectedManagedEntryCount}`,
    `更新规则：${diagnostics.hasUpdateRulesEntry ? '已找到' : '缺失'}`,
    `变量展示：${diagnostics.hasVariableListEntry ? '已找到' : '缺失'}`,
    `运行时索引：${diagnostics.runtimeIndexWorldbookName || '（未找到）'}`,
    `正文来源：${
      diagnostics.runtimeContentWorldbookNames.length > 0
        ? diagnostics.runtimeContentWorldbookNames.join('、')
        : '（未找到）'
    }`,
  ];
}

function buildManagedWorldbookSourceHtml(diagnostics: CalendarManagedWorldbookDiagnostics): string {
  const groups: Array<{ group: 'event' | 'book' | 'utility'; title: string }> = [
    { group: 'event', title: 'event / 节庆' },
    { group: 'book', title: 'book / 读物' },
    { group: 'utility', title: 'utility / 基础规则' },
  ];
  const items = diagnostics.sourceItems ?? [];
  return groups
    .map(({ group, title }) => {
      const groupItems = items.filter(item => item.group === group);
      const body = groupItems.length
        ? groupItems
            .map(
              item => `
                <li class="th-managed-source-item">
                  <span class="th-managed-source-name">${escapeHtml(item.label)}</span>
                  <span class="th-managed-source-path">source: ${escapeHtml(item.sourceWorldbookName || '（未找到）')} / ${escapeHtml(item.entryName || '（无条目名）')}</span>
                </li>
              `,
            )
            .join('')
        : '<li class="th-managed-source-empty">没有读取到来源</li>';
      return `
        <section class="th-managed-source-group">
          <div class="th-managed-source-title">${escapeHtml(title)}</div>
          <ul class="th-managed-source-list">${body}</ul>
        </section>
      `;
    })
    .join('');
}

/**
 * UI 入口保持为“侦错模式”；正常状态不在菜单按钮上显示后端诊断，只在弹窗内展示调试信息。
 */
function getConnectivityButtonCopy(diagnostics: CalendarManagedWorldbookDiagnostics): {
  text: string;
  title: string;
} {
  const installedText = `${diagnostics.managedEntryCount}/${diagnostics.expectedManagedEntryCount}`;
  const stateText =
    diagnostics.connectivity === 'checking'
      ? '正在检查世界书后端条目'
      : diagnostics.connectivity === 'error'
        ? `世界书后端检查失败；当前 ${installedText}`
        : `打开侦错模式；世界书后端 ${installedText}`;
  return {
    text: uiState.managedWorldbookBusy ? '侦错模式…' : '侦错模式',
    title: stateText,
  };
}

function updateManagedWorldbookButton(): void {
  if (!refs.root) {
    return;
  }
  const diagnostics = getCalendarManagedWorldbookDiagnostics();
  const button = refs.root.querySelector<HTMLButtonElement>('[data-action="managed-worldbook-connectivity"]');
  refs.root.dataset.managedWorldbookConnectivity = diagnostics.connectivity;
  if (!button) {
    return;
  }
  const copy = getConnectivityButtonCopy(diagnostics);
  button.dataset.state = diagnostics.connectivity;
  button.disabled = uiState.managedWorldbookBusy || diagnostics.connectivity === 'checking';
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

function openManagedWorldbookDialog(
  mode: ManagedWorldbookDialogMode,
  diagnostics = getCalendarManagedWorldbookDiagnostics(),
): void {
  uiState.managedWorldbookDialogOpen = true;
  uiState.managedWorldbookDialogMode = mode;
  uiState.managedWorldbookDialogDiagnostics = diagnostics;
  renderShell();
}

function closeManagedWorldbookDialog(): void {
  uiState.managedWorldbookDialogOpen = false;
  uiState.managedWorldbookDialogMode = null;
  uiState.managedWorldbookDialogDiagnostics = null;
  renderShell();
}

function renderManagedWorldbookDialog(): void {
  if (!refs.root) {
    return;
  }

  const layer = refs.root.querySelector<HTMLElement>('[data-role="managed-worldbook-dialog-layer"]');
  if (!layer) {
    return;
  }

  if (!uiState.managedWorldbookDialogOpen || !uiState.managedWorldbookDialogMode) {
    syncDialogLayerOpen(layer, false);
    layer.innerHTML = '';
    return;
  }

  const diagnostics = uiState.managedWorldbookDialogDiagnostics ?? getCalendarManagedWorldbookDiagnostics();
  const summaryHtml = buildManagedWorldbookSummaryLines(diagnostics)
    .map(line => `<li class="th-managed-worldbook-dialog-summary-item">${escapeHtml(line)}</li>`)
    .join('');
  const uninstallDisabled = diagnostics.managedEntryCount <= 0;
  const sourceHtml = buildManagedWorldbookSourceHtml(diagnostics);

  let title = '侦错模式';
  let description =
    '这里显示脚本实际读到的 event / book / utility 来源与后端诊断。正常使用时不需要操作；重装/卸载仅作为 debug/dev 工具。';
  let bodyHtml = '';
  let actionHtml = [
    '<div class="th-managed-worldbook-action-row is-primary">',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-menu-export-external">搬运到其他 worldbook</button>',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">关闭</button>',
    '</div>',
    '<div class="th-managed-worldbook-action-row is-secondary th-managed-worldbook-dev-actions">',
    '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-menu-reinstall">Dev: 重装后端条目</button>',
    `<button type="button" class="th-btn th-managed-worldbook-dialog-btn is-danger" data-action="managed-worldbook-menu-uninstall" ${uninstallDisabled ? 'disabled' : ''}>Dev: 卸载后端条目</button>`,
    '</div>',
  ].join('');

  if (uiState.managedWorldbookDialogMode === 'confirm-uninstall') {
    title = '确认卸载';
    description =
      '确定要卸载吗？这只会从当前后端目标 worldbook 中删除脚本托管的 utility 条目，不会删除节庆/书籍正文来源。';
    actionHtml = [
      '<div class="th-managed-worldbook-action-row is-secondary">',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn is-danger" data-action="managed-worldbook-confirm-uninstall">确认卸载</button>',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">取消</button>',
      '</div>',
    ].join('');
  } else if (uiState.managedWorldbookDialogMode === 'confirm-reinstall') {
    title = '确认重装';
    description = '两个托管后端条目会重置为默认内容：mvu_update 规则与当前日历内容展示。确定要继续吗？';
    actionHtml = [
      '<div class="th-managed-worldbook-action-row is-primary">',
      '<button type="button" class="th-btn th-primary-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-confirm-reinstall">确认重装</button>',
      '<button type="button" class="th-btn th-managed-worldbook-dialog-btn" data-action="managed-worldbook-dialog-return">取消</button>',
      '</div>',
    ].join('');
  } else if (uiState.managedWorldbookDialogMode === 'export-external') {
    const diagnosticsWorldbookName = String(diagnostics.worldbookName || '').trim();
    const availableNames = getAvailableCalendarWorldbooks()
      .map(name => String(name || '').trim())
      .filter(Boolean);
    const suggestedName = availableNames.find(name => name !== diagnosticsWorldbookName) ?? `${SCRIPT_NAME}-backend`;
    const worldbookListHtml = availableNames.length
      ? availableNames
          .map(
            name =>
              `<button type="button" class="th-worldbook-picker-item" data-action="managed-worldbook-pick-export-target" data-worldbook-name="${escapeHtml(name)}"><span>${escapeHtml(name)}</span>${name === diagnosticsWorldbookName ? '<em>当前主世界书</em>' : ''}</button>`,
          )
          .join('')
      : '<div class="th-worldbook-picker-empty">没有读到可复用的 worldbook；可以直接在上方输入新名称创建。</div>';
    const moveCandidateHtml = uiState.managedWorldbookMoveCandidates.length
      ? uiState.managedWorldbookMoveCandidates
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
      : '<div class="th-worldbook-picker-empty">没有从当前打开来源里找到可搬运的索引/正文条目；仍可只搬运基础规则。</div>';
    const warningHtml = uiState.managedWorldbookMoveWarnings.length
      ? `<div class="th-worldbook-picker-meta">读取提示：${escapeHtml(uiState.managedWorldbookMoveWarnings.slice(-2).join('；'))}</div>`
      : '';
    title = '搬运到其他 worldbook';
    description =
      '先选目标 worldbook，再勾选要搬运的条目。列表来自当前运行时索引引用到的世界书条目，并包含基础规则与当前日历内容展示。';
    bodyHtml = `
      <div class="th-worldbook-export-panel">
        <label class="th-worldbook-export-field">
          <span>目标 worldbook</span>
          <input type="text" data-role="managed-worldbook-export-target" value="${escapeHtml(suggestedName)}" placeholder="搜索或输入 worldbook 名称" autocomplete="off" />
        </label>
        <div class="th-worldbook-picker-meta">当前后端目标：${escapeHtml(diagnosticsWorldbookName || '（未绑定）')}；目标可以是已有 worldbook 或新名称。</div>
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
            <span>搬运后从原来源删除已选索引/正文条目，避免多个打开 worldbook 重复注入；脚本内置基础规则不会删除。</span>
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
    <section class="th-managed-worldbook-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">${escapeHtml(title)}</div>
        <div class="th-managed-worldbook-dialog-desc">${escapeHtml(description)}</div>
      </div>
      <ul class="th-managed-worldbook-dialog-summary">${summaryHtml}</ul>
      ${uiState.managedWorldbookDialogMode === 'menu' ? `<div class="th-managed-source-board">${sourceHtml}</div>` : ''}
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
    openManagedWorldbookDialog('confirm-uninstall', diagnostics);
  });
  bindClick('[data-action="managed-worldbook-menu-reinstall"]', () => {
    openManagedWorldbookDialog('confirm-reinstall', diagnostics);
  });
  bindClick('[data-action="managed-worldbook-menu-export-external"]', () => {
    void openExternalWorldbookMoveDialog(diagnostics);
  });
  bindClick('[data-action="managed-worldbook-confirm-uninstall"]', () => {
    void confirmManagedWorldbookUninstall();
  });
  bindClick('[data-action="managed-worldbook-confirm-reinstall"]', () => {
    void confirmManagedWorldbookReinstall();
  });
  bindClick('[data-action="managed-worldbook-confirm-export-external"]', () => {
    void confirmExternalManagedWorldbookInstall(layer);
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

function getKnownTagLabels(): string[] {
  const archive = readArchiveStore();
  const values = [
    ...(state.dataset?.suggestions.tagCandidates.map(option => option.label) ?? []),
    ...archive.policy.customTags,
    ...Object.keys(archive.policy.tagColors),
  ];
  return values
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
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
            <span class="th-tag-color-preview" style="--th-chip-bg: ${escapeHtml(selectedColor.background)}; --th-chip-text: ${escapeHtml(selectedColor.text)}; --th-chip-border: ${escapeHtml(selectedColor.border || selectedColor.background)};">${escapeHtml(selectedTag)}</span>
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

function normalizeLocationMatchText(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function splitLocationTerms(value: string): string[] {
  return String(value || '')
    .split(/[，,、;；/|>\\\n\r\t -]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function isLocationMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeLocationMatchText(left);
  const normalizedRight = normalizeLocationMatchText(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function buildLocalFestivalSearchTerms(dataset: CalendarDataset): string[] {
  const terms = new Set<string>(
    [dataset.currentLocationText, ...splitLocationTerms(dataset.currentLocationText)].filter(Boolean),
  );
  if (terms.size === 0) {
    return [];
  }

  let changed = true;
  while (changed) {
    changed = false;
    dataset.festivals.forEach(festival => {
      const keywords = getFestivalLocationKeywords(festival);
      if (
        !keywords.length ||
        !keywords.some(keyword => Array.from(terms).some(term => isLocationMatch(term, keyword)))
      ) {
        return;
      }
      keywords.forEach(keyword => {
        if (!terms.has(keyword)) {
          terms.add(keyword);
          changed = true;
        }
      });
    });
  }

  return Array.from(terms);
}

function isFestivalVisibleInLocalScope(festival: FestivalRecord, localTerms: string[]): boolean {
  const keywords = getFestivalLocationKeywords(festival);
  if (!keywords.length || localTerms.length === 0) {
    return true;
  }
  return keywords.some(keyword => localTerms.some(term => isLocationMatch(term, keyword)));
}

function getVisibleCalendarDataset(): CalendarDataset | null {
  if (!state.dataset) {
    return null;
  }
  if (uiState.festivalScopeMode === 'none') {
    return {
      ...state.dataset,
      festivals: [],
    };
  }
  if (uiState.festivalScopeMode === 'all') {
    return state.dataset;
  }
  const localTerms = buildLocalFestivalSearchTerms(state.dataset);
  if (!localTerms.length) {
    return state.dataset;
  }
  return {
    ...state.dataset,
    festivals: state.dataset.festivals.filter(festival => isFestivalVisibleInLocalScope(festival, localTerms)),
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
        const row = rowOccupancy.findIndex(occupied =>
          occupied.slice(startIndex, endIndex + 1).every(value => !value),
        );
        if (row < 0) {
          for (let index = startIndex; index <= endIndex; index += 1) {
            week[index].overflowCount += 1;
          }
          return;
        }

        for (let index = startIndex; index <= endIndex; index += 1) {
          rowOccupancy[row][index] = true;
          const cell = week[index];
          cell.chips.push({
            id: event.id,
            title: event.title,
            row,
            startOffset: 0,
            endOffset: 0,
            isStart: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.start) === 0,
            isEnd: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.end) === 0,
            source: event.source,
            colorToken: 'festival',
            color: event.color,
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
  const compactEvents = buildFestivalEventsForRange(compactFestivals, range);
  addCompactFestivalBars(cells, compactEvents);
}

function renderMonthView(cells: MonthDayCell[], visibleDataset: CalendarDataset): string {
  return renderCalendarMonthView({
    cells,
    currentMonth: {
      year: state.currentMonth.year,
      month: state.currentMonth.month,
      alias: getCurrentMonthAlias(),
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
  if (isElliaBetaTicketBookId(bookId)) {
    return renderElliaBetaTicketBookView(bookId);
  }

  return renderBookMainViewExternal({
    book: state.dataset?.books[bookId] ?? null,
    currentPageIndex: uiState.openedBookPageIndex,
    renderMarkdownContent,
  });
}

function getCurrentMonthAgendaGroups(dataset: CalendarDataset | null): DailyAgendaGroup[] {
  if (!dataset) {
    return [];
  }
  return buildMonthAgenda(dataset, state.currentMonth);
}

function renderAgendaPanel(groups: DailyAgendaGroup[]): string {
  return renderAgendaPanelExternal({
    groups,
    filterKeyword: state.filterKeyword,
    showArchived: state.showArchived,
    agendaSort: uiState.agendaSort,
    editingEventId: state.editingEventId,
  });
}

function renderDetailPanel(selectedLabel: string, selectedItems: DailyAgendaItem[]): string {
  if (!state.dataset) {
    return '<div class="th-empty">数据加载中…</div>';
  }

  const openedBook = uiState.openedBookId ? (state.dataset.books[uiState.openedBookId] ?? null) : null;
  if (uiState.openedBookId && !openedBook && !isElliaBetaTicketBookId(uiState.openedBookId)) {
    uiState.openedBookId = null;
  }

  const addonHtml = state.selectedDateKey ? renderElliaTicketAddOnForDate(state.selectedDateKey) : '';

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

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDateKeyPoint(value: string): DatePoint | null {
  const match = String(value || '')
    .trim()
    .match(/^(\d+)[/-](\d{1,2})[/-](\d{1,2})(?:[-/ ]?(?:[01]?\d|2[0-3]):[0-5]\d)?$/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getWorldTimePrefix(nowText: string): string {
  const match = String(nowText || '').match(/^(.+?)(?=\d+\s*年)/);
  return match ? match[1].trim() : '';
}

function formatWorldTimeForPoint(point: DatePoint, args: { nowText: string; anchor?: CalendarDataset['calendarAnchor'] }): string {
  const prefix = getWorldTimePrefix(args.nowText);
  const weekday = WORLD_WEEKDAY_TEXT[getWeekdayFromAnchor(point, args.anchor)] ?? '';
  const clock = extractClockTimeText(args.nowText);
  if (String(args.nowText || '').includes('年')) {
    return `${prefix}${point.year}年-${point.month}月-${point.day}日-${weekday}${clock ? `-${clock}` : ''}`;
  }
  return `${point.year}-${pad2(point.month)}-${pad2(point.day)}${clock ? `-${clock}` : ''}`;
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
    nowText: inputClock ? context.nowText.replace(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/, `-${inputClock}`) : context.nowText,
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
        }
      : {
          type: '临时',
          start: defaultStart,
          rule: '无',
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
  refs.root.dataset.readingBook = uiState.openedBookId ? 'true' : 'false';
  refs.root.dataset.mobileSideOpen = !isDesktopMode() && uiState.mobileSideOpen ? 'true' : 'false';
  refs.root.dataset.panelFullscreen = isDesktopMode() && uiState.panelFullscreen ? 'true' : 'false';
  refs.root.dataset.tagColorOpen = uiState.tagColorDialogOpen ? 'true' : 'false';
  refs.root.dataset.ballDragging = uiState.ballDragging ? 'true' : 'false';
  applyBallPosition();
  applyTheme();
  updatePanelFullscreenButton();
  updateManagedWorldbookButton();
  renderManagedWorldbookDialog();
  renderTagColorDialog();
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
  const elliaTicketEvents = buildElliaBetaTicketCalendarEventsForMonth(cells.map(cell => cell.key));
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
  const dataset = await loadCalendarDatasetFromRuntimeWorldbook();
  await syncArchiveOnActiveRemoval(dataset.nowText || '');
  monthAliases = dataset.monthAliases ?? [];
  state.dataset = dataset;
  state.reminder = buildReminderState(dataset);
  syncStateAnchors();
  renderShell();
}

function setOpen(open: boolean): void {
  state.open = open;
  if (!open) {
    uiState.mobileSideOpen = false;
    uiState.managedWorldbookDialogOpen = false;
    uiState.managedWorldbookDialogMode = null;
    uiState.managedWorldbookDialogDiagnostics = null;
    uiState.tagColorDialogOpen = false;
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
  const result = await saveCalendarForm({
    type: readFormValue('type') === '重复' ? '重复' : '临时',
    id,
    title,
    tags: readFormValue('tags')
      .split(/[，,]/)
      .map(value => value.trim())
      .filter(Boolean),
    content: readFormValue('content'),
    start: normalizeFormTimeInput(readFormValue('start')),
    end: normalizeFormTimeInput(readFormValue('end')),
    rule: readFormValue('rule') || '无',
    editingRecord: editing ? { id: editing.id } : null,
  });

  if (!result.ok) {
    hostWindow.alert(result.message);
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
  const ok = hostWindow.confirm(`确认移除事件「${active.title}」吗？\n普通事件会进入归档区；黑名单标签会直接清理。`);
  if (!ok) {
    return;
  }
  const result = await removeActiveEventWithPolicy({ id: eventId, completedAt: state.dataset?.nowText || '' });
  if (result === 'protected') {
    hostWindow.alert('这个事件带有收藏标签，规则已阻止删除。');
    return;
  }
  await refreshDataset();
}

async function purgeArchived(eventId: string): Promise<void> {
  const archive = readArchiveStore();
  if (!archive.completed[eventId]) {
    return;
  }
  const ok = hostWindow.confirm(`确认彻底删除归档事件「${eventId}」吗？`);
  if (!ok) {
    return;
  }
  const result = purgeArchivedEventWithPolicy(eventId);
  if (result === 'protected') {
    hostWindow.alert('这个归档事件带有收藏标签，规则已阻止彻底删除。');
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
    hostWindow.alert('请输入有效的 hex 颜色，例如 #dcecff。');
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
  const ok = hostWindow.confirm('确认清理所有命中黑名单标签的归档事件吗？收藏标签仍会被保留。');
  if (!ok) {
    return;
  }
  const result = purgeAutoDeleteArchivedEvents();
  hostWindow.alert(
    `已清理 ${result.deleted} 条归档事件。${result.protected ? `\n收藏保护 ${result.protected} 条。` : ''}`,
  );
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

async function handleManagedWorldbookClick(): Promise<void> {
  try {
    await refreshCalendarManagedWorldbookRuntimeDiagnostics();
    await refreshCalendarManagedWorldbookSourceDiagnostics();
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 刷新世界书 runtime 状态失败`, error);
  }
  const diagnostics = getCalendarManagedWorldbookDiagnostics();
  console.info(`[${SCRIPT_NAME}] 用户点击 managed worldbook connectivity 按钮`, diagnostics);
  if (uiState.managedWorldbookBusy) {
    return;
  }

  openManagedWorldbookDialog('menu', diagnostics);
}

async function openExternalWorldbookMoveDialog(diagnostics: CalendarManagedWorldbookDiagnostics): Promise<void> {
  if (uiState.managedWorldbookBusy) {
    return;
  }

  uiState.managedWorldbookBusy = true;
  renderShell();
  try {
    const result = await listCalendarWorldbookMoveCandidates();
    uiState.managedWorldbookMoveCandidates = result.candidates;
    uiState.managedWorldbookMoveWarnings = result.warnings;
    openManagedWorldbookDialog('export-external', diagnostics);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取可搬运 worldbook 条目失败`, error);
    uiState.managedWorldbookMoveCandidates = [];
    uiState.managedWorldbookMoveWarnings = [error instanceof Error ? error.message : String(error)];
    openManagedWorldbookDialog('export-external', diagnostics);
  } finally {
    uiState.managedWorldbookBusy = false;
    renderShell();
  }
}

function readExternalWorldbookTargetName(layer: HTMLElement): string {
  return String(
    layer.querySelector<HTMLInputElement>('[data-role="managed-worldbook-export-target"]')?.value || '',
  ).trim();
}

function filterExternalWorldbookPicker(layer: HTMLElement): void {
  const keyword = readExternalWorldbookTargetName(layer).toLowerCase();
  const buttons = Array.from(
    layer.querySelectorAll<HTMLElement>('[data-action="managed-worldbook-pick-export-target"]'),
  );
  buttons.forEach(button => {
    const name = String(button.getAttribute('data-worldbook-name') || '').trim();
    const matched = !keyword || name.toLowerCase().includes(keyword);
    button.hidden = !matched;
    button.classList.toggle('is-selected', Boolean(name && name.toLowerCase() === keyword));
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
      '<div class="th-worldbook-picker-empty" data-role="managed-worldbook-export-filter-empty">列表里没有匹配项；继续点击“导出 / 创建”会用当前输入创建新 worldbook。</div>',
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
  if (uiState.managedWorldbookBusy) {
    return;
  }

  const targetName = readExternalWorldbookTargetName(layer);
  if (!targetName) {
    hostWindow.alert('请先选择或输入目标 worldbook 名称。');
    return;
  }

  const candidateIds = readExternalWorldbookMoveCandidateIds(layer);
  if (candidateIds.length === 0) {
    hostWindow.alert('请至少勾选一个要搬运的条目。');
    return;
  }

  const removeFromSource = shouldRemoveExternalWorldbookMoveSources(layer);
  uiState.managedWorldbookDialogOpen = false;
  uiState.managedWorldbookDialogMode = null;
  uiState.managedWorldbookDialogDiagnostics = null;
  uiState.managedWorldbookBusy = true;
  renderShell();
  try {
    const result = await installCalendarManagedEntriesToExternalWorldbook(targetName, {
      candidateIds,
      removeFromSource,
    });
    console.info(`[${SCRIPT_NAME}] 已搬运 worldbook 条目`, result);
    hostWindow.alert(
      `已搬运 ${result.movedCount ?? candidateIds.length} 个条目到 worldbook\nWorldbook: ${result.name}${
        removeFromSource ? `\n已从原来源删除 ${result.removedSourceCount ?? 0} 个条目` : ''
      }`,
    );
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 搬运 worldbook 条目失败`, error);
    hostWindow.alert(`搬运 worldbook 条目失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    uiState.managedWorldbookBusy = false;
    renderShell();
  }
}

async function confirmManagedWorldbookUninstall(): Promise<void> {
  if (uiState.managedWorldbookBusy) {
    return;
  }

  uiState.managedWorldbookDialogOpen = false;
  uiState.managedWorldbookDialogMode = null;
  uiState.managedWorldbookDialogDiagnostics = null;
  uiState.managedWorldbookBusy = true;
  renderShell();
  try {
    const result = await uninstallCalendarManagedWorldbookEntries();
    console.info(`[${SCRIPT_NAME}] 一键卸载 worldbook backend 条目成功`, result);
    hostWindow.alert(`已卸载 ${result.removedCount} 个 backend 条目\nWorldbook: ${result.worldbookName}`);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 一键卸载 worldbook backend 条目失败`, error);
    hostWindow.alert(`卸载 backend 条目失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    uiState.managedWorldbookBusy = false;
    renderShell();
  }
}

async function confirmManagedWorldbookReinstall(): Promise<void> {
  if (uiState.managedWorldbookBusy) {
    return;
  }

  uiState.managedWorldbookDialogOpen = false;
  uiState.managedWorldbookDialogMode = null;
  uiState.managedWorldbookDialogDiagnostics = null;
  uiState.managedWorldbookBusy = true;
  renderShell();
  try {
    const result = await installCalendarManagedWorldbookEntries();
    console.info(`[${SCRIPT_NAME}] 手动重装 worldbook backend 条目成功`, result);
    hostWindow.alert(`已重装 backend 条目，所有托管条目已恢复默认状态\nWorldbook: ${result.name}`);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 手动重装 worldbook backend 条目失败`, error);
    hostWindow.alert(`重装 backend 条目失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    uiState.managedWorldbookBusy = false;
    renderShell();
  }
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

function bindEvents(): void {
  bindCalendarWidgetEvents({
    refs,
    hostDocument: uiDocument,
    hostWindow: hostWindow,
    onToggleBall: () => {
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
    },
    onBallDragStart: handleBallDragStart,
    onBallDragMove: handleBallDragMove,
    onBallDragEnd: handleBallDragEnd,
    onClosePanel: () => {
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      setOpen(false);
    },
    onReload: refreshDataset,
    onTogglePanelFullscreen: () => {
      setPanelFullscreen(!uiState.panelFullscreen);
    },
    onToggleTheme: toggleTheme,
    onToggleFestivalScope: () => {
      uiState.festivalScopeMode =
        uiState.festivalScopeMode === 'all' ? 'local' : uiState.festivalScopeMode === 'local' ? 'none' : 'all';
      renderShell();
    },
    onOpenTagColorPanel: openTagColorDialog,
    onCloseTagColorPanel: closeTagColorDialog,
    onManagedWorldbookClick: handleManagedWorldbookClick,
    onSwitchTab: switchSidebarTab,
    onOpenCreateForm: startCreateForm,
    onOpenMobileAgenda: () => {
      state.selectedDateKey = '';
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
    },
    onCloseMobileSide: hideSidebarOnMobile,
    onCancelForm: () => {
      state.editingEventId = null;
      state.formMode = 'create';
      switchSidebarTab('detail');
    },
    onFillNowTime: fillNowTime,
    onSaveForm: saveForm,
    onTagSearchInput: filterFormTagOptions,
    onToggleFormTag: toggleFormTag,
    onRemoveFormTag: (tag: string) => {
      writeFormTags(readFormTags().filter(item => item !== tag));
    },
    onAddCustomTag: addCustomFormTag,
    onTagColorSearchInput: filterTagColorOptions,
    onAddColorTag: addTagFromColorDialog,
    onSelectTagColor: selectTagColor,
    onApplyTagColorPalette: (color: CalendarEventColorStyle) => {
      void saveTagColor(color);
    },
    onSaveTagColorHex: saveTagColorHex,
    onResetTagColor: resetSelectedTagColor,
    onPolicyTagSearchInput: filterPolicyTagOptions,
    onTogglePolicyTag: togglePolicyTag,
    onRemovePolicyTag: (field: string, tag: string) => {
      writePolicyTags(
        field,
        readPolicyTags(field).filter(item => item !== tag),
      );
    },
    onAddPolicyTag: addPolicyTag,
    onTogglePolicyTagList: togglePolicyTagList,
    onPickDay: (dateKey: string) => {
      state.selectedDateKey = dateKey;
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
    },
    onMonthPrev: () => {
      state.currentMonth = {
        year: state.currentMonth.month === 1 ? state.currentMonth.year - 1 : state.currentMonth.year,
        month: state.currentMonth.month === 1 ? 12 : state.currentMonth.month - 1,
        day: 1,
      };
      state.selectedDateKey = '';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
    },
    onMonthNext: () => {
      state.currentMonth = {
        year: state.currentMonth.month === 12 ? state.currentMonth.year + 1 : state.currentMonth.year,
        month: state.currentMonth.month === 12 ? 1 : state.currentMonth.month + 1,
        day: 1,
      };
      state.selectedDateKey = '';
      uiState.openedBookId = null;
      switchSidebarTab('detail');
      renderShell();
    },
    onMonthToday: () => {
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
    },
    onOpenBook: (bookId: string) => {
      const book = state.dataset?.books[bookId];
      if (!book && !isElliaBetaTicketBookId(bookId)) {
        return;
      }
      uiState.openedBookId = bookId;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
    },
    onCloseBookReader: () => {
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      renderShell();
    },
    onOpenBookPage: (pageIndex: number) => {
      uiState.openedBookPageIndex = Math.max(0, pageIndex);
      renderShell();
    },
    onBookPrevPage: () => {
      uiState.openedBookPageIndex = Math.max(0, uiState.openedBookPageIndex - 1);
      renderShell();
    },
    onBookNextPage: () => {
      uiState.openedBookPageIndex += 1;
      renderShell();
    },
    onEditEvent: startEditForm,
    onCompleteEvent: async (eventId: string, eventType: '临时' | '重复') => {
      const result = await archiveCompletedEvent({
        id: eventId,
        type: eventType,
        completedAt: state.dataset?.nowText || '',
      });
      if (result === 'protected') {
        hostWindow.alert('这个事件带有收藏标签，规则已阻止完成后移出。');
        return;
      }
      await refreshDataset();
    },
    onDeleteEvent: deleteEvent,
    onRestoreEvent: (eventId: string) => restoreArchivedEvent(eventId).then(refreshDataset),
    onPurgeEvent: purgeArchived,
    onSaveArchivePolicy: saveArchivePolicy,
    onPurgeAutoDeleteArchive: purgeAutoDeleteArchive,
    onAgendaFilterInput: (keyword: string) => {
      state.filterKeyword = keyword;
      renderShell();
    },
    onAgendaToggleArchived: (checked: boolean) => {
      state.showArchived = checked;
      renderShell();
    },
    onAgendaSortChange: (sort: AgendaSortMode) => {
      uiState.agendaSort = sort;
      renderShell();
    },
    onOpenAgendaItemDate: (dateKey: string) => {
      state.selectedDateKey = dateKey;
      state.editingEventId = null;
      state.formMode = 'create';
      uiState.openedBookId = null;
      uiState.openedBookPageIndex = 0;
      switchSidebarTab('detail');
      renderShell();
      revealSidebarOnMobile();
    },
    onPanelDragStart: handlePanelDragStart,
    onPanelDragMove: handlePanelDragMove,
    onPanelDragEnd: handlePanelDragEnd,
    onWindowResize: () => {
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
    },
  });
}

function destroy(reason?: string): void {
  if (state.destroyed) {
    return;
  }
  state.destroyed = true;
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

function setExternalHostMode(enabled: boolean): void {
  if (refs.root) {
    refs.root.dataset.externalHost = enabled ? 'true' : 'false';
  }
  syncIframePointerEvents();
}

export function bootstrapCalendarWidget(): void {
  hostWindow[INSTANCE_KEY]?.destroy('reload');
  state.destroyed = false;
  ensureIframe();
  ensureStyle();
  ensureRoot();
  loadTheme();
  bindEvents();
  resetPanelPosition();
  renderShell();
  void refreshDataset();
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
