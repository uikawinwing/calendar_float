import { parseDocument } from 'yaml';
import { getActiveCalendarProfile, initializeCalendarProfile } from '../../../src/calendar-float/profile';
import { getCalendarRuntimeDefaults } from '../../../src/calendar-float/runtime-worldbook/config';
import { findCalendarRuntimeEntryByReference, normalizeCalendarRuntimeIndexDocument, readCalendarRuntimeIndex } from '../../../src/calendar-float/runtime-worldbook/loader';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testTopLevelMaterialLinksBackToFestival(): void {
  const yamlText = `
固定事件:
  - id: huanmo_mask_festival
    名称: 幻沫假面祭
    开始: 05-14
    结束: 05-20
补充资料:
  - id: 幻沫与潮汐之恋：索伦蒂斯的起源
    书名: 幻沫与潮汐之恋：索伦蒂斯的起源
    关联事件:
      - huanmo_mask_festival
    全文:
      条目名: "[节庆_幻沫假面祭_文本_幻沫与潮汐之恋：索伦蒂斯的起源]"
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings);
  assert(normalized, '索引应该能被成功归一化');

  const festival = normalized?.节庆?.find(item => item.id === 'huanmo_mask_festival');
  assert(festival, '应该存在幻沫假面祭');
  assert(
    festival?.相关书籍?.includes('幻沫与潮汐之恋：索伦蒂斯的起源'),
    '顶层补充资料的关联事件应该反向补进节庆相关书籍',
  );

  const book = normalized?.书籍?.find(item => item.id === '幻沫与潮汐之恋：索伦蒂斯的起源');
  assert(book, '顶层补充资料应该被保留在书籍列表');
}

function testProfileIsReadFromRuntimeIndex(): void {
  const yamlText = `
Profile: 命定之诗
Profile设置:
  label: 命定之诗
  paths:
    worldTime: stat_data.世界.时辰
    worldLocation: stat_data.世界.所在地
  date:
    eraName: 复兴纪元
    useChineseNumeralYear: true
固定事件: []
补充资料: []
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings) as any;
  assert(normalized, '索引应该能被成功归一化');
  assert(normalized.Profile === '命定之诗', '索引顶层 Profile 应该被保留用于 profile 识别');
  assert(normalized.Profile设置?.paths?.worldTime === 'stat_data.世界.时辰', 'Profile设置.paths 应该被保留');
  assert(normalized.Profile设置?.date?.eraName === '复兴纪元', 'Profile设置.date 应该被保留');
}

function testRuntimeIndexRejectsOldTopLevelSchemaAliases(): void {
  const yamlText = `
profile: legacy-profile
profileSettings:
  label: Legacy Profile
event_groups:
  - id: legacy_group
    name: Legacy Group
fixed_events:
  - id: legacy_event
    name: Legacy Event
    start: 01-01
    end: 01-01
materials:
  - id: legacy_material
    name: Legacy Material
节庆:
  - id: old_chinese_event
    名称: 旧节庆
    开始: 02-01
    结束: 02-01
书籍:
  - id: old_chinese_book
    书名: 旧书籍
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings);
  assert(normalized, '旧顶层别名文件仍应返回空索引对象，而不是崩溃');
  assert(normalized?.Profile === undefined, '旧 Profile 顶层别名不应该再被默认解析');
  assert(normalized?.Profile设置 === undefined, '旧 Profile设置 顶层别名不应该再被默认解析');
  assert((normalized?.节庆 ?? []).length === 0, '旧顶层事件别名不应该再被默认解析为固定事件');
  assert((normalized?.书籍 ?? []).length === 0, '旧顶层资料别名不应该再被默认解析为补充资料');
}

async function testRuntimeIndexAppliesProfileConfigBeforeDefaults(): Promise<void> {
  await initializeCalendarProfile();
  const host = globalThis as any;
  const previousGetVariables = host.getVariables;
  const previousGetCharWorldbookNames = host.getCharWorldbookNames;
  const previousGetGlobalWorldbookNames = host.getGlobalWorldbookNames;
  const previousGetWorldbook = host.getWorldbook;
  const previousToastr = host.toastr;
  host.getVariables = () => ({
    calendar_float_store: {
      sources: {
        useChatBoundWorldbook: false,
        extraWorldbooks: [],
        devWorldbooks: [],
      },
    },
  });
  host.getCharWorldbookNames = () => ({ primary: '测试世界书', additional: [] });
  host.getGlobalWorldbookNames = () => [];
  host.getWorldbook = async () => [
    {
      name: '[fixed_event_index]',
      content: `
Profile: custom-court
Profile设置:
  label: 王庭月历
  paths:
    worldTime: stat_data.王庭.时辰
    worldLocation: stat_data.王庭.所在地
固定事件: []
补充资料: []
`,
    },
  ];
  host.toastr = { info: () => undefined, warning: () => undefined };

  try {
    const result = await readCalendarRuntimeIndex();
    assert(result.索引?.Profile === 'custom-court', 'loader 应该读取 Profile');
    assert(getActiveCalendarProfile().id === 'custom-court', 'loader 应该应用自定义 Profile');
    assert(
      getCalendarRuntimeDefaults().mvu时间路径 === 'stat_data.王庭.时辰',
      'runtime defaults 应该使用 Profile设置.paths.worldTime',
    );
    assert(
      getCalendarRuntimeDefaults().mvu地点路径 === 'stat_data.王庭.所在地',
      'runtime defaults 应该使用 Profile设置.paths.worldLocation',
    );
  } finally {
    host.getVariables = previousGetVariables;
    host.getCharWorldbookNames = previousGetCharWorldbookNames;
    host.getGlobalWorldbookNames = previousGetGlobalWorldbookNames;
    host.getWorldbook = previousGetWorldbook;
    host.toastr = previousToastr;
    await initializeCalendarProfile();
  }
}

function testLoaderDoesNotSynthesizeHardcodedFestivalStages(): void {
  const yamlText = `
固定事件:
  - id: goddess_beauty_contest
    名称: 倾国倾城祭
    开始: 02-01
    结束: 02-14
补充资料: []
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings);
  assert(normalized, '索引应该能被成功归一化');

  const festival = normalized?.节庆?.find(item => item.id === 'goddess_beauty_contest');
  assert(festival, '应该存在倾国倾城祭');
  assert((festival?.阶段 ?? []).length === 0, 'loader 不应该为特定节庆硬编码补全阶段');
}

function testExplicitFestivalStagesArePreserved(): void {
  const yamlText = `
固定事件:
  - id: goddess_beauty_contest
    名称: 倾国倾城祭
    开始: 02-01
    结束: 02-14
    阶段:
      - id: first_bloom
        名称: 第一阶段·初绽海选
        开始: 02-01
        结束: 02-04
补充资料: []
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings);
  assert(normalized, '索引应该能被成功归一化');

  const festival = normalized?.节庆?.find(item => item.id === 'goddess_beauty_contest');
  assert(festival?.阶段?.length === 1, '显式配置的阶段必须保留');
  assert(festival?.阶段?.[0]?.id === 'first_bloom', '显式阶段 id 必须保留');
}

function testReferenceLookupDoesNotMatchBySuffix(): void {
  const matched = findCalendarRuntimeEntryByReference(
    [
      {
        世界书名: '测试世界书',
        条目: {
          name: '[foo][节庆_盟约日_介绍]',
          content: 'wrong',
        } as WorldbookEntry,
      },
    ],
    { 条目名: '[节庆_盟约日_介绍]' },
  );

  assert(!matched, '正文引用不应该靠后缀误匹配世界书条目');
}

async function main(): Promise<void> {
  testTopLevelMaterialLinksBackToFestival();
  testProfileIsReadFromRuntimeIndex();
  testRuntimeIndexRejectsOldTopLevelSchemaAliases();
  testLoaderDoesNotSynthesizeHardcodedFestivalStages();
  testExplicitFestivalStagesArePreserved();
  testReferenceLookupDoesNotMatchBySuffix();
  await testRuntimeIndexAppliesProfileConfigBeforeDefaults();
  console.log('loader.check.ts OK');
}

void main();
