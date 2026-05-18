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
  };
  editing?: boolean;
}): string {
  const values = args.values ?? {};
  const selectedTags = parseTagText(values.tags);
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
        <div class="th-form-field">
          <label>时间</label>
          <input data-form-field="start" value="${escapeHtml(values.start || '')}" placeholder="完整世界时间；短日期会自动补全" />
        </div>
        <div class="th-form-field">
          <label>结束时间</label>
          <input data-form-field="end" value="${escapeHtml(values.end || '')}" placeholder="可留空" />
        </div>
        <div class="th-form-field">
          <label>重复规则</label>
          <select data-form-field="rule">
            ${['无', '每天', '每周', '每月', '每年', '仅工作日', '仅节假日']
              .map(
                rule =>
                  `<option value="${escapeHtml(rule)}" ${values.rule === rule ? 'selected' : rule === '无' && !values.rule ? 'selected' : ''}>${escapeHtml(rule)}</option>`,
              )
              .join('')}
          </select>
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
