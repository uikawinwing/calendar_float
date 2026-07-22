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

  return { settings };
});
```

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
