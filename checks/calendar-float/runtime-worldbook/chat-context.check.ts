import { resolveCalendarSearchableMessageText } from '../../../src/calendar-float/runtime-worldbook/chat-context';

function assertSearchableText(
  name: string,
  input: string,
  expected: ReturnType<typeof resolveCalendarSearchableMessageText>,
): void {
  const actual = resolveCalendarSearchableMessageText(input);
  if (actual.来源 !== expected.来源 || actual.文本 !== expected.文本) {
    throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertSearchableText('uses gametxt blocks when present', '<think>noise</think><gametxt>可扫描正文</gametxt>', {
  来源: 'gametxt',
  文本: '可扫描正文',
});

assertSearchableText(
  'joins multiple gametxt blocks and ignores surrounding text',
  '旁白<gametxt>第一段</gametxt>垃圾<gametxt>第二段</gametxt>',
  {
    来源: 'gametxt',
    文本: '第一段\n\n第二段',
  },
);

assertSearchableText('fallback removes think prefix and variable updates', '草稿</think>正文<UpdateVariable>mvu</UpdateVariable>结尾', {
  来源: 'fallback',
  文本: '正文结尾',
});

assertSearchableText('empty input falls back to empty text', '', {
  来源: 'fallback',
  文本: '',
});

console.log('runtime-worldbook/chat-context.check.ts OK');
