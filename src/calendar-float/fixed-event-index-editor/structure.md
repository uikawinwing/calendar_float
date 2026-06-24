# Fixed Event Index Editor Structure

本目录负责 `[fixed_event_index]` 的读取、结构化编辑、校验、序列化和保存。它不直接负责 runtime 扫描，也不负责月历主 UI 渲染。

## 文件职责

- `index.ts`：公共导出门面。外部模块应优先从这里导入编辑器 API
- `draft-types.ts`：编辑器 draft 类型、校验类型和内置图标文件名
- `parse.ts`：把 YAML 文本解析成 `FixedEventIndexDraft`
  - 当前顶层字段：`配置档案设置`、`固定事件分组`、`固定事件`、`补充资料`
  - runtime defaults：`默认设置`、`提醒默认值`、`书籍默认值`、`月份别名`
  - 旧顶层字段 `节庆`、`书籍`、`fixed_events`、`event_groups`、`materials`、`books` 不再作为当前 schema 解析
  - 保留未知字段，避免结构化编辑洗掉暂未支持的 YAML 内容
- `serialize.ts`：把 `FixedEventIndexDraft` 写回 preferred YAML
  - 稳定输出 profile、默认值、月份别名、分组、事件、阶段、提醒、补充资料
  - 新 profile 路径写入 `配置档案设置.路径.世界时间路径` 和 `配置档案设置.路径.世界地点路径`
- `edit.ts`：纯 YAML 变换层
  - `applyFixedEventIndexStructuredEditsToYaml()`：把表单字段套用进 YAML
  - `applyFixedEventIndexRowOperationsToYaml()`：新增 / 删除 / 移动分组、事件、补充资料、阶段
  - `renameFixedEventIndexRowIdInYaml()`：重命名 id 并同步引用
- `panel.ts`：编辑器 HTML 预览与结构化编辑面板渲染
  - 不直接保存世界书
  - 只输出按钮、输入框、YAML textarea 和校验提示
  - Profile 设置只显示一组 MVU 时间 / 地点路径，避免让用户重复填写
- `save.ts`：把 YAML 安全写回当前世界书来源条目
  - 检查来源是否仍匹配
  - 通过 `replaceWorldbook()` 写回
- `validate.ts`：校验 draft 是否可保存，并生成顶部 / 行内提示
- `comment-groups.ts`：在当前 `固定事件:` 列表缺少显式分组时，尝试把注释分组迁移为 editable `固定事件分组`

## 数据流

1. `panel.ts` 调 `readCalendarRuntimeIndexSourceEntry()` 读取 runtime 索引来源
2. `parse.ts` 把来源 YAML 解析成 draft
3. `validate.ts` 生成可保存状态和行内提示
4. `panel.ts` 渲染结构化表单和 YAML 预览
5. `widget/index.ts` 收集表单字段，调用 `edit.ts` 更新 YAML preview
6. 用户点击保存后，`save.ts` 写回世界书

## 用户教程位置

面向普通测试者的固定事件编辑器教程写在仓库根目录 `README.md`。这里不重复教程，只维护代码边界和检查入口。

## 检查脚本

当前相关 checks：

- `checks/calendar-float/fixed-event-index-editor/profile.check.ts`：配置档案设置 / 日期解析
- `checks/calendar-float/fixed-event-index-editor/save.check.ts`：保存工作流
- `checks/calendar-float/widget/fixed-event-editor-host.check.ts`：编辑器 loading model / 月份别名回填
- `checks/calendar-float/widget/fixed-event-editor-bindings.check.ts`：DOM 事件绑定
- `checks/calendar-float/widget/fixed-event-editor-row-actions.check.ts`：分组 / 事件 / 补充资料 / 阶段行操作 command
- `checks/calendar-float/widget/fixed-event-editor-scroll.check.ts`：scroll snapshot / restore
- `checks/calendar-float/widget/fixed-event-editor-rename-policy.check.ts`：重命名提示策略

运行单个检查的常用命令：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/fixed-event-index-editor/profile.check.ts
```
