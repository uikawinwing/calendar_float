# 酒馆助手前端界面或脚本编写

本项目用于编写 Tavern Helper / SillyTavern 前端界面与脚本

## 进入项目后必须先读

- `.cursor/rules/项目基本概念.mdc`
- `.cursor/rules/mcp.mdc`
- `.cursor/rules/酒馆变量.mdc`
- `.cursor/rules/酒馆助手接口.mdc`
- 如任务涉及前端界面，读 `.cursor/rules/前端界面.mdc`
- 如任务涉及脚本，读 `.cursor/rules/脚本.mdc`
- 如任务涉及 MVU变量，读 `.cursor/rules/mvu变量框架.mdc` 和 `.cursor/rules/mvu角色卡.mdc`

## Shell 注意事项

在 Codex Windows 环境中，优先使用：

- `cmd.exe`
- `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`

避免依赖 `pwsh.exe`，它可能因 Windows App Execution Alias 权限问题启动失败

## Chrome DevTools / SillyTavern 调试

SillyTavern URL 以 `.vscode/launch.json` 为准，目前是：`http://localhost:8000`

- 需要操作 SillyTavern 页面时，优先连接用户已经打开并操作到当前状态的页面，不要直接重新打开首页后猜测下一步按钮
- Chrome DevTools MCP 固定连接 `http://127.0.0.1:9222`。如果连接不到页面，先说明远程调试端口未启动或浏览器不是同一实例，再请求用户用 VS Code 的 Chrome 调试配置打开酒馆页面
- 注意：用户自己已经打开的 Chrome 标签页，不一定会出现在 MCP 连接的浏览器上下文里
