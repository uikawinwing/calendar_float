# 月历悬浮球（Calendar Float）

这是一个为《命定之诗》世界书提供日历功能的 SillyTavern / Tavern Helper 脚本。它会从世界书的月历索引读取固定事件、节庆、提醒和补充资料，并提供悬浮月历、事件编辑和提醒。

脚本负责功能，世界书负责世界设定，用户设置负责主题、尺寸、过滤等个人偏好。日历的运行身份固定为《命定之诗》，时间路径、纪元、月份别名及节庆视觉规则继续由原有索引配置。

## 当前状态

- 当前分支基于 v1.0.24 重构，本地回归通过后仍需完成真实 SillyTavern 验收
- 脚本配合 `[fixed_event_index]` 和正文世界书条目使用
- 旧索引缺少新增字段时保持原版默认效果；保留《命定之诗》原有条目命名兼容

## 核心入口

- 脚本入口：`src/calendar-float/index.ts`
- 月历 UI：`src/calendar-float/widget/`
- 固定事件索引编辑器：`src/calendar-float/fixed-event-index-editor/`
- 日历索引配置：`src/calendar-float/profile/`
- runtime 世界书读取：`src/calendar-float/runtime-worldbook/`
- 世界书基础设施安装：`src/calendar-float/worldbook-manager/`
- 仓库结构说明：`structure.md`

## 构建与开发

```powershell
pnpm install
pnpm run build:dev
```

开发时常用：

```powershell
pnpm watch
```

如果你要给 SillyTavern / Tavern Helper 加载本地构建产物，再开一个终端运行：

```powershell
pnpm run serve:dev
```

`serve:dev` 会先检查 `127.0.0.1:5500/dist/calendar-float/index.js`。如果服务已经可用，它会直接退出，不会重复占端口；如果端口被别的服务占用但不是当前项目，会报错并停止。

`pnpm watch` 只负责重新构建，不负责打开浏览器服务。

## 世界书条目

日历使用这些条目名：

- `[fixed_event_index]`：固定事件索引，月历主要数据源
- `[mvu_update][月历球][月历变量更新规则]`：月历变量更新规则
- `[月历球][当前月历内容展示]`：当前月历内容展示

同时保留带 `[DLC][扩展]` 的旧命名，例如：

- `[DLC][扩展][月历球][月历变量更新规则][mvu_update]`
- `[DLC][扩展][月历球][当前月历内容展示](...)`

已有世界书无需为了本轮重构改名。`[fixed_event_index]` 供脚本按需读取，应保持禁用自动注入；配置字段不会整份送入模型。

## 固定事件索引结构

`[fixed_event_index]` 是 YAML。当前推荐结构如下：

```yaml
配置档案设置:
  id: fate-poem
  显示名称: 命定之诗
  开发者模式: false
  路径:
    事件根路径: stat_data.事件.月历
    世界时间路径: stat_data.世界.时间
    世界地点路径: stat_data.世界.地点
  日期:
    纪元名: 复兴纪元
    纪元别名:
      - 复兴纪元
    中文数字年份: false
版本: 1
说明: 固定事件索引
默认设置:
  书籍全文默认关键词模板: "[[打开《${bookname}》]]"
提醒默认值:
  注入方式: silent_scan
  注入深度: 0
  禁用递归: true
  禁用触发词: true
  宏触发词模板: "[[_${id}_reminder_]]"
  缺省模板:
    未开始: ${固定事件} 将在 ${剩余天数} 天后开始。
    进行中: ${固定事件} 正在举行。
书籍默认值:
  摘要注入方式: injectprompt
  摘要注入深度: 4
月份别名:
  - 月份: 1
    名称: 苏醒
    季节: 初春
固定事件分组:
  - id: royal
    名称: 王庭节庆
    图标: crown-solid-full.svg
    事件:
      - alliance_day
固定事件:
  - id: alliance_day
    名称: 盟约日
    分组: royal
    开始: 01-08
    结束: 01-08
    地点关键词:
      - 王城
      - 白曜城
    介绍:
      条目名: "[节庆_盟约日_介绍]"
      简介: 纪念盟约建立的节日
      关键字:
        - 盟约日
        - 盟约
    提醒:
      开始前提醒天数: 5
      注入方式: silent_scan
      开启自定义提醒:
        未开始: 盟约日将在 ${剩余天数} 天后开始。
        进行中: 盟约日正在举行。
    相关资料:
      - alliance_day_manual
补充资料:
  - id: alliance_day_manual
    书名: 盟约日观礼手册
    关联事件:
      - alliance_day
    摘要: 盟约日观礼流程、禁忌与仪式背景摘要
    全文:
      世界书: 当前世界书
      条目名: "[节庆_盟约日_文本_盟约日观礼手册]"
    关键字:
      - 盟约
      - 观礼
```

旧字段 `默认设置.mvu时间路径` 和 `默认设置.mvu地点路径` 只作为兼容 fallback。新配置应写在 `配置档案设置.路径.世界时间路径` 和 `配置档案设置.路径.世界地点路径`。

完整配置示例见 [节庆索引](节庆_索引.latest.yaml)。`配置档案设置.视觉` 可分别设置地点、分类、标签的图标与颜色；不填写时保留原版效果。旧 `generic` 身份会提示迁移，其他世界身份的索引会停止读取并显示诊断。

## 固定事件编辑器教程

1. 开发者先在 `[fixed_event_index]` 把 `配置档案设置.开发者模式` 设为 `true`，再打开月历悬浮球，从设置或工具菜单进入 `固定事件索引`。普通测试者默认看不到这个入口。
2. 如果提示找不到固定事件索引，点击 `创建空固定事件索引`。脚本会在当前角色的主世界书里创建 `[fixed_event_index]`。
3. 在 `基础设置` 的 `命定之诗日历设置` 中填写：
   - `MVU 时间路径`：从 MVU/stat_data 读取当前世界时间的路径
   - `MVU 地点路径`：从 MVU/stat_data 读取当前地点的路径
   - `纪元名`：使用世界书中的纪元名
   - `中文数字年份`：如果世界时间使用中文数字年份，设为 `是`
   - `节庆视觉规则（YAML）`：编辑索引中的地点、分类、标签图标和配色规则
4. 如果需要自定义月份名，在 `月份别名` 写月份、名称和季节。
5. 在左侧新增分组。分组用于给事件分类和设置图标。
6. 新增固定事件，至少填写：
   - `id`：稳定英文或拼音 id，后续不要随便改
   - `名称`
   - `开始` / `结束`：格式 `MM-DD`
   - `分组`
   - `地点关键词`：用于地点命中
7. 如果事件有多阶段，给事件新增 `阶段`，每个阶段也使用 `MM-DD` 日期。
8. 如果希望 LLM 或世界书能读到节庆说明，在 `介绍` 里填世界书条目名和关键词。
9. 如果需要提醒，配置 `提醒` 或阶段里的 `提醒`。没有自定义文本时会回退到 `提醒默认值`。
10. 如果有书籍、信件、手册、档案等资料，在 `补充资料` 新增条目，并把资料 id 挂到固定事件的 `相关资料`。
11. 切到 `YAML 预览` 检查生成结果。结构化表单和 YAML textarea 会同步。
12. 点击 `保存到世界书`。保存后重新读取或重新打开月历，确认事件进入月历。

注意事项：

- 时间路径只需填写 `配置档案设置.路径`，无需重复填写旧默认字段。
- 创建空索引前要确认当前角色卡已经有可写的主世界书。
- 编辑器会尽量保留未知 YAML 字段，但不要依赖旧顶层字段 `节庆`、`书籍`、`fixed_events`、`event_groups`、`materials`、`books`。
- 日期解析预览用于验证纪元和日期规则，不代表对应日期一定有事件。
- 错误 YAML 或无法安全编辑的完整逻辑会阻止保存；应先在 YAML 中修正，原有条件不会被结构化编辑静默删除。

## Runtime 行为

运行时会：

1. 读取 `[fixed_event_index]`
2. 读取索引配置的时间路径和地点路径
3. 解析当前世界日期、地点、最近消息和用户输入
4. 根据固定事件日期窗口、地点关键词、正文关键词和资料关键词判断命中
5. 对世界书扫描类内容 silent inject token 并开启 `should_scan`
6. 对提醒、摘要等脚本直接展示的内容执行可见注入
7. 把匹配到的固定事件、归档事件、补充资料组装给月历 UI

## 推荐检查

文档或配置改动后：

```powershell
git diff --check
```

代码改动后至少运行：

```powershell
pnpm test
pnpm run build
```

固定事件编辑器相关改动可加跑：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/fixed-event-index-editor/profile.check.ts
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/fixed-event-index-editor/save.check.ts
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/widget/fixed-event-editor-row-actions.check.ts
```

`pnpm test` 包含 v1.0.24 同输入对照，需要本地 Git 历史中存在 `9b8da7b`。

## 许可证

本项目采用 [Aladdin License](LICENSE)。
