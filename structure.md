# Project Structure

本文件是仓库级入口，用来快速判断“该看哪里、该改哪里”。更细的模块说明放在对应目录的 `structure.md`。

## 产品定位

Calendar Float 是 **SillyTavern / Tavern Helper 的世界时间可视化与提醒层**。

它负责：

- 读取角色卡当前世界时间
- 读取 `[fixed_event_index]` 固定日程
- 读取 `stat_data.事件.月历` 动态时间事项
- 统一解析一次性/重复日期
- 渲染玩家月历 UI
- 在提醒或预定时间到达时向 LLM 提供时间信号

它不负责：任务状态、新闻、世界事件阶段、隐藏剧情策划、剧情结果、Archive / Memory 系统历史。

未来 Diary 若加入，应由 NPC/Diary 系统产出有意义的带日期内容，再由 Calendar 提供日期入口；不要恢复自动系统流水账。

## 根目录

- `README.md`：面向玩家/创作者的产品说明与使用模型
- `structure.md`：当前文件，仓库级维护入口
- `AGENTS.md`：Agent 进入仓库后必须遵守的开发规则
- `package.json`：构建、格式化、lint 与依赖
- `webpack.config.ts`：Tavern Helper 浏览器脚本打包配置
- `tsconfig.json`：TypeScript 配置
- `tavern_sync.mjs`：酒馆同步/构建辅助
- `节庆_索引.latest.yaml`：固定事件索引参考输出

## 主要目录

- `src/calendar-float/`：Calendar Float 主源码，先读 `src/calendar-float/structure.md`
- `dist/calendar-float/index.js`：构建产物
- `checks/calendar-float/`：手写 smoke / regression checks
- `docs/`：仍有效的设计文档；历史实现说明应删除或留在 archive branch，不在当前文档制造第二套事实
- `@types/`：Tavern Helper、SillyTavern、MVU 等运行时类型
- `util/`：共享工具函数
- `svg/`：固定事件分组图标素材
- `.cursor/rules/`：项目开发规则来源

## 当前核心入口

- 世界时间/日期：`src/calendar-float/date.ts`、`profile/`
- 动态 MVU 迁移：`src/calendar-float/event-normalizer.ts`
- 动态到时提醒：`src/calendar-float/event-reminder.ts`
- 固定事项索引：`src/calendar-float/fixed-event-index-editor/`
- runtime worldbook：`src/calendar-float/runtime-worldbook/`
- dataset：`src/calendar-float/runtime-dataset/`
- UI：`src/calendar-float/widget/`
- settings/storage：`src/calendar-float/storage/`
- worldbook rules 管理：`src/calendar-float/worldbook-manager/`

## 当前数据契约

动态事项统一写在：

```text
stat_data.事件.月历.[事件ID]
```

核心字段：

```text
标题
内容?
时间
结束时间?
重复规则?
提前提醒天数?
显示?
提醒?
标签?
```

旧 `{临时, 重复}` 只用于读取与迁移。旧 `可见性` 只用于映射成 `显示/提醒`，不会继续作为新持久化字段。

## Check 文件规则

- runtime/source 代码放 `src/`
- `.check.ts` 放 `checks/calendar-float/`
- 新功能优先补最靠近边界的 check，而不是为了覆盖率复制 implementation
- 删除产品功能时同时删除对应旧 check；不要让 test 反过来强迫已废弃行为继续存在

基础验证：

```powershell
git diff --check
pnpm run build:dev
```

单个 check：

```powershell
pnpm exec ts-node --transpile-only --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' checks/calendar-float/<path>.check.ts
```
