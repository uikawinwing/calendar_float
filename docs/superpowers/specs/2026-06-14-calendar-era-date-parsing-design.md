# Calendar Era Date Parsing Design

## Goal

Add a shareable calendar-era parsing configuration to the fixed event index, so creators can ship one lorebook that defines:

- the era label shown in the calendar UI
- whether world time may use Chinese-number year/month/day text
- how MVU world time is parsed under the generic calendar profile

This feature must let creators configure a world like `太初`, share that index YAML to other users, and have both parsing and UI display work without per-chat manual setup.

## User Problem

The current generic profile only parses numeric formats such as:

- `488年-6月5日`
- `488-06-05`

It does not support:

- era-prefixed world dates such as `太初二年五月二十三日`
- pure Chinese-number dates such as `二零零六年五月二十三日`
- UI display of a configured era label such as `复兴纪元488年`

Creators therefore cannot bundle their world calendar format into the fixed event index and expect it to work for others.

## Scope

This design covers three connected behaviors:

1. Add a new top-level fixed-event-index setting section for time parsing
2. Expose that setting in the fixed event index editor near month aliases
3. Use that setting in runtime date parsing and month-title rendering

This design does not include:

- multi-era aliases
- automatic calendar conversion between `公元`, `民國`, `U.C.` and similar systems
- arbitrary user-defined parsing grammars
- support for rare Chinese day forms such as `廿三`, `卅一`, `初五`
- chat-local MVU parsing overrides for era format

## Recommended Approach

### Option 1: Fixed Event Index As Source Of Truth

Store era parsing settings in the fixed event index YAML and use that single source for:

- editor controls
- runtime parsing
- UI title rendering

Pros:

- shareable with lorebook/index distribution
- no split between parsing config and worldbook config
- fits the existing month-alias authoring workflow

Cons:

- requires parser, serializer, editor UI, and runtime integration

### Option 2: Chat Runtime Setting

Store the era parsing settings alongside current MVU path settings.

Pros:

- smallest implementation

Cons:

- not shareable through worldbook export
- conflicts with creator-driven world distribution

### Option 3: Hardcode Generic Profile Support

Bake a few extra formats directly into the generic parser without index-configurable settings.

Pros:

- fast to implement

Cons:

- not world-specific
- no creator control over displayed era label
- becomes ambiguous once different worlds want different era names

### Recommendation

Use Option 1.

The fixed event index should become the source of truth for shareable era parsing rules, just like it already is for month aliases and fixed-event defaults.

## YAML Shape

Add a new top-level section, sibling to `月份别名`:

```yaml
时间解析设置:
  纪年名称: 太初
  年份使用中文数字: true
```

Only two fields are needed in first version:

- `纪年名称`
- `年份使用中文数字`

Behavior:

- if `纪年名称` is present, the calendar title uses it as a prefix
- if `年份使用中文数字` is `true`, parser enables Chinese-number year/month/day parsing
- if `纪年名称` is empty, UI falls back to current no-prefix year display
- if `年份使用中文数字` is absent or `false`, parser keeps current numeric-only behavior plus existing month-alias support

## Draft Model Changes

Extend the fixed-event-index draft with a new top-level object:

```ts
interface FixedEventIndexDraft {
  entryName: string;
  worldbookName: string;
  canSave: boolean;
  saveBlockedReasons: string[];
  warnings: string[];
  metadata: FixedEventIndexMetadataDraft;
  defaults: FixedEventDefaultsDraft;
  reminderDefaults: FixedEventReminderDefaultsDraft;
  bookDefaults: FixedEventBookDefaultsDraft;
  timeParsing: FixedEventTimeParsingDraft;
  monthAliases: FixedEventMonthAliasDraft[];
  groups: FixedEventGroupDraft[];
  events: FixedEventDraft[];
  materials: FixedEventMaterialDraft[];
  unknownTopLevelFields: Record<string, unknown>;
}

interface FixedEventTimeParsingDraft {
  eraName?: string;
  useChineseNumeralYear?: boolean;
  unknownFields: Record<string, unknown>;
}
```

YAML aliases to read:

- `时间解析设置`
- `timeParsing`
- `time_parsing`

Field aliases to read:

- `纪年名称`
- `era`
- `eraName`
- `年份使用中文数字`
- `useChineseNumeralYear`
- `use_chinese_numeral_year`

Preferred YAML output remains:

```yaml
时间解析设置:
  纪年名称: 太初
  年份使用中文数字: true
```

## Editor UI Design

### Placement

Show the new settings in the fixed event index editor `基础设置` page, adjacent to `月份别名`.

Recommended order:

1. MVU and book defaults
2. reminder defaults
3. book defaults
4. time parsing settings
5. month aliases

### Controls

The new `时间解析设置` block should contain:

- `纪年名称` text input
- `年份使用中文数字` boolean select
- read-only parse preview line

Suggested UI copy:

- `纪年名称`: shown before the year in the calendar title
- `年份使用中文数字`: allows inputs such as `二零零六年五月二十三日`

### Parse Preview

The editor should show a live preview using the current draft settings.

When:

- `纪年名称 = 太初`
- `年份使用中文数字 = true`

Show:

`太初二年五月二十三日 -> 太初 / 2 / 5 / 23 -> OK`

If parsing fails:

`太初二年五月二十三日 -> 无法解析`

This preview is a warning aid, not a save gate.

### Validation

Do not block save just because preview parsing fails.

First version validation rules:

- `纪年名称` may be empty
- `年份使用中文数字` must resolve to `true`, `false`, or `undefined`
- preview failure adds a warning, not a blocking issue

Blocking save is reserved for structural loss or unsupported YAML, not incomplete authoring.

## Runtime Parsing Design

### Core Rule

Do not replace the current parser. Layer the new behavior in front of the existing parser.

Recommended parse order inside `parseWorldDateAnchor()`:

1. index-configured era/chinese-numeral parsing
2. existing `488年-6月5日` / `488年6月5日` style parsing
3. existing `YYYY-MM-DD` style fallback

This preserves backward compatibility while enabling richer world-specific formats.

### New Runtime Options

Extend parse options:

```ts
interface ParseWorldDateAnchorOptions {
  monthAliases?: CalendarMonthAliasRecord[];
  eraName?: string;
  useChineseNumeralYear?: boolean;
}
```

These values should come from normalized runtime index defaults, not from profile hardcoding.

### Supported New Formats

When `年份使用中文数字 = true`, parser should support:

- `太初二年五月二十三日`
- `太初488年五月二十三日`
- `二零零六年五月二十三日`
- `二〇〇六年五月二十三日`
- `488年五月二十三日`

These should parse to:

- `太初二年五月二十三日` -> `{ year: 2, month: 5, day: 23 }`
- `太初488年五月二十三日` -> `{ year: 488, month: 5, day: 23 }`
- `二零零六年五月二十三日` -> `{ year: 2006, month: 5, day: 23 }`

The parser should also continue to support:

- `488年-5月23日`
- `488年5月23日`
- `488-05-23`

### Chinese Numeral Support Boundary

First version should support:

- year:
  - `二`
  - `十二`
  - `九十五`
  - `二零零六`
  - `二〇〇六`
- month:
  - `五`
  - `十一`
  - `十二`
- day:
  - `二十三`
  - `三十一`

First version should not support:

- `廿三`
- `卅一`
- `初五`

Those can be added later if needed.

### Era Name Behavior

`纪年名称` is a parsing/display prefix, not a calendar conversion rule.

Examples:

- `纪年名称 = 太初`, input `太初二年五月二十三日` -> year `2`
- `纪年名称 = 复兴纪元`, input `复兴纪元488年五月二十三日` -> year `488`

The parser should not convert era years into Gregorian years. It only extracts the year number used by the world calendar.

If `纪年名称` is configured, parser should accept both:

- with prefix: `太初二年五月二十三日`
- without prefix: `二年五月二十三日`

Reason:

- creators may want display prefix without forcing every MVU source to include it
- this keeps the parser permissive and backward-compatible

If strict prefix-only parsing is ever needed, that should be a later option, not first-version behavior.

## Chinese Number Parsing Strategy

Implement a small, deterministic conversion helper in `date.ts`.

Needed helpers:

- normalize mixed `〇` / `零`
- detect pure digit strings vs Chinese-number strings
- convert simple Chinese numerals into integers

Recommended behavior:

- if string contains ASCII digits, parse directly
- else if Chinese-number mode is enabled, convert Chinese-number tokens
- reject ambiguous or unsupported tokens cleanly

Conversion rules should support the common worldbuilding styles:

- positional year text like `二零零六`
- unit-based numbers like `二十三`, `九十五`

## Runtime Index Integration

The runtime index normalizer should preserve the new section so the widget can read it without re-parsing raw YAML at render time.

Recommended normalized shape:

```ts
interface CalendarRuntimeIndex {
  时间解析设置?: {
    纪年名称?: string;
    年份使用中文数字?: boolean;
  };
}
```

Any place that currently calls:

- `parseWorldDateAnchor()`
- `parseWorldDateText()`
- `readCurrentWorldTime()`

should receive the normalized time parsing options from runtime index alongside month aliases.

## Calendar Title UI

### Goal

Display configured era name in the main month title.

Current style:

- `488年・1月(苏醒)`

New style when era exists:

- `复兴纪元488年・1月（苏醒）`

New style when no era exists:

- `488年・1月（苏醒）`

Behavior:

- `纪年名称` prefixes only the displayed year
- month alias remains unchanged except bracket style becomes full-width `（ ）`

Recommended implementation:

- extend the month-title formatting helper instead of rebuilding title strings in widget render code
- feed era label from runtime index config into the same formatting path that already handles month aliases

## Error Handling

User-facing behavior:

- if configured preview sample cannot parse, show warning in the fixed-event-index editor
- if current world time cannot parse at runtime, keep existing fallback behavior
- do not crash UI because era parsing config is incomplete or malformed

Developer-facing behavior:

- `console.warn` for malformed `时间解析设置`
- no repeated toast spam for parse-preview failure during typing

## Backward Compatibility

This feature must not break:

- existing fixed event index files with no `时间解析设置`
- existing fate-poem month alias behavior
- existing `488年-6月5日` parsing
- existing `YYYY-MM-DD` parsing

If `时间解析设置` is absent:

- parser behaves as it does today
- title remains `488年・1月（苏醒）` style without era prefix

## Verification Strategy

Implementation should begin with parser-first checks.

Required checks:

- parse fixed event index with `时间解析设置`
- serialize fixed event index with `时间解析设置`
- parse `太初二年五月二十三日`
- parse `二零零六年五月二十三日`
- parse `488年五月二十三日`
- preserve old parsing for `488年-5月23日`
- month title renders `复兴纪元488年・1月（苏醒）`
- editor preview reflects configured settings

Suggested check files:

- `fixed-event-index-editor-time-parsing-settings.check.ts`
- `calendar-date-chinese-era-parsing.check.ts`
- `calendar-month-title-era-label.check.ts`

And still run:

- `pnpm run build:dev`

## Implementation Boundaries

This feature intentionally stops at:

- one era label
- one boolean for Chinese-number support
- parser support for common Chinese-number year/month/day text
- title display support

It intentionally avoids:

- arbitrary parsing DSL
- multiple eras in one index
- automatic modern-calendar conversion
- retrofitting unrelated profile systems

This keeps the feature small enough to implement safely while still solving the creator-sharing workflow.
