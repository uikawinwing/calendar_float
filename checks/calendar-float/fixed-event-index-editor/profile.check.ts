import { parse as parseYaml } from 'yaml';
import { applyFixedEventIndexStructuredEditsToYaml } from '../../../src/calendar-float/fixed-event-index-editor/edit';
import { parseFixedEventIndexDraft } from '../../../src/calendar-float/fixed-event-index-editor/parse';
import { renderFixedEventIndexEditorPreview } from '../../../src/calendar-float/fixed-event-index-editor/panel';
import { serializeFixedEventIndexDraft } from '../../../src/calendar-float/fixed-event-index-editor/serialize';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const SOURCE_INFO = {
  entryName: '[fixed_event_index]',
  worldbookName: '测试世界书',
};

const PROFILE_INDEX_YAML = `
Profile: fate-poem
Profile设置:
  label: 命定之诗
  paths:
    worldTime: stat_data.世界.时间
    worldLocation: stat_data.世界.地点
    eventRoot: stat_data.事件.月历
  date:
    eraName: 太初
    eraNames:
      - 太初
      - 旧历
    useChineseNumeralYear: true
  worldbook:
    variableDisplayTitle: 命定日程
  visual:
    festivalMarkerPresetId: fate-poem
固定事件: []
补充资料: []
`;

function testProfileConfigCanBeParsedAndSerialized(): void {
  const draft = parseFixedEventIndexDraft(PROFILE_INDEX_YAML, SOURCE_INFO);

  assert(draft.profile.id === 'fate-poem', '编辑器应该读取顶层 Profile');
  assert(draft.profile.settings.label === '命定之诗', '编辑器应该读取 Profile设置.label');
  assert(
    draft.profile.settings.paths.worldTime === 'stat_data.世界.时间',
    '编辑器应该读取 Profile设置.paths.worldTime',
  );
  assert(
    draft.profile.settings.paths.worldLocation === 'stat_data.世界.地点',
    '编辑器应该读取 Profile设置.paths.worldLocation',
  );
  assert(draft.profile.settings.date.eraName === '太初', '编辑器应该读取 Profile设置.date.eraName');
  assert(
    draft.profile.settings.date.useChineseNumeralYear === true,
    '编辑器应该读取 Profile设置.date.useChineseNumeralYear',
  );

  const serialized = parseYaml(serializeFixedEventIndexDraft(draft)) as Record<string, any>;
  assert(serialized.Profile === 'fate-poem', '序列化应该写回 Profile');
  assert(serialized.Profile设置?.label === '命定之诗', '序列化应该写回 Profile设置.label');
  assert(
    serialized.Profile设置?.paths?.worldTime === 'stat_data.世界.时间',
    '序列化应该写回 Profile设置.paths.worldTime',
  );
  assert(serialized.Profile设置?.paths?.eventRoot === 'stat_data.事件.月历', '序列化不应该删除未直接编辑的 paths 字段');
  assert(serialized.Profile设置?.date?.eraName === '太初', '序列化应该写回 Profile设置.date.eraName');
  assert(serialized.Profile设置?.date?.eraNames?.join('|') === '太初|旧历', '序列化不应该删除 eraNames');
  assert(serialized.Profile设置?.date?.useChineseNumeralYear === true, '序列化应该写回中文数字年份开关');
  assert(serialized.Profile设置?.worldbook?.variableDisplayTitle === '命定日程', '序列化不应该删除 worldbook 设置');
  assert(serialized.Profile设置?.visual?.festivalMarkerPresetId === 'fate-poem', '序列化不应该删除 visual 设置');
}

function testStructuredEditsCanUpdateProfileConfig(): void {
  const updatedYaml = applyFixedEventIndexStructuredEditsToYaml({
    sourceYaml: PROFILE_INDEX_YAML,
    sourceInfo: SOURCE_INFO,
    profile: {
      id: 'custom-court',
      label: '王庭月历',
      worldTimePath: 'stat_data.王庭.时辰',
      worldLocationPath: 'stat_data.王庭.所在地',
      eraName: '星历',
      useChineseNumeralYear: 'false',
    },
    groups: [],
    events: [],
    materials: [],
  });
  const serialized = parseYaml(updatedYaml) as Record<string, any>;

  assert(serialized.Profile === 'custom-court', '结构化编辑应该更新 Profile');
  assert(serialized.Profile设置?.label === '王庭月历', '结构化编辑应该更新 Profile设置.label');
  assert(
    serialized.Profile设置?.paths?.worldTime === 'stat_data.王庭.时辰',
    '结构化编辑应该更新 Profile设置.paths.worldTime',
  );
  assert(
    serialized.Profile设置?.paths?.worldLocation === 'stat_data.王庭.所在地',
    '结构化编辑应该更新 Profile设置.paths.worldLocation',
  );
  assert(serialized.Profile设置?.date?.eraName === '星历', '结构化编辑应该更新 Profile设置.date.eraName');
  assert(
    serialized.Profile设置?.date?.useChineseNumeralYear === false,
    '结构化编辑应该更新中文数字年份开关',
  );
  assert(
    serialized.Profile设置?.paths?.eventRoot === 'stat_data.事件.月历',
    '结构化编辑不应该删除未直接编辑的 paths 字段',
  );
  assert(serialized.Profile设置?.date?.eraNames?.join('|') === '太初|旧历', '结构化编辑不应该删除 eraNames');
  assert(
    serialized.Profile设置?.worldbook?.variableDisplayTitle === '命定日程',
    '结构化编辑不应该删除 worldbook 设置',
  );
  assert(
    serialized.Profile设置?.visual?.festivalMarkerPresetId === 'fate-poem',
    '结构化编辑不应该删除 visual 设置',
  );
}

function testProfileConfigFieldsRenderInSettingsPanel(): void {
  const draft = parseFixedEventIndexDraft(PROFILE_INDEX_YAML, SOURCE_INFO);
  const html = renderFixedEventIndexEditorPreview(
    {
      loading: false,
      source: {
        worldbookName: SOURCE_INFO.worldbookName,
        entryName: SOURCE_INFO.entryName,
        content: PROFILE_INDEX_YAML,
        sourceWorldbooks: [SOURCE_INFO.worldbookName],
        candidates: [],
        warnings: [],
      },
      draft,
      yamlPreview: serializeFixedEventIndexDraft(draft),
      validation: null,
      errorMessage: '',
    },
    { section: 'settings', scope: 'profile' },
  );

  assert(html.includes('data-role="fixed-event-profile-row"'), '设置页应该渲染 Profile 编辑卡片');
  assert(html.includes('data-field="worldTimePath"'), '设置页应该渲染 Profile 时间路径字段');
  assert(!html.includes('data-scope="defaults" data-id="main" data-field="mvuTimePath"'), '设置页不应该重复渲染默认 MVU 时间路径字段');
  assert(!html.includes('data-scope="defaults" data-id="main" data-field="mvuLocationPath"'), '设置页不应该重复渲染默认 MVU 地点路径字段');
  assert(html.includes('data-field="useChineseNumeralYear"'), '设置页应该渲染中文数字年份字段');
  assert(html.includes('data-role="profile-date-preview"'), '设置页应该渲染日期解析预览');
  assert(html.includes('日期解析规则来自 Profile设置.date'), '日期解析预览应该说明规则来源');
  assert(!html.includes('太初二年五月二十三日'), '日期解析预览不应该显示误导性的假当前日期');
  assert(!html.includes('解析结果：2-05-23'), '日期解析预览不应该显示误导性的假解析日期');
}

function testEditorRejectsOldTopLevelSchemaAliases(): void {
  const draft = parseFixedEventIndexDraft(
    `
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
`,
    SOURCE_INFO,
  );

  assert(draft.profile.id === undefined, '编辑器不应该再把旧 Profile 顶层别名解析为当前 Profile');
  assert(draft.profile.settings.label === undefined, '编辑器不应该再把旧 Profile设置 顶层别名解析为当前 Profile设置');
  assert(draft.groups.length === 0, '编辑器不应该再把旧顶层分组别名解析为当前分组');
  assert(draft.events.length === 0, '编辑器不应该再把旧顶层事件别名解析为当前固定事件');
  assert(draft.materials.length === 0, '编辑器不应该再把旧顶层资料别名解析为当前补充资料');
}

function main(): void {
  testProfileConfigCanBeParsedAndSerialized();
  testStructuredEditsCanUpdateProfileConfig();
  testProfileConfigFieldsRenderInSettingsPanel();
  testEditorRejectsOldTopLevelSchemaAliases();
  console.log('fixed-event-index-editor/profile.check.ts OK');
}

main();
