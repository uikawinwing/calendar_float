# Widget Structure

`widget/` 负责悬浮月历的可见 UI。它运行在酒馆页面环境里，使用 jQuery 绑定事件，样式通过 `teleportStyle()` 注入到宿主页。

## 文件职责

- `index.ts`：widget 主控制器
  - 管理 UI state / refs
  - 启动、刷新、打开 / 关闭面板
  - 打开管理世界书对话框、固定事件索引编辑器、标签颜色面板
  - 编排固定事件索引编辑器的字段收集、YAML preview 同步、行操作和保存
- `date-actions.ts`：日期 key 解析和世界时间格式化
- `dialog-policy.ts`：toast / confirmation 决策模型
- `event-action-policy.ts`：保存、删除、归档、颜色等交互的用户提示决策
- `fixed-event-editor-host.ts`：固定事件索引编辑器 loading model 和月份别名回填
- `fixed-event-editor-bindings.ts`：固定事件索引编辑器 DOM 事件绑定
- `fixed-event-editor-row-actions.ts`：固定事件索引编辑器行操作 command 构造
- `fixed-event-editor-scroll.ts`：固定事件索引编辑器 scroll snapshot / restore
- `events.ts`：主月历 UI 的 DOM 事件绑定
  - 月份切换、日期选择、表单保存、归档操作、书籍阅读器、标签颜色等
- `event-binding/`：主月历事件绑定的可测试辅助逻辑
  - `types.ts`：widget sidebar / agenda sort / bucket / festival scope 的共享 mode 类型和常量
  - `parsers.ts`：DOM attribute / select value 到 widget action 参数的解析
- `render.ts`：主 UI HTML 渲染辅助
  - 月历格子、议程列表、书籍阅读器、归档列表
- `form-render.ts`：事件表单 HTML 渲染辅助
- `day-detail.ts`：选中日期详情模型和 fallback 日期标题
- `layout.ts`：悬浮窗位置、拖动、视口适配、全屏状态
- `style.ts`：样式注入入口
- `style-parts/`：拆分后的 CSS 字符串
- `helpers/color.ts`：颜色合法性、对比色、标签颜色工具
- `helpers/markdown.ts`：Markdown / HTML 转义和安全渲染辅助

## 与固定事件索引编辑器的关系

- 编辑器 HTML 由 `fixed-event-index-editor/panel.ts` 生成
- 编辑器 loading model 和运行时月份别名回填由 `widget/fixed-event-editor-host.ts` 生成
- widget 负责连接 DOM 和 editor API：
  - 收集 `[data-role="fixed-event-edit-row"]` 和 `[data-role="fixed-event-stage-row"]`
  - 调用 `applyFixedEventIndexStructuredEditsToYaml()` 同步 YAML
  - 调用 `applyFixedEventIndexRowOperationsToYaml()` 新增、删除、移动行
  - 调用 `saveFixedEventIndexDraftToWorldbook()` 保存到世界书
  - 通过 `fixed-event-editor-bindings.ts` 连接 DOM 事件和 host handler

## Host Boundary

`index.ts` owns browser lifecycle, DOM event binding, effect execution, and rendering orchestration only.

不要把这些东西继续塞进 `index.ts`：

- 纯 policy
- 日期格式化
- fixed-event editor model construction
- native dialog 文案
- YAML 结构变换
- profile 解析

当前已拆出的边界：

- `date-actions.ts`：纯日期 key 和世界时间格式化辅助
- `dialog-policy.ts`：toast / confirmation 决策
- `event-action-policy.ts`：save / delete / archive / color flow 决策
- `fixed-event-editor-host.ts`：固定事件编辑器 loading / backfill model
- `fixed-event-editor-bindings.ts`：固定事件编辑器 selector 和 DOM event wiring
- `fixed-event-editor-row-actions.ts`：固定事件编辑器行操作 command builder
- `fixed-event-editor-scroll.ts`：固定事件编辑器 scroll snapshot
- `event-binding/types.ts`：共享 widget mode 类型和常量
- `event-binding/parsers.ts`：主 widget event binding 的 parser helper
- `managed-worldbook/`：managed-worldbook-specific dialog and notice policy

## 修改建议

- 新增普通月历交互：优先看 `events.ts`
- 新增主要 UI 区块：优先看 `render.ts`
- 新增事件表单字段：优先看 `form-render.ts`
- 新增日期详情行为：优先看 `day-detail.ts`
- 新增固定事件索引编辑器按钮：通常需要同时改 `fixed-event-index-editor/panel.ts`、`widget/fixed-event-editor-bindings.ts` 和 `widget/index.ts`
- 修改视觉样式：优先改 `style-parts/base.ts`，移动端补 `style-parts/responsive.ts`
- 不要在 widget 中直接改世界书结构；世界书 YAML 变换应放在 `fixed-event-index-editor/edit.ts`
