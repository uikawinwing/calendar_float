import { formatDateLabel } from './date';
import type { DailyAgendaGroup, MonthDayCell, SelectedDayDetail } from './types';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseTagText(value: string | undefined): string[] {
  return String(value || '')
    .split(/[，,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function renderTagPicker(args: { selectedTags: string[]; tagCandidates: string[] }): string {
  const selectedSet = new Set(args.selectedTags);
  const candidates = [...args.tagCandidates, ...args.selectedTags]
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag, index, array) => array.indexOf(tag) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
  const selectedChips = args.selectedTags.length
    ? args.selectedTags
        .map(
          tag =>
            `<button type="button" class="th-form-tag-chip" data-action="remove-form-tag" data-tag-value="${escapeHtml(tag)}">${escapeHtml(tag)} ×</button>`,
        )
        .join('')
    : '<span class="th-tag-picker-empty">未选择标签</span>';
  const candidateButtons = candidates
    .map(tag => {
      const active = selectedSet.has(tag);
      return `<button type="button" class="th-tag-option ${active ? 'is-active' : ''}" data-action="toggle-form-tag" data-tag-value="${escapeHtml(tag)}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(tag)}</button>`;
    })
    .join('');

  return `
    <div class="th-tag-picker" data-role="tag-picker">
      <input type="hidden" data-form-field="tags" value="${escapeHtml(args.selectedTags.join(', '))}" />
      <div class="th-selected-tag-list" data-role="selected-tag-list">${selectedChips}</div>
      <div class="th-tag-search-row">
        <input type="text" data-action="tag-search-input" placeholder="搜索标签，或输入新标签" />
        <button type="button" class="th-btn" data-action="add-custom-tag">加入标签</button>
      </div>
      <div class="th-tag-option-list" data-role="tag-option-list">${candidateButtons || '<span class="th-tag-picker-empty">暂无候选标签</span>'}</div>
    </div>
  `;
}

const repeatRules = ['每天', '每周', '每月', '每年', '仅工作日'];
const weekdayOptions = [
  { value: '日', label: '日' },
  { value: '一', label: '一' },
  { value: '二', label: '二' },
  { value: '三', label: '三' },
  { value: '四', label: '四' },
  { value: '五', label: '五' },
  { value: '六', label: '六' },
];

function parseMonthlyRepeatDay(value: string): number | null {
  const text = String(value || '').trim();
  const match =
    text.match(/每月\s*(\d{1,2})\s*[日号]?/) ??
    text.match(/(?:^|[^\d])(\d{1,2})\s*[日号](?!\d)/) ??
    text.match(/^(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
}

function parseYearlyRepeatDate(value: string): { month: number; day: number } | null {
  const text = String(value || '').trim();
  const match =
    text.match(/(?:每年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/) ??
    text.match(/(?:每年\s*)?(\d{1,2})[-/](\d{1,2})/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  return Number.isFinite(month) && month >= 1 && month <= 12 && Number.isFinite(day) && day >= 1 && day <= 31
    ? { month, day }
    : null;
}

function parseMonthDayFromText(value: string): { month: number; day: number } | null {
  const text = String(value || '').trim();
  const match = text.match(/(\d{1,2})\s*月[-/ ]?(\d{1,2})\s*[日号]?/) ?? text.match(/(\d{1,2})[-/](\d{1,2})/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  return Number.isFinite(month) && month >= 1 && month <= 12 && Number.isFinite(day) && day >= 1 && day <= 31
    ? { month, day }
    : null;
}

function parseWeeklyRepeatDays(value: string): string[] {
  const text = String(value || '').toLowerCase();
  const values = new Set<string>();
  const normalized = text.replace(/星期/g, '周').replace(/礼拜/g, '周');
  if (/每周|每星期|周|星期|礼拜/.test(text)) {
    for (const [, day] of normalized.matchAll(/([日天一二三四五六])/g)) {
      values.add(day === '天' ? '日' : day);
    }
  }
  if (normalized.includes('weekend')) {
    values.add('六');
    values.add('日');
  }
  const englishMap: Array<[RegExp, string]> = [
    [/\b(mon|monday)\b/, '一'],
    [/\b(tue|tues|tuesday)\b/, '二'],
    [/\b(wed|wednesday)\b/, '三'],
    [/\b(thu|thur|thurs|thursday)\b/, '四'],
    [/\b(fri|friday)\b/, '五'],
    [/\b(sat|saturday)\b/, '六'],
    [/\b(sun|sunday)\b/, '日'],
  ];
  englishMap.forEach(([pattern, day]) => {
    if (pattern.test(text)) {
      values.add(day);
    }
  });
  return weekdayOptions.map(option => option.value).filter(day => values.has(day));
}

function renderRepeatDetail(args: {
  isRepeat: boolean;
  rule: string;
  start: string;
  end: string;
  defaultMonth: number;
  defaultDay: number;
}): string {
  const weeklyDays = parseWeeklyRepeatDays(args.start);
  const selectedWeeklyDays = weeklyDays.length ? weeklyDays : ['一'];
  const monthlyStartDay = parseMonthlyRepeatDay(args.start) ?? args.defaultDay;
  const monthlyEndDay = parseMonthlyRepeatDay(args.end);
  const monthlyMode = monthlyEndDay ? 'period' : 'day';
  const yearlyStart = parseYearlyRepeatDate(args.start) ?? { month: args.defaultMonth, day: args.defaultDay };
  const yearlyEnd = parseYearlyRepeatDate(args.end);
  const yearlyMode = yearlyEnd ? 'period' : 'day';
  const detailHidden = !args.isRepeat || args.rule === '每天' || args.rule === '仅工作日';

  return `
    <div class="th-repeat-detail" data-role="repeat-detail-field" ${detailHidden ? 'hidden' : ''}>
      <div class="th-repeat-detail-group" data-repeat-detail="每周" ${args.isRepeat && args.rule === '每周' ? '' : 'hidden'}>
        <label>每周哪几天</label>
        <input type="hidden" data-form-field="repeat_weekdays" value="${escapeHtml(selectedWeeklyDays.join(','))}" />
        <div class="th-repeat-weekday-list">
          ${weekdayOptions
            .map(option => {
              const checked = selectedWeeklyDays.includes(option.value);
              return `<label class="th-repeat-weekday ${checked ? 'is-active' : ''}"><input type="checkbox" data-action="toggle-repeat-weekday" value="${escapeHtml(option.value)}" ${checked ? 'checked' : ''} /><span>${escapeHtml(option.label)}</span></label>`;
            })
            .join('')}
        </div>
      </div>
      <div class="th-repeat-detail-group" data-repeat-detail="每月" ${args.isRepeat && args.rule === '每月' ? '' : 'hidden'}>
        <label>每月模式</label>
        <select data-form-field="repeat_month_mode">
          <option value="day" ${monthlyMode === 'day' ? 'selected' : ''}>每月某一天</option>
          <option value="period" ${monthlyMode === 'period' ? 'selected' : ''}>每月一段日期</option>
        </select>
        <div class="th-repeat-inline" data-repeat-mode="month-day" ${monthlyMode === 'day' ? '' : 'hidden'}>
          <input type="number" min="1" max="31" data-form-field="repeat_month_day" value="${escapeHtml(monthlyStartDay)}" />
          <span>日</span>
        </div>
        <div class="th-repeat-inline" data-repeat-mode="month-period" ${monthlyMode === 'period' ? '' : 'hidden'}>
          <input type="number" min="1" max="31" data-form-field="repeat_month_start_day" value="${escapeHtml(monthlyStartDay)}" />
          <span>日至</span>
          <input type="number" min="1" max="31" data-form-field="repeat_month_end_day" value="${escapeHtml(monthlyEndDay ?? monthlyStartDay)}" />
          <span>日</span>
        </div>
      </div>
      <div class="th-repeat-detail-group" data-repeat-detail="每年" ${args.isRepeat && args.rule === '每年' ? '' : 'hidden'}>
        <label>每年模式</label>
        <select data-form-field="repeat_year_mode">
          <option value="day" ${yearlyMode === 'day' ? 'selected' : ''}>每年某一天</option>
          <option value="period" ${yearlyMode === 'period' ? 'selected' : ''}>每年一段日期</option>
        </select>
        <div class="th-repeat-inline" data-repeat-mode="year-day" ${yearlyMode === 'day' ? '' : 'hidden'}>
          <input type="number" min="1" max="12" data-form-field="repeat_year_month" value="${escapeHtml(yearlyStart.month)}" />
          <span>月</span>
          <input type="number" min="1" max="31" data-form-field="repeat_year_day" value="${escapeHtml(yearlyStart.day)}" />
          <span>日</span>
        </div>
        <div class="th-repeat-inline" data-repeat-mode="year-period" ${yearlyMode === 'period' ? '' : 'hidden'}>
          <input type="number" min="1" max="12" data-form-field="repeat_year_start_month" value="${escapeHtml(yearlyStart.month)}" />
          <span>月</span>
          <input type="number" min="1" max="31" data-form-field="repeat_year_start_day" value="${escapeHtml(yearlyStart.day)}" />
          <span>日至</span>
          <input type="number" min="1" max="12" data-form-field="repeat_year_end_month" value="${escapeHtml(yearlyEnd?.month ?? yearlyStart.month)}" />
          <span>月</span>
          <input type="number" min="1" max="31" data-form-field="repeat_year_end_day" value="${escapeHtml(yearlyEnd?.day ?? yearlyStart.day)}" />
          <span>日</span>
        </div>
      </div>
    </div>
  `;
}

export function renderFormHtml(args: {
  nowText: string;
  titleCandidates: string[];
  idCandidates: string[];
  tagCandidates: string[];
  values?: {
    type?: string;
    id?: string;
    title?: string;
    tags?: string;
    content?: string;
    start?: string;
    end?: string;
    rule?: string;
    visibility?: string;
  };
  editing?: boolean;
}): string {
  const values = args.values ?? {};
  const selectedTags = parseTagText(values.tags);
  const isRepeat = values.type === '重复';
  const rule = isRepeat && repeatRules.includes(String(values.rule || '')) ? String(values.rule) : isRepeat ? '每月' : '无';
  const selectedRepeatRule = isRepeat ? rule : '每月';
  const defaultDate = parseMonthDayFromText(args.nowText);
  const defaultMonth = defaultDate?.month ?? 1;
  const defaultDay = defaultDate?.day ?? 1;
  return `
    <section class="th-calendar-section">
      <div class="th-section-title-row">
        <div>
          <div class="th-section-title">${args.editing ? '编辑事件' : '新增事件'}</div>
          <div class="th-section-subtitle">当前世界时间：${escapeHtml(args.nowText || '未读取到')}</div>
        </div>
      </div>
      <div class="th-form-shell">
        <div class="th-form-field">
          <label>类型</label>
          <select data-form-field="type">
            <option value="临时" ${values.type === '重复' ? '' : 'selected'}>临时</option>
            <option value="重复" ${values.type === '重复' ? 'selected' : ''}>重复</option>
          </select>
        </div>
        <details class="th-form-advanced" ${args.editing ? 'open' : ''}>
          <summary>高级选项</summary>
          <div class="th-form-field">
            <label>事件 ID</label>
            <input data-form-field="id" value="${escapeHtml(values.id || '')}" placeholder="留空自动生成，例如 quest_01" />
          </div>
          <div class="th-form-field">
            <label>可见性</label>
            <select data-form-field="visibility">
              <option value="玩家与LLM" ${values.visibility === '仅玩家' ? '' : 'selected'}>玩家与 LLM</option>
              <option value="仅玩家" ${values.visibility === '仅玩家' ? 'selected' : ''}>仅玩家</option>
            </select>
          </div>
          <div class="th-form-field" data-role="absolute-time-field" ${isRepeat ? 'hidden' : ''}>
            <label>时间</label>
            <input data-form-field="start" value="${escapeHtml(values.start || '')}" placeholder="默认使用选中日期或当前世界时间" />
          </div>
          <div class="th-form-field" data-role="absolute-time-field" ${isRepeat ? 'hidden' : ''}>
            <label>结束时间</label>
            <input data-form-field="end" value="${escapeHtml(values.end || '')}" placeholder="可留空" />
          </div>
          <div class="th-form-field" data-role="repeat-rule-field" ${isRepeat ? '' : 'hidden'}>
            <label>重复规则</label>
            <select data-form-field="rule">
              ${repeatRules
                .map(
                  option =>
                    `<option value="${escapeHtml(option)}" ${option === selectedRepeatRule ? 'selected' : ''}>${escapeHtml(option)}</option>`,
                )
                .join('')}
            </select>
          </div>
          ${renderRepeatDetail({
            isRepeat,
            rule,
            start: values.start || '',
            end: values.end || '',
            defaultMonth,
            defaultDay,
          })}
        </details>
        <div class="th-form-field">
          <label>标题</label>
          <input data-form-field="title" value="${escapeHtml(values.title || '')}" placeholder="事件标题" />
        </div>
        <div class="th-form-field">
          <label>标签</label>
          ${renderTagPicker({ selectedTags, tagCandidates: args.tagCandidates })}
        </div>
        <div class="th-form-field">
          <label>内容</label>
          <textarea data-form-field="content" rows="4" placeholder="详细描述、备忘信息">${escapeHtml(values.content || '')}</textarea>
        </div>
        <div class="th-form-actions">
          <button type="button" class="th-btn" data-action="fill-now-time">填入当前时间</button>
          <button type="button" class="th-btn th-primary-btn" data-action="save-form">${args.editing ? '保存修改' : '新增事件'}</button>
          <button type="button" class="th-btn" data-action="cancel-form">取消</button>
        </div>
      </div>
    </section>
  `;
}

export function buildSelectedDayDetail(args: {
  dateKey: string;
  cells: MonthDayCell[];
  agendaGroups: DailyAgendaGroup[];
}): SelectedDayDetail {
  return {
    dateKey: args.dateKey,
    monthCell: args.cells.find(cell => cell.key === args.dateKey),
    agenda: args.agendaGroups.find(group => group.dateKey === args.dateKey) ?? null,
  };
}

export function fallbackDateLabel(dateKey: string): string {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return dateKey;
  }
  return formatDateLabel({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
}
