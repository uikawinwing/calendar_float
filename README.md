# 月历悬浮球（Calendar Float）

这是一个用于 SillyTavern / Tavern Helper 的月历悬浮窗脚本。它会读取固定事件、MVU 临时/重复事件、节庆、提醒和补充资料，并把它们渲染成可交互的月历 UI。

项目最早服务于《命定之诗与黄昏之歌》的月历 DLC，现在已经拆成 **通用脚本主体 + profile 配置 + 世界书索引**。不同角色卡可以带自己的 profile、MVU 时间路径、地点路径、固定事件索引和正文条目，不需要额外导入独立 JSON。

## 主要能力

- 从 `[fixed_event_index]` 与 `stat_data.事件.月历` 组装统一月历
- 支持一次性事件、重复事件、固定节庆、多阶段提醒和关联资料
- 支持由 LLM 规划与世界时间绑定的隐藏剧情事件，到达提醒时间后再交还给 LLM 处理
- 玩家月历与 LLM 变量展示采用独立的可见性过滤
- 内置固定事件索引编辑器、世界书诊断、搬运和基础设施安装工具
- 推荐把脚本、`[fixed_event_index]`、profile 配置和正文世界书条目一起打包进角色卡或配套世界书
- 旧的《命定之诗》命名仍可读取，但新 profile 不应该复制 `[DLC][扩展]` 这类前缀

## 核心入口

- 脚本入口：`src/calendar-float/index.ts`
- 月历 UI：`src/calendar-float/widget/`
- 固定事件索引编辑器：`src/calendar-float/fixed-event-index-editor/`
- profile 配置：`src/calendar-float/profile/`
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

通用 profile 推荐使用这些条目名：

- `[fixed_event_index]`：固定事件索引，月历主要数据源
- `[mvu_update][月历球][月历变量更新规则]`：月历变量更新规则
- `[月历球][当前月历内容展示]`：当前月历内容展示

《命定之诗》profile 仍兼容带 `[DLC][扩展]` 的旧命名，例如：

- `[DLC][扩展][月历球][月历变量更新规则][mvu_update]`
- `[DLC][扩展][月历球][当前月历内容展示](...)`

新角色卡不要硬抄旧前缀。通用脚本只需要能语义匹配 `[月历球][当前月历内容展示]` 和 `[月历球][月历变量更新规则]`。

## MVU 事件与隐藏剧情

动态事件存放在：

- `stat_data.事件.月历.临时`：一次性、临时或隐藏剧情事件
- `stat_data.事件.月历.重复`：每天、每周、每月或每年重复的公开事件

LLM 写普通事件时，`可见性`默认为`玩家与LLM`，可以省略。需要预埋尚未被玩家或角色知晓的剧情时，写入临时事件并使用：

```yaml
事件:
  月历:
    临时:
      earthquake_488_06_05_0923:
        标题: 应对突发地震
        内容: 地震将造成大范围破坏，领主需要组织救援并处理后续影响。
        时间: 复兴纪元488年-6月5日-星期三-09:23
        提前提醒天数: 0
        可见性: 完全不显示
```

隐藏事件必须使用包含年、月、日、小时、分钟的绝对世界时间。到达提醒时间时，脚本只执行`完全不显示 -> 仅LLM`；LLM 不能自行写入`仅LLM`。之后由 LLM 判断它仍是暗雷，还是在玩家通过征兆、传闻、公告、调查或亲身经历得知后改为`玩家与LLM`。

| 可见性 | 玩家月历 | LLM 变量展示 | 写入来源 |
| --- | --- | --- | --- |
| `玩家与LLM` | 显示 | 显示 | LLM 默认 |
| `仅玩家` | 显示 | 隐藏 | UI 面板 |
| `完全不显示` | 隐藏 | 隐藏 | LLM 创建隐藏剧情 |
| `仅LLM` | 隐藏 | 显示 | 脚本到期解封 |

## 固定事件索引结构

`[fixed_event_index]` 是 YAML。当前推荐结构如下：

```yaml
配置档案设置:
  id: generic
  显示名称: 王庭月历
  开发者模式: false
  路径:
    事件根路径: stat_data.事件.月历
    世界时间路径: stat_data.世界信息.完整时间字符串
    世界地点路径: stat_data.世界信息.地点
  日期:
    纪元名: 星历
    纪元别名:
      - 星历
      - 王庭历
    中文数字年份: true
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

## 固定事件编辑器教程

1. 开发者先在 `[fixed_event_index]` 把 `配置档案设置.开发者模式` 设为 `true`，再打开月历悬浮球，从设置或工具菜单进入 `固定事件索引`。普通测试者默认看不到这个入口。
2. 如果提示找不到固定事件索引，点击 `创建空固定事件索引`。脚本会在当前角色的主世界书里创建 `[fixed_event_index]`。
3. 在 `基础设置` 里填写 profile：
   - `Profile ID`：写入 `配置档案设置.id`，通用角色卡通常写 `generic`
   - `显示名称`：UI 或诊断里显示的名字
   - `MVU 时间路径`：从 MVU/stat_data 读取当前世界时间的路径
   - `MVU 地点路径`：从 MVU/stat_data 读取当前地点的路径
   - `纪元名`：例如 `AC`、`星历`、`王庭历`
   - `中文数字年份`：如果世界时间会写成 `星历二年五月三日`，设为 `是`
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

- 不要把 profile 时间路径和 MVU 全局默认路径填两次。当前推荐只填 `配置档案设置.路径`。
- 创建空索引前要确认当前角色卡已经有可写的主世界书。
- 编辑器会尽量保留未知 YAML 字段，但不要依赖旧顶层字段 `节庆`、`书籍`、`fixed_events`、`event_groups`、`materials`、`books`。
- 日期解析预览只验证 profile 的纪元和日期规则，不代表对应日期一定有事件。
- 保存前如果有红色错误提示，先修正；否则可能写入了 UI 能显示但 runtime 无法正确扫描的索引。

## Runtime 行为

运行时会：

1. 读取 `[fixed_event_index]`、MVU 临时/重复事件和归档事件
2. 读取 profile 的时间路径和地点路径
3. 到达隐藏事件提醒时间时，把其可见性从`完全不显示`改为`仅LLM`
4. 分别过滤玩家月历与 LLM 变量展示不可见的事件
5. 解析当前世界日期、地点、最近消息和用户输入
6. 根据固定事件日期窗口、地点关键词、正文关键词和资料关键词判断命中
7. 对世界书扫描类内容 silent inject token 并开启 `should_scan`
8. 对提醒、摘要等脚本直接展示的内容执行可见注入
9. 把匹配到的事件、节庆、归档事件和补充资料组装给月历 UI

## 推荐检查

文档或配置改动后：

```powershell
git diff --check
```

代码改动后至少运行：

```powershell
pnpm run build:dev
```

固定事件编辑器相关改动可加跑：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/fixed-event-index-editor/profile.check.ts
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/fixed-event-index-editor/save.check.ts
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/widget/fixed-event-editor-row-actions.check.ts
```

## 许可证

本项目采用 [Aladdin License](LICENSE)。
