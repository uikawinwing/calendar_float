export interface FixedEventIndexEditorScrollSnapshot {
  dialogTop: number;
  navTop: number;
  detailTop: number;
}

export type FixedEventIndexEditorScrollScheduler = (callback: () => void) => void;

export function readFixedEventIndexEditorScrollSnapshot(layer: HTMLElement): FixedEventIndexEditorScrollSnapshot {
  return {
    dialogTop: layer.querySelector<HTMLElement>('.th-index-editor-dialog')?.scrollTop ?? 0,
    navTop: layer.querySelector<HTMLElement>('[data-role="fixed-event-editor-nav"]')?.scrollTop ?? 0,
    detailTop: layer.querySelector<HTMLElement>('[data-role="fixed-event-editor-detail"]')?.scrollTop ?? 0,
  };
}

export function restoreFixedEventIndexEditorScrollSnapshot(
  layer: HTMLElement,
  snapshot: FixedEventIndexEditorScrollSnapshot,
  schedule: FixedEventIndexEditorScrollScheduler,
): void {
  schedule(() => {
    const dialog = layer.querySelector<HTMLElement>('.th-index-editor-dialog');
    const nav = layer.querySelector<HTMLElement>('[data-role="fixed-event-editor-nav"]');
    const detail = layer.querySelector<HTMLElement>('[data-role="fixed-event-editor-detail"]');
    if (dialog) {
      dialog.scrollTop = snapshot.dialogTop;
    }
    if (nav) {
      nav.scrollTop = snapshot.navTop;
    }
    if (detail) {
      detail.scrollTop = snapshot.detailTop;
    }
  });
}
