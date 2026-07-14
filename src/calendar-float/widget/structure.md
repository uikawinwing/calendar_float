# Widget Structure

`widget/` 负责悬浮月历的可见 UI。它运行在酒馆页面环境里，通过 jQuery 连接宿主 DOM，并把样式注入隔离 iframe。

## Host 边界

`index.ts` 是 browser host，负责：

- iframe、style、root、DOM refs 与真实 browser lifecycle；
- `WidgetAction` 的生产组合和 exhaustive dispatch；
- HTML/dialog/toast presentation、局部与整体 render coordination；
- dataset refresh、book reader、drag/layout 和 destroy cleanup；
- fixed-event editor session 与 managed-worldbook flow 的 production adapter composition。

`bootstrapCalendarWidget()` 是 host 唯一的 source export。依赖注入只用于 lifecycle 初始化边界，不扩大 runtime API。

Host 禁止重新拥有：

- fixed-event editor 的 open/model/selection/dirty 镜像状态；
- parse、serialize、validate、structured edit、row operation、rename 等 YAML 变换；
- managed-worldbook 的 busy/dialog/diagnostics/candidates/warnings 镜像状态或 effect ordering；
- editor/managed flow 已拥有的确认、错误和结果文案决策；
- 逐 action 的 `onX` callback options 或绕过 typed action 的第二条主事件通道。

Host 不是业务状态仓库。它可以持有真实 DOM ref、render coordination 和 browser lifecycle；能在纯 session、flow、dataset 或 policy 模块表达的状态与顺序，不得回流到 `uiState`。

DOM 元素、jQuery、toastr 和 Tavern Helper globals 留在 host adapter，不能传入纯 session/flow 模块。

## 三个深模块

### 主事件：`actions.ts` + `events.ts`

- `actions.ts` 定义唯一 `WidgetAction` discriminated union 与 dispatch 类型。
- `events.ts` 只解析 DOM intent，发出 typed action，并保留 `preventDefault`、drag event identity 等 DOM 语义。
- `index.ts` 通过一个 exhaustive dispatcher 执行生产行为；新增 action 必须同时更新 union、DOM adapter 和 dispatcher。

### 固定事件编辑器：session + bindings

- `fixed-event-editor-session.ts` 是 open/model/selection/dirty、YAML 变换、load/save ordering、dirty guard 与 stale-result invalidation 的唯一 owner。
- `fixed-event-editor-bindings.ts` 只采集 DOM 字段并发出 DOM-free intent，同时处理 recurrence、selection 和 scroll 所需的 DOM 细节。
- `fixed-event-editor-host.ts` 保留 loading model 与运行时月份别名回填 policy；`fixed-event-editor-scroll.ts` 保留 scroll snapshot。
- `index.ts` 只组装 load/save/confirm adapter、订阅 snapshot、渲染 panel 和绑定 DOM。
- unsupported nested YAML fields 由 parse/serialize round-trip 保留；structured edit 只能改变已拥有的字段，不能把未知子树洗掉。

### 托管世界书：`managed-worldbook/flow.ts`

- `flow.ts` 是 busy、dialog mode、diagnostics、move candidates/warnings、effect ordering 与 stale-result invalidation 的唯一 owner。
- `dialog-model.ts` 负责纯展示模型，`notices.ts` 负责纯 notice decision。
- `index.ts` 只读取 DOM intent、组装真实 worldbook-manager effects、渲染 snapshot 并展示 flow 返回的 notice。

## 其余文件职责

- `date-actions.ts`：日期 key 解析和世界时间格式化。
- `dataset-refresh-queue.ts`：同一 widget generation 内合并 refresh；invalidate 后旧任务不得阻塞或提交到新实例。
- `dialog-policy.ts`：通用 confirmation 决策。
- `event-action-policy.ts`：保存、删除、归档、颜色等交互决策。
- `event-binding/types.ts`、`event-binding/parsers.ts`：共享 mode 与 DOM attribute parser。
- `render.ts`、`form-render.ts`、`day-detail.ts`：主 UI、表单与日期详情渲染模型。
- `layout.ts`：位置、拖动、视口与全屏计算。
- `style.ts`、`style-parts/`：样式注入入口与 CSS 分片。
- `helpers/`：颜色、Markdown/HTML 等无 host ownership 的辅助逻辑。

## 修改路线

- 新增普通月历交互：先改 `actions.ts` 与 `events.ts`，再补 host dispatcher 的生产 effect。
- 新增固定事件编辑器按钮：优先改 panel、bindings 和 session command；只有 browser presentation/composition 才改 host。
- 新增托管世界书流程：优先改 flow 与 pure dialog/notice policy；host 只接 DOM 和生产 adapter。
- 新增主要 UI、表单字段或日期详情：分别看 `render.ts`、`form-render.ts`、`day-detail.ts`。
- 修改视觉样式：优先改 `style-parts/base.ts`，移动端补 `style-parts/responsive.ts`。
- 不要在 widget host 里直接改世界书 YAML；结构变换属于 `fixed-event-index-editor/`。
