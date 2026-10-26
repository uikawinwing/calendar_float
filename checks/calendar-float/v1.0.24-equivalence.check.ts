import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative, resolve } from 'node:path';
import nodeAssert from 'node:assert/strict';
import ts from 'typescript';

const ROOT = process.cwd();
const BASE = '9b8da7bb6755895d7b2d36edff147714489ade15';
const FATE_POEM_BASE = '9e3b277c63e0040cfd8b8f5aa072ea9267079704';
const INDEX_PATH = '节庆_索引.latest.yaml';
const FIXTURE_WORLDBOOK = 'calendar_float_v1_0_24_equivalence_fixture';
const PACKAGE_REQUIRE = createRequire(join(ROOT, 'package.json'));
const gitShowCache = new Map<string, string>();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readGitFile(revision: string, file: string): string {
  const key = `${revision}:${file}`;
  const cached = gitShowCache.get(key);
  if (cached !== undefined) return cached;
  const content = execFileSync('git', ['show', key], { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  gitShowCache.set(key, content);
  return content;
}

function createModuleLoader(revision?: string): (file: string) => any {
  const moduleCache = new Map<string, { exports: Record<string, unknown> }>();

  function getModuleSource(filename: string): string {
    const repositoryPath = relative(ROOT, filename).replaceAll('\\', '/');
    if (revision) return readGitFile(revision, repositoryPath);
    return PACKAGE_REQUIRE('node:fs').readFileSync(filename, 'utf8');
  }

  function resolveLocalModule(filename: string): string {
    const candidates = extname(filename)
      ? [filename]
      : [`${filename}.ts`, `${filename}.tsx`, `${filename}.js`, `${filename}.json`, join(filename, 'index.ts')];
    const fs = PACKAGE_REQUIRE('node:fs');
    const resolved = candidates.find(candidate => fs.existsSync(candidate));
    if (!resolved) throw new Error(`无法解析对照模块：${filename}`);
    return resolve(resolved);
  }

  function loadModule(filename: string): any {
    const resolvedFilename = resolveLocalModule(filename);
    const cached = moduleCache.get(resolvedFilename);
    if (cached) return cached.exports;

    if (resolvedFilename.endsWith('.json')) {
      const jsonModule = { exports: JSON.parse(getModuleSource(resolvedFilename)) };
      moduleCache.set(resolvedFilename, jsonModule);
      return jsonModule.exports;
    }

    const source = getModuleSource(resolvedFilename);
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      fileName: resolvedFilename,
    }).outputText;
    const module = { exports: {} as Record<string, unknown> };
    moduleCache.set(resolvedFilename, module);

    const localRequire = (request: string): any => {
      if (request.endsWith('?raw')) {
        const filename = request.slice(0, -4).split(/[\\/]/).pop() || 'icon.svg';
        return `<svg data-equivalence-icon="${filename}"></svg>`;
      }
      if (request.startsWith('.')) {
        return loadModule(resolve(dirname(resolvedFilename), request));
      }
      return PACKAGE_REQUIRE(request);
    };

    const compile = new Function('exports', 'require', 'module', '__filename', '__dirname', output);
    compile(module.exports, localRequire, module, resolvedFilename, dirname(resolvedFilename));
    return module.exports;
  }

  return file => loadModule(resolve(ROOT, file));
}

function installReadOnlySillyTavernMocks(worldbookContent: string): {
  setNow: (value: string) => void;
  getNow: () => string;
  setLocation: (value: string) => void;
  activate: () => void;
  reads: string[];
  writes: string[];
  chatRuntimeWrites: unknown[];
  promptCaptures: Array<Record<string, unknown>>;
} {
  let now = '';
  let location = '';
  const reads: string[] = [];
  const writes: string[] = [];
  const chatRuntimeWrites: unknown[] = [];
  const promptCaptures: Array<Record<string, unknown>> = [];
  const chatVariables: Record<string, unknown> = {
    calendar_float_store: {
      archive: {
        sources: { useChatBoundWorldbook: false, extraWorldbooks: [FIXTURE_WORLDBOOK], devWorldbooks: [] },
      },
    },
  };
  const globals = globalThis as any;
  globals.toastr = { warning: () => undefined, info: () => undefined };
  globals.getCharWorldbookNames = () => ({ primary: '', additional: [] });
  globals.getGlobalWorldbookNames = () => [];
  globals.getChatBoundCalendarWorldbookName = () => '';
  globals.getChatWorldbookName = () => '';
  globals.getWorldbook = async (name: string) => {
    reads.push(name);
    if (name !== FIXTURE_WORLDBOOK) throw new Error(`Unexpected worldbook read: ${name}`);
    return [{ name: '[fixed_event_index]', content: worldbookContent }];
  };
  for (const method of ['replaceWorldbook', 'createWorldbook', 'deleteWorldbook', 'importRaw']) {
    globals[method] = (...args: unknown[]) => {
      writes.push(method);
      throw new Error(`Read-only equivalence check called ${method}(${args.length})`);
    };
  }
  globals.getLastMessageId = () => 0;
  globals.getChatMessages = () => [{ message_id: 0, role: 'user', message: '查看月历' }];
  globals.injectPrompts = (prompts: Array<Record<string, unknown>>) => {
    promptCaptures.push(...JSON.parse(JSON.stringify(prompts)));
    return { uninject: () => undefined };
  };
  globals.uninjectPrompts = () => undefined;
  const updateVariablesWith = (updater: (variables: Record<string, unknown>) => Record<string, unknown>) => {
    const updated = updater(chatVariables);
    chatRuntimeWrites.push(JSON.parse(JSON.stringify(updated)));
    Object.assign(chatVariables, updated);
  };
  globals.updateVariablesWith = updateVariablesWith;
  globals.Mvu = {
    getMvuData: () => ({ stat_data: { 世界: { 时间: now, 地点: location }, 事件: { 月历: { 临时: {}, 重复: {} } } } }),
    replaceMvuData: () => {
      writes.push('Mvu.replaceMvuData');
      throw new Error('Read-only equivalence check called Mvu.replaceMvuData');
    },
  };
  globals.getVariables = (option: { type?: string }) =>
    option?.type === 'chat' ? chatVariables : option?.type === 'message' ? globals.Mvu.getMvuData() : {};
  const activate = () => {
    globals.Mvu = {
      getMvuData: () => ({
        stat_data: { 世界: { 时间: now, 地点: location }, 事件: { 月历: { 临时: {}, 重复: {} } } },
      }),
      replaceMvuData: () => {
        writes.push('Mvu.replaceMvuData');
        throw new Error('Read-only equivalence check called Mvu.replaceMvuData');
      },
    };
    globals.getVariables = (option: { type?: string }) =>
      option?.type === 'chat' ? chatVariables : option?.type === 'message' ? globals.Mvu.getMvuData() : {};
    globals.updateVariablesWith = updateVariablesWith;
    globals.getWorldbook = async (name: string) => {
      reads.push(name);
      if (name !== FIXTURE_WORLDBOOK) throw new Error(`Unexpected worldbook read: ${name}`);
      return [{ name: '[fixed_event_index]', content: worldbookContent }];
    };
    globals.injectPrompts = (prompts: Array<Record<string, unknown>>) => {
      promptCaptures.push(...JSON.parse(JSON.stringify(prompts)));
      return { uninject: () => undefined };
    };
    globals.uninjectPrompts = () => undefined;
  };
  return {
    setNow: value => (now = value),
    getNow: () => now,
    setLocation: value => (location = value),
    activate,
    reads,
    writes,
    chatRuntimeWrites,
    promptCaptures,
  };
}

function getPromptBlock(template: string): string {
  const blocks = [...template.matchAll(/<%_([\s\S]*?)_%>/g)].map(match => match[1]);
  const body = blocks.find(block => block.includes('const rootPath'));
  assert(body, '变量展示模板应包含执行块');
  return body;
}

function renderVariableDisplay(template: string, variables: Record<string, unknown>): unknown {
  const yaml = PACKAGE_REQUIRE('yaml');
  let rendered = '';
  const getvar = (path: string) => {
    assert(path === 'stat_data.事件.月历', `Prompt 使用了意外 MVU 路径：${path}`);
    return variables;
  };
  const print = (content: string) => (rendered += content);
  const run = new Function('getvar', '_', 'YAML', 'print', getPromptBlock(template));
  run(getvar, PACKAGE_REQUIRE('lodash'), yaml, print);
  return yaml.parse(rendered);
}

function withoutUpdatedAt(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUpdatedAt);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'updated_at')
      .map(([key, item]) => [key, withoutUpdatedAt(item)]),
  );
}

function assertPromptCapturesEquivalent(oldCapture: any, newCapture: any, label: string, requirePrompt = false): void {
  const retainedKeywords = [...new Set(oldCapture.scan.命中关键字)].filter((keyword: string) =>
    newCapture.scan.命中关键字.includes(keyword),
  );
  const retainedUpcoming = [...new Set(oldCapture.scan.提醒未开始文本)].filter((text: string) =>
    newCapture.scan.提醒未开始文本.includes(text),
  );
  const retainedActive = [...new Set(oldCapture.scan.提醒进行中文本)].filter((text: string) =>
    newCapture.scan.提醒进行中文本.includes(text),
  );
  const expectedScanPrompt = retainedKeywords.join('\n');
  const reminderBody = [...retainedUpcoming, ...retainedActive].join('\n\n');
  const expectedReminderPrompt = reminderBody ? `<festival_reminder>\n${reminderBody}\n</festival_reminder>` : '';
  const compactPrompts = (prompts: Array<Record<string, any>>) =>
    prompts.map(({ id, position, depth, role, content, should_scan }) => ({
      id,
      position,
      depth,
      role,
      content,
      should_scan,
    }));
  nodeAssert.deepEqual(
    compactPrompts(newCapture.prompts),
    compactPrompts(oldCapture.prompts).map(prompt => {
      if (prompt.id === 'calendar_float_runtime_worldbook_scan') return { ...prompt, content: expectedScanPrompt };
      if (prompt.id === 'calendar_float_runtime_visible_reminders') {
        return { ...prompt, content: expectedReminderPrompt };
      }
      return prompt;
    }),
    `Scanner 实际注入 Prompt 应等价：${label}；唯一允许变化是禁用的节庆/阶段提醒`,
  );
  if (requirePrompt) assert(newCapture.prompts.length > 0, `Scanner 实际注入 Prompt 不应为空：${label}`);
}

function compactCell(cell: any): unknown {
  return {
    key: cell.key,
    inCurrentMonth: cell.inCurrentMonth,
    isToday: cell.isToday,
    reminderLevel: cell.reminderLevel,
    overflowCount: cell.overflowCount,
    chips: cell.chips.map((chip: any) => ({
      id: chip.id,
      title: chip.title,
      row: chip.row,
      start: chip.isStart,
      end: chip.isEnd,
      kind: chip.displayKind,
      color: chip.color,
    })),
    markers: cell.markers,
  };
}

function compactAgenda(groups: any[]): unknown {
  return groups.map(group => ({
    dateKey: group.dateKey,
    items: group.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source,
      startText: item.startText,
      endText: item.endText,
      periodLabel: item.periodLabel,
      stageTitle: item.stageTitle,
      icon: item.festivalIconSvg,
      iconColor: item.festivalIconColor,
      tags: item.tags,
      reminderLevel: item.reminderLevel,
      color: item.color,
    })),
  }));
}

function disabledReminderExpectations(index: any): { eventNames: string[]; keywords: Set<string> } {
  const eventNames: string[] = [];
  const keywords = new Set<string>();
  for (const event of index.节庆 ?? []) {
    if (event.提醒?.启用 === false) {
      eventNames.push(event.名称);
      for (const keyword of event.提醒.扫描触发词 ?? []) keywords.add(keyword);
    }
    for (const stage of event.阶段 ?? []) {
      if (stage.提醒?.启用 === false) {
        eventNames.push(`${event.名称}/${stage.名称}`);
        for (const keyword of stage.提醒.扫描触发词 ?? []) keywords.add(keyword);
      }
    }
  }
  return { eventNames, keywords };
}

function assertScannerDifferencesAreDisabledReminderChanges(oldResult: any, newResult: any, index: any): number {
  const disabled = disabledReminderExpectations(index);
  const oldOnlyKeywords = oldResult.命中关键字.filter((keyword: string) => !newResult.命中关键字.includes(keyword));
  const newOnlyKeywords = newResult.命中关键字.filter((keyword: string) => !oldResult.命中关键字.includes(keyword));
  for (const keyword of [...oldOnlyKeywords, ...newOnlyKeywords]) {
    assert(disabled.keywords.has(keyword), `Scanner 关键字差异不属于禁用提醒修复：${keyword}`);
  }
  for (const text of oldResult.提醒未开始文本) {
    if (newResult.提醒未开始文本.includes(text)) continue;
    assert(
      disabled.eventNames.some(name => text.includes(name)),
      `Scanner 未开始提醒差异不属于禁用提醒修复：${text}`,
    );
  }
  for (const text of oldResult.提醒进行中文本) {
    if (newResult.提醒进行中文本.includes(text)) continue;
    assert(
      disabled.eventNames.some(name => text.includes(name)),
      `Scanner 进行中提醒差异不属于禁用提醒修复：${text}`,
    );
  }
  for (const text of newResult.提醒未开始文本) {
    assert(oldResult.提醒未开始文本.includes(text), `重构版新增未开始提醒超出本轮范围：${text}`);
  }
  for (const text of newResult.提醒进行中文本) {
    assert(oldResult.提醒进行中文本.includes(text), `重构版新增进行中提醒超出本轮范围：${text}`);
  }
  nodeAssert.deepEqual(newResult.摘要文本, oldResult.摘要文本, 'Scanner 书籍摘要输出应保持一致');
  nodeAssert.deepEqual(newResult.警告, oldResult.警告, 'Scanner 诊断输出应保持一致');
  return oldOnlyKeywords.length + newOnlyKeywords.length;
}

async function loadRuntime(revision: string | undefined, sourceYaml: string) {
  const load = createModuleLoader(revision);
  const mocks = installReadOnlySillyTavernMocks(sourceYaml);
  const snapshotModule = load('src/calendar-float/runtime-worldbook/snapshot.ts');
  const festivalsModule = load('src/calendar-float/runtime-dataset/festivals.ts');
  const aliasesModule = load('src/calendar-float/runtime-worldbook/month-alias.ts');
  const calendarModel = load('src/calendar-float/calendar-view-model/model.ts');
  const scanner = load('src/calendar-float/runtime-worldbook/scanner.ts');
  const visual = load('src/calendar-float/festival-visual.ts');
  const prompt = load('src/calendar-float/worldbook-manager/content.ts');
  const snapshot = await snapshotModule.loadCalendarRuntimeWorldbookSnapshot({
    useChatBoundWorldbook: false,
    extraWorldbooks: [FIXTURE_WORLDBOOK],
    devWorldbooks: [],
  });
  assert(snapshot.indexResult.索引, `${revision ?? '重构版'} 未能读取固定事件索引`);
  const monthAliases = aliasesModule.normalizeCalendarMonthAliasList(snapshot.indexResult.索引.月份别名);

  async function readSample(sample: { year: number; month: number; day: number }): Promise<unknown> {
    const nowText = `复兴纪元${sample.year}年-${sample.month}月${sample.day}日`;
    mocks.setNow(nowText);
    const now = { year: sample.year, month: sample.month, day: sample.day };
    const festivals = (
      await Promise.all(
        snapshot.indexResult.索引!.节庆.map((festival: any) =>
          festivalsModule.buildRuntimeFestivalRecord(festival, now, {}, snapshot),
        ),
      )
    ).filter(Boolean);
    const dataset: any = {
      nowText,
      nowDate: now,
      calendarAnchor: undefined,
      currentLocationText: '',
      activeEvents: [],
      archivedEvents: [],
      festivals,
      books: {},
      suggestions: [],
      monthAliases,
      sourceConfig: { useChatBoundWorldbook: false, extraWorldbooks: [FIXTURE_WORLDBOOK], devWorldbooks: [] },
      worldbookSources: snapshot.sources,
      sourceWarnings: [...snapshot.indexResult.警告],
    };
    const monthDate = { year: sample.year, month: sample.month, day: 1 };
    const cells = calendarModel.buildMonthCells({
      month: monthDate,
      selectedDateKey: `${sample.year}-${String(sample.month).padStart(2, '0')}-${String(sample.day).padStart(2, '0')}`,
      dataset,
    });
    const monthAgenda = calendarModel.buildMonthAgenda(dataset, monthDate);
    const reminderState = calendarModel.buildReminderState(dataset);
    const markers = festivals.map((festival: any) => visual.buildFestivalMarker(festival));
    return {
      fixedEventCount: snapshot.indexResult.索引!.节庆.length,
      stageCount: snapshot.indexResult.索引!.节庆.reduce(
        (total: number, festival: any) => total + (festival.阶段?.length ?? 0),
        0,
      ),
      records: festivals.map((festival: any) => ({
        id: festival.id,
        start: festival.startText,
        end: festival.endText,
        stages: festival.stages.map((stage: any) => ({
          id: stage.phaseId,
          start: stage.startText,
          end: stage.endText,
        })),
      })),
      markers,
      cells: cells.map(compactCell),
      agenda: compactAgenda(monthAgenda),
      reminderState,
    };
  }

  const index = snapshot.indexResult.索引;
  const scanResult = await scanner.scanCalendarRuntimeWorldbook(snapshot);
  const promptTemplates = {
    variableList: prompt.buildCalendarVariableListEntryContent(),
    updateRules: prompt.buildCalendarUpdateRulesEntryContent(),
  };
  return {
    index,
    snapshot,
    scanResult,
    promptTemplates,
    readSample,
    mocks,
    async capturePrompts() {
      mocks.promptCaptures.length = 0;
      mocks.activate();
      const freshScan = await scanner.scanCalendarRuntimeWorldbook(snapshot);
      await scanner.applyCalendarRuntimeWorldbookScan();
      return { prompts: JSON.parse(JSON.stringify(mocks.promptCaptures)), scan: freshScan };
    },
  };
}

async function main(): Promise<void> {
  const sourceYaml = readGitFile(BASE, INDEX_PATH);
  const oldRuntime = await loadRuntime(BASE, sourceYaml);
  const fatePoemRuntime = await loadRuntime(FATE_POEM_BASE, sourceYaml);
  const newRuntime = await loadRuntime(undefined, sourceYaml);
  const oldIndex = oldRuntime.index;
  const newIndex = newRuntime.index;

  nodeAssert.equal(newIndex.节庆.length, oldIndex.节庆.length, '固定事件总数应保持一致');
  nodeAssert.equal(
    newIndex.节庆.reduce((total: number, event: any) => total + (event.阶段?.length ?? 0), 0),
    oldIndex.节庆.reduce((total: number, event: any) => total + (event.阶段?.length ?? 0), 0),
    '固定事件阶段总数应保持一致',
  );

  const samples: Array<{ year: number; month: number; day: number }> = [];
  for (let month = 1; month <= 12; month += 1) {
    samples.push({ year: 488, month, day: 1 });
    const daysInMonth = new Date(Date.UTC(488, month, 0)).getUTCDate();
    samples.push({ year: 488, month, day: daysInMonth });
  }
  samples.push({ year: 488, month: 12, day: 31 }, { year: 489, month: 1, day: 1 }, { year: 488, month: 2, day: 29 });

  let expectedScannerKeywordDifferences = 0;
  for (const sample of samples) {
    const oldOutput = await oldRuntime.readSample(sample);
    const newOutput = await newRuntime.readSample(sample);
    nodeAssert.deepEqual(newOutput, oldOutput, `月历输出不等价：${sample.year}-${sample.month}-${sample.day}`);
  }

  const oldScan = oldRuntime.scanResult;
  const newScan = newRuntime.scanResult;
  expectedScannerKeywordDifferences = assertScannerDifferencesAreDisabledReminderChanges(oldScan, newScan, oldIndex);
  oldRuntime.mocks.setNow('复兴纪元488年-12月31日');
  newRuntime.mocks.setNow('复兴纪元488年-12月31日');
  oldRuntime.mocks.setLocation('索伦蒂斯王国');
  newRuntime.mocks.setLocation('索伦蒂斯王国');
  const oldCapture = await oldRuntime.capturePrompts();
  const newCapture = await newRuntime.capturePrompts();
  const oldPrompts = oldCapture.prompts;
  const newPrompts = newCapture.prompts;
  assertPromptCapturesEquivalent(oldCapture, newCapture, '索伦蒂斯王国', true);

  oldRuntime.mocks.setLocation('无关地点');
  newRuntime.mocks.setLocation('无关地点');
  const oldUnrelatedLocation = await oldRuntime.capturePrompts();
  const newUnrelatedLocation = await newRuntime.capturePrompts();
  assertPromptCapturesEquivalent(oldUnrelatedLocation, newUnrelatedLocation, '无关地点');
  nodeAssert.notDeepEqual(
    withoutUpdatedAt(oldUnrelatedLocation.scan),
    withoutUpdatedAt(oldCapture.scan),
    '原版 Scanner 的关联地点与无关地点结果应不同，确认地点条件分支确实执行',
  );
  nodeAssert.notDeepEqual(
    withoutUpdatedAt(newUnrelatedLocation.scan),
    withoutUpdatedAt(newCapture.scan),
    '重构版 Scanner 的关联地点与无关地点结果应不同，确认地点条件分支确实执行',
  );

  const variables = {
    临时: {
      visible: { 标题: '公开约会', 内容: '去港口', 时间: '488年-6月5日', 可见性: '公开' },
      private: { 标题: '私人行程', 内容: '私密', 时间: '488年-6月6日', 可见性: '仅玩家' },
      dirty: { 标题: '旧数据', 内容: '缺省可见', 时间: '488年-6月7日' },
    },
    重复: {},
  };
  const oldRenderedPrompt = renderVariableDisplay(oldRuntime.promptTemplates.variableList, variables);
  const newRenderedPrompt = renderVariableDisplay(newRuntime.promptTemplates.variableList, variables);
  const newPromptWithoutVisibility = JSON.parse(JSON.stringify(newRenderedPrompt));
  delete newPromptWithoutVisibility.事件.月历.临时.visible.可见性;
  nodeAssert.deepEqual(
    newPromptWithoutVisibility,
    oldRenderedPrompt,
    '变量展示 Prompt 除新增的可见性字段外，应保持旧版公开/仅玩家事件输出一致',
  );
  nodeAssert.deepEqual(
    newRenderedPrompt,
    {
      事件: {
        月历: {
          临时: {
            visible: { 标题: '公开约会', 内容: '去港口', 时间: '488年-6月5日', 可见性: '公开' },
            dirty: { 标题: '旧数据', 内容: '缺省可见', 时间: '488年-6月7日' },
          },
          重复: {},
        },
      },
    },
    'Prompt 应隐藏仅玩家事件并保持缺省可见的旧数据',
  );
  nodeAssert.match(
    newRuntime.promptTemplates.updateRules,
    /可见性: optional\['玩家与LLM' \| '完全不显示'\]/,
    '更新规则必须继续限制 LLM 可直接设置的可见性状态',
  );
  nodeAssert.match(
    newRuntime.promptTemplates.updateRules,
    /每次回复最多新增一个隐藏剧情事件/,
    '更新规则应继续保留最新隐藏剧情事件策略',
  );
  nodeAssert.match(
    newRuntime.promptTemplates.updateRules,
    /LLM不得主动写入或改为`仅LLM`/,
    '仅 LLM 状态仍应由提醒脚本提升',
  );
  const normalizeRuleExamples = (rules: string) =>
    rules
      .replace(/当前可用标签：<%-[\s\S]*?%>/g, '当前可用标签：<标签表达式>')
      .replace(/(重复事件严禁使用包含具体年份的完整世界时间，例如).*$/gm, '$1<示例时间>');
  nodeAssert.equal(
    normalizeRuleExamples(newRuntime.promptTemplates.updateRules),
    normalizeRuleExamples(fatePoemRuntime.promptTemplates.updateRules),
    '合并版更新规则应保留合并前 Fate-only 版本的现行策略',
  );

  nodeAssert.equal(oldRuntime.mocks.writes.length, 0, '原版读取/扫描路径不得写世界书或 MVU');
  nodeAssert.equal(newRuntime.mocks.writes.length, 0, '重构版读取/扫描路径不得写世界书或 MVU');
  nodeAssert.deepEqual(
    withoutUpdatedAt(newRuntime.mocks.chatRuntimeWrites),
    withoutUpdatedAt(oldRuntime.mocks.chatRuntimeWrites),
    'Scanner 对聊天运行时缓存的更新 payload 应保持一致（忽略 updated_at）',
  );
  assert(oldRuntime.mocks.reads.length > 0, '原版用例应实际读取世界书');
  assert(newRuntime.mocks.reads.length > 0, '重构版用例应实际读取世界书');

  console.log(
    JSON.stringify({
      result: 'v1.0.24-equivalence.check.ts OK',
      indexEvents: newIndex.节庆.length,
      stages: newIndex.节庆.reduce((total: number, event: any) => total + (event.阶段?.length ?? 0), 0),
      calendarSamples: samples.length,
      scannerExpectedDisabledReminderKeywordDifferences: expectedScannerKeywordDifferences,
      scannerDisabledReminderNames: disabledReminderExpectations(oldIndex).eventNames.length,
      promptInjectionCount: newCapture.prompts.length,
      unrelatedLocationPromptCount: newUnrelatedLocation.prompts.length,
      locationSamples: ['索伦蒂斯王国', '无关地点'],
      chatRuntimeWriteCounts: {
        old: oldRuntime.mocks.chatRuntimeWrites.length,
        current: newRuntime.mocks.chatRuntimeWrites.length,
      },
      worldbookReads: { old: oldRuntime.mocks.reads.length, current: newRuntime.mocks.reads.length },
      worldbookWrites: { old: oldRuntime.mocks.writes.length, current: newRuntime.mocks.writes.length },
    }),
  );
}

void main();
