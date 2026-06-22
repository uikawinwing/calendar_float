import {
  buildManagedWorldbookSummaryLines,
  filterWorldbookPickerNames,
  getConnectivityButtonCopy,
} from '../../../../src/calendar-float/widget/managed-worldbook/dialog-model';
import type { CalendarManagedWorldbookDiagnostics } from '../../../../src/calendar-float/worldbook-manager';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createDiagnostics(overrides: Partial<CalendarManagedWorldbookDiagnostics> = {}): CalendarManagedWorldbookDiagnostics {
  return {
    worldbookName: '命定之诗',
    version: 'v4.1.0',
    connectivity: 'missing',
    existsInRegistry: true,
    foundByScript: true,
    createdDuringEnsure: false,
    updatedDuringEnsure: false,
    lastEnsureSucceeded: false,
    lastImportTriggered: false,
    entryCount: 1,
    hasMetaEntry: false,
    hasUpdateRulesEntry: true,
    hasVariableListEntry: false,
    runtimeIndexWorldbookName: '',
    runtimeContentWorldbookNames: [],
    managedEntryCount: 1,
    expectedManagedEntryCount: 2,
    allManagedEntriesPresent: false,
    managementEnabled: true,
    lastError: '',
    lastEnsureAt: '',
    lastImportAt: '',
    sourceItems: [],
    ...overrides,
  };
}

function testSummaryLinesKeepRuleLocationsReadable(): void {
  const lines = buildManagedWorldbookSummaryLines(createDiagnostics());

  assert(lines.some(line => line.includes('基础规则：已找到')), '摘要应该显示基础规则已找到');
  assert(lines.some(line => line.includes('变量展示：未找到')), '摘要应该显示变量展示未找到');
  assert(lines.some(line => line.includes('重装位置：命定之诗')), '摘要应该显示重装位置');
}

function testConnectivityButtonCopyUsesBusyAndCounts(): void {
  const copy = getConnectivityButtonCopy(createDiagnostics(), { busy: true });

  assert(copy.text === '检查中…', 'busy 时按钮文本应该是检查中');
  assert(copy.title.includes('1/2'), '按钮 title 应该包含托管条目数量');
}

function testWorldbookPickerFilteringIsPureAndCaseInsensitive(): void {
  const result = filterWorldbookPickerNames(['命定之诗', 'Calendar Backend', '节庆库'], 'calendar');

  assert(result.length === 1, '过滤应该只保留匹配项');
  assert(result[0]?.name === 'Calendar Backend', '过滤应该大小写不敏感');
  assert(result[0]?.selected === true, '完全匹配输入时应该标记 selected');
}

function main(): void {
  testSummaryLinesKeepRuleLocationsReadable();
  testConnectivityButtonCopyUsesBusyAndCounts();
  testWorldbookPickerFilteringIsPureAndCaseInsensitive();
  console.log('dialog-model.check.ts OK');
}

main();
