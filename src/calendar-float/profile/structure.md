# 命定之诗月历配置

`calendar_float` 现在只服务《命定之诗》。不再检测、选择或创建其他角色卡的 Generic Profile。

## 文件

- `profiles.ts`：唯一内置配置 `FATE_POEM_CALENDAR_PROFILE`
- `normalize.ts`：仅归一化该世界书允许覆盖的路径、纪元、提示词默认值和开发者模式；任何不同的 Profile ID 都给出警告并忽略
- `index.ts`：聊天上下文初始化、活动配置与 getter
- `festival-visual-presets.ts`：索伦蒂斯等命定世界节庆的专属颜色和图标

## 唯一 Profile

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
```

`id` 固定为 `fate-poem`。读取既有世界书时，旧 ID 不会切换产品；显式保存索引时，编辑器会写回 `fate-poem`。

运行时路径优先级仍保留：聊天路径覆盖 → `配置档案设置.路径` → 旧 `默认设置` → 内置命定路径；不能因为删除多 Profile 系统就丢失旧存档或自定义路径。

## 保留

固定事件和阶段、MVU 临时/重复事件、提醒、世界书 Scanner/Prompt、隐藏剧情解封、正文阅读、编辑器、归档及 `dlc_ellia`。

## 不再做

- 新增 Generic Profile、新世界 Profile 注册表和角色名自动匹配
- 为了“通用日历”复制另一个 UI、CalendarCore 引擎或事件模型
- 把具体节庆日期硬编码进源码（仍由 `[fixed_event_index]` 决定）
