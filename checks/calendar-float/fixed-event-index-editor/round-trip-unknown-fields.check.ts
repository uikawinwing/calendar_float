import { parse as parseYaml } from 'yaml';
import {
  parseFixedEventIndexDraft,
  serializeFixedEventIndexDraft,
} from '../../../src/calendar-float/fixed-event-index-editor';

const SOURCE = { entryName: '[fixed_event_index]', worldbookName: '测试世界书' };
const input = `
固定事件:
  - id: event_1
    名称: 测试节庆
    开始: 05-14
    结束: 05-15
    周期:
      每隔年: 2
      上次年份: 488
      自定义周期字段: keep-recurrence
    提醒:
      开始前提醒天数: 2
      开启自定义提醒:
        未开始: 即将开始
        进行中: 正在进行
        自定义提醒字段: keep-reminder
    次要关键字1:
      逻辑: 与任意
      关键字: [庆典]
      自定义关键字字段: keep-keyword
补充资料:
  - id: material_1
    书名: 测试资料
    全文:
      世界书: 测试世界书
      条目名: 测试正文
      自定义全文字段: keep-fulltext
`;

const output = parseYaml(serializeFixedEventIndexDraft(parseFixedEventIndexDraft(input, SOURCE))) as any;
const event = output.固定事件[0];
const material = output.补充资料[0];

if (event.周期.自定义周期字段 !== 'keep-recurrence') throw new Error('周期未知字段丢失');
if (event.提醒.开启自定义提醒.自定义提醒字段 !== 'keep-reminder') throw new Error('提醒未知字段丢失');
if (event.次要关键字1.自定义关键字字段 !== 'keep-keyword') throw new Error('次要关键字未知字段丢失');
if (material.全文.自定义全文字段 !== 'keep-fulltext') throw new Error('全文未知字段丢失');
console.log('round-trip-unknown-fields.check.ts OK');
