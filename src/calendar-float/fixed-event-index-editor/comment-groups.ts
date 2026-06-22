import type { FixedEventGroupDraft } from './draft-types';

interface LegacyCommentGroupPreset {
  id: string;
  name: string;
  iconSvgFilename?: string;
}

export interface LegacyCommentGroupMigration {
  groups: FixedEventGroupDraft[];
  eventGroupIds: Record<string, string>;
}

const LEGACY_EVENT_LIST_KEYS = new Set(['固定事件']);

const LEGACY_COMMENT_GROUP_PRESETS: Record<string, LegacyCommentGroupPreset> = {
  基础历法固定节日: {
    id: 'basic_calendar',
    name: '基础历法固定节日',
  },
  诺斯加德联盟节庆: {
    id: 'nordgard',
    name: '诺斯加德联盟节庆',
    iconSvgFilename: '诺斯加德联盟_snowflake-solid-full.svg',
  },
  精灵文明艾尔文海姆节庆: {
    id: 'alfheim',
    name: '精灵文明艾尔文海姆节庆',
    iconSvgFilename: '精灵文明_leaf-solid-full.svg',
  },
  索伦蒂斯王国节庆: {
    id: 'solentis',
    name: '索伦蒂斯王国节庆',
    iconSvgFilename: '索伦蒂斯王国_chess-queen-regular-full.svg',
  },
  奥古斯提姆帝国节庆: {
    id: 'augustim',
    name: '奥古斯提姆帝国节庆',
    iconSvgFilename: '奥古斯提姆帝国_landmark-flag-solid-full.svg',
  },
  圣都梵尼亚节庆: {
    id: 'vania',
    name: '圣都梵尼亚节庆',
    iconSvgFilename: '翼民圣都_feather-solid-full.svg',
  },
  萨赫拉联邦节庆: {
    id: 'sahra',
    name: '萨赫拉联邦节庆',
    iconSvgFilename: '萨赫拉联邦_sun-solid-full.svg',
  },
  伯伦斯法环节庆: {
    id: 'berens',
    name: '伯伦斯法环节庆',
    iconSvgFilename: '伯伦斯法环_hat-wizard-solid-full.svg',
  },
  赛瑞利亚节庆: {
    id: 'sairelia',
    name: '赛瑞利亚节庆',
  },
};

function getIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function parseTopLevelKey(line: string): { indent: number; key: string } | null {
  const match = line.match(/^(\s*)([^#:\s][^:]*):\s*(?:#.*)?$/);
  if (!match) {
    return null;
  }
  return {
    indent: match[1].length,
    key: match[2].trim(),
  };
}

function parseCommentHeading(line: string): string | null {
  const match = line.match(/^\s*#\s*(.+?)\s*$/);
  return match?.[1]?.trim() || null;
}

function parseEventId(line: string): string | null {
  const match = line.match(/^\s*-\s+id\s*:\s*(.+?)\s*$/);
  if (!match) {
    return null;
  }
  const rawValue = match[1].replace(/\s+#.*$/, '').trim();
  const quoted = rawValue.match(/^['"](.+)['"]$/);
  return (quoted?.[1] ?? rawValue).trim() || null;
}

function makeFallbackPreset(name: string, index: number): LegacyCommentGroupPreset {
  return {
    id: `comment_group_${index + 1}`,
    name,
  };
}

export function extractLegacyCommentGroupsFromYaml(content: string, validEventIds: string[]): LegacyCommentGroupMigration {
  const validEventIdSet = new Set(validEventIds);
  const lines = String(content || '').split(/\r?\n/);
  const groupOrder: string[] = [];
  const eventIdsByGroup = new Map<string, string[]>();
  const eventGroupIds: Record<string, string> = {};

  let isInsideEventList = false;
  let eventListIndent = 0;
  let eventItemIndent: number | undefined;
  let currentGroupName: string | undefined;

  for (const line of lines) {
    if (!isInsideEventList) {
      const topLevelKey = parseTopLevelKey(line);
      if (topLevelKey && LEGACY_EVENT_LIST_KEYS.has(topLevelKey.key)) {
        isInsideEventList = true;
        eventListIndent = topLevelKey.indent;
        eventItemIndent = undefined;
        currentGroupName = undefined;
      }
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const indent = getIndent(line);
    if (indent <= eventListIndent && !line.trim().startsWith('#')) {
      break;
    }

    const eventId = parseEventId(line);
    if (eventId) {
      if (eventItemIndent === undefined) {
        eventItemIndent = indent;
      }
      if (indent === eventItemIndent && currentGroupName && validEventIdSet.has(eventId)) {
        const preset = LEGACY_COMMENT_GROUP_PRESETS[currentGroupName] ?? makeFallbackPreset(currentGroupName, groupOrder.length);
        if (!eventIdsByGroup.has(preset.id)) {
          groupOrder.push(preset.id);
          eventIdsByGroup.set(preset.id, []);
        }
        eventIdsByGroup.get(preset.id)?.push(eventId);
        eventGroupIds[eventId] = preset.id;
      }
      continue;
    }

    const commentHeading = parseCommentHeading(line);
    if (commentHeading && indent > eventListIndent && (eventItemIndent === undefined || indent === eventItemIndent)) {
      currentGroupName = commentHeading;
    }
  }

  const groups = groupOrder.map((groupId, index) => {
    const eventIds = eventIdsByGroup.get(groupId) ?? [];
    const preset =
      Object.values(LEGACY_COMMENT_GROUP_PRESETS).find(candidate => candidate.id === groupId) ??
      makeFallbackPreset(groupId, index);
    return {
      id: preset.id,
      name: preset.name,
      iconSvgFilename: preset.iconSvgFilename,
      eventIds: [...new Set(eventIds)],
      unknownFields: {},
    };
  });

  return {
    groups,
    eventGroupIds,
  };
}
