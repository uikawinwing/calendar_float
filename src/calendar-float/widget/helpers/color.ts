import type { CalendarEventColorStyle } from '../../types';

export const TAG_COLOR_PALETTE: Array<CalendarEventColorStyle & { name: string }> = [
  { name: '天空蓝', background: '#dcecff', text: '#305d97', border: '#a8c7ed' },
  { name: '薰衣草', background: '#e9e2ff', text: '#5c4a98', border: '#c8bbf4' },
  { name: '薄荷绿', background: '#dff4e8', text: '#2f7048', border: '#a9d9b9' },
  { name: '玫瑰粉', background: '#ffe1eb', text: '#9a3d61', border: '#efadc2' },
  { name: '蜜糖黄', background: '#ffe6a6', text: '#895710', border: '#e8bf59' },
  { name: '湖水青', background: '#dff2f3', text: '#2d6f73', border: '#a7d4d7' },
  { name: '珊瑚橙', background: '#ffe3cf', text: '#9a4b20', border: '#efb186' },
  { name: '暖灰褐', background: '#f1e6d8', text: '#73583c', border: '#d3bea6' },
  { name: '石榴红', background: '#ffd8d2', text: '#9b2f2f', border: '#ee9e96' },
  { name: '墨绿', background: '#d8efe2', text: '#276153', border: '#9fcfba' },
  { name: '靛蓝', background: '#dfe6ff', text: '#3d4c93', border: '#aebcf0' },
  { name: '银雾', background: '#e8edf2', text: '#4d5c6b', border: '#bdc7d1' },
];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(value.trim());
}

function expandHexColor(value: string): string {
  const text = value.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(text)) {
    return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
  }
  return text;
}

function getHexRgb(value: string): { red: number; green: number; blue: number } | null {
  if (!isValidHexColor(value)) {
    return null;
  }
  const hex = expandHexColor(value).slice(1);
  return {
    red: parseInt(hex.slice(0, 2), 16),
    green: parseInt(hex.slice(2, 4), 16),
    blue: parseInt(hex.slice(4, 6), 16),
  };
}

function getRelativeLuminance(value: string): number | null {
  const rgb = getHexRgb(value);
  if (!rgb) {
    return null;
  }
  const convert = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(rgb.red) + 0.7152 * convert(rgb.green) + 0.0722 * convert(rgb.blue);
}

export function getContrastRatio(background: string, text: string): number | null {
  const backgroundLuminance = getRelativeLuminance(background);
  const textLuminance = getRelativeLuminance(text);
  if (backgroundLuminance === null || textLuminance === null) {
    return null;
  }
  const lighter = Math.max(backgroundLuminance, textLuminance);
  const darker = Math.min(backgroundLuminance, textLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}
