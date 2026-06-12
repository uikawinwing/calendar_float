import {
  BUNDLED_ICON_FILENAMES,
  type FixedEventIndexDraft,
  type FixedEventIndexRowIssue,
  type FixedEventIndexValidationResult,
} from './draft-types';

const BUNDLED_ICON_FILENAME_SET = new Set<string>(BUNDLED_ICON_FILENAMES);

function isValidMonthDay(value: string): boolean {
  if (!/^\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [monthText, dayText] = value.split('-');
  const month = Number(monthText);
  const day = Number(dayText);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach(value => {
    if (!value) {
      return;
    }
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }
    seen.add(value);
  });
  return [...duplicates];
}

export function validateFixedEventIndexDraft(draft: FixedEventIndexDraft): FixedEventIndexValidationResult {
  const blockingIssues: string[] = [];
  const warnings = [...draft.warnings];
  const rowIssues: FixedEventIndexRowIssue[] = [];
  const groupIds = draft.groups.map(group => group.id).filter(Boolean);
  const eventIds = draft.events.map(event => event.id).filter(Boolean);
  const materialIds = draft.materials.map(material => material.id).filter(Boolean);

  const addRowIssue = (
    scope: FixedEventIndexRowIssue['scope'],
    id: string,
    severity: FixedEventIndexRowIssue['severity'],
    message: string,
  ) => {
    rowIssues.push({ scope, id, severity, message });
  };

  if (!draft.entryName) {
    blockingIssues.push('索引条目名为空，无法保存');
  }
  if (!draft.worldbookName) {
    blockingIssues.push('来源世界书为空，无法保存');
  }

  findDuplicates(groupIds).forEach(id => {
    const message = `固定事件分组 id 重复：${id}`;
    blockingIssues.push(message);
    addRowIssue('group', id, 'danger', message);
  });
  findDuplicates(eventIds).forEach(id => {
    const message = `固定事件 id 重复：${id}`;
    blockingIssues.push(message);
    addRowIssue('event', id, 'danger', message);
  });
  findDuplicates(materialIds).forEach(id => {
    const message = `补充资料 id 重复：${id}`;
    blockingIssues.push(message);
    addRowIssue('material', id, 'danger', message);
  });

  draft.groups.forEach(group => {
    if (!group.id) {
      const message = `固定事件分组「${group.name || '未命名'}」缺少 id`;
      blockingIssues.push(message);
      addRowIssue('group', group.id, 'danger', message);
    }
    if (!group.name) {
      const message = `固定事件分组「${group.id || '未命名'}」缺少名称`;
      blockingIssues.push(message);
      addRowIssue('group', group.id, 'danger', message);
    }
    if (group.iconSvgFilename && !BUNDLED_ICON_FILENAME_SET.has(group.iconSvgFilename)) {
      const message = `固定事件分组「${group.name || group.id}」图标不是内置 SVG 文件名：${group.iconSvgFilename}`;
      blockingIssues.push(message);
      addRowIssue('group', group.id, 'danger', message);
    }
    group.eventIds.forEach(eventId => {
      if (!eventIds.includes(eventId)) {
        const message = `固定事件分组「${group.name || group.id}」包含不存在的固定事件 id：${eventId}`;
        warnings.push(message);
        addRowIssue('group', group.id, 'warning', message);
      }
    });
  });

  draft.events.forEach(event => {
    if (!event.id) {
      const message = `固定事件「${event.name || '未命名'}」缺少 id`;
      blockingIssues.push(message);
      addRowIssue('event', event.id, 'danger', message);
    }
    if (!event.name) {
      const message = `固定事件「${event.id || '未命名'}」缺少名称`;
      blockingIssues.push(message);
      addRowIssue('event', event.id, 'danger', message);
    }
    if (!isValidMonthDay(event.start)) {
      const message = `固定事件「${event.name || event.id}」开始日期不是 MM-DD：${event.start || '空'}`;
      blockingIssues.push(message);
      addRowIssue('event', event.id, 'danger', message);
    }
    if (!isValidMonthDay(event.end)) {
      const message = `固定事件「${event.name || event.id}」结束日期不是 MM-DD：${event.end || '空'}`;
      blockingIssues.push(message);
      addRowIssue('event', event.id, 'danger', message);
    }
    if (event.groupId && !groupIds.includes(event.groupId)) {
      const message = `固定事件「${event.name || event.id}」关联了不存在的分组 id：${event.groupId}`;
      warnings.push(message);
      addRowIssue('event', event.id, 'warning', message);
    }
    event.relatedMaterialIds.forEach(materialId => {
      if (!materialIds.includes(materialId)) {
        const message = `固定事件「${event.name || event.id}」关联了不存在的补充资料 id：${materialId}`;
        warnings.push(message);
        addRowIssue('event', event.id, 'warning', message);
      }
    });
    if (event.hasUnsupportedAdvancedLogic || event.intro.hasUnsupportedAdvancedLogic || event.reminder.hasUnsupportedAdvancedLogic) {
      const message = `固定事件「${event.name || event.id}」包含完整逻辑，第一版编辑器不能安全保存`;
      blockingIssues.push(message);
      addRowIssue('event', event.id, 'danger', message);
    }
  });

  draft.materials.forEach(material => {
    if (!material.id) {
      const message = `补充资料「${material.title || '未命名'}」缺少 id`;
      blockingIssues.push(message);
      addRowIssue('material', material.id, 'danger', message);
    }
    if (!material.title) {
      const message = `补充资料「${material.id || '未命名'}」缺少标题`;
      blockingIssues.push(message);
      addRowIssue('material', material.id, 'danger', message);
    }
    if (material.hasUnsupportedAdvancedLogic) {
      const message = `补充资料「${material.title || material.id}」包含完整逻辑，第一版编辑器不能安全保存`;
      blockingIssues.push(message);
      addRowIssue('material', material.id, 'danger', message);
    }
    material.eventIds.forEach(eventId => {
      if (!eventIds.includes(eventId)) {
        const message = `补充资料「${material.title || material.id}」关联了不存在的固定事件 id：${eventId}`;
        warnings.push(message);
        addRowIssue('material', material.id, 'warning', message);
      }
    });
  });

  return {
    canSave: blockingIssues.length === 0,
    blockingIssues,
    warnings,
    rowIssues,
  };
}
