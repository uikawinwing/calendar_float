<<<<<<< HEAD
# Tavern Helper / SillyTavern 开发协作指南

本仓库用于编写 Tavern Helper / SillyTavern 的前端界面与脚本。进入本仓库后，不要只读本文件就开始改代码；`.cursor/rules/` 是项目规则的来源，本文件只是给 Codex / Agent 的强制入口。

## 必须先读

在任何代码修改、调试、重构、排错前，先读取这些文件：

- `.cursor/rules/项目基本概念.mdc`
- `.cursor/rules/mcp.mdc`
- `.cursor/rules/酒馆变量.mdc`
- `.cursor/rules/酒馆助手接口.mdc`

然后按任务类型继续读取：

- 涉及前端界面、状态栏、楼层 UI、Vue、HTML、CSS、样式：读 `.cursor/rules/前端界面.mdc`
- 涉及后台脚本、事件监听、按钮、操作酒馆页面 DOM：读 `.cursor/rules/脚本.mdc`
- 用户明确提到 MVU、变量结构、`schema.ts`、`stat_data`、MVU 角色卡：读 `.cursor/rules/mvu变量框架.mdc`
- 涉及 MVU 角色卡文件夹、角色卡脚本/界面/世界书：再读 `.cursor/rules/mvu角色卡.mdc`

读取规则后，再阅读目标目录附近的代码、模板和类型定义。不要凭通用前端经验直接写。

## 项目结构判断

- `src/<name>/index.ts` + `src/<name>/index.html`：前端界面项目
- 只有 `src/<name>/index.ts`：脚本项目
- `示例/` 提供参考实现
- `初始模板/` 提供新建项目模板
- `@types/` 是 Tavern Helper、SillyTavern、MVU 等全局接口的类型定义
- `util/` 中有本项目封装好的工具函数，优先复用

如果用户给的目标目录不明确，先用 `rg --files` 查找相近文件和现有命名模式，再选择最小修改范围。

## 开发原则

- 使用 TypeScript，不新建 JavaScript 脚本
- 前端界面或脚本运行在浏览器环境，不能使用 Node.js 专用库
- 优先使用 `package.json` 已有依赖，不随意新增 dependency
- 优先使用 `@types/function/*` 和 `@types/iframe/*` 中定义的 Tavern Helper 接口
- 不要优先使用低层级的 `SillyTavern` 原生接口
- 不要优先使用 STScript；只有没有合适接口时，才通过 `triggerSlash` 调用 `slash_command.txt` 中的命令
- 酒馆助手接口在运行环境中可直接使用，通常不需要导入或自行声明
- 修改前先看同目录已有写法，保持项目风格

## 加载与卸载

不要用 `DOMContentLoaded` 作为初始化时机。打包后的代码可能通过网络链接被动态加载到酒馆中，这时 `DOMContentLoaded` 不会按预期触发。

推荐结构：

```ts
function init() {
  // 初始化逻辑
}

$(() => {
  errorCatched(init)();
});
```

卸载时使用 `pagehide`，不要用 `unload`：

```ts
$(window).on('pagehide', () => {
  // 清理事件、DOM、样式、定时器
});
```

如果注册了事件监听、挂载了 Vue、插入了 DOM、复制了样式、启动了定时器，必须在 `pagehide` 中清理。

## 前端界面规则

前端界面指同时存在 `index.ts` 和 `index.html` 的项目。

- `index.html` 只写静态 `<body>` 内容，通常只放 `<div id="app"></div>`
- 不要在 `index.html` 中写 `<script src="./index.ts">`
- 不要在 `index.html` 中用 `<link>` 引入本地样式
- 不要写空的 `<img src="">`
- 样式通过 TypeScript 导入，或写在 Vue 组件中
- 优先使用 Vue 组件、Pinia、Zod
- Vue Router 在 iframe 中应使用 `createMemoryHistory()`
- iframe 高度不要依赖 `vh`
- 页面整体用宽度和 `aspect-ratio` 适配，不产生横向滚动条
- 主体内容不要完全脱离文档流，避免让宿主楼层无法正确计算高度

## 脚本规则

脚本指只有 `index.ts` 的项目。

- 脚本没有自己的可见界面，默认在后台 iframe 中运行
- 脚本中的 jQuery 会作用于整个酒馆页面，而不只是脚本 iframe
- 需要挂载 Vue 到酒馆页面时，用 jQuery 创建挂载点，并在 `pagehide` 中卸载
- 如果组件需要沿用酒馆网页样式，挂载到父页面 DOM，并用 `teleportStyle()` 复制样式；这种情况不要使用 Tailwind class 避免类名冲突
- 如果组件是独立悬浮窗或独立 UI，优先用 `createScriptIdIframe()` 创建隔离 iframe，再挂载 Vue
- 添加脚本按钮时使用 `appendInexistentScriptButtons`，按钮事件用 `eventOn(getButtonEvent(...), ...)`

## 状态与变量

- 普通持久化数据优先使用 Tavern Helper 的 `getVariables` / `replaceVariables`
- 脚本配置使用脚本变量：`{ type: 'script', script_id: getScriptId() }`
- 需要响应式读写时，优先使用 Pinia + Zod
- 将 Vue reactive/ref 数据写回酒馆变量前，用 `klona()` 去掉 proxy
- Zod 使用项目中的 Zod 4 写法

示例：

```ts
const Settings = z.object({
  enabled: z.boolean().prefault(false),
}).prefault({});

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

=======
# 酒馆助手前端界面或脚本编写

本项目主要用于编写酒馆助手 ([Tavern Helper](https://n0vi028.github.io/JS-Slash-Runner-Doc/guide/关于酒馆助手/介绍.html)) 所支持的前端界面或脚本. 它们在酒馆 (SillyTavern) 中以前台或后台的形式运行, 可以在代码中直接使用酒馆助手所提供的接口, 进而:

- 为角色卡提供更好的 UI 显示, 如将消息楼层中原本只是代码块纯文本的状态栏美化为有动态效果、有交互的 html 状态栏
- 实现非纯文本的游玩体验, 如监听现实时间或酒馆事件来实现 meta 游戏、播放多媒体文件、自制游玩界面并与酒馆交互
- 优化酒馆使用体验, 如用 jQuery 为预设提示词条目新增复制按钮, 监听酒馆接收到消息事件并判断是否需要重新生成本楼层消息
- 连接外部应用程序, 如通过 socket.io-client 连接外部服务器, 进而实现外部应用程序与酒馆的通信
- 新增额外功能, 如每 20 楼在后台调用一次 LLM 来生成对之前剧情的总结
- ...

## 访问酒馆网页

在编写时, 你应该用 chrome-devtools 连接我已经打开的浏览器, 从中读取或操纵连接到的酒馆网页 (其网址与 `.vscode/launch.json` 中配置的 `url` 一致), 来了解当前的界面、脚本情况, 如获取当前的 DOM 情况、实际显示情况、Console 情况、点击界面……

连接到网页后, 你需要检查 `$('#extensions_settings')` 中的`酒馆助手-实时监听-允许监听`开关是否处于启用状态. 一旦启用, 则界面、脚本代码到酒馆网页的实时同步已经建立好了: 在代码变更后, 酒馆网页上将热重载新的脚本或界面代码, 因此你不需要刷新酒馆网页, 也不需要自己运行 `pnpm build` 来更新代码打包结果, 直接查看网页即可.

## 项目结构

### 核心机制: 前端界面或脚本

每个前端界面或脚本, 都以 `src` 文件夹或 `示例` 文件夹中的一个独立文件夹形式存在. 具体是前端界面还是脚本, 由文件夹中的内容直接决定:

- 如果文件夹中既有 `index.ts` 文件也有 `index.html` 文件, 则是前端界面项目. 例如, `示例/界面示例` 是一个前端界面项目.
- 如果文件夹中仅有 `index.ts` 文件, 则是脚本项目. 例如, `示例/脚本示例`、`示例/流式楼层界面示例` 是一个脚本项目.

你可以在 `初始模板/*/新建为src文件夹中的文件夹` 中找到前端界面和脚本项目的初始模板.

### 流式楼层界面

由于酒馆框架限制, 前端界面只能在它所基于的文本格式输出完毕后才能渲染, 也就是说前端界面的渲染不支持流式文本 (AI 逐渐输出文本供用户阅读).

为了让前端界面支持流式, 本编写模板的[进阶技巧](https://stagedog.github.io/青空莉/工具经验/实时编写前端界面或脚本/进阶技巧/)中提出了两种方法, 简单地说: (具体需要查看进阶技巧文章)

- 不再使用酒馆的输入框, 让玩家始终在一个渲染好的前端界面里游玩, 而在前端界面内使用酒馆助手提供的 `generate` 或 `generateRaw` 请求 AI 生成新的回复.
- 继续使用酒馆的输入框, 但利用脚本可以使用 jquery 操纵酒馆网页的特性, 替换掉酒馆原本不支持流式前端界面渲染的楼层显示.

流式楼层界面即使用了第二种方法. 在 `util/streaming.ts` 中, 项目提供了 `mountStreamingMessage` 函数来挂载流式楼层界面. 此外, 在 `示例/流式楼层界面示例` 中, 你可以找到一个流式楼层界面的示例.

**流式楼层界面不过是调用了 `mountStreamingMessage` 的脚本, 因此所有脚本的编写规则依旧适用.**

### MVU 角色卡

如果我要求你制作一张基于 MVU 的角色卡, 你应该参考本项目提供在 `示例/角色卡示例` 中的额外支持:

- `示例/角色卡示例/脚本/*/` 中是角色卡的所有脚本
- `示例/角色卡示例/界面/*/` 中是角色卡的所有前端界面
- `示例/角色卡示例/schema.ts` 中是用 zod 4 库书写的角色卡 MVU 变量结构定义
  - 提供给脚本、前端界面导入使用
  - 会在 `pnpm build` 或 `pnpm watch` 时生成对应的 json schema 文件 `示例/角色卡示例/schema.json`, 便于编写变量初始值文件 initvar.yaml `# yaml-language-server: $schema=schema文件路径`
- `util/mvu.ts` 中提供了 `defineMvuDataStore` 函数, 它基于 pinia 实现了本项目推荐的前端界面获取、修改 MVU 变量方式, 支持与酒馆实际变量之间的双向同步; `示例/角色卡示例/界面/store.ts` 中的 `useDataStore` 就是用它获取和修改界面所在楼层变量的.

你同样可以在 `初始模板/角色卡/新建为src文件夹中的文件夹` 中找到 MVU zod 角色卡的初始模板.

## 项目参考文件

### 可用的第三方库

项目使用 pnpm 作为包管理器, 在 `package.json` 的 `dependencies` 部分定义了可用的第三方库 (dedent、gsap、jquery、jquery-ui、lodash、pinia、pixi.js、toastr、yaml、vue、vue-router、@vueuse/core、react、@pixi/react、async-wait-until、zod), 你也可以自己通过 `pnpm add` 添加更多第三方库, 如添加 (@vueuse/integrations 等).

前端界面或脚本都是在浏览器中使用, 因此你不能使用 nodejs 库

### 与酒馆交互的方式

前端界面或脚本主要使用酒馆助手所提供的接口与酒馆进行交互. 这些接口定义在 `@types` 文件夹中, 如 `@types/function/worldbook.d.ts` 中描述了该如何操控世界书, `@types/function/variables.d.ts` 中描述了该如何操控酒馆变量.

此外, `@types` 文件夹也为酒馆本身、其他插件、MVU 变量框架所提供的接口变量、函数进行了类型定义, 如 `@types/iframe/exported.mvu.d.ts` 中描述了 MVU 变量框架所提供的接口 `Mvu`.

除了代码接口外, 酒馆自制了 STScript 命令. 要将这些命令转换为 Typescript 代码, 你需要使用 `@types/function/slash.d.ts` 内所定义的 `triggerSlash` 函数来调用它们. 具体的命令列表见于 `slash_command.txt` 文件.

以上接口在代码中均可直接使用, 不需要导入或新定义它们, 也不需要检查是否可用.

#### 酒馆助手接口

`@types` 文件夹中定义了酒馆助手所提供的所有接口, [酒馆助手官方文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/)中也对这些接口进行了类似的说明:

其中, `@types/function` 中的接口将会导出到酒馆网页的 `window.TavernHelper`; 而 `@types/iframe` 依赖于 iframe 环境, 只在酒馆助手前端界面或脚本内可用. 由于本项目主要是制作酒馆助手前端界面或脚本, `@types/function` 和 `@types/iframe` 内的接口均可直接调用, 你无须在意 `@types/function` 和 `@types/iframe` 的区别.

- `@types/function/audio.d.ts`: 音频播放器
- `@types/function/builtin.d.ts`: 对 `@types/iframe/exported.sillytavern.d.ts` 的增补, 一些酒馆原生具有但没有导出的接口
- `@types/function/chat_message.d.ts`: 操作目前酒馆玩家与 AI 的聊天楼层记录, 如获取某些楼层的消息、修改楼层消息内容、新建楼层、删除楼层、移动楼层等
- `@types/function/displayed_message.d.ts`: 操作目前酒馆网页对楼层的显示, 如获取某一楼层的 JQuery 实例、将文本格式化为如果放在楼层中会如何显示的 html 文本等
- `@types/iframe/event.d.ts`: 监听、发送酒馆事件, 如监听消息接收完毕、监听世界书发生更新等
- `@types/iframe/exported.ejstemplate.d.ts`: 与提示词模板这一酒馆插件进行交互, 主要是调整提示词模板的设置. 除非我明确要求你做, 不要考虑
- `@types/iframe/exported.mvu.d.ts`: 与 MVU 变量框架进行交互
- `@types/iframe/exported.sillytavern.d.ts`: 酒馆原生导出的接口, 但抽象层次很低, 因此你应该优先使用 `@types` 中列出的其他酒馆助手接口而不是这个文件里的
- `@types/function/extension.d.ts`: 操作酒馆第三方扩展的安装、卸载、更新等
- `@types/function/generate.d.ts`: 请求酒馆 AI 生成回复. `generate` 是携带酒馆预设作为提示词的请求 AI 生成, 而 `generateRaw` 是不携带酒馆预设 (但依旧会发送酒馆世界书条目等内容) 直接请求 AI 生成
- `@types/function/global.d.ts`: 支持不同前端界面、脚本间的接口共享
- `@types/function/import_raw.d.ts`: 导入酒馆原生数据, 包括角色卡、聊天记录、世界书、预设等. 导入所用的数据格式应与玩家通过酒馆页面按钮导出的数据格式一致
- `@types/function/inject.d.ts`: 为酒馆 AI 请求注入额外提示词
- `@types/function/macro_like.d.ts`: 注册酒馆助手宏. 注册后, 酒馆 AI 提示词、酒馆楼层显示中出现这个宏时, 将会被替换为宏所定义的内容
- `@types/function/preset.d.ts`: 操作酒馆预设, 可以切换使用别的预设, 也可以调整预设中的酒馆 AI 请求参数 (温度、流式传输等) 和提示词等
- `@types/function/raw_character.d.ts`: 获取角色卡的一些信息
- `@types/function/script.d.ts`: 获取或修改当前酒馆助手脚本的某些信息
- `@types/iframe/script.d.ts`: 获取或修改当前酒馆助手脚本的某些信息
- `@types/function/slash.d.ts`: 运行酒馆的 DSL 命令 (称为 "/STScript"), 可运行的命令在 `slash_command.txt` 中有列出, 但这些命令很难与代码结合使用,因此你应该优先使用 `@types` 中列出的其他酒馆助手接口而不是 "/STScript" 命令
- `@types/function/tavern_regex.d.ts`: 操作酒馆正则. 酒馆在发送 AI 请求或显示楼层时, 会按酒馆正则将聊天记录中的内容替换成其他内容. 除非明确要求, 你只应该在有些时候使用这个文件里的 `formatAsTavernRegexedString` 函数
- `@types/function/util.d.ts`: 一些工具函数, 如获取当前酒馆聊天的最新楼层号, 替换文本里的酒馆宏等
- `@types/iframe/util.d.ts`: 一些工具函数, 如在前端界面里获取前端界面所在楼层号等
- `@types/function/variables.d.ts`: 操作酒馆变量, 可以获取或修改变量值
- `@types/iframe/varriables.d.ts`: 操作酒馆变量
- `@types/function/version.d.ts`: 获取酒馆和酒馆助手的版本号
- `@types/function/worldbook.d.ts`: 操作世界书, 可以删除创建世界书, 可以调整世界书启用情况, 也可以调整其中的条目等

### 工具函数

在 `util` 中定义了一些工具函数:

- `util/script.ts`: 脚本可能使用的函数
- `util/common.ts`: 前端界面或脚本可能使用的函数
- `util/mvu.ts`: MVU 角色卡可能使用的函数

## 酒馆变量

酒馆变量可用于持久化地存储前端界面、脚本的数据, 可通过酒馆助手的 `getVariables`、`replaceVariables` 等接口读写.

- 全局变量 (`{type: 'global'}`): 在酒馆中全局一致, 无论是否打开角色卡、哪张角色卡, 都共享同样的全局变量.
- 角色卡变量 (`{type: 'character'}`): 绑定在角色卡上的变量.
- 脚本变量 (`{type: 'script', script_id: string}`): 绑定在某个脚本上的变量.
- 聊天变量 (`{type: 'chat'}`): 绑定在某角色卡的某个聊天文件上的变量. 当在酒馆中选择某张角色卡与 LLM 进行对话时, 都需要创建一个聊天文件.
- 消息楼层变量 (`{type: 'message', message_id: 'latest'|number}`): 绑定在某角色卡、某聊天的某个楼层上. 当在酒馆中用某个聊天文件与 LLM 进行对话时, 可能会逐渐有很多用户输入和 AI 输出, 每个用户输入和 AI 输出都是单独的消息楼层.

## 特殊导入方式

### 导入文件内容

项目支持用 `import string from './文件?raw'` 来将文件内容作为字符串导入.

如果导入的文件是 typescript、scss, 则导入的将会是经过 webpack 打包后的纯 javascript、css 而不是原始内容, 因此能在 jquery 中直接使用.

```typescript
// 直接导入文件内容
import html_content from './html.html?raw';
import json_content from './json.json?raw';

// 经过 webpack 打包后导入
import javascript_content from './script.ts?raw';
import css_content from './style.scss?raw';
```

### 导入 html

除了以 `?raw` 直接导入 HTML 文件内容外, 项目还支持用 `import html from './文件.html'` 来通过 html-loader 将 html 文件内容最小化后作为字符串导入.

### 导入 markdown

项目还支持用 `import markdown from './文件.md'` 来通过 remark-loader 将 markdown 文件内容解析为 html 后作为字符串导入.

### 导入 vue

项目直接支持用 `import Component from './文件.vue'` 来导入 vue 组件, 如果要设计界面你应该优先使用 vue 组件 (含 pinia 和 vue-router).

### 为前端界面导入样式

前端界面支持在 typescript 中 `import './index.scss'` 来导入全局 scss 文件, 并自动将它们打包到最终的 `dist/**/index.html` 中的 `<head>` 部分.

## 最佳实践

通用于前端界面和脚本:

### 使用 typescript 而非 javascript

typescript 更容易写对, 你应该使用 typescript 而非 javascript

### 尽量使用项目参考文件中的功能

项目参考文件中的功能往往更为简单正确, 因此你应该尽量使用它们. 例如:

- 尽量使用第三方库, 例如:
  - 使用 jquery 而不是 javascript 内置的 DOM 操作
  - 使用 jqueryui 实现拖动效果 (vue 中则使用 vueuse 等第三方库)
  - 使用 zod 处理数据校验和纠错而不是 if else, 并用 `z.prettifyError()` 来格式化错误信息
  - 使用 gsap 制作打字机等所有动画效果
  - ...
- 尽量使用酒馆助手给出的接口, 例如:
  - 使用 `getIframeName()` 而不是 `(this.frameElement as Element).id`
  - ...

### 优先使用酒馆助手提供的接口

**酒馆助手所提供的接口抽象层次更高, 你应该优先使用 `@types` 文件夹中其他文件定义的酒馆助手接口**, 而不是 `@types/iframe/exported.sillytavern.d.ts` 中定义的酒馆内置接口或 STScript 命令.

- 使用 `@types/function/chat_message.d.ts` 中定义的 `getChatMessages()`、`setChatMessages()` 等来获取、修改消息楼层
- 使用 `@types/function/worldbook.d.ts` 中定义的 `getWorldbook()`、`replaceWorldbook()` 等来获取、修改世界书条目
- 使用 `@types/function/variables.d.ts` 中定义的 `getVariables()`、`replaceVariables()` 等来获取、修改酒馆变量
- ……

### 优先使用 vue 编写界面

vue 相比于 jquery 或 DOM 操作更为简单, 因此你应该尽量使用 vue (可使用 pinia、vue-router 或自己添加其他第三方库) 来编写前端界面, 但要注意 vue-router 的 `createRouter()` 不能写在 `$(() => {})` 中, 必须在全局执行.

当需要监听 vue 的响应式数据变化并存入酒馆数据时 (如酒馆变量、世界书……), 你应该先用 `klona()` 来去除 proxy 层, 以在脚本中编写 vue 并提供用户设置为例:

```typescript
const Settings = z.object({/*...*/}); // 用 zod 定义设置的类型和默认值
const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
watchEffect(() => replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() }));
```

前端界面和脚本都是 iframe, 因此你在使用 vue-router 时, 应该使用 `history: createMemoryHistory()` 来创建路由, 否则将无法正常路由.

### 优先使用 pinia、zod 管理数据状态

当需要从酒馆读取配置/数据时, 你应该用 pinia 实现响应式读写:

```typescript
const Settings = z.object({ button_selected: z.boolean().default(false) }).prefault({});
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
  watchEffect(() => {
    replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });
>>>>>>> 2dc3a4c6557394b004089da10a6c56467e18b325
  return { settings };
});
```

<<<<<<< HEAD
## MVU 规则

只要用户明确提到 MVU、变量结构、`schema.ts`、`stat_data`、MVU 角色卡，就必须先读 MVU 规则文件。

- 使用 MVU 前先 `await waitGlobalInitialized('Mvu')`
- 前端界面读取楼层 MVU 变量前，要等待消息楼层变量准备好
- MVU 数据通常位于 `stat_data`
- 优先查找并复用同目录或角色卡目录中的 `schema.ts`
- `schema.ts` 应只导出 `export const Schema`，不要混入注册副作用
- 如果用户给的是“变量结构脚本”，需要去掉 `registerMvuSchema` 的导入与 `$(() => registerMvuSchema(...))` 包装，只保留 schema
- MVU 角色卡的脚本、界面、世界书应参考 `初始模板/角色卡` 与 `示例/角色卡示例`

## 调试与浏览器

SillyTavern 地址以 `.vscode/launch.json` 为准，目前是：

```text
http://localhost:8000
```

Chrome DevTools MCP 固定连接：

```text
http://127.0.0.1:9222
```

需要操作页面时，优先连接用户已经打开并操作到当前状态的 SillyTavern 页面。不要直接重新打开首页后猜测用户在哪个界面。

连接页面后，检查 `#extensions_settings` 中的“酒馆助手-实时监听-允许监听”是否启用。若已启用，代码改动会热重载到酒馆页面；此时通常不需要刷新页面，也不需要为了同步而手动运行完整 build。

如果连接不到页面，说明远程调试端口可能未启动，或用户当前 Chrome 不是 VS Code 调试配置打开的同一实例。此时提示用户用 VS Code 的 Chrome 调试配置打开酒馆页面。

## 常用命令

- 开发构建：`pnpm run build:dev`
- 生产构建：`pnpm run build`
- 监听构建：`pnpm run watch`
- 格式化源码：`pnpm run format`
- 检查代码：`pnpm run lint`
- 修复 lint：`pnpm run lint:fix`

如果酒馆助手实时监听已启用，改动后优先看页面热重载效果；需要验证打包或类型问题时再运行构建。

## 发布与 tag

本仓库的 `.github/workflows/bundle.yaml` 会在 `main` / `master` 收到非 `dist/**` 的 push 后自动运行：

1. 删除并重新生成 `dist`
2. 提交一个 `[bot] bundle` commit
3. 用 `phish108/autotag-action` 自动创建下一个 `vX.Y.Z` tag

因此发布时不要手动创建或推送 tag。否则手动 tag 会先占用一个版本号，bundle bot 又会在自己的 `[bot] bundle` commit 上创建下一个版本，导致人工 commit message 和最终 tag 不一致。

推荐发布流程：

- 先确认远端最新 tag 与 `origin/main`，必要时 fetch/rebase 到最新 bot commit
- 计算下一个版本号，例如远端最新是 `v1.0.16`，本次人工 commit message 写 `v1.0.17: ...`
- 只 push `main`，不要执行 `git tag` / `git push origin v...`
- 等 GitHub Actions 的 bundle workflow 完成后，再 fetch tags 验证 bot 创建的 tag 是否为同一个版本号
- 若用户明确要求手动 tag，先提醒：当前 workflow 会继续自动 bump，下一个 bot tag 可能再次盖过人工 tag

## Windows 与搜索

- 默认使用 PowerShell 7：`pwsh.exe`
- 读写中文路径或中文内容时，在命令内显式设置 UTF-8：

```powershell
$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

- 搜索优先用 `rg` / `rg --files`
- 手动编辑文件优先用 `apply_patch`
- 不要为了写文件创建临时 writer 脚本
- 递归删除或移动前，必须确认解析后的路径仍在当前工作区内

## 回复习惯

回复用户时使用中文。说明技术问题要直接、可执行，少讲空话。发现需求有歧义时，按最可能的解释继续，并简短说明假设。
=======
### 优先使用 tailwindcss 和 `<style scoped>` 进行样式设计

你可以直接在项目中使用 tailwindcss, 而无需导入任何 css 文件.

在设计样式时, 你应该优先使用 tailwindcss 直接在 vue 组件的 `<template>` 内书写, 对于无法这样做的情况则使用 `<style scoped>` 标签.

### 尝试使用 @pixi/react 编写界面

当有很多多媒体资源时, 我们的前端界面更像是一个完整的游戏, 因此你应该使用 @pixi/react 在 .tsx 中编写界面, 并使用 pixi.js 来实现资源预先加载等逻辑.

### 正确在加载、卸载前端界面或脚本时执行功能

你应该总是在加载时才执行代码, 而不该直接在全局作用域中执行代码.

项目最终打包生成的 `dist/**/index.html` 或 `dist/**/index.js` 可能先上传到网上, 再以 `$('body').load(网络链接)` 或 `import '网络链接'` 的方式加载到酒馆中. `document.addEventListener("DOMContentLoaded", fn)` 在这个加载过程中不会被触发, 因此禁止使用 `DOMContentLoaded` 作为加载时的执行时机.

你应该使用 jquery 来在加载时执行功能:

```typescript
$(() => {
  toastr.success('加载成功');
});
```

同样地, 使用 jquery 及 `'pagehide'` 事件 (而不是 `'unload'`) 来在卸载时执行功能:

```typescript
$(window).on('pagehide', () => {
  toastr.success('卸载成功');
});
```

### 使用 console、throw 和 errorCatched 合理记录日志和错误

你应该在代码的关键节点使用 `console.info` 简洁地记录日志, 并尽量保持日志与最新代码逻辑的一致性.

对于可恢复的错误, 使用 `console.warn`、`console.error` 记录日志;

对于让前端界面、脚本无法继续使用的错误, 你应该使用 `throw Error`, 而用 errorCatched 转换顶部函数从而对其进行记录, 例如:

```typescript
function init() { /*... */}

$(() => {
  errorCatched(init)();
})
```

### 重载前端界面或脚本

如果有完全重载前端界面或脚本的需求, 你应该使用 `window.location.reload()`. 如聊天文件变更时重新载入前端界面或脚本, 你可以用 `util/script.ts` 中定义好了的工具函数:

```ts
export function reloadOnChatChange(): EventOnReturn {
  let chat_id = SillyTavern.getCurrentChatId();
  return eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
    if (chat_id !== new_chat_id) {
      chat_id = new_chat_id;
      window.location.reload();
    }
  });
}
```
>>>>>>> 2dc3a4c6557394b004089da10a6c56467e18b325
