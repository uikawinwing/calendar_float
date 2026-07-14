# Calendar Float Source Structure

`src/calendar-float/` 是月历悬浮球脚本源码。这个项目是 Tavern Helper 浏览器脚本，不是独立 Web App；入口由 `index.ts` 初始化，最终打包为 `dist/calendar-float/index.js`。

## 根文件

- `index.ts`：脚本主入口。初始化 profile、变量迁移、runtime scanner、widget、host adapter，并把调试 / 安装函数挂到 `globalThis`
- `constants.ts`：共享常量，例如脚本名、根 DOM id
- `types.ts`：跨模块共享的月历数据类型
- `date.ts`：日期解析、格式化、范围判断、世界时间文本解析
- `festival-date-range.ts`：节庆月日范围的唯一纯 resolver；统一规范化、最近举办年、周期、跨年、提醒预窗口与状态
- `host-adapter.ts`：和外部宿主页 / host 的桥接启动与清理
- `mvu-removal-archive.ts`：把 MVU 变量删除同步到月历归档的桥接逻辑
- `form-service.ts`：用户自定义事件的新增、编辑、删除等表单保存逻辑
- `event-normalizer.ts`：把原始事件数据归一化为月历可用结构
- `festival-icons.ts`：打包内置 SVG icon，并提供文件名到 SVG 的映射
- `festival-visual-types.ts`：节庆视觉 preset 的共享类型
- `festival-visual.ts`：通用节庆标记选择逻辑；profile 专属 preset 由 `profile/` 提供
- `runtime-ui-dataset.ts`：widget 读取 runtime dataset 的对外门面
- `runtime-chat-context.ts`：从聊天消息提取 runtime 扫描需要的文本上下文
- `runtime-config.ts`：旧 runtime 配置门面；新 profile 逻辑优先看 `profile/` 和 `runtime-worldbook/config.ts`
- `runtime-month-alias.ts`：月份别名读取门面

## 子目录

- `calendar-view-model/`：把 dataset 转为月视图格子、日程列表、月内条形 chip 等 UI view model
- `fixed-event-index-editor/`：`[fixed_event_index]` 结构化编辑器，见 `fixed-event-index-editor/structure.md`
- `profile/`：通用月历 / 命定之诗 profile 检测、路径配置、日期设置和 profile 专属视觉 preset
- `runtime-dataset/`：把世界书索引、主动事件、归档事件、节庆和读物组装成 UI 使用的 `CalendarDataset`；单次 load 传递 operation-scoped worldbook snapshot
- `runtime-trigger-evaluator/`：runtime 命中判定、日期窗口、关键词、提醒和内容解析
- `runtime-worldbook/`：世界书索引来源发现、YAML 读取、schema 归一化、正文解析、runtime defaults、月份别名、scanner 输入上下文和 bootstrap；snapshot 不跨 operation 复用，scanner 在同一 generation 内 single-flight，teardown 后新 generation 不等待旧任务
- `storage/`：聊天变量、消息变量、归档策略、世界书来源配置、事件颜色和标签建议
- `widget/`：悬浮月历 UI、事件绑定、渲染和样式，见 `widget/structure.md`
- `worldbook-manager/`：脚本托管的基础设施世界书条目安装、重装、卸载、诊断和搬运
- `dlc_ellia/`：命定之诗相关 DLC 扩展逻辑，例如艾莉亚票券渲染

## 修改路线

- 只改固定事件 YAML 结构：优先改 `fixed-event-index-editor/parse.ts`、`serialize.ts`、`edit.ts` 和对应 check
- 只改 profile 时间 / 地点 / 纪元解析：优先改 `profile/` 和 `runtime-worldbook/config.ts`
- 只改 runtime 读取兼容性：优先改 `runtime-worldbook/loader.ts`、`normalizer.ts` 和对应 check
- 只改 UI dataset 组装：优先改 `runtime-dataset/`，widget 仍从 `runtime-ui-dataset.ts` 门面读取
- 只改命中条件：优先改 `runtime-trigger-evaluator/`
- 只改节庆月日范围、跨年或提醒预窗口：优先改 `festival-date-range.ts`；dataset 与 evaluator 只保留兼容 facade，不要再各自推断年份
- 只改 profile 专属节庆图标 / 颜色规则：优先改 `profile/festival-visual-presets.ts`
- 只改 UI 展示：优先改 `widget/render.ts`、`widget/form-render.ts`、`widget/day-detail.ts`、`widget/index.ts`、`widget/style-parts/`
- 只改持久化：优先改 `storage/`，不要改现有变量 key，除非有迁移计划

## 不要再做的事

- 不要把《命定之诗》的地点、节庆、颜色规则塞回通用模块
- 不要在 `widget/index.ts` 增加新的纯函数和 YAML 变换
- 不要为新 profile 复制 `[DLC][扩展]` 这类旧命名前缀
- 不要把旧字段 `默认设置.mvu时间路径` / `默认设置.mvu地点路径` 写成新文档示例；它们只属于 fallback
- 不要把新的 `.check.ts` 放在 `src/`；check 统一放到 `checks/calendar-float/`，按原模块路径分目录
- 不要绕过 `runtime-worldbook/snapshot.ts` 在一次 dataset/scan 内重复读取同一世界书，也不要给 scanner 加平行 publish 通道
