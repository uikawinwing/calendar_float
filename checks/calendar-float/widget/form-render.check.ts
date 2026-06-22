import { renderFormHtml } from '../../../src/calendar-float/widget/form-render';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testRenderFormHtmlEscapesValuesAndKeepsTagPicker(): void {
  const html = renderFormHtml({
    nowText: '星见 100年-1月-2日',
    titleCandidates: [],
    idCandidates: [],
    tagCandidates: ['危险', '日常'],
    values: {
      type: '临时',
      id: 'event_1',
      title: '<坏标题>',
      tags: '危险, 自定义',
      content: '内容 & 备注',
      start: '100-01-02',
      visibility: '仅玩家',
    },
    editing: true,
  });

  assert(html.includes('编辑事件'), 'editing=true 应该显示编辑事件标题');
  assert(html.includes('&lt;坏标题&gt;'), '标题应该 HTML escape');
  assert(html.includes('内容 &amp; 备注'), '内容应该 HTML escape');
  assert(html.includes('data-role="tag-picker"'), '应该保留 tag picker');
  assert(html.includes('data-tag-value="危险"'), '应该渲染已选标签');
  assert(html.includes('value="仅玩家" selected'), '应该保留可见性选择');
}

function testRenderRepeatFormKeepsRepeatDetailDefaults(): void {
  const html = renderFormHtml({
    nowText: '100年-3月-4日',
    titleCandidates: [],
    idCandidates: [],
    tagCandidates: [],
    values: {
      type: '重复',
      rule: '每年',
      start: '每年5月6日',
      end: '每年5月8日',
    },
  });

  assert(html.includes('data-role="repeat-detail-field"'), '重复事件应该渲染 repeat detail');
  assert(html.includes('data-repeat-detail="每年"'), '每年规则应该保留 yearly detail');
  assert(html.includes('data-repeat-mode="year-period"'), '有结束日期时应该保留 yearly period mode');
  assert(html.includes('data-form-field="repeat_year_start_month" value="5"'), '应该解析每年开始月份');
  assert(html.includes('data-form-field="repeat_year_end_day" value="8"'), '应该解析每年结束日期');
}

function main(): void {
  testRenderFormHtmlEscapesValuesAndKeepsTagPicker();
  testRenderRepeatFormKeepsRepeatDetailDefaults();
  console.log('widget/form-render.check.ts OK');
}

main();
