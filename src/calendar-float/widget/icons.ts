import arrowRotateRightIconSvg from '../../../svg/arrow-rotate-right-solid.svg?raw';
import arrowsRotateIconSvg from '../../../svg/arrows-rotate-solid.svg?raw';
import expandIconSvg from '../../../svg/expand-solid.svg?raw';
import leftLongIconSvg from '../../../svg/left-long-solid.svg?raw';
import maximizeIconSvg from '../../../svg/maximize-solid.svg?raw';
import minimizeIconSvg from '../../../svg/minimize-solid.svg?raw';
import rightLongIconSvg from '../../../svg/right-long-solid.svg?raw';
import xmarkIconSvg from '../../../svg/xmark-solid.svg?raw';

const UTILITY_ICONS = {
  close: xmarkIconSvg,
  expand: expandIconSvg,
  maximize: maximizeIconSvg,
  minimize: minimizeIconSvg,
  monthNext: rightLongIconSvg,
  monthPrev: leftLongIconSvg,
  reload: arrowRotateRightIconSvg,
  sync: arrowsRotateIconSvg,
} as const;

export type CalendarUtilityIconName = keyof typeof UTILITY_ICONS;

export function renderUtilityIcon(name: CalendarUtilityIconName, className = 'th-utility-icon'): string {
  const rawSvg = UTILITY_ICONS[name] ?? '';
  return rawSvg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace('<svg ', `<svg class="${className}" aria-hidden="true" focusable="false" `);
}
