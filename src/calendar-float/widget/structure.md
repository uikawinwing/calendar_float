# Widget Structure

`widget/` 负责悬浮月历的可见 UI。它运行在酒馆页面环境里，使用 jQuery 绑定事件，样式通过 `teleportStyle()` 注入到宿主页。

## 文件职责

- `index.ts`：widget 主控制器
  - 管理 UI state / refs
  - 启动、刷新、打开 / 关闭面板
  - 打开管理世界书对话框、固定事件索引编辑器、标签颜色面板
  - 处理固定事件索引编辑器的结构化字段收集、YAML preview 同步、行操作按钮
- `events.ts`：主月历 UI 的 DOM 事件绑定
  - 月份切换、日期选择、表单保存、归档操作、书籍阅读器、标签颜色等
- `render.ts`：主 UI HTML 渲染辅助
  - 月历格子、日期详情、议程列表、书籍阅读器、归档列表、表单片段
- `layout.ts`：悬浮窗位置、拖动、视口适配、全屏状态
- `style.ts`：样式注入入口
- `style-parts/`：拆分后的 CSS 字符串
  - `base.ts`：基础浅色主题、主布局、对话框、编辑器样式
  - `dark.ts`：暗色主题覆盖
  - `overrides.ts`：一般覆盖
  - `responsive.ts`：窄屏和移动端适配
  - `final-overrides.ts`：最后加载的高优先级修正
  - `index.ts`：按顺序拼接所有 style parts
- `helpers/color.ts`：颜色合法性、对比色、标签颜色工具
- `helpers/markdown.ts`：Markdown / HTML 转义和安全渲染辅助

## 与固定事件索引编辑器的关系

- 编辑器 HTML 由 `fixed-event-index-editor/panel.ts` 生成
- widget 在 `index.ts` 中负责：
  - 收集 `[data-role="fixed-event-edit-row"]` 和 `[data-role="fixed-event-stage-row"]` 的输入值
  - 调用 `applyFixedEventIndexStructuredEditsToYaml()` 同步 YAML
  - 调用 `applyFixedEventIndexRowOperationsToYaml()` 新增、删除、移动行
  - 调用 `saveFixedEventIndexDraftToWorldbook()` 保存到世界书

## 修改建议

- 新增普通月历交互：优先看 `events.ts`
- 新增主要 UI 区块：优先看 `render.ts`，必要时由 `index.ts` 接 state
- 新增固定事件索引编辑器按钮：通常需要同时改 `fixed-event-index-editor/panel.ts` 和 `widget/index.ts`
- 修改视觉样式：优先改 `style-parts/base.ts`，移动端补 `style-parts/responsive.ts`
- 不要在 widget 中直接改世界书结构；世界书 YAML 变换应放在 `fixed-event-index-editor/edit.ts`
