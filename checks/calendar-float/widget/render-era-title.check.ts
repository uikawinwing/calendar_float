declare const require: NodeRequire;

// eslint-disable-next-line import-x/no-nodejs-modules -- check stubs webpack raw SVG imports under ts-node.
const Module = require('module') as {
  _load: (request: string, parent: NodeJS.Module | null, isMain: boolean) => unknown;
};
const originalLoad = Module._load;
Module._load = (request: string, parent: NodeJS.Module | null, isMain: boolean): unknown => {
  if (request.endsWith('.svg?raw')) {
    return '<svg></svg>';
  }
  return originalLoad(request, parent, isMain);
};

const { renderCalendarMonthView } = require('../../../src/calendar-float/widget/render') as typeof import('../../../src/calendar-float/widget/render');

const html = renderCalendarMonthView({
  cells: [],
  currentMonth: {
    year: 488,
    month: 6,
    alias: '苏醒',
    eraName: '复兴纪元',
  },
  festivalScope: {
    mode: 'local',
    currentLocationText: '',
    visibleFestivalCount: 0,
    allFestivalCount: 0,
  },
});

if (!html.includes('复兴纪元488年·6月（苏醒）')) {
  throw new Error(`month title should include era label, got: ${html}`);
}

console.log('widget/render-era-title.check.ts OK');
