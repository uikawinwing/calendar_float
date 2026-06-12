# Project Structure

本文件是仓库级入口，用来快速判断“该看哪里、该改哪里”。更细的模块说明放在对应目录的 `structure.md`。

## 根目录

- `README.md`：面向使用者和维护者的项目说明，描述世界书 runtime 驱动、索引结构和维护流程
- `AGENTS.md`：Codex / Agent 进入本仓库后必须遵守的协作规则入口
- `package.json`：构建、格式化、lint、同步命令和依赖清单
- `webpack.config.ts`：把 `src/**/index.ts`、`src/**/index.tsx` 等入口打包为酒馆助手脚本或界面
- `tsconfig.json`：TypeScript 编译配置；当前 `tsc --noEmit` 有既有 TypeFest / VueUse Bluetooth 类型基线问题
- `tavern_sync.mjs`：酒馆同步脚本服务器与打包辅助逻辑
- `节庆_索引.yaml`：旧索引源文件参考，不一定是最新 preferred YAML
- `节庆_索引.latest.yaml`：结构化编辑器生成的 preferred YAML 最新参考，不会自动覆盖旧索引

## 主要目录

- `src/calendar-float/`：月历悬浮球主脚本源码，见 `src/calendar-float/structure.md`
- `dist/calendar-float/index.js`：构建产物，可由 `pnpm run build:dev` 或 `pnpm run build` 更新
- `docs/handover/`：阶段交接记录，尤其用于上下文压缩后恢复工作
- `docs/superpowers/plans/`：Superpowers 阶段计划与执行记录
- `docs/superpowers/checks/`：轻量行为检查脚本，通常用 `pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' <check.ts>` 运行
- `docs/previews/`：本地静态预览文件
- `@types/`：Tavern Helper、SillyTavern、MVU 等运行时全局接口类型定义
- `util/`：项目共享工具函数
- `svg/`：月历固定事件分组可用的内置 SVG 图标素材
- `.cursor/rules/`：项目实际规则来源；做代码修改前必须按 `AGENTS.md` 要求读取

## 常用修改入口

- 修改月历主 UI：从 `src/calendar-float/widget/structure.md` 开始
- 修改固定事件索引编辑器：从 `src/calendar-float/fixed-event-index-editor/structure.md` 开始
- 修改世界书 runtime 读取：看 `src/calendar-float/runtime-worldbook/`
- 修改 runtime 命中判定：看 `src/calendar-float/runtime-trigger-evaluator/`
- 修改用户自定义事件存储：看 `src/calendar-float/storage/`
- 修改脚本启动流程：看 `src/calendar-float/index.ts`
