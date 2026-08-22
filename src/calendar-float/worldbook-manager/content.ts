import { getActiveCalendarProfile } from '../profile';

export function buildCalendarVariableListEntryContent(): string {
  return [
    '---',
    '现有月历事项',
    '',
    '<calendar_variables_display>',
    '<%_ { _%>',
    '<%_',
    "  const rootPath = 'stat_data.事件.月历';",
    '  const rawCalendar = getvar(rootPath, { defaults: {} });',
    '  const calendar = (_.isObject(rawCalendar.临时) || _.isObject(rawCalendar.重复))',
    "    ? _.assign({}, rawCalendar.临时 || {}, _.mapValues(rawCalendar.重复 || {}, function (event) { return _.assign({}, event, { 重复规则: _.get(event, '重复规则', _.get(event, '重复规则分类', '无')) }); }))",
    '    : rawCalendar;',
    "  const cleanEvent = function (event) { const output = _.pick(event, ['标题', '内容', '时间', '结束时间', '重复规则', '提前提醒天数', '显示', '提醒', '标签']); if (_.get(output, '重复规则') === '无') delete output.重复规则; return _.pickBy(output, function (value) { return value !== undefined && value !== null && value !== '' && !(_.isArray(value) && value.length === 0); }); };",
    '  const displayOutput = { 事件: { 月历: _.chain(_.isObject(calendar) ? calendar : {}).mapValues(cleanEvent).pickBy(function (event) { return !_.isEmpty(event); }).value() } };',
    "  print(YAML.stringify(displayOutput, { blockQuote: 'literal' }));",
    '_%>',
    '<%_ } _%>',
    '</calendar_variables_display>',
  ].join('\n');
}

export function buildCalendarUpdateRulesEntryContent(): string {
  const profile = getActiveCalendarProfile();
  const rootPath = profile.paths.eventRoot.replace(/^stat_data\./, '');
  const timeExamples = profile.worldbook.updateRuleTimeExamples.map(example => `\`${example}\``).join('、');
  return [
    '---',
    '月历变量更新规则:',
    `  ${rootPath}:`,
    '    type: |-',
    '      {',
    '        [事件ID: string]: {',
    '          标题: string;',
    '          内容: optional[string]; // 与该时间事项直接相关的简短说明',
    '          时间: string; // 事项发生、开始或截止的世界时间',
    '          结束时间: optional[string];',
    "          重复规则: optional['每天' | '每周' | '每月' | '每年' | '仅工作日'];",
    '          提前提醒天数: optional[number];',
    '          显示: optional[boolean]; // 是否显示在玩家月历UI，默认true',
    '          提醒: optional[boolean]; // 是否在到达提醒/预定时间时提醒LLM，默认true',
    '          标签: optional[string[]];',
    '        }',
    '      }',
    '    check:',
    '      - 月历只记录具有明确时间锚点的事项，用于月历UI显示与到时提醒；不负责保存任务进度、世界事件状态、新闻内容或剧情结果',
    '      - 只有剧情、任务、世界设定或<user>的安排已经明确产生时间时才新增；不得为了填充月历自行创造未来事件',
    '      - 已由世界书固定定义且可被月历脚本直接读取的课程、节庆、纪念日等固定事项，不重复写入变量',
    '      - 新事项生成稳定唯一ID，必须匹配`/^[a-zA-Z0-9_]+$/`；同一事项改期、改名或补充说明时沿用原ID更新',
    '      - 新增前检查现有事项，避免同一时间安排重复记录',
    '      - 一次性与重复事项使用同一个collection；无`重复规则`表示一次性，有`重复规则`表示周期事项，不建立`临时/重复`子目录',
    `      - 一次性\`时间\`使用${timeExamples}这类明确的世界时间或日期锚点，不得写“明天”“三天后”“月底”等会随当前时间变化的自由相对描述`,
    '      - 重复事项的`时间`按规则填写，例如`每天`、`每周一`、`每周一、三`、`每月10日`、`每年1月10日`',
    '      - `提前提醒天数`必须为大于等于0的整数；省略按0处理',
    '      - `显示`省略时视为true；设为false只表示不显示在玩家月历UI，不表示月历拥有或推进隐藏剧情',
    '      - `提醒`省略时视为true；设为true时，到达提前提醒时间或预定时间后由月历脚本向LLM提供时间提醒',
    '      - 到达预定时间只表示时间条件成立；月历不得自行判定任务完成或失败、世界事件发生、角色行动或任何剧情结果',
    '      - 事项取消，或结束且不再需要显示与提醒时删除；不得把结束事项转存为系统历史、归档或回忆',
    `      - ${buildCalendarTagRuleText()}`,
  ].join('\n');
}

function buildCalendarTagRuleText(): string {
  const profile = getActiveCalendarProfile();
  return `标签只用于月历UI分类，不承载任务状态、事件阶段或其他系统状态；优先复用已有短标签。当前可用标签：<%- (function () { var raw = getvar('${profile.paths.eventRoot}', { defaults: {} }); var calendar = (_.isObject(raw.临时) || _.isObject(raw.重复)) ? _.assign({}, raw.临时 || {}, raw.重复 || {}) : raw; var baseTags = ['主线', '支线', '课程', '约会', '节庆', '旅行', '比赛', '限时', '纪念']; var mirroredTags = getvar('calendar_float_store.runtime.known_tags', { defaults: [] }); var eventTags = _.flatMap(_.values(_.isObject(calendar) ? calendar : {}), function (event) { return _.isArray(_.get(event, '标签')) ? _.get(event, '标签') : []; }); var tags = _.uniq([].concat(baseTags, _.isArray(mirroredTags) ? mirroredTags : [], eventTags).map(function (tag) { return String(tag || '').trim(); }).filter(Boolean)).sort(function (left, right) { return left.localeCompare(right, 'zh-CN'); }); return tags.length ? tags.join('、') : '暂无'; }()) %>`;
}
