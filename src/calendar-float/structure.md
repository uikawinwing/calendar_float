# Calendar Float Source Structure

`src/calendar-float/` 是 Calendar Float 的 Tavern Helper 浏览器脚本源码。

它的产品职责只有两层：

1. **Temporal UI**：把角色卡已有的固定/动态时间事项整理成玩家可读的月历
2. **Temporal Reminder**：根据角色卡世界时间判断事项是否即将或已经到时，并向 LLM 提供时间信号

它不拥有任务进度、新闻、世界事件阶段、剧情后果、系统历史或回忆数据库。

## 主要数据流

```text
世界时间 ───────────────┐
[fixed_event_index] ───┼─> runtime dataset ─> Calendar UI
MVU 动态时间事项 ──────┘             └──────> timed reminder -> LLM
```

到时 reminder 只说明时间条件成立，不修改其他业务系统状态，也不自动决定剧情结果。

## 根文件

- `index.ts`：runtime 生命周期入口；初始化 profile、变量兼容、scanner、widget 与 host adapter
- `constants.ts`：脚本名、DOM id、变量路径等共享常量
- `types.ts`：Calendar runtime/UI 共用类型
- `date.ts`：世界日期解析、格式化、范围计算
- `event-normalizer.ts`：读取动态事项并把旧数据迁移为当前薄 schema
- `event-reminder.ts`：动态事项的时间判断与 `<calendar_reminder>` 构建
- `festival-date-range.ts`：固定节庆日期范围、跨年与 recurrence resolver
- `runtime-context.ts`：角色/聊天切换与 lifecycle generation
- `host-adapter.ts`：与 SillyTavern/Tavern Helper 宿主页的桥接
- `form-service.ts`：玩家新增/编辑动态时间事项
- `festival-visual.ts` / `festival-visual-types.ts`：固定事项视觉规则
- `runtime-ui-dataset.ts`：widget 读取 runtime dataset 的门面
- `runtime-chat-context.ts`：runtime 扫描所需的聊天上下文

旧 `可见性` 只作为旧存档/旧 Widget 的迁移桥接，不属于新的持久化数据契约。

## 子目录

- `calendar-view-model/`：把 dataset 转成月格、agenda、提醒状态等纯 UI model
- `fixed-event-index-editor/`：`[fixed_event_index]` 的结构化编辑、校验、序列化与保存
- `profile/`：不同角色卡的 MVU 时间/地点路径、纪元和日期解析配置
- `runtime-dataset/`：合并固定事项、动态事项、资料与当前世界时间
- `runtime-trigger-evaluator/`：固定节庆/正文的时间窗口、关键词与提醒判定
- `runtime-worldbook/`：发现、读取、归一化 `[fixed_event_index]` 与相关正文世界书
- `storage/`：动态事项持久化、Calendar settings、来源配置、标签与旧数据迁移
- `widget/`：悬浮月历 UI、表单与交互
- `worldbook-manager/`：Calendar 管理的世界书规则安装、诊断、搬运与卸载
- `dlc_ellia/`：《命定之诗》专属可选 addon，不属于通用 Calendar core

## Storage 边界

新的 Calendar storage 只长期拥有：

- `stat_data.事件.月历.[事件ID]`：动态时间事项
- Calendar script settings：世界书来源、标签颜色、提醒去重等 UI/runtime 设置

Calendar **不再拥有 Archive / Memory store**。

重构期间 `storage/archive-actions.ts`、`archive-settings.ts`、`archive-store.ts` 仅是旧 Widget host 的无状态兼容 facade：

- `completed` 永远为空
- 不会创建或恢复历史记录
- 旧“归档/完成”调用最终只会删除 active item，或成为 no-op
- 只有仍然有效的来源设置、标签颜色等会迁入 `calendar_float_store.settings`

当 Widget host 不再引用这些旧 API 后，应直接删除这些 facade。

## 修改路线

- 改动态 MVU schema / 旧存档迁移：`event-normalizer.ts`、`storage/active-buckets.ts`
- 改动态事项到时提醒：`event-reminder.ts` 与 `runtime-worldbook/scanner.ts`
- 改固定世界日程 schema：`fixed-event-index-editor/` 与 `runtime-worldbook/`
- 改固定节庆提醒：`runtime-trigger-evaluator/`
- 改 Calendar UI：`widget/` 与 `calendar-view-model/`
- 改 profile 时间/地点/纪元：`profile/` 与 `runtime-worldbook/config.ts`
- 改来源/标签等脚本设置：`storage/calendar-settings.ts`

## Core 判断规则

准备给 Calendar Float 加功能时先问：

> 这个功能的主要职责，是读取时间、显示时间、比较时间，还是在时间到达时提醒？

如果答案都不是，它通常不属于 Calendar core。

例如：

- 任务完成条件 -> Mission system
- 世界事件阶段 -> World Event system
- 新闻内容 -> News system
- 自动剧情历史 -> 不属于 Calendar
- NPC 主动写下的 Diary -> 可以作为未来的**带日期内容来源**接入 Calendar，但 Diary 内容本身由 Diary/NPC 系统拥有

## 不要再做的事

- 不要让 Calendar 自行规划隐藏剧情
- 不要因为时间到了就判定任务成功/失败或强制触发世界事件
- 不要恢复 Archive / Memory 系统历史数据库
- 不要把任务、新闻或世界事件状态复制进月历
- 不要把一次性/重复事项重新拆成持久化父目录
- 不要在世界时间解析失败时回退到现实电脑时间
- 不要把《命定之诗》的专属规则硬编码回通用模块
