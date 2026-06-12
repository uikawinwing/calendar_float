import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_OVERRIDE_STYLE = `
    #${ROOT_ID} .th-policy-tag-search-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 32px auto;
      gap: 6px;
      align-items: center;
    }

    #${ROOT_ID} .th-policy-tag-search-shell input {
      width: 100%;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid var(--th-line);
      border-radius: 11px;
      background: rgba(255, 252, 246, 0.82);
      color: var(--th-ink);
      font-size: 12px;
      outline: none;
    }

    #${ROOT_ID} .th-policy-tag-search-shell input:focus {
      border-color: color-mix(in srgb, var(--th-accent) 56%, var(--th-line));
      box-shadow: 0 0 0 3px var(--th-accent-soft);
    }

    #${ROOT_ID} .th-policy-tag-arrow {
      display: inline-grid;
      place-items: center;
      width: 32px;
      height: 32px;
      min-width: 32px;
      border: 1px solid var(--th-line-strong);
      border-radius: 10px;
      background: rgba(255, 252, 246, 0.88);
      color: var(--th-muted);
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      font-weight: 900;
      line-height: 1;
      transition: transform 0.16s ease, border-color 0.16s ease, color 0.16s ease, background 0.16s ease;
    }

    #${ROOT_ID} .th-policy-tag-arrow.is-open {
      color: var(--th-accent);
      border-color: color-mix(in srgb, var(--th-accent) 52%, var(--th-line-strong));
      background: var(--th-accent-soft);
      transform: rotate(180deg);
    }

    #${ROOT_ID} .th-policy-tag-add {
      min-width: 48px;
      padding-inline: 10px;
      justify-content: center;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-policy-tag-meta {
      color: var(--th-muted);
      font-size: 11px;
      font-weight: 650;
      line-height: 1.35;
    }

    #${ROOT_ID} .th-policy-tag-picker .th-tag-option-list {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 5px;
      max-height: 152px;
      overflow: auto;
      padding: 6px;
      border: 1px solid var(--th-line);
      border-radius: 12px;
      background: rgba(255, 249, 238, 0.62);
    }

    #${ROOT_ID} .th-policy-tag-picker .th-tag-option-list[hidden] {
      display: none !important;
    }

    #${ROOT_ID} .th-policy-tag-picker .th-tag-option {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      align-items: center;
      gap: 7px;
      width: 100%;
      min-height: 30px;
      padding: 6px 8px;
      border-radius: 9px;
      text-align: left;
    }

    #${ROOT_ID} .th-policy-tag-picker .th-tag-option-check {
      display: inline-grid;
      place-items: center;
      width: 16px;
      height: 16px;
      color: var(--th-accent);
      font-size: 11px;
      font-weight: 950;
      line-height: 1;
    }

    #${ROOT_ID} .th-agenda-item,
    #${ROOT_ID} .th-detail-card {
      border-radius: 16px;
      padding: 12px;
    }

    #${ROOT_ID} .th-agenda-group {
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }

    #${ROOT_ID} .th-card-actions--icon .th-icon-btn {
      width: 25px;
      height: 25px;
      min-width: 25px;
      border-radius: 9px;
      font-size: 12px;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-calendar-main {
      grid-template-rows: auto minmax(0, 1fr);
    }

    #${ROOT_ID}[data-reading-book='true'] [data-role="month-grid"] {
      padding: 0;
      overflow: hidden;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-fab-add,
    #${ROOT_ID}[data-reading-book='true'] .th-fab-list {
      display: none !important;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-main-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      min-height: 0;
      height: 100%;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-main-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      gap: 0;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-main-title-wrap {
      min-width: 0;
      width: 100%;
      max-width: none;
      justify-self: stretch;
      text-align: center;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-main-head .th-month-title {
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      font-size: clamp(22px, var(--th-book-title-size, 48px), 48px);
      line-height: 1.12;
      white-space: normal;
      word-break: normal;
      overflow-wrap: anywhere;
      overflow: hidden;
      text-overflow: clip;
      text-align: center;
      letter-spacing: 0.02em;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-return-btn {
      justify-self: end;
      white-space: nowrap;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-reading-surface {
      min-height: 0;
      overflow: auto;
      padding: 34px clamp(16px, 3vw, 34px) 18px;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-book-pagination {
      align-self: end;
      margin: 0;
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-main,
    #${ROOT_ID}[data-theme='dark'] .th-calendar-side,
    #${ROOT_ID}[data-theme='dark'] .th-month-board,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel,
    #${ROOT_ID}[data-theme='dark'] .th-form-advanced,
    #${ROOT_ID}[data-theme='dark'] .th-empty,
    #${ROOT_ID}[data-theme='dark'] .th-reminder-summary {
      background: color-mix(in srgb, var(--th-surface) 86%, transparent) !important;
      border-color: var(--th-line) !important;
      color: var(--th-ink) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-main-head,
    #${ROOT_ID}[data-theme='dark'] .th-side-head,
    #${ROOT_ID}[data-theme='dark'] .th-sidebar-tabs,
    #${ROOT_ID}[data-theme='dark'] [data-role="month-grid"],
    #${ROOT_ID}[data-theme='dark'] .th-week-head {
      background: color-mix(in srgb, var(--th-surface-2) 76%, transparent) !important;
      border-color: var(--th-line) !important;
      color: var(--th-ink) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell {
      background: transparent !important;
      border-right-color: var(--th-line) !important;
      color: var(--th-ink) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-week-block {
      border-bottom-color: var(--th-line) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-muted {
      background: rgba(255, 255, 255, 0.025) !important;
      color: var(--th-muted) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected {
      background: linear-gradient(135deg, var(--th-accent-soft), transparent 72%) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected::after {
      border-color: color-mix(in srgb, var(--th-accent) 48%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-today .th-day-number {
      color: #0b1220 !important;
      background: #d7e7ff !important;
      box-shadow: 0 0 18px rgba(184, 215, 255, 0.42) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-btn,
    #${ROOT_ID}[data-theme='dark'] .th-book-link,
    #${ROOT_ID}[data-theme='dark'] .th-tab-button,
    #${ROOT_ID}[data-theme='dark'] .th-side-search-btn,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell input,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell select,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell textarea,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar select,
    #${ROOT_ID}[data-theme='dark'] .th-policy-tag-search-shell input,
    #${ROOT_ID}[data-theme='dark'] .th-policy-tag-arrow {
      background: rgba(13, 16, 30, 0.74) !important;
      border-color: rgba(178, 196, 235, 0.18) !important;
      color: var(--th-ink) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    #${ROOT_ID} .th-calendar-main,
    #${ROOT_ID} .th-calendar-side {
      background: rgba(255, 253, 247, 0.9) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-main,
    #${ROOT_ID}[data-theme='dark'] .th-calendar-side {
      background: rgba(15, 24, 40, 0.84) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar {
      background: transparent !important;
      border-color: rgba(151, 184, 235, 0.14) !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-check-proxy {
      color: var(--th-accent) !important;
      border-color: color-mix(in srgb, var(--th-accent) 62%, var(--th-line-strong)) !important;
      background: color-mix(in srgb, var(--th-accent) 18%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tab-button.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-primary-btn,
    #${ROOT_ID}[data-theme='dark'] .th-tab-add-button.is-active {
      color: #06111f !important;
      background: #d7e7ff !important;
      border-color: rgba(158, 203, 255, 0.76) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.46),
        0 0 18px rgba(158, 203, 255, 0.22) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival {
      color: #1f1605 !important;
      background: linear-gradient(90deg, #fef08a, #facc15 62%, #f59e0b) !important;
      border-color: rgba(255, 237, 122, 0.9) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.46),
        0 0 18px rgba(250, 204, 21, 0.42) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user {
      color: #031525 !important;
      background: linear-gradient(90deg, #bae6fd, #38bdf8 58%, #0ea5e9) !important;
      border-color: rgba(125, 211, 252, 0.92) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.42),
        0 0 18px rgba(56, 189, 248, 0.38) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color {
      color: var(--th-chip-text) !important;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-chip-bg) 84%, #ffffff 16%),
          color-mix(in srgb, var(--th-chip-border) 72%, var(--th-chip-bg) 28%)
        ) !important;
      border-color: color-mix(in srgb, var(--th-chip-border) 82%, #ffffff 18%) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.48),
        inset 0 -1px 0 color-mix(in srgb, var(--th-chip-border) 46%, transparent),
        0 0 20px color-mix(in srgb, var(--th-chip-bg) 58%, transparent) !important;
      text-shadow: none;
    }

    #${ROOT_ID}[data-theme='dark'] .th-corner-marker {
      width: 19px !important;
      height: 19px !important;
      color: color-mix(in srgb, var(--th-marker-text) 48%, #ffffff 52%) !important;
      border-color: color-mix(in srgb, var(--th-marker-border) 76%, #ffffff 24%) !important;
      background:
        radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.36), transparent 34%),
        color-mix(in srgb, var(--th-marker-bg) 82%, #07101d 18%) !important;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.08),
        0 0 15px color-mix(in srgb, var(--th-marker-bg) 38%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-corner-marker-svg {
      width: 13px !important;
      height: 13px !important;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.28));
    }

    #${ROOT_ID}[data-theme='dark'] .th-corner-marker-overflow {
      background: rgba(184, 215, 255, 0.2) !important;
      color: #dcecff !important;
      border-color: rgba(184, 215, 255, 0.34) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top {
      background: linear-gradient(90deg, rgba(216, 183, 111, 0.2), rgba(20, 32, 55, 0.78) 62%, rgba(13, 22, 38, 0.92)) !important;
      border-bottom-color: rgba(216, 183, 111, 0.2) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color {
      --th-card-accent-soft: color-mix(in srgb, var(--th-card-accent) 64%, #0b1424 36%) !important;
      --th-card-accent-border: color-mix(in srgb, var(--th-card-accent) 86%, rgba(255, 255, 255, 0.34)) !important;
      --th-card-accent-strong: var(--th-card-title-text, #06111f) !important;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--th-card-accent) 15%, rgba(10, 18, 32, 0.78)), rgba(10, 18, 32, 0.72)) !important;
      border-color: color-mix(in srgb, var(--th-card-accent) 70%, rgba(151, 184, 235, 0.18)) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top {
      background: linear-gradient(
        90deg,
        color-mix(in srgb, var(--th-card-accent) 58%, rgba(8, 13, 24, 0.88)) 0%,
        color-mix(in srgb, var(--th-card-accent) 34%, rgba(20, 32, 55, 0.82)) 46%,
        color-mix(in srgb, var(--th-card-accent) 14%, rgba(13, 22, 38, 0.94)) 100%
      ) !important;
      border-bottom-color: var(--th-card-accent-border) !important;
      box-shadow:
        inset 0 1px 0 color-mix(in srgb, var(--th-card-accent) 32%, rgba(255, 255, 255, 0.08)),
        inset 0 -1px 0 color-mix(in srgb, var(--th-card-accent) 44%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top::before {
      background: var(--th-card-accent-strong) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-title {
      color: var(--th-card-accent-strong) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-title-icon {
      border-color: color-mix(in srgb, var(--th-card-accent-strong) 58%, rgba(184, 215, 255, 0.2)) !important;
      background:
        radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.18), transparent 38%),
        color-mix(in srgb, var(--th-card-accent) 34%, rgba(8, 13, 24, 0.9)) !important;
      color: var(--th-card-accent-strong) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.12),
        0 0 16px color-mix(in srgb, var(--th-card-accent) 28%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-location-label {
      border-color: color-mix(in srgb, var(--th-card-accent-strong) 62%, rgba(184, 215, 255, 0.18)) !important;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--th-card-accent) 34%, rgba(255, 255, 255, 0.08)), color-mix(in srgb, var(--th-card-accent) 24%, rgba(8, 13, 24, 0.92))) !important;
      color: var(--th-card-accent-strong) !important;
      box-shadow: 0 0 14px color-mix(in srgb, var(--th-card-accent) 18%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-date,
    #${ROOT_ID}[data-theme='dark'] .th-month-title,
    #${ROOT_ID}[data-theme='dark'] .th-side-title,
    #${ROOT_ID}[data-theme='dark'] .th-side-section-title {
      color: var(--th-ink) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-stage,
    #${ROOT_ID}[data-theme='dark'] .th-item-time,
    #${ROOT_ID}[data-theme='dark'] .th-detail-meta,
    #${ROOT_ID}[data-theme='dark'] .th-item-summary,
    #${ROOT_ID}[data-theme='dark'] .th-detail-summary,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toggle,
    #${ROOT_ID}[data-theme='dark'] .th-tag-picker-empty {
      color: var(--th-muted) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-tags span,
    #${ROOT_ID}[data-theme='dark'] .th-form-tag-chip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-option,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag,
    #${ROOT_ID}[data-theme='dark'] .th-book-page-tab {
      background: rgba(184, 215, 255, 0.1) !important;
      border-color: rgba(151, 184, 235, 0.18) !important;
      color: #c7d8f4 !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-location-label {
      color: var(--th-card-accent-strong) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-policy-tag-picker .th-tag-option-list {
      background: rgba(10, 18, 32, 0.72) !important;
      border-color: rgba(151, 184, 235, 0.18) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-policy-field-label small,
    #${ROOT_ID}[data-theme='dark'] .th-policy-tag-meta {
      color: var(--th-muted) !important;
    }

    #${ROOT_ID} .th-agenda-item.is-festival:not(.has-custom-color),
    #${ROOT_ID} .th-detail-card.is-festival:not(.has-custom-color) {
      --th-card-accent: #ffe66d;
      --th-card-accent-soft: #fff2a8;
      --th-card-accent-border: #d69a00;
      --th-card-accent-strong: #382500;
    }

    #${ROOT_ID} .th-agenda-item.is-active,
    #${ROOT_ID} .th-detail-card.is-active {
      --th-card-accent: #a7d8ff;
      --th-card-accent-soft: #dff1ff;
      --th-card-accent-border: #3b82c4;
      --th-card-accent-strong: #06345f;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-festival:not(.has-custom-color),
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-festival:not(.has-custom-color) {
      --th-card-accent: #ffe66d !important;
      --th-card-accent-soft: rgba(255, 230, 109, 0.2) !important;
      --th-card-accent-border: rgba(255, 237, 153, 0.76) !important;
      --th-card-accent-strong: #fff7cf !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-active {
      --th-card-accent: #7dd3fc !important;
      --th-card-accent-soft: rgba(125, 211, 252, 0.2) !important;
      --th-card-accent-border: rgba(186, 230, 253, 0.72) !important;
      --th-card-accent-strong: #e0f7ff !important;
    }

    #${ROOT_ID} .th-item-title {
      font-size: clamp(15px, 0.92vw, 18px);
      line-height: 1.25;
      color: var(--th-card-accent-strong);
    }

    #${ROOT_ID} .th-item-summary,
    #${ROOT_ID} .th-detail-summary {
      font-size: clamp(13px, 0.82vw, 15px);
      line-height: 1.65;
    }

    #${ROOT_ID} .th-festival-title-icon {
      width: 36px !important;
      height: 36px !important;
      border-radius: 13px !important;
      color: var(--th-festival-icon-color, #382500) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-festival-title-svg {
      width: 23px !important;
      height: 23px !important;
    }

    #${ROOT_ID} .th-festival-title-svg path,
    #${ROOT_ID} .th-corner-marker-svg path {
      fill: currentColor !important;
    }

    #${ROOT_ID} .th-festival-title-dot {
      background: currentColor !important;
    }

    #${ROOT_ID} .th-corner-marker {
      width: 22px !important;
      height: 22px !important;
      color: var(--th-marker-icon, var(--th-marker-text)) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-corner-marker-svg {
      width: 15px !important;
      height: 15px !important;
      filter: none !important;
    }

    #${ROOT_ID} .th-chip {
      min-height: 24px;
      gap: 6px;
      padding-inline: 9px;
      font-size: clamp(12.5px, 0.76vw, 14px);
      font-weight: 850;
      line-height: 1.18;
      border-width: 1px;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        inset 0 -1px 0 rgba(25, 18, 10, 0.14) !important;
      text-shadow: none !important;
    }

    #${ROOT_ID} .th-chip::before {
      content: '';
      flex: 0 0 auto;
      width: 4px;
      height: 13px;
      border-radius: 999px;
      background: currentColor;
      opacity: 0.82;
    }

    #${ROOT_ID} .th-chip.is-festival::before {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 16%, transparent);
    }

    #${ROOT_ID} .th-chip.is-user::before {
      width: 4px;
      height: 13px;
    }

    #${ROOT_ID} .th-chip.is-archived::before {
      width: 9px;
      height: 3px;
      border-radius: 999px;
      opacity: 0.72;
    }

    #${ROOT_ID} .th-week-chip-grid {
      grid-auto-rows: 25px;
      row-gap: 4px;
    }

    #${ROOT_ID} .th-week-chip-grid .th-chip {
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
    }

    #${ROOT_ID} .th-week-chip-bar,
    #${ROOT_ID} .th-chip.is-continue-left,
    #${ROOT_ID} .th-chip.is-continue-right,
    #${ROOT_ID} .th-chip.is-continue-left.is-continue-right {
      border-radius: 999px !important;
    }

    #${ROOT_ID} .th-chip.is-continue-left {
      border-top-left-radius: 999px !important;
      border-bottom-left-radius: 999px !important;
    }

    #${ROOT_ID} .th-chip.is-continue-right {
      border-top-right-radius: 999px !important;
      border-bottom-right-radius: 999px !important;
    }

    #${ROOT_ID} .th-item-top::before {
      margin: 11px 0;
      min-height: 30px;
      border-radius: 999px !important;
      background: transparent !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tab-button.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-primary-btn,
    #${ROOT_ID}[data-theme='dark'] .th-tab-add-button.is-active {
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival {
      color: #fff7cf !important;
      background:
        linear-gradient(90deg, rgba(255, 230, 109, 0.18), rgba(245, 158, 11, 0.3)) !important;
      border-color: rgba(255, 226, 112, 0.92) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(245, 158, 11, 0.36),
        0 0 16px rgba(245, 158, 11, 0.18) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user {
      color: #e0f7ff !important;
      background:
        linear-gradient(90deg, rgba(96, 165, 250, 0.18), rgba(56, 189, 248, 0.28)) !important;
      border-color: rgba(125, 211, 252, 0.88) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.2),
        inset 0 -1px 0 rgba(14, 165, 233, 0.36),
        0 0 16px rgba(56, 189, 248, 0.18) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color {
      color: color-mix(in srgb, var(--th-chip-bg) 22%, #ffffff 78%) !important;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-chip-bg) 22%, transparent),
          color-mix(in srgb, var(--th-chip-border) 32%, transparent)
        ) !important;
      border-color: color-mix(in srgb, var(--th-chip-border) 82%, #ffffff 18%) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        inset 0 -1px 0 color-mix(in srgb, var(--th-chip-border) 34%, transparent),
        0 0 16px color-mix(in srgb, var(--th-chip-bg) 22%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card {
      border-color: rgba(184, 215, 255, 0.28) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top {
      border-bottom-color: rgba(184, 215, 255, 0.22) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-time,
    #${ROOT_ID}[data-theme='dark'] .th-detail-meta {
      color: #c8d6ea !important;
      font-weight: 760;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-summary,
    #${ROOT_ID}[data-theme='dark'] .th-detail-summary {
      color: #e5edf8 !important;
    }

    #${ROOT_ID} .th-chip.is-continue-left,
    #${ROOT_ID} .th-chip.is-continue-right,
    #${ROOT_ID} .th-chip.is-continue-left.is-continue-right {
      width: auto !important;
      max-width: none;
    }

    #${ROOT_ID}[data-theme='dark'] .th-corner-marker {
      color: var(--th-marker-icon, var(--th-marker-text)) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-title-icon {
      color: var(--th-festival-icon-color, #382500) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-title-icon {
      color: var(--th-festival-icon-color, #382500) !important;
      background: transparent !important;
      border-color: transparent !important;
    }

    #${ROOT_ID} .th-festival-location-label {
      color: var(--th-festival-location-text, #fffaf0) !important;
      border-color: var(--th-festival-location-border, transparent) !important;
      background: var(--th-festival-location-bg, var(--th-card-accent-strong)) !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-location-label {
      color: var(--th-festival-location-text, #fffaf0) !important;
      border-color: var(--th-festival-location-border, transparent) !important;
      background: var(--th-festival-location-bg, var(--th-card-accent-strong)) !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-location-label {
      color: var(--th-festival-location-text, var(--th-card-accent-strong)) !important;
      border-color: var(--th-festival-location-border, transparent) !important;
      background: var(--th-festival-location-bg, transparent) !important;
    }

    #${ROOT_ID} .th-book-main-head .th-month-title,
    #${ROOT_ID} .th-book-reader-head .th-item-title {
      color: #2f2100 !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-main-head .th-month-title,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-head .th-item-title {
      color: #fff7cf !important;
    }

    #${ROOT_ID} .th-agenda-item,
    #${ROOT_ID} .th-detail-card {
      background:
        linear-gradient(180deg, rgba(255, 252, 246, 0.92), rgba(255, 249, 238, 0.82)) !important;
      border-color: color-mix(in srgb, var(--th-card-accent-border) 58%, rgba(108, 76, 38, 0.18)) !important;
      box-shadow:
        0 10px 22px rgba(95, 66, 31, 0.055),
        inset 0 1px 0 rgba(255, 255, 255, 0.62) !important;
    }

    #${ROOT_ID} .th-item-top {
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-card-accent) 10%, rgba(255, 252, 246, 0.94)),
          rgba(255, 252, 246, 0.84)
        ) !important;
      border-bottom-color: color-mix(in srgb, var(--th-card-accent-border) 50%, rgba(108, 76, 38, 0.14)) !important;
    }

    #${ROOT_ID} .th-item-top::before {
      background: var(--th-card-accent-border) !important;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--th-card-accent-border) 26%, transparent) !important;
    }

    #${ROOT_ID} .th-item-title {
      color: #2f2419 !important;
    }

    #${ROOT_ID} .th-item-time,
    #${ROOT_ID} .th-detail-meta {
      color: #77634c !important;
      font-weight: 760;
    }

    #${ROOT_ID} .th-item-summary,
    #${ROOT_ID} .th-detail-summary {
      color: #44372a !important;
    }

    #${ROOT_ID} .th-festival-title-icon {
      color: color-mix(in srgb, var(--th-card-accent-border) 76%, #2f2419 24%) !important;
    }

    #${ROOT_ID} .th-festival-location-label {
      color: color-mix(in srgb, var(--th-card-accent-border) 70%, #2f2419 30%) !important;
      border-color: color-mix(in srgb, var(--th-card-accent-border) 72%, rgba(108, 76, 38, 0.16)) !important;
      background: color-mix(in srgb, var(--th-card-accent) 16%, rgba(255, 252, 246, 0.86)) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card {
      background:
        linear-gradient(180deg, rgba(13, 23, 40, 0.88), rgba(8, 14, 26, 0.9)) !important;
      border-color: color-mix(in srgb, var(--th-card-accent-border) 52%, rgba(184, 215, 255, 0.2)) !important;
      box-shadow:
        0 16px 30px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.055) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top {
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-card-accent) 13%, rgba(20, 32, 55, 0.88)),
          rgba(10, 18, 32, 0.88)
        ) !important;
      border-bottom-color: color-mix(in srgb, var(--th-card-accent-border) 44%, rgba(184, 215, 255, 0.14)) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top::before {
      background: color-mix(in srgb, var(--th-card-accent-border) 84%, #ffffff 16%) !important;
      box-shadow: 0 0 12px color-mix(in srgb, var(--th-card-accent-border) 28%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-title {
      color: #f2f6ff !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-title-icon {
      color: color-mix(in srgb, var(--th-card-accent-border) 62%, #ffffff 38%) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-location-label {
      color: color-mix(in srgb, var(--th-card-accent-border) 64%, #ffffff 36%) !important;
      border-color: color-mix(in srgb, var(--th-card-accent-border) 62%, rgba(184, 215, 255, 0.18)) !important;
      background: color-mix(in srgb, var(--th-card-accent) 14%, rgba(8, 13, 24, 0.86)) !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-chip,
    #${ROOT_ID} .th-chip.is-festival,
    #${ROOT_ID} .th-chip.is-user,
    #${ROOT_ID} .th-chip.is-archived,
    #${ROOT_ID} .th-chip.has-custom-color {
      color: #2f2419 !important;
      background:
        linear-gradient(90deg, rgba(214, 171, 91, 0.28), rgba(214, 171, 91, 0.18)) !important;
      border-color: rgba(166, 120, 50, 0.58) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.42),
        inset 0 -1px 0 rgba(128, 86, 28, 0.16) !important;
    }

    #${ROOT_ID} .th-chip::before {
      color: #9b6a1f;
    }

    #${ROOT_ID} .th-agenda-item,
    #${ROOT_ID} .th-detail-card,
    #${ROOT_ID} .th-agenda-item.is-festival,
    #${ROOT_ID} .th-detail-card.is-festival,
    #${ROOT_ID} .th-agenda-item.is-active,
    #${ROOT_ID} .th-detail-card.is-active,
    #${ROOT_ID} .th-agenda-item.is-archive,
    #${ROOT_ID} .th-detail-card.is-archive,
    #${ROOT_ID} .th-agenda-item.has-custom-color,
    #${ROOT_ID} .th-detail-card.has-custom-color {
      --th-card-accent: #d6ab5b !important;
      --th-card-accent-soft: rgba(214, 171, 91, 0.16) !important;
      --th-card-accent-border: rgba(166, 120, 50, 0.58) !important;
      --th-card-accent-strong: #2f2419 !important;
      --th-card-title-text: #2f2419 !important;
    }

    #${ROOT_ID} .th-item-top::before,
    #${ROOT_ID} .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-item-top::before {
      background: #a67832 !important;
      box-shadow: 0 0 0 1px rgba(166, 120, 50, 0.2) !important;
    }

    #${ROOT_ID} .th-festival-title-icon,
    #${ROOT_ID} .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-festival-title-icon,
    #${ROOT_ID} .th-festival-location-label,
    #${ROOT_ID} .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-festival-location-label {
      color: #7b561d !important;
      border-color: rgba(166, 120, 50, 0.42) !important;
      background: rgba(214, 171, 91, 0.12) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-archived,
    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color {
      color: #e7f0ff !important;
      background:
        linear-gradient(90deg, rgba(90, 132, 194, 0.26), rgba(90, 132, 194, 0.16)) !important;
      border-color: rgba(139, 177, 231, 0.62) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        inset 0 -1px 0 rgba(60, 98, 156, 0.22),
        0 0 14px rgba(74, 123, 196, 0.16) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip::before {
      color: #b9d4ff;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-festival,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-festival,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-archive,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-archive,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color {
      --th-card-accent: #5a84c2 !important;
      --th-card-accent-soft: rgba(90, 132, 194, 0.16) !important;
      --th-card-accent-border: rgba(139, 177, 231, 0.62) !important;
      --th-card-accent-strong: #f2f6ff !important;
      --th-card-title-text: #f2f6ff !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top::before {
      background: #8bb1e7 !important;
      box-shadow: 0 0 12px rgba(139, 177, 231, 0.24) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-location-label {
      color: #cfe1ff !important;
      border-color: rgba(139, 177, 231, 0.42) !important;
      background: rgba(90, 132, 194, 0.12) !important;
    }

    #${ROOT_ID} .th-chip.has-custom-color {
      color: var(--th-chip-text) !important;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-chip-bg) 88%, #ffffff 12%),
          var(--th-chip-bg)
        ) !important;
      border-color: var(--th-chip-border) !important;
    }

    #${ROOT_ID} .th-chip.has-custom-color::before {
      color: var(--th-chip-border) !important;
      background: currentColor !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color,
    #${ROOT_ID} .th-detail-card.has-custom-color {
      --th-card-accent: var(--th-custom-card-accent) !important;
      --th-card-accent-soft: var(--th-custom-card-accent-soft) !important;
      --th-card-accent-border: var(--th-custom-card-accent-border) !important;
      --th-card-accent-strong: var(--th-custom-card-accent-strong) !important;
      --th-card-title-text: var(--th-custom-card-title-text) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color {
      color: color-mix(in srgb, var(--th-chip-bg) 22%, #ffffff 78%) !important;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-chip-bg) 26%, transparent),
          color-mix(in srgb, var(--th-chip-border) 38%, transparent)
        ) !important;
      border-color: color-mix(in srgb, var(--th-chip-border) 82%, #ffffff 18%) !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color,
    #${ROOT_ID} .th-detail-card.has-custom-color {
      background:
        linear-gradient(180deg, rgba(255, 252, 246, 0.92), rgba(255, 249, 238, 0.82)) !important;
      border-color: var(--th-line) !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-item-top,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-item-top {
      background:
        linear-gradient(90deg, rgba(255, 252, 246, 0.94), rgba(255, 252, 246, 0.84)) !important;
      border-bottom-color: var(--th-line) !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-item-top::before {
      background: var(--th-custom-card-accent-border) !important;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--th-custom-card-accent-border) 22%, transparent) !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-item-title,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-item-title {
      color: #2f2419 !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-festival-title-icon {
      color: var(--th-custom-card-accent-border) !important;
      border-color: color-mix(in srgb, var(--th-custom-card-accent-border) 44%, rgba(108, 76, 38, 0.16)) !important;
      background: color-mix(in srgb, var(--th-custom-card-accent) 22%, rgba(255, 252, 246, 0.9)) !important;
    }

    #${ROOT_ID} .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID} .th-detail-card.has-custom-color .th-festival-location-label {
      color: color-mix(in srgb, var(--th-custom-card-accent-border) 70%, #2f2419 30%) !important;
      border-color: color-mix(in srgb, var(--th-custom-card-accent-border) 58%, rgba(108, 76, 38, 0.16)) !important;
      background: color-mix(in srgb, var(--th-custom-card-accent) 16%, rgba(255, 252, 246, 0.86)) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color {
      background:
        linear-gradient(180deg, rgba(13, 23, 40, 0.88), rgba(8, 14, 26, 0.9)) !important;
      border-color: rgba(184, 215, 255, 0.2) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top {
      background: linear-gradient(90deg, rgba(20, 32, 55, 0.88), rgba(10, 18, 32, 0.88)) !important;
      border-bottom-color: rgba(184, 215, 255, 0.14) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-top::before,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-top::before {
      background: color-mix(in srgb, var(--th-custom-card-accent-border) 84%, #ffffff 16%) !important;
      box-shadow: 0 0 12px color-mix(in srgb, var(--th-custom-card-accent-border) 28%, transparent) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-item-title,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-item-title {
      color: #f2f6ff !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-title-icon,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-title-icon {
      color: color-mix(in srgb, var(--th-custom-card-accent-border) 64%, #ffffff 36%) !important;
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.has-custom-color .th-festival-location-label,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.has-custom-color .th-festival-location-label {
      color: color-mix(in srgb, var(--th-custom-card-accent-border) 64%, #ffffff 36%) !important;
      border-color: color-mix(in srgb, var(--th-custom-card-accent-border) 58%, rgba(184, 215, 255, 0.18)) !important;
      background: color-mix(in srgb, var(--th-custom-card-accent) 12%, rgba(8, 13, 24, 0.86)) !important;
    }

    #${ROOT_ID} .th-week-chip-grid {
      grid-auto-rows: 26px;
      row-gap: 4px;
    }

    #${ROOT_ID} .th-chip,
    #${ROOT_ID} .th-week-chip-grid .th-chip {
      justify-content: flex-start;
      min-width: 0;
      padding-inline: 8px;
      gap: 5px;
      font-size: 13px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0;
    }

    #${ROOT_ID} .th-chip::before {
      opacity: 1;
      box-shadow: none;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user,
    #${ROOT_ID}[data-theme='dark'] .th-chip.is-archived {
      color: #f8fbff !important;
      background:
        linear-gradient(90deg, rgba(89, 116, 150, 0.88), rgba(64, 91, 126, 0.76)) !important;
      border-color: rgba(190, 215, 250, 0.72) !important;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.55);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.22),
        inset 0 -1px 0 rgba(26, 44, 72, 0.4),
        0 0 0 1px rgba(4, 10, 20, 0.2) !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color {
      color: #ffffff !important;
      background:
        linear-gradient(
          90deg,
          color-mix(in srgb, var(--th-chip-bg) 58%, #07111f 42%),
          color-mix(in srgb, var(--th-chip-border) 68%, #07111f 32%)
        ) !important;
      border-color: color-mix(in srgb, var(--th-chip-border) 72%, #ffffff 28%) !important;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.64);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.has-custom-color::before {
      background: color-mix(in srgb, var(--th-chip-border) 76%, #ffffff 24%) !important;
      color: color-mix(in srgb, var(--th-chip-border) 76%, #ffffff 24%) !important;
    }

    #${ROOT_ID} .th-main-head {
      min-height: 52px;
      padding: 0 18px;
    }

    #${ROOT_ID} [data-role="month-grid"] {
      padding: 10px 16px 22px;
      gap: 0;
    }

    #${ROOT_ID} .th-month-view {
      gap: 12px;
    }

    #${ROOT_ID} .th-month-header {
      padding: 0;
      align-items: end;
    }

    #${ROOT_ID} .th-month-title {
      line-height: 1.05;
    }

    #${ROOT_ID} .th-week-chip-grid {
      top: 34px;
      grid-auto-rows: 22px;
      row-gap: 3px;
    }

    #${ROOT_ID} .th-chip,
    #${ROOT_ID} .th-week-chip-grid .th-chip {
      min-height: 0;
      padding-inline: 7px;
      font-size: 12.5px;
    }

    #${ROOT_ID} [data-role="month-grid"] {
      overflow-x: hidden;
    }

    #${ROOT_ID} .th-month-header {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
    }

    #${ROOT_ID} .th-month-actions {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      max-width: 100%;
    }

    #${ROOT_ID} .th-month-actions .th-btn {
      flex: 0 0 auto;
      height: 40px;
      min-height: 40px;
    }

    #${ROOT_ID} .th-festival-scope-btn {
      min-width: 112px;
      padding-inline: 14px;
    }

    #${ROOT_ID} .th-month-nav-btn {
      width: 48px;
      min-width: 48px;
    }

    #${ROOT_ID} .th-month-today-btn {
      min-width: 68px;
      padding-inline: 14px;
    }

    #${ROOT_ID} .th-sidebar-tabs {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-tab-button {
      flex: 1 1 0;
      min-width: 0;
      height: 40px;
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    #${ROOT_ID} .th-side-search-btn,
    #${ROOT_ID} .th-tab-add-button {
      flex: 0 0 40px;
      width: 40px;
      min-width: 40px;
      height: 40px;
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

`;
