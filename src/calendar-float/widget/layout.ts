export interface WidgetPanelLayoutState {
  panelLeft: number | null;
  panelTop: number | null;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragOriginLeft: number;
  dragOriginTop: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isDesktopViewport(hostWindow: Window & typeof globalThis): boolean {
  return hostWindow.innerWidth > 980;
}

export function getViewportSize(options: { hostWindow: Window & typeof globalThis; hostDocument: Document }): {
  width: number;
  height: number;
} {
  const { hostWindow, hostDocument } = options;
  const docEl = hostDocument.documentElement;
  return {
    width: hostWindow.innerWidth || docEl.clientWidth || 0,
    height: hostWindow.innerHeight || docEl.clientHeight || 0,
  };
}

export function applyPanelPosition(options: {
  panel: HTMLElement | null;
  hostWindow: Window & typeof globalThis;
  hostDocument: Document;
  state: WidgetPanelLayoutState;
}): void {
  const { panel, hostWindow, state } = options;
  if (!panel || !isDesktopViewport(hostWindow)) {
    return;
  }
  if (state.panelLeft == null || state.panelTop == null) {
    panel.style.left = '2vw';
    panel.style.top = '2vh';
    return;
  }
  panel.style.left = `${state.panelLeft}px`;
  panel.style.top = `${state.panelTop}px`;
}

export function resetPanelPosition(options: {
  panel: HTMLElement | null;
  hostWindow: Window & typeof globalThis;
  hostDocument: Document;
  state: WidgetPanelLayoutState;
}): void {
  const { panel, hostWindow, hostDocument, state } = options;
  if (!isDesktopViewport(hostWindow)) {
    state.panelLeft = null;
    state.panelTop = null;
    if (panel) {
      panel.style.left = '';
      panel.style.top = '';
    }
    return;
  }

  const viewport = getViewportSize({ hostWindow, hostDocument });
  if (!panel) {
    return;
  }

  const width = panel.offsetWidth || Math.min(1560, viewport.width * 0.96);
  const height = panel.offsetHeight || Math.min(960, viewport.height * 0.94);
  state.panelLeft = Math.round((viewport.width - width) / 2);
  state.panelTop = Math.round((viewport.height - height) / 2);
  applyPanelPosition({ panel, hostWindow, hostDocument, state });
}

export function handlePanelDragStart(options: {
  event: MouseEvent;
  panel: HTMLElement | null;
  hostWindow: Window & typeof globalThis;
  state: WidgetPanelLayoutState;
}): void {
  const { event, panel, hostWindow, state } = options;
  if (!isDesktopViewport(hostWindow) || !panel) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (!target || target.closest('button, input, textarea, select, label')) {
    return;
  }

  const panelRect = panel.getBoundingClientRect();
  state.dragging = true;
  state.dragStartX = event.clientX;
  state.dragStartY = event.clientY;
  state.dragOriginLeft = panelRect.left;
  state.dragOriginTop = panelRect.top;
  event.preventDefault();
}

export function handlePanelDragMove(options: {
  event: MouseEvent;
  panel: HTMLElement | null;
  hostWindow: Window & typeof globalThis;
  hostDocument: Document;
  state: WidgetPanelLayoutState;
}): void {
  const { event, panel, hostWindow, hostDocument, state } = options;
  if (!state.dragging || !panel) {
    return;
  }

  const viewport = getViewportSize({ hostWindow, hostDocument });
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;
  const nextLeft = clamp(state.dragOriginLeft + (event.clientX - state.dragStartX), 8, viewport.width - panelWidth - 8);
  const nextTop = clamp(state.dragOriginTop + (event.clientY - state.dragStartY), 8, viewport.height - panelHeight - 8);
  state.panelLeft = nextLeft;
  state.panelTop = nextTop;
  applyPanelPosition({ panel, hostWindow, hostDocument, state });
}

export function handlePanelDragEnd(state: WidgetPanelLayoutState): void {
  state.dragging = false;
}
