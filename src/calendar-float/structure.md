# Calendar Float Source Structure

`src/calendar-float/` 是月历悬浮球脚本源码。这个项目是酒馆助手脚本，不是独立 Web App；入口由 `index.ts` 初始化，最终打包为 `dist/calendar-float/index.js`。

## 根文件

- `index.ts`：脚本主入口。负责初始化 profile、变量迁移、runtime scanner、widget、host adapter，并把调试/安装函数挂到 `globalThis`
- `constants.ts`：共享常量，例如脚本名、根 DOM id
- `types.ts`：跨模块共享的月历数据类型
- `date.ts`：日期解析、格式化、范围判断、世界时间文本解析
- `host-adapter.ts`：和外部宿主页 / host 的桥接启动与清理
- `mvu-removal-archive.ts`：把 MVU 变量删除同步到月历归档的桥接逻辑
- `form-service.ts`：用户自定义事件的新增、编辑、删除等表单保存逻辑
- `event-normalizer.ts`：把原始事件数据归一化为月历可用结构
- `festival-visual.ts`：节庆标记的颜色、图标和视觉元数据选择
- `render.ts`：非 widget 专属的共享渲染辅助
- `runtime-chat-context.ts`：读取最近聊天消息、用户消息、`<gametxt>` 等 runtime 触发上下文
- `runtime-config.ts`：runtime 默认 MVU 路径与索引默认设置
- `runtime-dataset.ts`：把 runtime 世界书索引组装成 UI 使用的 `CalendarDataset`
- `runtime-month-alias.ts`：从 runtime 索引读取月份别名并生成显示文本
- `runtime-ui-dataset.ts`：widget 读取 runtime dataset 的对外门面

## 子目录

- `calendar-view-model/`：把 dataset 转为月视图格子、日程列表、月内条形 chip 等 UI view model
- `fixed-event-index-editor/`：`[fixed_event_index]` 结构化编辑器，见 `fixed-event-index-editor/structure.md`
- `profile/`：通用月历 / 命定之诗 profile 检测与路径配置
- `runtime-trigger-evaluator/`：runtime 命中判定、日期窗口、关键词、提醒和内容解析
- `runtime-worldbook/`：世界书索引来源发现、YAML 读取、schema-ish 归一化、正文解析、scanner bootstrap
- `storage/`：聊天变量、消息变量、归档策略、世界书来源配置、事件颜色和标签建议
- `widget/`：悬浮月历 UI、事件绑定、渲染和样式，见 `widget/structure.md`
- `worldbook-manager/`：脚本托管的基础设施世界书条目安装、重装、卸载、诊断和搬运
- `dlc_ellia/`：命定之诗相关 DLC 扩展逻辑，例如艾莉亚票券渲染

## 修改路线

- 只改世界书索引结构：优先改 `fixed-event-index-editor/` 的 parse / serialize / edit / panel
- 只改 runtime 读取兼容性：优先改 `runtime-worldbook/loader.ts` 和对应 check
- 只改命中条件：优先改 `runtime-trigger-evaluator/`
- 只改 UI 展示：优先改 `widget/render.ts`、`widget/index.ts`、`widget/style-parts/`
- 只改持久化：优先改 `storage/`，注意不要改现有变量 key，除非有迁移计划
