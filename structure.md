# Project Structure

本文件是仓库级入口，用来快速判断“该看哪里、该改哪里”。更细的模块说明放在对应目录的 `structure.md`。

## 根目录

- `README.md`：面向 GitHub 测试者的项目说明、安装思路、固定事件编辑器教程和 YAML 示例
- `structure.md`：当前文件，维护者定位入口
- `AGENTS.md`：Codex / Agent 进入本仓库后必须遵守的协作规则入口
- `package.json`：构建、格式化、lint、同步命令和依赖清单
- `webpack.config.ts`：把脚本入口打包为 Tavern Helper 可加载的浏览器脚本
- `tsconfig.json`：TypeScript 编译配置
- `tavern_sync.mjs`：酒馆同步脚本服务器与打包辅助逻辑
- `节庆_索引.yaml`：旧索引源文件参考
- `节庆_索引.latest.yaml`：结构化编辑器生成的 preferred YAML 参考

## 主要目录

- `src/calendar-float/`：月历悬浮球主脚本源码，见 `src/calendar-float/structure.md`
- `dist/calendar-float/index.js`：构建产物，由 `pnpm run build:dev` 或 `pnpm run build` 更新
- `docs/handover/`：阶段交接记录，用于上下文压缩后恢复工作
- `docs/superpowers/plans/`：仍有效的阶段计划与执行记录
- `docs/superpowers/archive/`：已完成、过期或仅作历史参考的计划与检查记录
- `checks/`：所有手写 smoke / regression check 的唯一目录；不要把新的 `.check.ts` 放进 `src/`
- `docs/previews/`：本地静态预览文件
- `@types/`：Tavern Helper、SillyTavern、MVU 等运行时全局接口类型定义
- `util/`：项目共享工具函数
- `svg/`：月历固定事件分组可用的内置 SVG 图标素材
- `.cursor/rules/`：项目规则来源

## 常用修改入口

- 修改月历主 UI：从 `src/calendar-float/widget/structure.md` 开始
- 修改固定事件索引编辑器：从 `src/calendar-float/fixed-event-index-editor/structure.md` 开始
- 修改 profile / 时间地点路径 / 纪元解析：看 `src/calendar-float/profile/`
- 修改世界书 runtime 读取：看 `src/calendar-float/runtime-worldbook/`
- 修改 runtime 命中判定：看 `src/calendar-float/runtime-trigger-evaluator/`
- 修改用户自定义事件存储：看 `src/calendar-float/storage/`
- 修改脚本启动流程：看 `src/calendar-float/index.ts`
- 修改托管世界书安装、诊断、重装：看 `src/calendar-float/worldbook-manager/`

## 当前设计边界

- 通用脚本主体不应该硬编码某张角色卡的节庆、地点或命名风格
- profile 负责角色卡差异，例如 MVU 时间路径、地点路径、纪元名、日期解析和视觉 preset
- `[fixed_event_index]` 是固定事件、补充资料和 runtime defaults 的主要数据源
- 世界书基础设施条目使用通用语义名；带 `[DLC][扩展]` 的名字只属于《命定之诗》兼容路径
- `widget/index.ts` 只负责 UI 生命周期和事件编排；纯数据变换应放回对应模块

## Check 文件规则

- `src/` 只放运行时代码、类型和模块内部资源
- `.check.ts` 统一放在 `checks/calendar-float/`，并保留原模块相对路径
- 新增 check 时，路径格式应为 `checks/calendar-float/<module>/<name>.check.ts`
- check 可以 import `src/` 实现，但 `src/` 不应 import `checks/`
- 迁移或新增 check 后，至少跑对应 check 和 `git diff --check`

## 常用检查

```powershell
git diff --check
pnpm run build:dev
```

单个 TypeScript check 通常使用：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/<module>/<check-name>.check.ts
```
