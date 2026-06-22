# Calendar Profile Structure

`profile/` 负责把通用月历脚本适配到不同角色卡 / 世界书配置。它是“通用脚本主体”和“某张角色卡具体规则”之间的边界。

## 文件职责

- `profiles.ts`：内置 profile 定义，例如 `generic` 和 `fate-poem`
- `types.ts`：profile 输入、解析结果、路径、日期和视觉配置类型
- `normalize.ts`：把 runtime index 里的 profile hint / config 归一化为 `CalendarProfile`
- `index.ts`：active profile 状态、初始化、应用 runtime profile 配置、对外 getter
- `festival-visual-presets.ts`：profile 专属节庆 marker preset registry

## 当前配置来源

固定事件索引推荐在 `[fixed_event_index]` 写：

```yaml
Profile: generic
Profile设置:
  label: 王庭月历
  paths:
    worldTime: stat_data.世界信息.完整时间字符串
    worldLocation: stat_data.世界信息.地点
  date:
    eraName: 星历
    eraNames:
      - 星历
      - 王庭历
    useChineseNumeralYear: true
```

读取优先级：

1. 聊天级 override
2. `Profile设置.paths`
3. 旧字段 `默认设置.mvu时间路径` / `默认设置.mvu地点路径`
4. 内置 generic fallback

新 profile 应优先使用 `Profile设置.paths`，不要继续写旧字段。

## 边界

- 通用视觉选择逻辑放在 `../festival-visual.ts`
- 内置 SVG icon 打包放在 `../festival-icons.ts`
- profile 专属关键词、国家、颜色、fallback marker 放在 `festival-visual-presets.ts`
- 日期解析、纪元名和中文数字年份属于 profile 配置，不属于 widget UI 硬编码
- 不要把某个世界 / card 的专属视觉规则塞回 `../festival-visual.ts`

## 新增 profile 的最低要求

1. 在 `profiles.ts` 定义 profile id、显示名、默认路径和日期设置
2. 如果它有专属视觉规则，在 `festival-visual-presets.ts` 添加 preset
3. 在 `[fixed_event_index]` 的 `Profile` / `Profile设置` 中声明实际路径
4. 加一个 focused check，至少覆盖路径归一化和一个日期解析样例
