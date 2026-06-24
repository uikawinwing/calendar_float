import { readRuntimeField } from './aliases';
import type { CalendarProfileConfigInput } from '../profile';
import {
  构建节庆共享触发映射,
  取唯一文本,
  规范化书籍全文节点,
  规范化书籍摘要节点,
  规范化节庆介绍节点,
  规范化节庆提醒节点,
  规范化节庆阶段列表,
  读取书籍摘要源,
  读取共享地点关键词,
  读取节庆开始前天数,
  读取节庆周期,
} from './content-normalizer';
import { 规范化书籍默认值, 规范化提醒默认值, 规范化默认设置 } from './defaults';
import {
  是否对象,
  读取对象,
  读取对象字段,
  读取条目名,
  规范化单值或字符串数组,
  规范化名称,
  规范化对象数组,
  规范化数字,
} from './normalizers';
import type {
  CalendarRuntimeBookDefaults,
  CalendarRuntimeBookEntry,
  CalendarRuntimeContentNode,
  CalendarRuntimeDefaults,
  CalendarRuntimeFestivalEntry,
  CalendarRuntimeIndex,
  CalendarRuntimeReminderDefaults,
  CalendarRuntimeTextLibrary,
} from './types';
export function 提取文本库映射(data: unknown): CalendarRuntimeTextLibrary {
  if (!是否对象(data)) {
    return {};
  }

  const directEntries = Object.entries(data).filter(([, value]) => typeof value === 'string');
  if (directEntries.length > 0) {
    return Object.fromEntries(directEntries.map(([key, value]) => [规范化名称(key), String(value ?? '')]));
  }

  const rawList = Array.isArray(data.条目) ? data.条目 : Array.isArray(data.文本) ? data.文本 : [];
  const mappedList = rawList
    .map(item => {
      if (!是否对象(item)) {
        return null;
      }
      const key = 规范化名称(item.键 ?? item.id ?? item.ID ?? item.名称 ?? item.name);
      const text = item.文本 ?? item.content ?? item.内容 ?? item.text;
      if (!key || typeof text !== 'string') {
        return null;
      }
      return [key, text] as const;
    })
    .filter((item): item is readonly [string, string] => Boolean(item));

  return Object.fromEntries(mappedList);
}

function 规范化月份别名(value: unknown): NonNullable<CalendarRuntimeIndex['月份别名']> {
  const output: NonNullable<CalendarRuntimeIndex['月份别名']> = [];
  if (!Array.isArray(value)) {
    return output;
  }

  for (const item of value) {
    if (!是否对象(item)) {
      continue;
    }
    const 月份 = 规范化数字(读取对象字段(item, ['月份', 'month']));
    const 名称 = 规范化名称(读取对象字段(item, ['名称', 'name']));
    if (!月份 || !名称) {
      continue;
    }
    output.push({
      月份,
      名称,
      季节: 规范化名称(读取对象字段(item, ['季节', 'season'])) || undefined,
    });
  }
  return output;
}

type 运行时固定事件分组 = {
  id: string;
  名称: string;
  图标?: string;
  事件: string[];
};

function 规范化固定事件分组列表(value: unknown): 运行时固定事件分组[] {
  return 规范化对象数组(value)
    .map((item): 运行时固定事件分组 | null => {
      const id = 规范化名称(读取对象字段(item, ['id', '分组id', 'group_id', 'groupId']));
      const 名称 = 规范化名称(readRuntimeField(item, 'name')) || id;
      if (!id || !名称) {
        return null;
      }
      return {
        id,
        名称,
        图标: 规范化名称(读取对象字段(item, ['图标', 'icon', 'iconSvgFilename', 'icon_svg_filename'])) || undefined,
        事件: 取唯一文本(
          规范化单值或字符串数组(读取对象字段(item, ['事件', '固定事件', 'eventIds', 'event_ids', 'events'])),
        ),
      };
    })
    .filter((item): item is 运行时固定事件分组 => Boolean(item));
}

function 建立事件分组映射(groups: 运行时固定事件分组[]): Map<string, string> {
  const output = new Map<string, string>();
  for (const group of groups) {
    for (const eventId of group.事件) {
      if (!output.has(eventId)) {
        output.set(eventId, group.id);
      }
    }
  }
  return output;
}

function 收集节庆文本映射(rawFestivals: unknown): Map<string, string> {
  const map = new Map<string, string>();
  for (const festival of 规范化对象数组(rawFestivals)) {
    const oldTexts = 规范化对象数组(读取对象字段(festival, ['文本']));
    for (const textNode of oldTexts) {
      const 书籍id = 规范化名称(读取对象字段(textNode, ['书籍id', 'book_id', 'bookId', 'id']));
      const 条目名 = 读取条目名(textNode);
      if (书籍id && 条目名 && !map.has(书籍id)) {
        map.set(书籍id, 条目名);
      }
    }

    const nestedBooks = 规范化对象数组(读取对象字段(festival, ['补充资料', '书籍', 'materials', 'material', 'book', 'books']));
    nestedBooks.forEach((bookNode, index) => {
      const 节庆id = 规范化名称(读取对象字段(festival, ['id']));
      const 书名 = 规范化名称(读取对象字段(bookNode, ['书名', '名称', 'bookname', 'name']));
      const id =
        规范化名称(读取对象字段(bookNode, ['id', '书籍id', 'book_id', 'bookId'])) ||
        (书名 ? `${节庆id}_${书名}` : `${节庆id}__book_${index + 1}`);
      const 条目名 = 读取条目名(bookNode);
      if (id && 条目名 && !map.has(id)) {
        map.set(id, 条目名);
      }
    });
  }
  return map;
}

function 合并书籍(target: Map<string, CalendarRuntimeBookEntry>, book: CalendarRuntimeBookEntry): void {
  const existing = target.get(book.id);
  if (!existing) {
    target.set(book.id, book);
    return;
  }
  target.set(book.id, {
    ...existing,
    ...book,
    名称: book.名称 || existing.名称,
    启用: existing.启用 === false || book.启用 === false ? false : true,
    摘要: book.摘要 ?? existing.摘要,
    全文: book.全文 ?? existing.全文,
    元数据: {
      ...(existing.元数据 ?? {}),
      ...(book.元数据 ?? {}),
    },
  });
}

function 建立书籍关联事件映射(books: CalendarRuntimeBookEntry[]): Map<string, string[]> {
  const output = new Map<string, string[]>();
  for (const book of books) {
    const eventIds = 规范化单值或字符串数组(book.元数据?.关联事件);
    for (const eventId of eventIds) {
      const normalizedEventId = 规范化名称(eventId);
      if (!normalizedEventId) {
        continue;
      }
      const current = output.get(normalizedEventId) ?? [];
      current.push(book.id);
      output.set(normalizedEventId, current);
    }
  }
  return output;
}

function 规范化节庆与内嵌书籍(
  value: unknown,
  reminderDefaults: CalendarRuntimeReminderDefaults,
  bookDefaults: CalendarRuntimeBookDefaults,
  runtimeDefaults: CalendarRuntimeDefaults | undefined,
  festivalTextEntryByBookId: Map<string, string>,
  groupById: Map<string, 运行时固定事件分组>,
  groupIdByEventId: Map<string, string>,
): { 节庆: CalendarRuntimeFestivalEntry[]; 内嵌书籍: CalendarRuntimeBookEntry[] } {
  const 节庆列表: CalendarRuntimeFestivalEntry[] = [];
  const 书籍映射 = new Map<string, CalendarRuntimeBookEntry>();

  for (const item of 规范化对象数组(value)) {
    const id = 规范化名称(读取对象字段(item, ['id']));
    const 名称 = 规范化名称(读取对象字段(item, ['名称', 'name']));
    const 开始 = 规范化名称(readRuntimeField(item, 'start'));
    const 结束 = 规范化名称(readRuntimeField(item, 'end') ?? readRuntimeField(item, 'start'));
    if (!id || !名称 || !开始 || !结束) {
      continue;
    }

    const 周期 = 读取节庆周期(item);
    const 节庆共享触发 = 构建节庆共享触发映射(item, runtimeDefaults, 开始, 结束, 周期);
    const 分组 = 规范化名称(读取对象字段(item, ['分组', 'group', 'groupId', 'group_id'])) || groupIdByEventId.get(id) || '';
    const 分组信息 = 分组 ? groupById.get(分组) : undefined;
    const 相关书籍: string[] = [];
    const 节庆文本节点: CalendarRuntimeContentNode[] = [];

    相关书籍.push(
      ...规范化单值或字符串数组(
        读取对象字段(item, ['相关资料', '相关书籍', 'relatedMaterials', 'related_materials', 'relatedBooks', 'related_books']),
      ),
    );

    const nestedBooks = 规范化对象数组(读取对象字段(item, ['补充资料', '书籍', 'materials', 'material', 'book', 'books']));
    nestedBooks.forEach((rawBook, index) => {
      const bookName = 规范化名称(读取对象字段(rawBook, ['书名', '名称', 'bookname', 'name']));
      const bookId =
        规范化名称(读取对象字段(rawBook, ['id', '书籍id', 'book_id', 'bookId'])) ||
        (bookName ? `${id}_${bookName}` : `${id}__book_${index + 1}`);
      if (!bookId || !bookName) {
        return;
      }

      const 摘要源 = 读取书籍摘要源(rawBook);
      const 摘要节点 = 规范化书籍摘要节点(bookId, bookName, 摘要源, bookDefaults, 节庆共享触发);
      const 全文源 = 读取对象(rawBook, ['全文']) ?? rawBook;
      const 全文节点 = 规范化书籍全文节点(
        bookId,
        bookName,
        全文源,
        festivalTextEntryByBookId,
        节庆共享触发,
        runtimeDefaults,
      );
      if (!全文节点 && !摘要节点) {
        return;
      }

      相关书籍.push(bookId);
      if (全文节点) {
        节庆文本节点.push(全文节点);
      }
      合并书籍(书籍映射, {
        id: bookId,
        名称: bookName,
        启用: 读取对象字段(rawBook, ['启用', 'enabled']) === false ? false : true,
        摘要: 摘要节点,
        全文: 全文节点,
        元数据: {
          festivalId: id,
          festivalName: 名称,
          source: 'festival_nested',
          关联事件: [id],
        },
      });
    });

    const oldTexts = 规范化对象数组(读取对象字段(item, ['文本']));
    for (const textItem of oldTexts) {
      const 书籍id = 规范化名称(读取对象字段(textItem, ['书籍id', 'book_id', 'bookId', 'id']));
      if (书籍id) {
        相关书籍.push(书籍id);
      }
    }

    const 地点关键词 = 读取共享地点关键词(item);
    const 阶段 = 规范化节庆阶段列表(id, 名称, item, reminderDefaults, runtimeDefaults, 周期);
    const festival: CalendarRuntimeFestivalEntry = {
      id,
      名称,
      开始,
      结束,
      周期,
      启用: 读取对象字段(item, ['启用', 'enabled']) === false ? false : true,
      ...(地点关键词.length > 0 ? { 地点关键词 } : {}),
      介绍: 规范化节庆介绍节点(id, 名称, 读取对象字段(item, ['介绍', 'event']), 节庆共享触发),
      文本: 节庆文本节点,
      提醒: 规范化节庆提醒节点(id, 名称, 读取对象字段(item, ['提醒', 'reminder']), reminderDefaults, 节庆共享触发),
      阶段,
      相关书籍: 取唯一文本(相关书籍),
      元数据: {
        ...(节庆共享触发 ? { 共享条件: 节庆共享触发 } : {}),
        ...(周期 ? { 周期 } : {}),
        ...(读取节庆开始前天数(item) !== undefined ? { 开始前提醒天数: 读取节庆开始前天数(item) } : {}),
        ...(地点关键词.length > 0 ? { 地点关键词 } : {}),
        ...(分组 ? { 分组 } : {}),
        ...(分组信息?.名称 ? { 分组名称: 分组信息.名称 } : {}),
        ...(分组信息?.图标 ? { 分组图标: 分组信息.图标 } : {}),
      },
    };
    节庆列表.push(festival);
  }

  return {
    节庆: 节庆列表,
    内嵌书籍: [...书籍映射.values()],
  };
}

function 规范化顶层书籍列表(
  value: unknown,
  bookDefaults: CalendarRuntimeBookDefaults,
  festivalTextEntryByBookId: Map<string, string>,
  runtimeDefaults: CalendarRuntimeDefaults | undefined,
): CalendarRuntimeBookEntry[] {
  const output: CalendarRuntimeBookEntry[] = [];

  for (const item of 规范化对象数组(value)) {
    const id = 规范化名称(读取对象字段(item, ['id']));
    const 名称 = 规范化名称(读取对象字段(item, ['书名', '名称', 'name', 'bookname']));
    if (!id || !名称) {
      continue;
    }

    const 摘要 = 规范化书籍摘要节点(id, 名称, 读取书籍摘要源(item), bookDefaults, null);
    const 全文 = 规范化书籍全文节点(
      id,
      名称,
      读取对象(item, ['全文']) ?? item,
      festivalTextEntryByBookId,
      null,
      runtimeDefaults,
    );

    output.push({
      id,
      名称,
      启用: 读取对象字段(item, ['启用', 'enabled']) === false ? false : true,
      摘要,
      全文,
      元数据: {
        source: 'top_level_book',
        关联事件: 规范化单值或字符串数组(
          读取对象字段(item, ['关联事件', '相关事件', 'eventIds', 'event_ids', 'events']),
        ),
      },
    });
  }

  return output;
}

function 去掉未定义字段(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function 去掉空对象(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const cleaned = 去掉未定义字段(value);
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function 规范化配置档案设置(data: Record<string, unknown>, warnings: string[]): CalendarProfileConfigInput | undefined {
  const rawSettings = 读取对象字段(data, ['配置档案设置', 'Profile设置']);
  if (rawSettings === undefined) {
    return undefined;
  }
  if (!是否对象(rawSettings)) {
    warnings.push('配置档案设置 必须是对象');
    return undefined;
  }

  const rawPaths = 读取对象(rawSettings, ['路径', 'paths']) ?? {};
  const rawDate = 读取对象(rawSettings, ['日期', 'date']) ?? {};
  const rawWorldbook = 读取对象(rawSettings, ['世界书', 'worldbook']) ?? {};
  const rawVisual = 读取对象(rawSettings, ['视觉', 'visual']) ?? {};

  const config = 去掉未定义字段({
    id: 读取对象字段(rawSettings, ['id', 'Profile', 'profileId']) ?? 读取对象字段(data, ['Profile']),
    label: 读取对象字段(rawSettings, ['显示名称', 'label', '名称']),
    developerMode: 读取对象字段(rawSettings, ['开发者模式', 'developerMode']),
    paths: 去掉空对象({
      eventRoot: 读取对象字段(rawPaths, ['事件根路径', 'eventRoot']),
      tempEvents: 读取对象字段(rawPaths, ['临时事件路径', 'tempEvents']),
      repeatEvents: 读取对象字段(rawPaths, ['重复事件路径', 'repeatEvents']),
      worldTime: 读取对象字段(rawPaths, ['世界时间路径', 'worldTime', 'mvu时间路径', 'mvuTimePath']),
      worldLocation: 读取对象字段(rawPaths, ['世界地点路径', 'worldLocation', 'mvu地点路径', 'mvuLocationPath']),
    }),
    date: 去掉空对象({
      eraName: 读取对象字段(rawDate, ['纪元名', 'eraName', '纪元']),
      eraNames: 读取对象字段(rawDate, ['纪元别名', 'eraNames']),
      useChineseNumeralYear: 读取对象字段(rawDate, ['中文数字年份', 'useChineseNumeralYear']),
    }),
    worldbook: 去掉空对象({
      variableDisplayTitle: 读取对象字段(rawWorldbook, ['变量展示标题', 'variableDisplayTitle']),
      updateRuleTimeExamples: 读取对象字段(rawWorldbook, ['更新规则时间示例', 'updateRuleTimeExamples']),
      forbiddenRepeatTimeExamples: 读取对象字段(rawWorldbook, [
        '禁止重复时间示例',
        'forbiddenRepeatTimeExamples',
      ]),
    }),
    visual: 去掉空对象({
      festivalMarkerPresetId: 读取对象字段(rawVisual, ['节庆标记预设', 'festivalMarkerPresetId']),
    }),
    addons: 读取对象字段(rawSettings, ['插件', 'addons']),
  });
  return Object.keys(config).length > 0 ? (config as CalendarProfileConfigInput) : undefined;
}

export function normalizeCalendarRuntimeIndexDocument(data: unknown, warnings: string[] = []): CalendarRuntimeIndex | null {
  if (!是否对象(data)) {
    warnings.push('索引解析结果不是对象');
    return null;
  }

  const 默认设置 = 规范化默认设置({
    ...data,
    ...(是否对象(data.默认设置) ? data.默认设置 : {}),
  });
  const 提醒默认值 = 规范化提醒默认值(读取对象字段(data, ['提醒默认值']));
  const 书籍默认值 = 规范化书籍默认值(读取对象字段(data, ['书籍默认值']));
  const 原始节庆列表 = 读取对象字段(data, ['固定事件']);
  const 固定事件分组 = 规范化固定事件分组列表(
    读取对象字段(data, ['固定事件分组']),
  );
  const 分组映射 = new Map(固定事件分组.map(group => [group.id, group] as const));
  const 事件分组映射 = 建立事件分组映射(固定事件分组);
  const 节庆文本映射 = 收集节庆文本映射(原始节庆列表);
  const 节庆与书籍 = 规范化节庆与内嵌书籍(
    原始节庆列表,
    提醒默认值,
    书籍默认值,
    默认设置,
    节庆文本映射,
    分组映射,
    事件分组映射,
  );
  const 顶层书籍 = 规范化顶层书籍列表(
    读取对象字段(data, ['补充资料']),
    书籍默认值,
    节庆文本映射,
    默认设置,
  );
  const 关联书籍映射 = 建立书籍关联事件映射(顶层书籍);

  节庆与书籍.节庆.forEach(festival => {
    const linkedBookIds = 关联书籍映射.get(festival.id);
    if (!linkedBookIds?.length) {
      return;
    }
    festival.相关书籍 = 取唯一文本([...(festival.相关书籍 ?? []), ...linkedBookIds]);
  });

  const 合并后书籍 = new Map<string, CalendarRuntimeBookEntry>();
  节庆与书籍.内嵌书籍.forEach(book => 合并书籍(合并后书籍, book));
  顶层书籍.forEach(book => 合并书籍(合并后书籍, book));
  const Profile设置 = 规范化配置档案设置(data, warnings);

  return {
    Profile: 规范化名称(Profile设置?.id ?? 读取对象字段(data, ['Profile'])) || undefined,
    Profile设置,
    版本: 规范化数字(读取对象字段(data, ['版本', 'version'])),
    说明: 规范化名称(读取对象字段(data, ['说明', 'description'])) || undefined,
    索引条目名: 规范化名称(读取对象字段(data, ['索引条目名', 'index_entry'])) || undefined,
    默认值: 是否对象(读取对象字段(data, ['默认值']))
      ? (读取对象字段(data, ['默认值']) as Record<string, unknown>)
      : undefined,
    默认设置,
    内容仓库: 是否对象(读取对象字段(data, ['内容仓库']))
      ? (读取对象字段(data, ['内容仓库']) as Record<string, unknown>)
      : undefined,
    条目命名约定: 是否对象(读取对象字段(data, ['条目命名约定']))
      ? (读取对象字段(data, ['条目命名约定']) as Record<string, unknown>)
      : undefined,
    提醒默认值,
    书籍默认值,
    月份别名: 规范化月份别名(读取对象字段(data, ['月份别名'])),
    节庆: 节庆与书籍.节庆,
    书籍: [...合并后书籍.values()],
  };
}
