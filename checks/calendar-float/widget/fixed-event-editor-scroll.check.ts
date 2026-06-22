import {
  readFixedEventIndexEditorScrollSnapshot,
  restoreFixedEventIndexEditorScrollSnapshot,
} from '../../../src/calendar-float/widget/fixed-event-editor-scroll';

interface FakeNode {
  scrollTop: number;
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createLayer(nodes: Record<string, FakeNode | undefined>): HTMLElement {
  return {
    querySelector(selector: string): FakeNode | null {
      return nodes[selector] ?? null;
    },
  } as unknown as HTMLElement;
}

function testReadSnapshotUsesKnownEditorContainers(): void {
  const layer = createLayer({
    '.th-index-editor-dialog': { scrollTop: 11 },
    '[data-role="fixed-event-editor-nav"]': { scrollTop: 22 },
    '[data-role="fixed-event-editor-detail"]': { scrollTop: 33 },
  });
  const snapshot = readFixedEventIndexEditorScrollSnapshot(layer);
  assert(snapshot.dialogTop === 11, '应该读取 dialog scrollTop');
  assert(snapshot.navTop === 22, '应该读取 nav scrollTop');
  assert(snapshot.detailTop === 33, '应该读取 detail scrollTop');
}

function testReadSnapshotFallsBackToZeroWhenNodesAreMissing(): void {
  const snapshot = readFixedEventIndexEditorScrollSnapshot(createLayer({}));
  assert(snapshot.dialogTop === 0, '缺少 dialog 应该回退 0');
  assert(snapshot.navTop === 0, '缺少 nav 应该回退 0');
  assert(snapshot.detailTop === 0, '缺少 detail 应该回退 0');
}

function testRestoreSnapshotRunsThroughScheduler(): void {
  let scheduled = false;
  const dialog = { scrollTop: 0 };
  const nav = { scrollTop: 0 };
  const detail = { scrollTop: 0 };
  const layer = createLayer({
    '.th-index-editor-dialog': dialog,
    '[data-role="fixed-event-editor-nav"]': nav,
    '[data-role="fixed-event-editor-detail"]': detail,
  });

  restoreFixedEventIndexEditorScrollSnapshot(
    layer,
    { dialogTop: 10, navTop: 20, detailTop: 30 },
    callback => {
      scheduled = true;
      callback();
    },
  );

  assert(scheduled, 'restore 应该通过 scheduler 执行');
  assert(dialog.scrollTop === 10, '应该恢复 dialog scrollTop');
  assert(nav.scrollTop === 20, '应该恢复 nav scrollTop');
  assert(detail.scrollTop === 30, '应该恢复 detail scrollTop');
}

function main(): void {
  testReadSnapshotUsesKnownEditorContainers();
  testReadSnapshotFallsBackToZeroWhenNodesAreMissing();
  testRestoreSnapshotRunsThroughScheduler();
  console.log('widget/fixed-event-editor-scroll.check.ts OK');
}

main();
