export type 日历世界书内容类型 = '节庆介绍' | '节庆文本' | '节庆提醒' | '读物摘要' | '读物全文' | '其他';

export type 日历运行时消息匹配逻辑 = '全部满足' | '任一满足';
export type 日历运行时比较方式 = '包含' | '等于' | '正则';
export type 日历运行时条件来源 = '消息' | '用户消息' | 'mvu变量' | '变量';
export type 日历运行时提醒状态 = '未开始' | '进行中';
export type 日历运行时注入位置 = 'none' | 'in_chat';
export type 日历运行时输出模式 = 'silent_scan' | 'injectprompt';

export interface 日历世界书引用 {
  条目名: string;
  世界书?: string;
}

export interface 日历文本库引用 extends 日历世界书引用 {
  键?: string;
}

export interface 日历运行时变量条件 {
  路径: string;
  包含任一?: string[];
  包含全部?: string[];
  不包含任一?: string[];
  等于?: string | number | boolean | null;
  正则?: string;
  为空时视为未命中?: boolean;
}

export interface 日历运行时日期窗口条件 {
  路径?: string;
  开始?: string;
  结束?: string;
  提前天数?: number;
  延后天数?: number;
  仅进行中?: boolean;
  每隔年?: number;
  上次年份?: number;
}

export interface 日历运行时原子条件 {
  来源?: 日历运行时条件来源;
  路径?: string;
  包含任一?: string[];
  包含全部?: string[];
  不包含任一?: string[];
  等于?: string | number | boolean | null;
  正则?: string;
  日期窗口?: 日历运行时日期窗口条件;
  为空时视为未命中?: boolean;
}

export interface 日历运行时逻辑条件 {
  条件?: 日历运行时原子条件;
  全部满足?: 日历运行时逻辑条件[];
  任一满足?: 日历运行时逻辑条件[];
  都不满足?: 日历运行时逻辑条件[];
}

export interface 日历运行时触发映射 {
  启用?: boolean;
  默认逻辑?: 日历运行时消息匹配逻辑;
  消息关键词?: string[];
  用户消息包含?: string[];
  变量条件?: 日历运行时变量条件[];
  日期条件?: 日历运行时日期窗口条件 | null;
  完整逻辑?: 日历运行时逻辑条件 | null;
}

export interface 日历运行时输出配置 {
  模式: 日历运行时输出模式;
  位置: 日历运行时注入位置;
  深度: number;
  角色: 'system' | 'assistant' | 'user';
  作为扫描文本?: boolean;
}

export interface 日历运行时内容节点 {
  id: string;
  名称: string;
  类型?: 日历世界书内容类型;
  启用?: boolean;
  条目?: 日历世界书引用 | null;
  文本库?: 日历文本库引用 | null;
  内容ID?: string | null;
  正文?: string | null;
  状态正文?: Partial<Record<日历运行时提醒状态, string | null>>;
  触发?: 日历运行时触发映射 | null;
  扫描触发词?: string[];
  输出?: 日历运行时输出配置 | null;
  元数据?: Record<string, unknown>;
}

export interface 日历运行时节庆周期 {
  每隔年: number;
  上次年份: number;
}

export interface 日历运行时节庆条目 {
  id: string;
  名称: string;
  开始: string;
  结束: string;
  周期?: 日历运行时节庆周期;
  启用?: boolean;
  地点关键词?: string[];
  介绍?: 日历运行时内容节点 | null;
  文本?: 日历运行时内容节点[];
  提醒?: 日历运行时内容节点 | null;
  阶段?: 日历运行时节庆阶段条目[];
  相关书籍?: string[];
  元数据?: Record<string, unknown>;
}

export interface 日历运行时节庆阶段条目 {
  id: string;
  名称: string;
  开始: string;
  结束: string;
  周期?: 日历运行时节庆周期;
  启用?: boolean;
  提醒?: 日历运行时内容节点 | null;
  元数据?: Record<string, unknown>;
}

export interface 日历运行时书籍条目 {
  id: string;
  名称: string;
  启用?: boolean;
  摘要?: 日历运行时内容节点 | null;
  全文?: 日历运行时内容节点 | null;
  元数据?: Record<string, unknown>;
}

export interface 日历运行时提醒默认值 {
  注入方式?: 日历运行时输出模式;
  注入深度?: number;
  禁用递归?: boolean;
  禁用触发词?: boolean;
  宏触发词模板?: string;
  缺省模板?: Partial<Record<日历运行时提醒状态, string>>;
}

export interface 日历运行时书籍默认值 {
  摘要注入方式?: 'injectprompt';
  摘要注入深度?: number;
}

export interface 日历运行时默认设置 {
  mvu时间路径?: string;
  mvu地点路径?: string;
  书籍全文默认关键词模板?: string;
}

export interface 日历运行时索引 {
  版本?: number;
  说明?: string;
  索引条目名?: string;
  默认值?: Record<string, unknown>;
  默认设置?: 日历运行时默认设置;
  内容仓库?: Record<string, unknown>;
  条目命名约定?: Record<string, unknown>;
  提醒默认值?: 日历运行时提醒默认值;
  书籍默认值?: 日历运行时书籍默认值;
  月份别名?: Array<{
    月份: number;
    名称: string;
    季节?: string;
  }>;
  节庆?: 日历运行时节庆条目[];
  书籍?: 日历运行时书籍条目[];
}

export interface 日历运行时文本库 {
  [键: string]: string;
}

export interface 日历世界书来源条目 {
  世界书名: string;
  条目: WorldbookEntry;
}

export interface 日历世界书索引读取结果 {
  索引: 日历运行时索引 | null;
  来源世界书: string[];
  命中世界书名: string | null;
  命中条目名: string | null;
  警告: string[];
}

export interface 日历世界书文本库读取结果 {
  文本库: 日历运行时文本库;
  来源: 日历文本库引用 | null;
  命中条目名: string | null;
  警告: string[];
}
