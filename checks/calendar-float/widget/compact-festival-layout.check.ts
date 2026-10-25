// eslint-disable-next-line import-x/no-nodejs-modules -- This focused UI lifecycle check runs under Node.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- This focused UI lifecycle check runs under Node.
import Module from 'node:module';
// eslint-disable-next-line import-x/no-nodejs-modules -- This focused UI lifecycle check runs under Node.
import { resolve } from 'node:path';
import type { CalendarDataset, FestivalRecord, MonthDayCell } from '../../../src/calendar-float/types';

function installSvgRawRequireHook(): void {
  const moduleWithLoad = Module as unknown as {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
  };
  const originalLoad = moduleWithLoad._load;
  moduleWithLoad._load = (request, parent, isMain) => {
    if (request.endsWith('.svg?raw')) {
      return `<svg data-icon="${request.split('/').pop() ?? 'icon.svg'}"></svg>`;
    }
    return originalLoad(request, parent, isMain);
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createCells(): MonthDayCell[] {
  return Array.from({ length: 7 }, (_, index) => ({
    key: `2025-01-${String(index + 1).padStart(2, '0')}`,
    year: 2025,
    month: 1,
    day: index + 1,
    weekday: index,
    inCurrentMonth: true,
    isToday: false,
    isSelected: false,
    reminderLevel: 'none',
    chips: [],
    markers: [],
    overflowCount: 0,
  }));
}

function createFestival(
  id: string,
  title: string,
  startText: string,
  endText: string,
  range: FestivalRecord['range'],
): FestivalRecord {
  return {
    id,
    title,
    summary: '',
    content: '',
    startText,
    endText,
    sourceKind: 'fixed',
    range,
    relatedBookIds: [],
    locationKeywords: [],
    stages: [],
    metadata: {},
  };
}

function createDataset(festivals: FestivalRecord[]): CalendarDataset {
  return { festivals } as CalendarDataset;
}

function testSpansAndOrderingAreStable(addCompactFestivalChips: typeof import('../../../src/calendar-float/widget/compact-festival-layout').addCompactFestivalChips): void {
  const cells = createCells();
  const festivals = [
    createFestival('short', '较短节庆', '01-03', '01-04', {
      start: { year: 2025, month: 1, day: 3 },
      end: { year: 2025, month: 1, day: 4 },
    }),
    createFestival('long', '较长节庆', '01-01', '01-04', {
      start: { year: 2025, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 4 },
    }),
  ];

  addCompactFestivalChips(cells, createDataset(festivals), createDataset([]));

  assert(cells[0].chips[0]?.id === 'long', '较长节庆应优先占据第一行');
  assert(cells[2].chips.map(chip => chip.id).join('|') === 'long|short', '重叠日应按占用行排序');
  assert(cells[0].chips[0]?.isStart && !cells[0].chips[0]?.isEnd, '跨日节庆首日应保留起点标记');
  assert(cells[3].chips[0]?.isEnd, '节庆最后一日应保留终点标记');
  assert(cells[4].chips.length === 0, '节庆范围外日期不得生成条带');
}

function testAlreadyRenderedFestivalIsNotDuplicated(addCompactFestivalChips: typeof import('../../../src/calendar-float/widget/compact-festival-layout').addCompactFestivalChips): void {
  const cells = createCells();
  const festival = createFestival('shown', '已显示节庆', '01-01', '01-02', {
    start: { year: 2025, month: 1, day: 1 },
    end: { year: 2025, month: 1, day: 2 },
  });

  addCompactFestivalChips(cells, createDataset([festival]), createDataset([festival]));

  assert(cells.every(cell => cell.chips.length === 0), '已显示为完整条带的节庆不得重复生成紧凑条带');
}

function testOverflowCountAndFeedbackCleanupContract(addCompactFestivalChips: typeof import('../../../src/calendar-float/widget/compact-festival-layout').addCompactFestivalChips): void {
  const cells = createCells();
  const events = ['甲'].map((title, index) =>
    createFestival(`event_${index}`, title, '01-01', '01-02', {
      start: { year: 2025, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 2 },
    }),
  );
  cells[0].chips = [0, 1, 2].map(row => ({
    id: `occupied_${row}`,
    title: `已占用 ${row}`,
    row,
    startOffset: 0,
    endOffset: 0,
    isStart: true,
    isEnd: true,
    source: 'active',
    colorToken: 'user',
  }));

  addCompactFestivalChips(cells, createDataset(events), createDataset([]));

  assert(cells[0].overflowCount === 1, '全部可视行被占用时起始日的溢出计数应增加一次');
  assert(cells[1].overflowCount === 0, '部分跨日溢出不应重复计数到后续日期');

  const eventSource = readFileSync(resolve(__dirname, '../../../src/calendar-float/widget/events.ts'), 'utf8');
  const widgetSource = readFileSync(resolve(__dirname, '../../../src/calendar-float/widget/index.ts'), 'utf8');
  assert(eventSource.includes("$(rootDocument).off('.calendar-float-button')"), '事件重绑前应移除旧 document 反馈监听');
  assert(widgetSource.includes("$(refs.root.ownerDocument).off('.calendar-float-button')"), 'widget 销毁时应释放 document 反馈监听');
}

async function main(): Promise<void> {
  installSvgRawRequireHook();
  const { addCompactFestivalChips } = await import('../../../src/calendar-float/widget/compact-festival-layout');
  testSpansAndOrderingAreStable(addCompactFestivalChips);
  testAlreadyRenderedFestivalIsNotDuplicated(addCompactFestivalChips);
  testOverflowCountAndFeedbackCleanupContract(addCompactFestivalChips);
  console.log('compact-festival-layout.check.ts OK');
}

void main();
