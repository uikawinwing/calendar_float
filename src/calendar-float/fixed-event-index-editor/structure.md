# Fixed Event Index Editor Structure

本目录负责 `[fixed_event_index]` / `[节庆_索引]` 的读取、结构化编辑、校验、序列化和保存。它不直接负责 runtime 扫描，也不负责月历主 UI 渲染。

## 文件职责

- `index.ts`：公共导出门面。外部模块应优先从这里导入编辑器 API
- `draft-types.ts`：编辑器 draft 类型、校验类型和内置图标文件名
- `parse.ts`：把 YAML 文本解析成 `FixedEventIndexDraft`
  - 读取 preferred 字段：`固定事件分组`、`固定事件`、`补充资料`
  - 兼容旧字段：`节庆`、`书籍`、`event`、`reminder`、`books`
  - 保留未知字段，避免结构化编辑洗掉暂未支持的 YAML 内容
- `serialize.ts`：把 `FixedEventIndexDraft` 写回 preferred YAML
  - 主要输出 `固定事件分组`、`固定事件`、`补充资料`
  - 负责把默认值、月份别名、阶段、提醒、补充资料等写成稳定结构
- `edit.ts`：纯 YAML 变换层
  - `applyFixedEventIndexStructuredEditsToYaml()`：把表单字段套用进 YAML
  - `applyFixedEventIndexRowOperationsToYaml()`：新增 / 删除 / 移动分组、事件、补充资料、阶段
  - `renameFixedEventIndexRowIdInYaml()`：重命名 id 并同步引用
- `panel.ts`：编辑器 HTML 预览与结构化编辑面板渲染
  - 不直接保存世界书
  - 只输出按钮、输入框、YAML textarea 和校验提示
- `save.ts`：把 YAML 安全写回当前世界书来源条目
  - 检查来源是否仍匹配
  - 通过 `replaceWorldbook()` 写回
- `validate.ts`：校验 draft 是否可保存，并生成顶部 / 行内提示
- `comment-groups.ts`：把旧 `节庆:` 列表中的注释分组迁移为 editable `固定事件分组`

## 数据流

1. `panel.ts` 调 `readCalendarRuntimeIndexSourceEntry()` 读取 runtime 索引来源
2. `parse.ts` 把来源 YAML 解析成 draft
3. `validate.ts` 生成可保存状态和行内提示
4. `panel.ts` 渲染结构化表单和 YAML 预览
5. `widget/index.ts` 收集表单字段，调用 `edit.ts` 更新 YAML preview
6. 用户点击保存后，`save.ts` 写回世界书

## 检查脚本

相关 checks 放在 `docs/superpowers/checks/`：

- `fixed-event-index-editor.check.ts`：基础 parse / serialize
- `fixed-event-index-editor-panel.check.ts`：编辑面板关键 HTML
- `fixed-event-index-editor-save.check.ts`：保存工作流
- `fixed-event-index-editor-structured-edit.check.ts`：结构化字段套用
- `fixed-event-index-editor-row-operations.check.ts`：分组 / 事件 / 补充资料新增删除
- `fixed-event-index-editor-stage-fields.check.ts`：阶段字段编辑
- `fixed-event-index-editor-stage-row-operations.check.ts`：阶段新增删除
- `fixed-event-index-editor-stage-ordering.check.ts`：阶段上移 / 下移
- `fixed-event-index-editor-runtime-defaults.check.ts`：提醒默认值 / 书籍默认值

运行单个检查的常用命令：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' docs/superpowers/checks/fixed-event-index-editor-stage-ordering.check.ts
```
