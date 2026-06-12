import {
  readCalendarRuntimeIndexSourceEntry,
  type CalendarRuntimeIndexSourceCandidate,
  type CalendarRuntimeIndexSourceEntry,
} from '../runtime-worldbook';
import { parseFixedEventIndexDraft } from './parse';
import { serializeFixedEventIndexDraft } from './serialize';
import { validateFixedEventIndexDraft } from './validate';
import { BUNDLED_ICON_FILENAMES } from './draft-types';
import type {
  FixedEventBookDefaultsDraft,
  FixedEventDraft,
  FixedEventGroupDraft,
  FixedEventIndexDraft,
  FixedEventIndexRowIssue,
  FixedEventIndexValidationResult,
  FixedEventMaterialDraft,
  FixedEventMonthAliasDraft,
  FixedEventReminderDefaultsDraft,
  FixedEventStageDraft,
} from './draft-types';

export interface FixedEventIndexEditorPreviewModel {
  loading: boolean;
  source: CalendarRuntimeIndexSourceEntry | null;
  draft: FixedEventIndexDraft | null;
  yamlPreview: string;
  validation: FixedEventIndexValidationResult | null;
  errorMessage: string;
  saving?: boolean;
  saveMessage?: string;
  saveState?: 'success' | 'warning' | 'danger';
}

export type FixedEventIndexEditorSection = 'events' | 'materials' | 'settings' | 'yaml';

export type FixedEventIndexEditorDetailTab = 'basic' | 'intro' | 'stages' | 'reminder';

export interface FixedEventIndexEditorSelection {
  section: FixedEventIndexEditorSection;
  scope:
    | 'overview'
    | 'group'
    | 'event'
    | 'stage'
    | 'material'
    | 'defaults'
    | 'reminderDefaults'
    | 'bookDefaults'
    | 'monthAliases'
    | 'yaml';
  id?: string;
  eventId?: string;
  detailTab?: FixedEventIndexEditorDetailTab;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderList(items: string[], emptyText: string): string {
  if (items.length === 0) {
    return `<li class="th-index-editor-muted">${escapeHtml(emptyText)}</li>`;
  }
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderCandidate(candidate: CalendarRuntimeIndexSourceCandidate): string {
  return `<li>${escapeHtml(candidate.worldbookName)} / ${escapeHtml(candidate.entryName)}</li>`;
}

function renderSourceDetails(source: CalendarRuntimeIndexSourceEntry): string {
  return `
    <details class="th-index-editor-summary-details">
      <summary>来源</summary>
      <div class="th-index-editor-columns">
        <div>
          <strong>已读取世界书</strong>
          <ul>${renderList(source.sourceWorldbooks, '没有读取到世界书来源')}</ul>
        </div>
        <div>
          <strong>索引候选</strong>
          <ul>${source.candidates.length ? source.candidates.map(renderCandidate).join('') : '<li class="th-index-editor-muted">没有候选</li>'}</ul>
        </div>
      </div>
    </details>
  `;
}

function renderStatusPill(model: FixedEventIndexEditorPreviewModel): string {
  if (model.loading) {
    return '<span class="th-index-editor-summary-pill is-loading">读取中</span>';
  }
  if (model.errorMessage) {
    return `<span class="th-index-editor-summary-pill is-danger">${escapeHtml(model.errorMessage)}</span>`;
  }
  if (!model.source) {
    return '<span class="th-index-editor-summary-pill is-warning">未找到固定事件索引</span>';
  }
  const blocked = model.validation ? !model.validation.canSave : false;
  return `<span class="th-index-editor-summary-pill ${blocked ? 'is-danger' : 'is-success'}">${blocked ? '阻止保存' : '可保存'}</span>`;
}

function renderEditorSummary(model: FixedEventIndexEditorPreviewModel): string {
  const source = model.source;
  const draft = model.draft;
  const blockingCount = model.validation?.blockingIssues.length ?? 0;
  const warningCount = model.validation?.warnings.length ?? 0;
  const sourceHtml = source
    ? `
      <span class="th-index-editor-summary-item"><b>世界书</b>${escapeHtml(source.worldbookName)}</span>
      <span class="th-index-editor-summary-item"><b>条目</b>${escapeHtml(source.entryName)}</span>
      <span class="th-index-editor-summary-item"><b>候选</b>${source.candidates.length}</span>
    `
    : '<span class="th-index-editor-summary-item"><b>来源</b>未找到</span>';
  const draftHtml = draft
    ? `
      <span class="th-index-editor-summary-item"><b>事件</b>${draft.events.length}</span>
      <span class="th-index-editor-summary-item"><b>资料</b>${draft.materials.length}</span>
      <span class="th-index-editor-summary-item"><b>分组</b>${draft.groups.length}</span>
    `
    : '';
  const issueDetails =
    model.validation && (blockingCount || warningCount)
      ? `
        <details class="th-index-editor-summary-details">
          <summary>校验详情</summary>
          ${
            blockingCount
              ? `<div class="th-index-editor-issues is-danger"><strong>阻止保存</strong><ul>${renderList(model.validation.blockingIssues, '无')}</ul></div>`
              : ''
          }
          ${
            warningCount
              ? `<div class="th-index-editor-issues is-warning"><strong>提示</strong><ul>${renderList(model.validation.warnings, '无')}</ul></div>`
              : ''
          }
        </details>
      `
      : '';
  return `
    <section class="th-index-editor-summary-bar" data-role="fixed-event-editor-summary">
      <div class="th-index-editor-summary-line">
        ${renderStatusPill(model)}
        ${sourceHtml}
        ${draftHtml}
        <span class="th-index-editor-summary-item"><b>阻止</b>${blockingCount}</span>
        <span class="th-index-editor-summary-item"><b>提示</b>${warningCount}</span>
      </div>
      ${model.saveMessage ? `<div class="th-index-editor-summary-message ${model.saveState ? `is-${escapeHtml(model.saveState)}` : 'is-warning'}">${escapeHtml(model.saveMessage)}</div>` : ''}
      ${source ? renderSourceDetails(source) : ''}
      ${issueDetails}
    </section>
  `;
}

function renderInput(args: {
  scope: string;
  id: string;
  field: string;
  label: string;
  value: string | undefined;
  textarea?: boolean;
  fieldClassName?: string;
}): string {
  const value = escapeHtml(args.value ?? '');
  const attrs = `data-scope="${escapeHtml(args.scope)}" data-id="${escapeHtml(args.id)}" data-field="${escapeHtml(args.field)}"`;
  return `
    <label class="th-index-editor-field ${escapeHtml(args.fieldClassName ?? '')}">
      <span>${escapeHtml(args.label)}</span>
      ${
        args.textarea
          ? `<textarea ${attrs} spellcheck="false">${value}</textarea>`
          : `<input ${attrs} type="text" value="${value}">`
      }
    </label>
  `;
}

function renderSelect(args: {
  scope: string;
  id: string;
  field: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
}): string {
  const normalized = String(args.value ?? '').trim();
  const attrs = `data-scope="${escapeHtml(args.scope)}" data-id="${escapeHtml(args.id)}" data-field="${escapeHtml(args.field)}"`;
  const options = args.options.map(
    option =>
      `<option value="${escapeHtml(option.value)}" ${option.value === normalized ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
  );
  return `
    <label class="th-index-editor-field">
      <span>${escapeHtml(args.label)}</span>
      <select ${attrs}>${options.join('')}</select>
    </label>
  `;
}

function renderIconSelect(groupId: string, value: string | undefined): string {
  const normalized = String(value ?? '').trim();
  const options = ['', ...BUNDLED_ICON_FILENAMES].map(
    filename =>
      `<option value="${escapeHtml(filename)}" ${filename === normalized ? 'selected' : ''}>${escapeHtml(filename || '不指定')}</option>`,
  );
  return `
    <label class="th-index-editor-field">
      <span>图标</span>
      <select data-scope="group" data-id="${escapeHtml(groupId)}" data-field="iconSvgFilename">${options.join('')}</select>
    </label>
  `;
}

function renderCardMeta(items: string[]): string {
  const visibleItems = items.map(item => item.trim()).filter(Boolean);
  if (visibleItems.length === 0) {
    return '';
  }
  return `<div class="th-index-editor-card-meta">${visibleItems.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderEditCardHeader(args: { title: string; id: string; meta?: string[] }): string {
  return `
    <div class="th-index-editor-edit-card-head">
      <div class="th-index-editor-card-heading">
        <strong class="th-index-editor-card-title">${escapeHtml(args.title || args.id)}</strong>
        ${renderCardMeta([args.id, ...(args.meta ?? [])])}
      </div>
      <details class="th-index-editor-action-menu">
        <summary>更多操作</summary>
        <div class="th-index-editor-edit-card-actions">
          <button type="button" class="th-btn" data-action="rename-fixed-event-index-row-id">重命名 id</button>
          <button type="button" class="th-btn is-danger" data-action="remove-fixed-event-index-row">移除</button>
        </div>
      </details>
    </div>
  `;
}

function formatDateRange(start: string | undefined, end: string | undefined): string {
  const normalizedStart = start?.trim() || '?';
  const normalizedEnd = end?.trim() || '?';
  if (normalizedStart === normalizedEnd) {
    return normalizedStart;
  }
  return `${normalizedStart} → ${normalizedEnd}`;
}

function renderDatePill(start: string | undefined, end: string | undefined): string {
  return `<span class="th-index-editor-date-pill">${escapeHtml(formatDateRange(start, end))}</span>`;
}

function renderFieldSection(args: { title: string; role: string; content: string; compact?: boolean }): string {
  return `
    <div class="th-index-editor-field-section" data-role="${escapeHtml(args.role)}">
      <div class="th-index-editor-field-section-title">${escapeHtml(args.title)}</div>
      <div class="th-index-editor-edit-grid${args.compact ? ' is-compact' : ''}">
        ${args.content}
      </div>
    </div>
  `;
}

function renderAdvancedFieldSection(args: { title: string; role: string; content: string }): string {
  return `
    <details class="th-index-editor-advanced-fields" data-role="${escapeHtml(args.role)}">
      <summary>${escapeHtml(args.title)}</summary>
      <div class="th-index-editor-edit-grid">
        ${args.content}
      </div>
    </details>
  `;
}

export function getDefaultFixedEventIndexEditorSelection(
  draft: FixedEventIndexDraft | null,
): FixedEventIndexEditorSelection {
  if (draft) {
    return {
      section: 'events',
      scope: 'overview',
    };
  }
  return {
    section: 'yaml',
    scope: 'yaml',
  };
}

function normalizeFixedEventIndexEditorSelection(
  draft: FixedEventIndexDraft,
  selection: FixedEventIndexEditorSelection | null | undefined,
): FixedEventIndexEditorSelection {
  const fallback = getDefaultFixedEventIndexEditorSelection(draft);
  const current = selection ?? fallback;
  if (current.scope === 'overview') {
    return { section: current.section === 'materials' ? 'materials' : 'events', scope: 'overview' };
  }
  if (current.scope === 'event' && current.id && draft.events.some(event => event.id === current.id)) {
    return {
      ...current,
      section: 'events',
      detailTab: current.detailTab ?? 'basic',
    };
  }
  if (current.scope === 'stage' && current.id && current.eventId) {
    const event = draft.events.find(item => item.id === current.eventId);
    if (event?.stages.some(stage => stage.id === current.id)) {
      return { ...current, section: 'events' };
    }
  }
  if (current.scope === 'group' && current.id && draft.groups.some(group => group.id === current.id)) {
    return { ...current, section: 'events' };
  }
  if (current.scope === 'material' && current.id && draft.materials.some(material => material.id === current.id)) {
    return { ...current, section: 'materials' };
  }
  if (
    current.scope === 'defaults' ||
    current.scope === 'reminderDefaults' ||
    current.scope === 'bookDefaults' ||
    current.scope === 'monthAliases'
  ) {
    return { ...current, section: 'settings' };
  }
  if (current.scope === 'yaml') {
    return { section: 'yaml', scope: 'yaml' };
  }
  return fallback;
}

function isSelectionActive(
  selection: FixedEventIndexEditorSelection,
  scope: string,
  id?: string,
  detailTab?: string,
): boolean {
  if (selection.scope !== scope) {
    return false;
  }
  if (id !== undefined && selection.id !== id) {
    return false;
  }
  if (detailTab !== undefined && selection.detailTab !== detailTab) {
    return false;
  }
  return true;
}

function renderSelectionButton(args: {
  selection: FixedEventIndexEditorSelection;
  section: FixedEventIndexEditorSection;
  scope: FixedEventIndexEditorSelection['scope'];
  label: string;
  id?: string;
  eventId?: string;
  detailTab?: FixedEventIndexEditorDetailTab;
  className?: string;
  meta?: string;
  metaClassName?: string;
}): string {
  const active = isSelectionActive(args.selection, args.scope, args.id, args.detailTab);
  const attrs = renderSelectionAttrs({
    section: args.section,
    scope: args.scope,
    id: args.id,
    eventId: args.eventId,
    detailTab: args.detailTab,
  });
  return `
    <button type="button" class="th-index-editor-nav-item ${args.className ?? ''}${active ? ' is-active' : ''}" ${attrs}>
      <span>${escapeHtml(args.label)}</span>
      ${args.meta ? `<b class="${escapeHtml(args.metaClassName ?? '')}">${escapeHtml(args.meta)}</b>` : ''}
    </button>
  `;
}

function renderSelectionAttrs(selection: FixedEventIndexEditorSelection): string {
  return [
    `data-action="select-fixed-event-index-pane"`,
    `data-section="${escapeHtml(selection.section)}"`,
    `data-scope="${escapeHtml(selection.scope)}"`,
    selection.id ? `data-id="${escapeHtml(selection.id)}"` : '',
    selection.eventId ? `data-event-id="${escapeHtml(selection.eventId)}"` : '',
    selection.detailTab ? `data-detail-tab="${escapeHtml(selection.detailTab)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function getRowIssues(
  validation: FixedEventIndexValidationResult | null,
  scope: FixedEventIndexRowIssue['scope'],
  id: string,
): FixedEventIndexRowIssue[] {
  return (validation?.rowIssues ?? []).filter(issue => issue.scope === scope && issue.id === id);
}

function getRowIssueClass(issues: FixedEventIndexRowIssue[]): string {
  if (issues.some(issue => issue.severity === 'danger')) {
    return ' is-invalid';
  }
  return issues.length ? ' has-warning' : '';
}

function renderRowIssues(issues: FixedEventIndexRowIssue[]): string {
  if (issues.length === 0) {
    return '';
  }
  const dangerItems = issues.filter(issue => issue.severity === 'danger');
  const warningItems = issues.filter(issue => issue.severity === 'warning');
  const renderIssueGroup = (items: FixedEventIndexRowIssue[], severity: FixedEventIndexRowIssue['severity']) =>
    items.length
      ? `<div class="th-index-editor-row-issues is-${severity}" data-role="fixed-event-row-issues"><strong>${severity === 'danger' ? '阻止保存' : '提示'}</strong><ul>${renderList(
          items.map(issue => issue.message),
          '无',
        )}</ul></div>`
      : '';
  return `${renderIssueGroup(dangerItems, 'danger')}${renderIssueGroup(warningItems, 'warning')}`;
}

function renderGroupEditCard(group: FixedEventGroupDraft, validation: FixedEventIndexValidationResult | null): string {
  const issues = getRowIssues(validation, 'group', group.id);
  return `
    <div class="th-index-editor-edit-card${getRowIssueClass(issues)}" data-role="fixed-event-edit-row" data-scope="group" data-id="${escapeHtml(group.id)}">
      ${renderEditCardHeader({
        title: group.name || group.id,
        id: group.id,
        meta: [`${group.eventIds.length} 个固定事件`],
      })}
      ${renderFieldSection({
        title: '分组信息',
        role: 'fixed-event-group-core-fields',
        compact: true,
        content: `
          ${renderInput({ scope: 'group', id: group.id, field: 'name', label: '名称', value: group.name })}
          ${renderIconSelect(group.id, group.iconSvgFilename)}
        `,
      })}
      ${renderAdvancedFieldSection({
        title: `事件排序 · ${group.eventIds.length}`,
        role: 'fixed-event-group-members',
        content: renderInput({
          scope: 'group',
          id: group.id,
          field: 'eventIdsText',
          label: '事件',
          value: group.eventIds.join('\n'),
          textarea: true,
          fieldClassName: 'is-wide is-id-list',
        }),
      })}
      ${renderRowIssues(issues)}
    </div>
  `;
}

function renderDefaultsEditor(draft: FixedEventIndexDraft): string {
  return `
    <details open>
      <summary>默认设置</summary>
      <div class="th-index-editor-edit-card" data-role="fixed-event-defaults-row" data-scope="defaults" data-id="main">
        <div class="th-index-editor-edit-grid">
          ${renderInput({
            scope: 'defaults',
            id: 'main',
            field: 'mvuTimePath',
            label: 'MVU 时间路径',
            value: draft.defaults.mvuTimePath,
          })}
          ${renderInput({
            scope: 'defaults',
            id: 'main',
            field: 'mvuLocationPath',
            label: 'MVU 地点路径',
            value: draft.defaults.mvuLocationPath,
          })}
          ${renderInput({
            scope: 'defaults',
            id: 'main',
            field: 'fullBookTriggerTemplate',
            label: '书籍全文关键词模板',
            value: draft.defaults.fullBookTriggerTemplate,
          })}
        </div>
      </div>
    </details>
  `;
}

function renderReminderDefaultsEditor(defaults: FixedEventReminderDefaultsDraft): string {
  return `
    <details>
      <summary>提醒默认值</summary>
      <div class="th-index-editor-edit-card" data-role="fixed-event-reminder-defaults-row" data-scope="reminderDefaults" data-id="main">
        <div class="th-index-editor-edit-grid">
          ${renderSelect({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'outputMode',
            label: '注入方式',
            value: defaults.outputMode,
            options: [
              { value: 'silent_scan', label: '静默扫描' },
              { value: 'injectprompt', label: '注入提示词' },
            ],
          })}
          ${renderInput({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'injectDepth',
            label: '注入深度',
            value: defaults.injectDepth?.toString(),
          })}
          ${renderSelect({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'disableRecursive',
            label: '禁用递归',
            value: defaults.disableRecursive === undefined ? undefined : String(defaults.disableRecursive),
            options: [
              { value: 'true', label: '是' },
              { value: 'false', label: '否' },
            ],
          })}
          ${renderSelect({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'disableKeywords',
            label: '禁用触发词',
            value: defaults.disableKeywords === undefined ? undefined : String(defaults.disableKeywords),
            options: [
              { value: 'true', label: '是' },
              { value: 'false', label: '否' },
            ],
          })}
          ${renderInput({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'macroTemplate',
            label: '宏触发词模板',
            value: defaults.macroTemplate,
          })}
          ${renderInput({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'inactiveTemplate',
            label: '未开始模板',
            value: defaults.inactiveTemplate,
            textarea: true,
          })}
          ${renderInput({
            scope: 'reminderDefaults',
            id: 'main',
            field: 'activeTemplate',
            label: '进行中模板',
            value: defaults.activeTemplate,
            textarea: true,
          })}
        </div>
      </div>
    </details>
  `;
}

function renderBookDefaultsEditor(defaults: FixedEventBookDefaultsDraft): string {
  return `
    <details>
      <summary>书籍默认值</summary>
      <div class="th-index-editor-edit-card" data-role="fixed-event-book-defaults-row" data-scope="bookDefaults" data-id="main">
        <div class="th-index-editor-edit-grid">
          ${renderInput({
            scope: 'bookDefaults',
            id: 'main',
            field: 'summaryOutputMode',
            label: '摘要注入方式',
            value: defaults.summaryOutputMode,
          })}
          ${renderInput({
            scope: 'bookDefaults',
            id: 'main',
            field: 'summaryInjectDepth',
            label: '摘要注入深度',
            value: defaults.summaryInjectDepth?.toString(),
          })}
        </div>
      </div>
    </details>
  `;
}

function renderMonthAliasEditCard(alias: FixedEventMonthAliasDraft): string {
  const id = String(alias.month);
  return `
    <div class="th-index-editor-edit-card" data-role="fixed-event-month-alias-row" data-month="${escapeHtml(id)}">
      <div class="th-index-editor-edit-card-head">
        <strong>${escapeHtml(`${alias.month}月`)}</strong>
      </div>
      <div class="th-index-editor-edit-grid">
        ${renderInput({ scope: 'monthAlias', id, field: 'month', label: '月份', value: id })}
        ${renderInput({ scope: 'monthAlias', id, field: 'name', label: '名称', value: alias.name })}
        ${renderInput({ scope: 'monthAlias', id, field: 'season', label: '季节', value: alias.season })}
      </div>
    </div>
  `;
}

function renderMonthAliasesEditor(draft: FixedEventIndexDraft): string {
  const aliases = draft.monthAliases ?? [];
  return `
    <details>
      <summary>月份别名 · ${aliases.length}</summary>
      <div class="th-index-editor-edit-list">
        ${aliases.length ? aliases.map(renderMonthAliasEditCard).join('') : '<div class="th-index-editor-muted">没有月份别名</div>'}
      </div>
    </details>
  `;
}

function renderEventDetailTabs(event: FixedEventDraft, activeTab: FixedEventIndexEditorDetailTab): string {
  const tabs: { tab: FixedEventIndexEditorDetailTab; label: string }[] = [
    { tab: 'basic', label: '基础' },
    { tab: 'intro', label: '介绍' },
    { tab: 'stages', label: `阶段 · ${(event.stages ?? []).length}` },
    { tab: 'reminder', label: '提醒' },
  ];
  return `
    <div class="th-index-editor-detail-tabs">
      ${tabs
        .map(tab =>
          renderSelectionButton({
            selection: { section: 'events', scope: 'event', id: event.id, detailTab: activeTab },
            section: 'events',
            scope: 'event',
            id: event.id,
            detailTab: tab.tab,
            label: tab.label,
            className: 'is-tab',
          }),
        )
        .join('')}
    </div>
  `;
}

function renderEventStageList(event: FixedEventDraft): string {
  const stages = event.stages ?? [];
  return `
    <div class="th-index-editor-stage-folder th-index-editor-stage-module" data-role="fixed-event-stage-module">
      <div class="th-index-editor-stage-toolbar">
        <button type="button" class="th-btn" data-action="add-fixed-event-index-stage" data-event-id="${escapeHtml(event.id)}">新增阶段</button>
      </div>
      <div class="th-index-editor-stage-list">
        ${
          stages.length
            ? stages
                .map(
                  (stage, index) => `
                    <div class="th-index-editor-stage-list-row" data-role="fixed-event-stage-list-row" data-event-id="${escapeHtml(event.id)}" data-id="${escapeHtml(stage.id)}">
                      <button type="button" class="th-index-editor-nav-item is-stage-file" data-action="select-fixed-event-index-pane" data-section="events" data-scope="stage" data-event-id="${escapeHtml(event.id)}" data-id="${escapeHtml(stage.id)}">
                        <span>${escapeHtml(stage.name || stage.id)}</span>
                        <b>${escapeHtml(`${stage.start || '?'} ~ ${stage.end || '?'}`)}</b>
                      </button>
                      <div class="th-index-editor-stage-actions">
                        <button type="button" class="th-btn" data-action="move-fixed-event-index-stage-up" ${index <= 0 ? 'disabled' : ''}>上移</button>
                        <button type="button" class="th-btn" data-action="move-fixed-event-index-stage-down" ${index >= stages.length - 1 ? 'disabled' : ''}>下移</button>
                        <button type="button" class="th-btn is-danger" data-action="remove-fixed-event-index-stage">移除阶段</button>
                      </div>
                    </div>
                  `,
                )
                .join('')
            : '<div class="th-index-editor-empty">这个固定事件还没有阶段</div>'
        }
      </div>
    </div>
  `;
}

function renderEventBasicFields(event: FixedEventDraft): string {
  const recurrenceVisible = Boolean(event.recurrence?.intervalYears || event.recurrence?.lastYear);
  return `
    <div class="th-index-editor-field-section" data-role="fixed-event-core-fields">
      <div class="th-index-editor-field-section-title">基础信息</div>
      <div class="th-index-editor-form-stack">
        <div class="th-index-editor-form-row">
          ${renderInput({ scope: 'event', id: event.id, field: 'name', label: '名称', value: event.name })}
          ${renderInput({ scope: 'event', id: event.id, field: 'groupId', label: '分组', value: event.groupId })}
        </div>
        <div class="th-index-editor-form-row is-date-range" data-role="fixed-event-date-range-fields">
          ${renderInput({ scope: 'event', id: event.id, field: 'start', label: '开始', value: event.start })}
          ${renderInput({ scope: 'event', id: event.id, field: 'end', label: '结束', value: event.end })}
        </div>
        <div class="th-index-editor-form-row is-recurrence" data-role="fixed-event-recurrence-fields">
          ${renderInput({
            scope: 'event',
            id: event.id,
            field: 'recurrenceIntervalYears',
            label: '周期每隔年（可选）',
            value: event.recurrence?.intervalYears?.toString(),
          })}
          <div class="th-index-editor-conditional-field${recurrenceVisible ? '' : ' is-hidden'}" data-role="fixed-event-recurrence-last-year-field">
            ${renderInput({
              scope: 'event',
              id: event.id,
              field: 'recurrenceLastYear',
              label: '周期上次年份',
              value: event.recurrence?.lastYear?.toString(),
            })}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEventEditCard(
  event: FixedEventDraft,
  validation: FixedEventIndexValidationResult | null,
  detailTab: FixedEventIndexEditorDetailTab,
): string {
  const issues = getRowIssues(validation, 'event', event.id);
  const content =
    detailTab === 'basic'
      ? renderEventBasicFields(event)
      : detailTab === 'intro'
        ? renderFieldSection({
            title: '介绍与资料',
            role: 'fixed-event-intro-fields',
            content: `
              ${renderInput({
                scope: 'event',
                id: event.id,
                field: 'locationKeywordsText',
                label: '地点关键词',
                value: event.locationKeywords.join('\n'),
                textarea: true,
              })}
              ${renderInput({
                scope: 'event',
                id: event.id,
                field: 'introEntryName',
                label: '介绍条目名',
                value: event.intro.entryName,
              })}
              ${renderInput({
                scope: 'event',
                id: event.id,
                field: 'introSummaryText',
                label: '简介',
                value: event.intro.summaryText,
                textarea: true,
              })}
              ${renderInput({
                scope: 'event',
                id: event.id,
                field: 'relatedMaterialIdsText',
                label: '相关资料',
                value: event.relatedMaterialIds.join('\n'),
                textarea: true,
              })}
            `,
          })
        : detailTab === 'stages'
          ? renderEventStageList(event)
          : renderFieldSection({
              title: '提醒与注入',
              role: 'fixed-event-reminder-fields',
              content: `
                ${renderSelect({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderEnabled',
                  label: '提醒启用',
                  value: event.reminder.enabled ? 'true' : 'false',
                  options: [
                    { value: 'true', label: '开启' },
                    { value: 'false', label: '关闭' },
                  ],
                })}
                ${renderInput({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderPrepareDays',
                  label: '开始前提醒天数',
                  value: event.reminder.prepareDays?.toString(),
                })}
                ${renderSelect({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderOutputMode',
                  label: '注入方式',
                  value: event.reminder.outputMode,
                  options: [
                    { value: 'silent_scan', label: '静默扫描' },
                    { value: 'injectprompt', label: '注入提示词' },
                  ],
                })}
                ${renderInput({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderInjectDepth',
                  label: '注入深度',
                  value: event.reminder.injectDepth?.toString(),
                })}
                ${renderInput({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderMacroToken',
                  label: '宏触发词',
                  value: event.reminder.macroToken,
                })}
                ${renderInput({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderInactiveText',
                  label: '未开始提醒',
                  value: event.reminder.inactiveText === false ? '' : event.reminder.inactiveText,
                  textarea: true,
                })}
                ${renderInput({
                  scope: 'event',
                  id: event.id,
                  field: 'reminderActiveText',
                  label: '进行中提醒',
                  value: event.reminder.activeText === false ? '' : event.reminder.activeText,
                  textarea: true,
                })}
              `,
            });
  return `
    <div class="th-index-editor-edit-card${getRowIssueClass(issues)}" data-role="fixed-event-edit-row" data-scope="event" data-id="${escapeHtml(event.id)}">
      ${renderEditCardHeader({
        title: event.name || event.id,
        id: event.id,
        meta: [event.groupId ? `分组 ${event.groupId}` : ''],
      })}
      <div class="th-index-editor-event-meta-strip">
        ${renderDatePill(event.start, event.end)}
      </div>
      ${renderEventDetailTabs(event, detailTab)}
      ${renderRowIssues(issues)}
      ${content}
    </div>
  `;
}

function renderStageEditCard(eventId: string, stage: FixedEventStageDraft, index: number, total: number): string {
  const attrs = `data-scope="stage" data-event-id="${escapeHtml(eventId)}" data-id="${escapeHtml(stage.id)}"`;
  return `
    <div class="th-index-editor-stage-card" data-role="fixed-event-stage-row" data-event-id="${escapeHtml(eventId)}" data-id="${escapeHtml(stage.id)}">
      <div class="th-index-editor-stage-head">
        <div class="th-index-editor-card-heading">
          <strong class="th-index-editor-card-title">${escapeHtml(stage.name || stage.id)}</strong>
          ${renderCardMeta([stage.id, stage.start || stage.end ? `${stage.start || '?'} ~ ${stage.end || '?'}` : ''])}
        </div>
        <div class="th-index-editor-stage-actions">
          <button type="button" class="th-btn" data-action="move-fixed-event-index-stage-up" ${index <= 0 ? 'disabled' : ''}>上移</button>
          <button type="button" class="th-btn" data-action="move-fixed-event-index-stage-down" ${index >= total - 1 ? 'disabled' : ''}>下移</button>
          <button type="button" class="th-btn is-danger" data-action="remove-fixed-event-index-stage">移除阶段</button>
        </div>
      </div>
      ${renderFieldSection({
        title: '阶段信息',
        role: 'fixed-event-stage-core-fields',
        compact: true,
        content: `
          <label class="th-index-editor-field">
            <span>阶段 id</span>
            <input ${attrs} data-field="stageId" type="text" value="${escapeHtml(stage.id)}">
          </label>
          ${renderInput({ scope: 'stage', id: stage.id, field: 'name', label: '名称', value: stage.name }).replace(
            `data-scope="stage" data-id="${escapeHtml(stage.id)}"`,
            attrs,
          )}
          ${renderInput({ scope: 'stage', id: stage.id, field: 'start', label: '开始', value: stage.start }).replace(
            `data-scope="stage" data-id="${escapeHtml(stage.id)}"`,
            attrs,
          )}
          ${renderInput({ scope: 'stage', id: stage.id, field: 'end', label: '结束', value: stage.end }).replace(
            `data-scope="stage" data-id="${escapeHtml(stage.id)}"`,
            attrs,
          )}
        `,
      })}
      ${renderAdvancedFieldSection({
        title: '阶段提醒',
        role: 'fixed-event-stage-reminder-fields',
        content: `
          ${renderSelect({
            scope: 'stage',
            id: stage.id,
            field: 'reminderEnabled',
            label: '提醒启用',
            value: stage.reminder.enabled ? 'true' : 'false',
            options: [
              { value: 'true', label: '开启' },
              { value: 'false', label: '关闭' },
            ],
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderInput({
            scope: 'stage',
            id: stage.id,
            field: 'reminderPrepareDays',
            label: '开始前提醒天数',
            value: stage.reminder.prepareDays?.toString(),
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderSelect({
            scope: 'stage',
            id: stage.id,
            field: 'reminderOutputMode',
            label: '注入方式',
            value: stage.reminder.outputMode,
            options: [
              { value: 'silent_scan', label: '静默扫描' },
              { value: 'injectprompt', label: '注入提示词' },
            ],
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderInput({
            scope: 'stage',
            id: stage.id,
            field: 'reminderInjectDepth',
            label: '注入深度',
            value: stage.reminder.injectDepth?.toString(),
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderInput({
            scope: 'stage',
            id: stage.id,
            field: 'reminderMacroToken',
            label: '宏触发词',
            value: stage.reminder.macroToken,
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderInput({
            scope: 'stage',
            id: stage.id,
            field: 'reminderInactiveText',
            label: '未开始提醒',
            value: stage.reminder.inactiveText === false ? '' : stage.reminder.inactiveText,
            textarea: true,
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
          ${renderInput({
            scope: 'stage',
            id: stage.id,
            field: 'reminderActiveText',
            label: '进行中提醒',
            value: stage.reminder.activeText === false ? '' : stage.reminder.activeText,
            textarea: true,
          }).replace(`data-scope="stage" data-id="${escapeHtml(stage.id)}"`, attrs)}
        `,
      })}
    </div>
  `;
}

function collectGroupEvents(
  group: FixedEventGroupDraft,
  events: FixedEventDraft[],
  assignedEventIds: Set<string>,
): FixedEventDraft[] {
  const eventsById = new Map(events.map(event => [event.id, event]));
  const groupEvents: FixedEventDraft[] = [];

  group.eventIds.forEach(eventId => {
    const event = eventsById.get(eventId);
    if (event && !assignedEventIds.has(event.id)) {
      groupEvents.push(event);
      assignedEventIds.add(event.id);
    }
  });

  events.forEach(event => {
    if (event.groupId === group.id && !assignedEventIds.has(event.id)) {
      groupEvents.push(event);
      assignedEventIds.add(event.id);
    }
  });

  return groupEvents;
}

function isGroupExpanded(
  group: FixedEventGroupDraft,
  events: FixedEventDraft[],
  selection: FixedEventIndexEditorSelection,
): boolean {
  if (selection.scope === 'group' && selection.id === group.id) {
    return true;
  }
  if (selection.scope === 'event' && events.some(event => event.id === selection.id)) {
    return true;
  }
  if (selection.scope === 'stage' && events.some(event => event.id === selection.eventId)) {
    return true;
  }
  return false;
}

function renderEditorNav(draft: FixedEventIndexDraft, selection: FixedEventIndexEditorSelection): string {
  const assignedEventIds = new Set<string>();
  const groupedEvents = draft.groups
    .map(group => ({
      group,
      events: collectGroupEvents(group, draft.events, assignedEventIds),
    }))
    .map(({ group, events }) => {
      const expanded = isGroupExpanded(group, events, selection);
      return `
        <div class="th-index-editor-nav-folder" data-role="fixed-event-group-folder" data-group-id="${escapeHtml(group.id)}" data-expanded="${expanded ? 'true' : 'false'}">
          ${renderSelectionButton({
            selection,
            section: 'events',
            scope: 'group',
            id: group.id,
            label: group.name || group.id,
            meta: `${events.length}`,
            className: 'is-folder',
          })}
          ${
            expanded
              ? `<div class="th-index-editor-nav-children">
                  ${events
                    .map(event =>
                      renderSelectionButton({
                        selection,
                        section: 'events',
                        scope: 'event',
                        id: event.id,
                        detailTab:
                          selection.scope === 'event' && selection.id === event.id ? selection.detailTab : 'basic',
                        label: event.name || event.id,
                        meta: formatDateRange(event.start, event.end),
                        metaClassName: 'th-index-editor-date-pill',
                        className: 'is-file',
                      }),
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>
      `;
    })
    .join('');
  const ungroupedEvents = draft.events.filter(event => !assignedEventIds.has(event.id));
  const ungroupedExpanded =
    selection.scope === 'overview'
      ? false
      : ungroupedEvents.some(event => event.id === selection.id || event.id === selection.eventId);
  const ungroupedHtml = ungroupedEvents.length
    ? `
      <div class="th-index-editor-nav-folder" data-role="fixed-event-ungrouped-folder" data-expanded="${ungroupedExpanded ? 'true' : 'false'}">
        ${renderSelectionButton({
          selection,
          section: 'events',
          scope: 'overview',
          label: '未分组',
          meta: `${ungroupedEvents.length}`,
          className: 'is-folder',
        })}
        ${
          ungroupedExpanded
            ? `<div class="th-index-editor-nav-children">
                ${ungroupedEvents
                  .map(event =>
                    renderSelectionButton({
                      selection,
                      section: 'events',
                      scope: 'event',
                      id: event.id,
                      detailTab:
                        selection.scope === 'event' && selection.id === event.id ? selection.detailTab : 'basic',
                      label: event.name || event.id,
                      meta: formatDateRange(event.start, event.end),
                      metaClassName: 'th-index-editor-date-pill',
                      className: 'is-file',
                    }),
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    `
    : '';
  return `
    <aside class="th-index-editor-nav" data-role="fixed-event-editor-nav">
      <div class="th-index-editor-nav-section">
        <div class="th-index-editor-nav-title">事件</div>
        <div class="th-index-editor-nav-actions">
          <button type="button" class="th-btn" data-action="add-fixed-event-index-group">新增分组</button>
          <button type="button" class="th-btn" data-action="add-fixed-event-index-event">新增事件</button>
        </div>
        ${groupedEvents || '<div class="th-index-editor-empty">没有分组</div>'}
        ${ungroupedHtml}
      </div>
      <div class="th-index-editor-nav-section">
        <div class="th-index-editor-nav-title">资料</div>
        <div class="th-index-editor-nav-actions">
          <button type="button" class="th-btn" data-action="add-fixed-event-index-material">新增资料</button>
        </div>
        ${
          draft.materials
            .map(material =>
              renderSelectionButton({
                selection,
                section: 'materials',
                scope: 'material',
                id: material.id,
                label: material.title || material.id,
                meta: `${material.eventIds.length}`,
                className: 'is-file',
              }),
            )
            .join('') || '<div class="th-index-editor-empty">没有补充资料</div>'
        }
      </div>
      <div class="th-index-editor-nav-section">
        <div class="th-index-editor-nav-title">设置</div>
        ${renderSelectionButton({ selection, section: 'settings', scope: 'defaults', label: '默认设置', className: 'is-file' })}
        ${renderSelectionButton({ selection, section: 'settings', scope: 'reminderDefaults', label: '提醒默认值', className: 'is-file' })}
        ${renderSelectionButton({ selection, section: 'settings', scope: 'bookDefaults', label: '书籍默认值', className: 'is-file' })}
        ${renderSelectionButton({
          selection,
          section: 'settings',
          scope: 'monthAliases',
          label: '月份别名',
          meta: `${draft.monthAliases.length}`,
          className: 'is-file',
        })}
      </div>
      <div class="th-index-editor-nav-section">
        ${renderSelectionButton({ selection, section: 'yaml', scope: 'yaml', label: 'YAML 预览', className: 'is-file' })}
      </div>
    </aside>
  `;
}

function renderMaterialEditCard(
  material: FixedEventMaterialDraft,
  validation: FixedEventIndexValidationResult | null,
): string {
  const issues = getRowIssues(validation, 'material', material.id);
  return `
    <div class="th-index-editor-edit-card${getRowIssueClass(issues)}" data-role="fixed-event-edit-row" data-scope="material" data-id="${escapeHtml(material.id)}">
      ${renderEditCardHeader({
        title: material.title || material.id,
        id: material.id,
        meta: [`${material.eventIds.length} 个关联事件`],
      })}
      ${renderFieldSection({
        title: '资料信息',
        role: 'fixed-event-material-core-fields',
        content: `
          ${renderInput({ scope: 'material', id: material.id, field: 'title', label: '书名', value: material.title })}
          ${renderInput({
            scope: 'material',
            id: material.id,
            field: 'eventIdsText',
            label: '关联事件',
            value: material.eventIds.join('\n'),
            textarea: true,
          })}
          ${renderInput({
            scope: 'material',
            id: material.id,
            field: 'summaryText',
            label: '摘要',
            value: material.summaryText,
            textarea: true,
          })}
          ${renderInput({
            scope: 'material',
            id: material.id,
            field: 'fullTextWorldbookName',
            label: '全文世界书',
            value: material.fullTextWorldbookName,
          })}
          ${renderInput({
            scope: 'material',
            id: material.id,
            field: 'fullTextEntryName',
            label: '全文条目名',
            value: material.fullTextEntryName,
          })}
        `,
      })}
      ${renderRowIssues(issues)}
    </div>
  `;
}

function renderStageDetail(draft: FixedEventIndexDraft, selection: FixedEventIndexEditorSelection): string {
  const event = draft.events.find(item => item.id === selection.eventId);
  const stages = event?.stages ?? [];
  const stageIndex = stages.findIndex(stage => stage.id === selection.id);
  const stage = stageIndex >= 0 ? stages[stageIndex] : undefined;
  if (!event || !stage) {
    return '<div class="th-index-editor-empty">找不到这个阶段</div>';
  }
  return renderStageEditCard(event.id, stage, stageIndex, stages.length);
}

function renderSettingsDetail(draft: FixedEventIndexDraft, selection: FixedEventIndexEditorSelection): string {
  if (selection.scope === 'reminderDefaults') {
    return renderReminderDefaultsEditor(draft.reminderDefaults);
  }
  if (selection.scope === 'bookDefaults') {
    return renderBookDefaultsEditor(draft.bookDefaults);
  }
  if (selection.scope === 'monthAliases') {
    return renderMonthAliasesEditor(draft);
  }
  return renderDefaultsEditor(draft);
}

function getMobileEditorView(selection: FixedEventIndexEditorSelection): 'nav' | 'detail' {
  return selection.scope === 'overview' || selection.scope === 'group' ? 'nav' : 'detail';
}

function getSelectionTitle(draft: FixedEventIndexDraft, selection: FixedEventIndexEditorSelection): string {
  if (selection.scope === 'event' && selection.id) {
    const event = draft.events.find(item => item.id === selection.id);
    return event?.name || selection.id;
  }
  if (selection.scope === 'stage' && selection.id) {
    const stage = draft.events
      .find(event => event.id === selection.eventId)
      ?.stages.find(item => item.id === selection.id);
    return stage?.name || selection.id;
  }
  if (selection.scope === 'material' && selection.id) {
    const material = draft.materials.find(item => item.id === selection.id);
    return material?.title || selection.id;
  }
  if (selection.scope === 'defaults') {
    return '默认设置';
  }
  if (selection.scope === 'reminderDefaults') {
    return '提醒默认值';
  }
  if (selection.scope === 'bookDefaults') {
    return '书籍默认值';
  }
  if (selection.scope === 'monthAliases') {
    return '月份别名';
  }
  if (selection.scope === 'yaml') {
    return 'YAML';
  }
  return '编辑';
}

function getMobileBackSelection(
  draft: FixedEventIndexDraft,
  selection: FixedEventIndexEditorSelection,
): FixedEventIndexEditorSelection {
  if (selection.scope === 'stage' && selection.eventId) {
    return {
      section: 'events',
      scope: 'event',
      id: selection.eventId,
      detailTab: 'stages',
    };
  }
  if (selection.scope === 'event' && selection.id) {
    const event = draft.events.find(item => item.id === selection.id);
    if (event?.groupId && draft.groups.some(group => group.id === event.groupId)) {
      return {
        section: 'events',
        scope: 'group',
        id: event.groupId,
      };
    }
  }
  return {
    section: selection.section === 'materials' ? 'materials' : 'events',
    scope: 'overview',
  };
}

function renderMobileDetailBar(draft: FixedEventIndexDraft, selection: FixedEventIndexEditorSelection): string {
  if (getMobileEditorView(selection) !== 'detail') {
    return '';
  }
  return `
    <div class="th-index-editor-mobile-detail-bar" data-role="fixed-event-editor-mobile-detail-bar">
      <button type="button" class="th-btn" ${renderSelectionAttrs(getMobileBackSelection(draft, selection))}>返回</button>
      <strong>${escapeHtml(getSelectionTitle(draft, selection))}</strong>
    </div>
  `;
}

function renderEditorDetail(
  draft: FixedEventIndexDraft,
  validation: FixedEventIndexValidationResult | null,
  selection: FixedEventIndexEditorSelection,
  yamlPreview: string,
): string {
  let content = '';
  if (selection.scope === 'overview') {
    content = renderEditorOverview(draft);
  } else if (selection.scope === 'group' && selection.id) {
    const group = draft.groups.find(item => item.id === selection.id);
    content = group
      ? renderGroupEditCard(group, validation)
      : '<div class="th-index-editor-empty">找不到这个分组</div>';
  } else if (selection.scope === 'event' && selection.id) {
    const event = draft.events.find(item => item.id === selection.id);
    content = event
      ? renderEventEditCard(event, validation, selection.detailTab ?? 'basic')
      : '<div class="th-index-editor-empty">找不到这个固定事件</div>';
  } else if (selection.scope === 'stage') {
    content = renderStageDetail(draft, selection);
  } else if (selection.scope === 'material' && selection.id) {
    const material = draft.materials.find(item => item.id === selection.id);
    content = material
      ? renderMaterialEditCard(material, validation)
      : '<div class="th-index-editor-empty">找不到这个补充资料</div>';
  } else if (selection.section === 'settings') {
    content = renderSettingsDetail(draft, selection);
  } else if (selection.scope === 'yaml') {
    content = renderYamlPreview(yamlPreview);
  } else {
    content = '<div class="th-index-editor-empty">请选择左侧项目</div>';
  }
  return `
    <main class="th-index-editor-detail" data-role="fixed-event-editor-detail">
      ${renderMobileDetailBar(draft, selection)}
      ${content}
    </main>
  `;
}

function renderEditorOverview(draft: FixedEventIndexDraft): string {
  return `
    <section class="th-index-editor-overview" data-role="fixed-event-editor-overview">
      <div class="th-index-editor-overview-title">选择项目</div>
      <div class="th-index-editor-overview-grid">
        <span><b>${draft.groups.length}</b> 个分组</span>
        <span><b>${draft.events.length}</b> 个事件</span>
        <span><b>${draft.materials.length}</b> 份资料</span>
      </div>
    </section>
  `;
}

function renderStructuredEditor(
  draft: FixedEventIndexDraft | null,
  validation: FixedEventIndexValidationResult | null,
  selection: FixedEventIndexEditorSelection | null | undefined,
  yamlPreview: string,
): string {
  if (!draft) {
    return '';
  }
  const normalizedSelection = normalizeFixedEventIndexEditorSelection(draft, selection);
  return `
    <div class="th-index-editor-scroll-root" data-role="fixed-event-editor-scroll-root">
      <section class="th-index-editor-section th-index-editor-structured-editor" data-role="fixed-event-structured-editor">
        <div class="th-index-editor-workspace" data-role="fixed-event-editor-workspace" data-mobile-view="${getMobileEditorView(normalizedSelection)}">
          ${renderEditorNav(draft, normalizedSelection)}
          ${renderEditorDetail(draft, validation, normalizedSelection, yamlPreview)}
        </div>
      </section>
    </div>
  `;
}

function renderYamlPreview(yamlPreview: string): string {
  const content = yamlPreview.trim() ? escapeHtml(yamlPreview) : '（没有可预览的 YAML）';
  return `
    <section class="th-index-editor-section">
      <h3>YAML 预览</h3>
      <textarea class="th-index-editor-yaml" data-role="fixed-event-index-yaml" spellcheck="false">${content}</textarea>
    </section>
  `;
}

export async function loadFixedEventIndexEditorPreview(): Promise<FixedEventIndexEditorPreviewModel> {
  try {
    const source = await readCalendarRuntimeIndexSourceEntry();
    if (!source) {
      return {
        loading: false,
        source: null,
        draft: null,
        yamlPreview: '',
        validation: null,
        errorMessage: '',
      };
    }
    const draft = parseFixedEventIndexDraft(source.content, {
      entryName: source.entryName,
      worldbookName: source.worldbookName,
    });
    const validation = validateFixedEventIndexDraft(draft);
    return {
      loading: false,
      source,
      draft,
      yamlPreview: serializeFixedEventIndexDraft(draft),
      validation,
      errorMessage: '',
    };
  } catch (error) {
    return {
      loading: false,
      source: null,
      draft: null,
      yamlPreview: '',
      validation: null,
      errorMessage: `读取固定事件索引失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function renderFixedEventIndexEditorPreview(
  model: FixedEventIndexEditorPreviewModel,
  selection?: FixedEventIndexEditorSelection | null,
): string {
  const canSave = Boolean(model.source && !model.saving);
  return `
    <div class="th-managed-worldbook-dialog-backdrop" data-action="close-fixed-event-index-editor"></div>
    <section class="th-managed-worldbook-dialog th-index-editor-dialog" role="dialog" aria-modal="true" aria-label="固定事件索引">
      <div class="th-managed-worldbook-dialog-head">
        <div class="th-managed-worldbook-dialog-title">固定事件索引</div>
      </div>
      ${renderEditorSummary(model)}
      ${renderStructuredEditor(model.draft, model.validation, selection, model.yamlPreview)}
      <div class="th-managed-worldbook-dialog-actions th-index-editor-footer-actions" data-role="fixed-event-editor-footer-actions">
        <button type="button" class="th-btn" data-action="reload-fixed-event-index-editor">重新读取</button>
        <button type="button" class="th-btn th-primary-btn" data-action="save-fixed-event-index-editor" ${canSave ? '' : 'disabled'} title="${canSave ? '保存到当前来源条目' : '当前结构不可保存'}">${model.saving ? '保存中…' : '保存到世界书'}</button>
        <button type="button" class="th-btn" data-action="close-fixed-event-index-editor">关闭</button>
      </div>
    </section>
  `;
}
