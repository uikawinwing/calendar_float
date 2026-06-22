import {
  DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES,
  isRuntimeEntryNameEqual,
  isRuntimeIndexEntryName,
  normalizeRuntimeEntryName,
} from '../../../src/calendar-float/runtime-worldbook/entry-matching';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testNormalizesWhitespaceOnly(): void {
  assert(normalizeRuntimeEntryName('  [fixed_event_index]  ') === '[fixed_event_index]', '应该只裁切首尾空白');
}

function testExactEntryNameMatch(): void {
  assert(isRuntimeEntryNameEqual('[fixed_event_index]', '[fixed_event_index]'), '相同条目名应该匹配');
  assert(isRuntimeEntryNameEqual('fixed_event_index', 'fixed_event_index'), '无括号候选应该匹配');
}

function testRejectsSuffixMatch(): void {
  assert(!isRuntimeEntryNameEqual('foo[fixed_event_index]', '[fixed_event_index]'), '不允许后缀误匹配索引条目');
  assert(!isRuntimeEntryNameEqual('[prefix][节庆_索引]', '[节庆_索引]'), '不允许前缀条目误匹配旧索引');
}

function testDefaultIndexCandidatesAreExplicit(): void {
  assert(DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.includes('[fixed_event_index]'), '必须保留首选索引名');
  assert(DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.includes('fixed_event_index'), '必须保留无括号首选索引名');
  assert(!DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.includes('[节庆_索引]'), '默认候选不应该再包含旧索引名');
  assert(!DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.includes('calendar_index'), '默认候选不应该再包含推测索引名');
  assert(isRuntimeIndexEntryName('[fixed_event_index]'), '首选索引名应该识别为 runtime index');
  assert(!isRuntimeIndexEntryName('[节庆_索引]'), '旧索引名不应该被默认识别为 runtime index');
  assert(!isRuntimeIndexEntryName('calendar_index'), '推测索引名不应该被默认识别为 runtime index');
  assert(!isRuntimeIndexEntryName('[DLC][fixed_event_index]'), '不允许靠后缀识别 runtime index');
}

function testReferenceMatchingDoesNotAllowSuffixes(): void {
  assert(!isRuntimeEntryNameEqual('[foo][节庆_盟约日_介绍]', '[节庆_盟约日_介绍]'), '正文引用不应该靠后缀误匹配');
}

function main(): void {
  testNormalizesWhitespaceOnly();
  testExactEntryNameMatch();
  testRejectsSuffixMatch();
  testDefaultIndexCandidatesAreExplicit();
  testReferenceMatchingDoesNotAllowSuffixes();
  console.log('entry-matching.check.ts OK');
}

main();
