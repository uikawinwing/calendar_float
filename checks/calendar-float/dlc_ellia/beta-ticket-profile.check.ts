import { applyCalendarProfileConfig } from '../../../src/calendar-float/profile';
import { buildElliaBetaTicketCalendarEventsForMonth } from '../../../src/calendar-float/dlc_ellia/beta-ticket';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function testElliaTicketDateUsesActiveProfileDateParser(): void {
  applyCalendarProfileConfig({
    profileHint: 'generic',
    config: {
      id: 'custom-era',
      label: 'Custom Era',
      date: {
        eraName: '星历',
        eraNames: ['星历', '王庭历'],
        useChineseNumeralYear: true,
      },
    },
  });

  (globalThis as unknown as { getLastMessageId: () => number }).getLastMessageId = () => -1;
  (globalThis as unknown as { getVariables: (target: { type?: string }) => Record<string, unknown> }).getVariables = target =>
    target?.type === 'chat'
      ? {
          系统核心: '艾莉亚',
          calendar_float_store: {
            ticket_alpha_store: {
              tickets: {
                ticket_1: {
                  id: 'ticket_1',
                  savedAt: '2-05-01',
                  time: '王庭历二年五月二十三日',
                  location: '王都',
                  fields: { title: '星历票券', date: '王庭历二年五月二十三日' },
                },
              },
            },
          },
        }
      : {};

  const events = buildElliaBetaTicketCalendarEventsForMonth(['2-05-23']);

  assert(events.length === 1, 'Ellia 票券应该用 active profile 解析纪元中文日期');
  assert(events[0].range?.start.year === 2, 'Ellia 票券事件 year 应该来自 profile 日期');
  assert(events[0].range?.start.month === 5, 'Ellia 票券事件 month 应该来自 profile 日期');
  assert(events[0].range?.start.day === 23, 'Ellia 票券事件 day 应该来自 profile 日期');
}

function main(): void {
  testElliaTicketDateUsesActiveProfileDateParser();
  console.log('dlc_ellia/beta-ticket-profile.check.ts OK');
}

main();
