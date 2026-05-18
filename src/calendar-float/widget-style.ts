import { ROOT_ID, STYLE_ID } from './constants';

export function ensureCalendarWidgetStyle(hostDocument: Document): void {
  if (!hostDocument || hostDocument.getElementById(STYLE_ID)) {
    return;
  }

  const style = hostDocument.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute('script_id', getScriptId());
  style.textContent = `
    #${ROOT_ID} {
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
      color: #2b241c;
    }

    #${ROOT_ID} * { box-sizing: border-box; }

    #${ROOT_ID} .th-calendar-ball {
      position: fixed;
      left: calc(100vw - 88px);
      top: 32vh;
      width: 68px;
      height: 68px;
      border: 1px solid rgba(147, 112, 51, 0.45);
      border-radius: 20px;
      background: rgba(233, 211, 171, 0.86);
      color: #4c3820;
      box-shadow: 0 14px 30px rgba(68, 44, 20, 0.18);
      backdrop-filter: blur(10px);
      pointer-events: auto;
      cursor: grab;
      touch-action: none;
      user-select: none;
      font-size: 32px;
      z-index: 2;
    }

    #${ROOT_ID}[data-ball-dragging='true'] .th-calendar-ball {
      cursor: grabbing;
    }

    #${ROOT_ID}[data-external-host='true'] .th-calendar-ball {
      display: none;
    }

    #${ROOT_ID} .th-calendar-ball::after {
      content: '';
      position: absolute;
      top: 9px;
      right: 9px;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: #d84b52;
      opacity: 0;
      transform: scale(0.7);
      transition: opacity 160ms ease, transform 160ms ease;
    }

    #${ROOT_ID}[data-has-upcoming='true'] .th-calendar-ball::after {
      opacity: 1;
      transform: scale(1);
    }

    #${ROOT_ID} .th-calendar-panel {
      position: fixed;
      left: 2vw;
      top: 2vh;
      width: min(1560px, calc(100vw - 40px));
      height: min(960px, calc(100vh - 40px));
      border-radius: 28px;
      border: 1px solid rgba(155, 128, 84, 0.22);
      background: rgba(242, 234, 220, 0.94);
      color: #2c241b;
      box-shadow: 0 28px 60px rgba(56, 38, 20, 0.24);
      display: none;
      pointer-events: auto;
      overflow: hidden;
      padding: 16px;
      backdrop-filter: blur(10px);
    }

    #${ROOT_ID}[data-open='true'] .th-calendar-panel { display: block; }
    #${ROOT_ID}[data-open='true'] .th-calendar-ball { display: none; }

    #${ROOT_ID} .th-calendar-shell {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(380px, 0.86fr);
      gap: 16px;
      height: 100%;
    }

    #${ROOT_ID}[data-reading-book='true'] .th-calendar-shell {
      grid-template-columns: minmax(0, 1fr);
    }

    #${ROOT_ID}[data-reading-book='true'] .th-calendar-side {
      display: none;
    }

    #${ROOT_ID} .th-calendar-main,
    #${ROOT_ID} .th-calendar-side {
      min-height: 0;
      overflow: hidden;
    }

    #${ROOT_ID} .th-calendar-main {
      display: grid;
      grid-template-rows: auto 1fr;
      background: rgba(255, 252, 246, 0.96);
      border: 1px solid rgba(155, 128, 84, 0.14);
      border-radius: 22px;
      overflow: hidden;
      min-width: 0;
    }

    #${ROOT_ID} .th-main-head {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      min-height: 74px;
      padding: 18px 22px;
      border-bottom: 1px solid rgba(155, 128, 84, 0.12);
      background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,249,240,0.82));
      cursor: move;
      user-select: none;
      position: relative;
    }

    #${ROOT_ID} .th-main-head * { user-select: none; }
    #${ROOT_ID} .th-main-head-copy {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    #${ROOT_ID} .th-connectivity-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 5px 9px;
      border: 1px solid rgba(155, 128, 84, 0.18);
      border-radius: 999px;
      background: rgba(255, 252, 246, 0.62);
      color: #6d5944;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      box-shadow: none;
      cursor: pointer;
      transition: 140ms ease;
    }

    #${ROOT_ID} .th-connectivity-button:hover {
      background: #fff7ea;
      transform: translateY(-1px);
    }

    #${ROOT_ID} .th-connectivity-button:disabled {
      cursor: progress;
      opacity: 0.72;
      transform: none;
    }

    #${ROOT_ID} .th-connectivity-text {
      white-space: nowrap;
      line-height: 1.2;
    }

    #${ROOT_ID} .th-main-title { font-size: 22px; font-weight: 800; letter-spacing: 0.01em; color: #3b2d1f; white-space: nowrap; }
    #${ROOT_ID} .th-main-subtitle { display: none; }
    #${ROOT_ID} .th-month-subtitle,
    #${ROOT_ID} .th-side-subtitle,
    #${ROOT_ID} .th-side-section-subtitle,
    #${ROOT_ID} .th-form-editing-notice,
    #${ROOT_ID} .th-agenda-toolbar-tip,
    #${ROOT_ID} .th-reminder-summary {
      display: none;
    }
    #${ROOT_ID} .th-main-actions,
    #${ROOT_ID} .th-month-actions,
    #${ROOT_ID} .th-sidebar-tabs,
    #${ROOT_ID} .th-card-actions,
    #${ROOT_ID} .th-form-actions,
    #${ROOT_ID} .th-inline-books,
    #${ROOT_ID} .th-detail-books,
    #${ROOT_ID} .th-window-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    #${ROOT_ID} .th-main-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      padding-right: 8px;
    }
    #${ROOT_ID} .th-card-actions--icon {
      margin-left: auto;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      flex-wrap: nowrap;
      flex: 0 0 auto;
    }
    #${ROOT_ID} .th-icon-btn {
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      line-height: 1;
      border-radius: 999px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
    }
    #${ROOT_ID} .th-window-actions {
      position: absolute;
      top: 20px;
      right: 20px;
      align-items: center;
      gap: 6px;
      flex-wrap: nowrap;
      z-index: 20;
      padding: 4px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      border-radius: 16px;
      background: rgba(255, 252, 246, 0.72);
      box-shadow:
        0 10px 24px rgba(23, 14, 5, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    #${ROOT_ID} .th-window-actions .th-btn {
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: color-mix(in srgb, var(--th-surface) 86%, transparent);
    }
    #${ROOT_ID}[data-theme='dark'] .th-window-actions {
      border-color: rgba(184, 215, 255, 0.16);
      background: rgba(8, 13, 24, 0.68);
      box-shadow:
        0 12px 28px rgba(0, 0, 0, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
    #${ROOT_ID}[data-theme='dark'] .th-window-actions .th-btn {
      background: rgba(14, 22, 38, 0.86);
      border-color: rgba(184, 215, 255, 0.18);
    }
    #${ROOT_ID} .th-color-tool-icon {
      width: 16px;
      height: 16px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2px;
    }
    #${ROOT_ID} .th-color-tool-icon i {
      display: block;
      border-radius: 4px;
      border: 1px solid rgba(80, 61, 38, 0.15);
    }
    #${ROOT_ID} .th-color-tool-icon i:nth-child(1) { background: #dcecff; }
    #${ROOT_ID} .th-color-tool-icon i:nth-child(2) { background: #ffe1eb; }
    #${ROOT_ID} .th-color-tool-icon i:nth-child(3) { background: #dff4e8; }
    #${ROOT_ID} .th-color-tool-icon i:nth-child(4) { background: #ffe6a6; }
    #${ROOT_ID} .th-fab-add {
      position: absolute;
      right: 18px;
      bottom: 18px;
      width: 58px;
      height: 58px;
      border: 1px solid rgba(191, 143, 68, 0.38);
      border-radius: 999px;
      background: rgba(243, 223, 181, 0.98);
      color: #74480f;
      box-shadow: 0 16px 28px rgba(56, 38, 20, 0.18);
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      line-height: 1;
      padding: 0;
      z-index: 4;
    }

    #${ROOT_ID} .th-fab-list {
      position: absolute;
      left: 18px;
      bottom: 18px;
      width: 50px;
      height: 50px;
      border: 1px solid rgba(151, 184, 235, 0.28);
      border-radius: 999px;
      background: rgba(223, 236, 255, 0.96);
      color: #305d97;
      box-shadow: 0 16px 28px rgba(32, 57, 96, 0.16);
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 25px;
      font-weight: 900;
      line-height: 1;
      padding: 0;
      z-index: 4;
    }

    #${ROOT_ID} .th-btn,
    #${ROOT_ID} .th-book-link,
    #${ROOT_ID} .th-form-shell input,
    #${ROOT_ID} .th-form-shell select,
    #${ROOT_ID} .th-form-shell textarea {
      border: 1px solid rgba(155, 128, 84, 0.26);
      background: rgba(255, 252, 246, 0.98);
      border-radius: 12px;
      color: #3a2d20;
      font: inherit;
    }

    #${ROOT_ID} .th-btn,
    #${ROOT_ID} .th-book-link {
      padding: 8px 12px;
      cursor: pointer;
      transition: 140ms ease;
      color: #4f3a26;
      font-weight: 700;
    }

    #${ROOT_ID} .th-btn:hover,
    #${ROOT_ID} .th-book-link:hover { background: #fff7ea; }
    #${ROOT_ID} .th-btn.is-danger,
    #${ROOT_ID} .th-book-link.is-danger { border-color: rgba(180, 70, 60, 0.42); color: #a0382d; }

    #${ROOT_ID} .th-managed-worldbook-dialog-layer {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      width: 100dvw;
      height: 100dvh;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 20px;
      border: 0;
      background: transparent;
      color: inherit;
      pointer-events: none;
      z-index: 12;
      overflow: hidden;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-layer:not([open]) { display: none; }

    #${ROOT_ID} .th-managed-worldbook-dialog-layer[data-open='true'] {
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-layer::backdrop {
      background: transparent;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(33, 24, 16, 0.34);
      backdrop-filter: blur(4px);
    }

    #${ROOT_ID} .th-managed-worldbook-dialog {
      position: relative;
      width: min(620px, calc(100vw - 32px));
      max-height: min(82vh, 760px);
      display: grid;
      gap: 14px;
      padding: 20px;
      border-radius: 20px;
      border: 1px solid rgba(155, 128, 84, 0.22);
      background: rgba(255, 251, 245, 0.98);
      box-shadow: 0 24px 60px rgba(45, 31, 18, 0.28);
      overflow: auto;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-head {
      display: grid;
      gap: 8px;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-title {
      font-size: 18px;
      font-weight: 800;
      color: #3b2d1f;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #6d5a45;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-summary {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 12px 14px;
      list-style: none;
      border-radius: 16px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(246, 239, 228, 0.78);
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-summary-item {
      font-size: 12px;
      line-height: 1.55;
      color: #564431;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-actions,
    #${ROOT_ID} .th-managed-worldbook-action-row {
      display: grid;
      gap: 10px;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-actions {
      grid-template-columns: minmax(0, 1fr);
    }

    #${ROOT_ID} .th-managed-worldbook-action-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
    }

    #${ROOT_ID} .th-managed-worldbook-action-row.is-secondary {
      padding-top: 2px;
    }

    #${ROOT_ID} .th-managed-worldbook-dialog-btn {
      min-width: 0;
      justify-content: center;
      text-align: center;
    }

    #${ROOT_ID} .th-worldbook-export-panel {
      display: grid;
      gap: 10px;
      min-height: 0;
    }

    #${ROOT_ID} .th-worldbook-export-field {
      display: grid;
      gap: 6px;
      color: #6e604f;
      font-size: 12px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-worldbook-export-field input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid rgba(155, 128, 84, 0.26);
      border-radius: 12px;
      background: rgba(255, 252, 246, 0.98);
      color: #3a2d20;
      font: inherit;
    }

    #${ROOT_ID} .th-worldbook-picker-meta {
      color: #7a6a58;
      font-size: 12px;
      line-height: 1.5;
    }

    #${ROOT_ID} .th-worldbook-picker-list {
      display: grid;
      gap: 7px;
      max-height: 260px;
      overflow: auto;
      padding: 8px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(246, 239, 228, 0.55);
      overscroll-behavior: contain;
    }

    #${ROOT_ID} .th-worldbook-picker-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      min-width: 0;
      padding: 9px 11px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.18);
      background: rgba(255, 252, 246, 0.9);
      color: #4f3a26;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 800;
      text-align: left;
    }

    #${ROOT_ID} .th-worldbook-picker-item:hover,
    #${ROOT_ID} .th-worldbook-picker-item.is-selected {
      border-color: rgba(191, 143, 68, 0.48);
      background: #fff0cf;
      color: #7d5315;
    }

    #${ROOT_ID} .th-worldbook-picker-item span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-worldbook-picker-item em {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 3px 7px;
      background: rgba(191, 143, 68, 0.16);
      color: #8a5a16;
      font-style: normal;
      font-size: 11px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-worldbook-picker-empty {
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px dashed rgba(155, 128, 84, 0.28);
      color: #7a6a58;
      background: rgba(255, 252, 246, 0.68);
      font-size: 12px;
      line-height: 1.55;
    }

    #${ROOT_ID} .th-managed-source-board {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    #${ROOT_ID} .th-managed-source-group {
      display: grid;
      gap: 7px;
      min-width: 0;
      padding: 10px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255, 252, 246, 0.62);
    }

    #${ROOT_ID} .th-managed-source-title {
      color: #5a4936;
      font-size: 12px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-managed-source-list {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
      max-height: 160px;
      overflow: auto;
      overscroll-behavior: contain;
    }

    #${ROOT_ID} .th-managed-source-item,
    #${ROOT_ID} .th-managed-source-empty {
      display: grid;
      gap: 3px;
      min-width: 0;
      padding: 7px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      background: rgba(255, 252, 246, 0.78);
      color: #4f3a26;
      font-size: 11px;
      line-height: 1.35;
    }

    #${ROOT_ID} .th-managed-source-name,
    #${ROOT_ID} .th-managed-source-path {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-managed-source-name {
      font-weight: 900;
    }

    #${ROOT_ID} .th-managed-source-path,
    #${ROOT_ID} .th-managed-source-empty {
      color: #7a6a58;
      font-weight: 700;
    }

    #${ROOT_ID} .th-worldbook-move-panel {
      display: grid;
      gap: 8px;
      padding: 10px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255, 252, 246, 0.62);
    }

    #${ROOT_ID} .th-worldbook-move-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: #5a4936;
      font-size: 12px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-text-btn {
      border: 0;
      background: transparent;
      color: #8a5a16;
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 900;
      padding: 2px 4px;
    }

    #${ROOT_ID} .th-worldbook-move-list {
      display: grid;
      gap: 7px;
      max-height: 260px;
      overflow: auto;
      overscroll-behavior: contain;
    }

    #${ROOT_ID} .th-worldbook-move-item,
    #${ROOT_ID} .th-worldbook-move-option {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px;
      align-items: flex-start;
      color: #4f3a26;
      font-size: 12px;
      line-height: 1.45;
    }

    #${ROOT_ID} .th-worldbook-move-item {
      padding: 8px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255, 252, 246, 0.84);
    }

    #${ROOT_ID} .th-worldbook-move-item span {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    #${ROOT_ID} .th-worldbook-move-item b,
    #${ROOT_ID} .th-worldbook-move-item small {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-worldbook-move-item small {
      color: #7a6a58;
      font-size: 11px;
      font-weight: 700;
    }

    #${ROOT_ID} .th-worldbook-move-option {
      padding-top: 4px;
      color: #7a6a58;
    }

    #${ROOT_ID} [data-role="month-grid"] {
      min-height: 0;
      overflow: auto;
      padding: 14px 16px 16px;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
      grid-auto-rows: minmax(0, 1fr);
      gap: 10px;
      align-content: stretch;
      background: rgba(255, 252, 246, 0.98);
    }

    #${ROOT_ID} .th-reminder-summary {
      display: grid;
      gap: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 246, 228, 0.9);
      border: 1px solid rgba(193, 158, 95, 0.28);
      font-size: 12px;
    }

    #${ROOT_ID} .th-month-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }

    #${ROOT_ID} .th-month-title { font-size: 22px; font-weight: 800; color: #3c2f22; }
    #${ROOT_ID} .th-month-subtitle { font-size: 13px; color: #7a6a58; margin-top: 4px; }
    #${ROOT_ID} .th-month-actions {
      align-items: center;
      justify-content: flex-end;
      flex-wrap: nowrap;
    }
    #${ROOT_ID} .th-month-actions .th-btn {
      min-width: 84px;
      padding-inline: 14px;
    }

    #${ROOT_ID} .th-month-view {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-height: 100%;
      gap: 10px;
    }

    #${ROOT_ID} .th-month-board {
      border: 1px solid rgba(155, 128, 84, 0.16);
      border-radius: 18px;
      overflow: hidden;
      background: #fffefb;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-height: 0;
      height: 100%;
    }

    #${ROOT_ID} .th-week-head {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      border-bottom: 1px solid rgba(155, 128, 84, 0.14);
      background: #fbf6ec;
    }

    #${ROOT_ID} .th-week-head > div {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      color: #7d6b58;
      border-right: 1px solid rgba(155, 128, 84, 0.12);
    }

    #${ROOT_ID} .th-week-head > div:last-child { border-right: 0; }
    #${ROOT_ID} .th-month-grid {
      display: grid;
      grid-auto-rows: minmax(0, 1fr);
      min-height: 0;
      height: 100%;
    }

    #${ROOT_ID} .th-week-block {
      position: relative;
      --th-week-chip-rows: 1;
      border-bottom: 1px solid rgba(155, 128, 84, 0.12);
      background: #fffefb;
      min-height: 0;
      display: grid;
    }

    #${ROOT_ID} .th-week-block:last-child { border-bottom: 0; }

    #${ROOT_ID} .th-week-days {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      min-height: calc(26px + var(--th-week-chip-rows) * 18px + 8px);
      height: 100%;
      position: relative;
      z-index: 1;
    }

    #${ROOT_ID} .th-day-cell {
      border-right: 1px solid rgba(155, 128, 84, 0.12);
      border-top: 1px solid rgba(155, 128, 84, 0.08);
      background: #fffefb;
      min-height: 82px;
      padding: 6px 5px 5px;
      text-align: left;
      cursor: pointer;
      border-radius: 0;
      box-shadow: none;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    #${ROOT_ID} .th-day-cell:last-child { border-right: 0; }
    #${ROOT_ID} .th-day-cell.is-muted { background: #f6f1e7; color: #b3a392; }
    #${ROOT_ID} .th-day-cell.is-selected { background: #fff6e8; }
    #${ROOT_ID} .th-day-cell.is-today { box-shadow: inset 0 0 0 2px rgba(191, 143, 68, 0.45); }
    #${ROOT_ID} .th-day-head { display: flex; align-items: center; justify-content: center; margin-bottom: 0; }
    #${ROOT_ID} .th-day-head {
      position: relative;
      min-height: 24px;
      padding: 0 34px;
    }
    #${ROOT_ID} .th-day-number { display: block; width: 100%; text-align: center; font-size: 16px; font-weight: 700; line-height: 1; color: #564431; }
    #${ROOT_ID} .th-day-cell.is-muted .th-day-number { color: #b8aa99; }
    #${ROOT_ID} .th-day-meta {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
    }
    #${ROOT_ID} .th-day-corner-markers {
      display: none;
    }
    #${ROOT_ID} .th-corner-marker {
      display: inline-grid;
      place-items: center;
      width: 17px;
      height: 17px;
      border: 1px solid var(--th-marker-border);
      border-radius: 999px;
      background: var(--th-marker-bg);
      color: var(--th-marker-text);
      font-size: 0;
      font-weight: 950;
      line-height: 1;
      box-shadow: 0 2px 6px rgba(24, 16, 8, 0.16);
      overflow: hidden;
    }
    #${ROOT_ID} .th-corner-marker-bubble::after {
      content: '';
      display: block;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--th-marker-text);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--th-marker-text) 16%, transparent);
    }
    #${ROOT_ID} .th-corner-marker-svg {
      width: 12px;
      height: 12px;
      display: block;
    }
    #${ROOT_ID} .th-corner-marker-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: currentColor;
      display: block;
    }
    #${ROOT_ID} .th-corner-marker-overflow {
      border-color: rgba(151, 184, 235, 0.2);
      background: rgba(184, 215, 255, 0.16);
      color: var(--th-muted);
      font-size: 8px;
    }
    #${ROOT_ID} .th-week-chip-grid {
      position: absolute;
      left: 0;
      right: 0;
      top: 28px;
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      grid-auto-rows: 16px;
      row-gap: 2px;
      align-content: start;
      pointer-events: none;
      z-index: 3;
    }
    #${ROOT_ID} .th-chip {
      display: flex;
      align-items: center;
      border-radius: 8px;
      padding: 4px 7px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      position: relative;
      z-index: 2;
    }

    #${ROOT_ID} .th-chip.is-continue-left {
      width: calc(100% + 9px);
      margin-left: -9px;
      padding-left: 12px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    #${ROOT_ID} .th-chip.is-continue-right {
      width: calc(100% + 9px);
      margin-right: -9px;
      padding-right: 12px;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    #${ROOT_ID} .th-chip.is-continue-left.is-continue-right {
      width: calc(100% + 18px);
      border-radius: 0;
    }

    #${ROOT_ID} .th-week-chip-bar:not(.is-continue-left) {
      border-top-left-radius: 9px;
      border-bottom-left-radius: 9px;
    }

    #${ROOT_ID} .th-week-chip-bar:not(.is-continue-right) {
      border-top-right-radius: 9px;
      border-bottom-right-radius: 9px;
    }

    #${ROOT_ID} .th-week-chip-bar {
      margin: 0 6px;
      z-index: 4;
    }
    #${ROOT_ID} .th-chip.is-festival { background: #ffe6a6; color: #895710; border: 1px solid rgba(201, 145, 40, 0.24); }
    #${ROOT_ID} .th-chip.is-user { background: #dcecff; color: #305d97; border: 1px solid rgba(95, 148, 216, 0.22); }
    #${ROOT_ID} .th-chip.is-archived { background: #e8e1db; color: #6d5745; border: 1px solid rgba(122, 98, 74, 0.16); }
    #${ROOT_ID} .th-chip.has-custom-color {
      background: var(--th-chip-bg);
      color: var(--th-chip-text);
      border: 1px solid var(--th-chip-border);
    }
    #${ROOT_ID} .th-overflow {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      align-items: center;
      gap: 2px;
      width: fit-content;
      min-width: 32px;
      height: 18px;
      padding: 1px 5px;
      border: 1px solid rgba(138, 103, 57, 0.22);
      border-radius: 999px;
      background: rgba(255, 252, 246, 0.82);
      color: #7b6954;
      font-size: 10px;
      font-weight: 900;
      line-height: 1;
      z-index: 6;
    }
    #${ROOT_ID} .th-overflow-icon {
      font-size: 13px;
      line-height: 0.7;
      transform: translateY(-1px);
    }
    #${ROOT_ID} .th-overflow-count {
      line-height: 1;
    }

    #${ROOT_ID} .th-calendar-side {
      border: 1px solid rgba(155, 128, 84, 0.14);
      border-radius: 22px;
      background: linear-gradient(180deg, rgba(248, 241, 229, 0.98), rgba(243, 236, 222, 0.98));
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      overflow: hidden;
    }

    #${ROOT_ID} .th-side-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 74px;
      padding: 18px;
      border-bottom: 1px solid rgba(155, 128, 84, 0.12);
      background: rgba(255, 250, 242, 0.82);
    }
    #${ROOT_ID} .th-side-head-copy {
      min-width: 0;
      display: grid;
      gap: 4px;
    }
    #${ROOT_ID} .th-side-title { font-size: 16px; font-weight: 800; color: #403122; }
    #${ROOT_ID} .th-side-subtitle { font-size: 12px; color: #776654; margin-top: 4px; }
    #${ROOT_ID} .th-primary-btn {
      background: #f3dfb5;
      border-color: rgba(191, 143, 68, 0.4);
      color: #74480f;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.65);
      white-space: nowrap;
    }

    #${ROOT_ID} .th-sidebar-tabs {
      padding: 12px 18px 12px;
      background: transparent;
      align-items: center;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: 10px;
    }

    #${ROOT_ID} .th-tab-button {
      border: 1px solid rgba(155, 128, 84, 0.28);
      background: rgba(255,255,255,0.9);
      border-radius: 999px;
      padding: 8px 14px;
      min-height: 40px;
      cursor: pointer;
      font: inherit;
      color: #52402f;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.78), 0 6px 14px rgba(95, 70, 40, 0.06);
    }

    #${ROOT_ID} .th-tab-button.is-active { background: #fff4db; border-color: rgba(191, 143, 68, 0.48); color: #8a5a16; }
    #${ROOT_ID} .th-tab-add-button {
      width: 40px;
      height: 40px;
      min-width: 40px;
      margin-left: auto;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      font-size: 24px;
      line-height: 1;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.78), 0 6px 14px rgba(95, 70, 40, 0.08);
    }
    #${ROOT_ID} .th-tab-add-button.is-active {
      background: #fff0cf;
      border-color: rgba(191, 143, 68, 0.52);
      color: #8a5a16;
      box-shadow: 0 0 0 2px rgba(191, 143, 68, 0.14), 0 6px 14px rgba(95, 70, 40, 0.08);
    }
    #${ROOT_ID} .th-mobile-side-close {
      display: none;
      width: 32px;
      height: 32px;
      min-width: 32px;
      padding: 0;
      border-radius: 10px;
      align-items: center;
      justify-content: center;
    }

    #${ROOT_ID} .th-side-body { min-height: 0; overflow: auto; padding: 16px 18px 18px; }
    #${ROOT_ID} .th-side-panel { display: none; }
    #${ROOT_ID} .th-side-section {
      display: grid;
      gap: 12px;
    }
    #${ROOT_ID} .th-side-section-head {
      display: grid;
      gap: 4px;
      padding: 2px 2px 4px;
    }
    #${ROOT_ID} .th-side-section-title {
      font-size: 14px;
      font-weight: 800;
      color: #443425;
    }
    #${ROOT_ID} .th-side-section-subtitle {
      font-size: 12px;
      color: #7a6a58;
      line-height: 1.5;
    }
    #${ROOT_ID} .th-agenda-toolbar {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      background: rgba(255,255,255,0.72);
    }
    #${ROOT_ID} .th-agenda-toolbar-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    #${ROOT_ID} .th-agenda-toolbar input,
    #${ROOT_ID} .th-agenda-toolbar select {
      min-width: 0;
      flex: 1 1 150px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.22);
      background: rgba(255,255,255,0.96);
      color: #3a2d20;
      font: inherit;
    }
    #${ROOT_ID} .th-agenda-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6e604f;
      white-space: nowrap;
    }
    #${ROOT_ID} .th-agenda-toolbar-tip {
      font-size: 12px;
      color: #7a6a58;
    }
    #${ROOT_ID}[data-tab='agenda'] .th-side-panel.is-agenda,
    #${ROOT_ID}[data-tab='archive'] .th-side-panel.is-detail,
    #${ROOT_ID}[data-tab='detail'] .th-side-panel.is-detail,
    #${ROOT_ID}[data-tab='form'] .th-side-panel.is-form { display: block; }

    #${ROOT_ID} .th-agenda-groups { display: grid; gap: 12px; }
    #${ROOT_ID} .th-archive-policy-panel {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255,255,255,0.72);
    }
    #${ROOT_ID} .th-agenda-group,
    #${ROOT_ID} .th-detail-card {
      display: grid;
      gap: 8px;
      padding: 14px;
      border-radius: 16px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255,255,255,0.86);
      box-shadow: 0 8px 20px rgba(95, 70, 40, 0.05);
    }

    #${ROOT_ID} .th-agenda-date { font-weight: 800; color: #4c3a29; }
    #${ROOT_ID} .th-agenda-item,
    #${ROOT_ID} .th-detail-card {
      --th-card-accent: #ffe6a6;
      --th-card-accent-soft: #ffe6a6;
      --th-card-accent-border: rgba(201, 145, 40, 0.24);
      --th-card-accent-strong: #895710;
      overflow: hidden;
    }
    #${ROOT_ID} .th-agenda-item {
      display: grid;
      gap: 6px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.18);
      background: rgba(255,255,255,0.94);
    }

    #${ROOT_ID} .th-agenda-item.is-festival,
    #${ROOT_ID} .th-detail-card.is-festival {
      --th-card-accent: #ffe6a6;
      --th-card-accent-soft: #ffe6a6;
      --th-card-accent-border: rgba(201, 145, 40, 0.24);
      --th-card-accent-strong: #895710;
    }
    #${ROOT_ID} .th-agenda-item.is-active,
    #${ROOT_ID} .th-detail-card.is-active {
      --th-card-accent: #dcecff;
      --th-card-accent-soft: #dcecff;
      --th-card-accent-border: rgba(95, 148, 216, 0.22);
      --th-card-accent-strong: #305d97;
    }
    #${ROOT_ID} .th-agenda-item.is-archive,
    #${ROOT_ID} .th-detail-card.is-archive {
      --th-card-accent: #e8e1db;
      --th-card-accent-soft: #e8e1db;
      --th-card-accent-border: rgba(122, 98, 74, 0.16);
      --th-card-accent-strong: #6d5745;
    }
    #${ROOT_ID} .th-agenda-item.is-editing,
    #${ROOT_ID} .th-detail-card.is-editing {
      border-color: rgba(208, 146, 89, 0.52);
      box-shadow: 0 0 0 2px rgba(208, 146, 89, 0.18), 0 10px 24px rgba(0, 0, 0, 0.12);
    }
    #${ROOT_ID} .th-agenda-item.has-custom-color,
    #${ROOT_ID} .th-detail-card.has-custom-color {
      border-color: var(--th-card-accent-border);
    }
    #${ROOT_ID} .th-item-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin: -12px -12px 0;
      padding: 12px 12px 10px;
      border-bottom: 1px solid var(--th-card-accent-border);
      background: var(--th-card-accent-soft);
    }
    #${ROOT_ID} .th-item-title-wrap { display: grid; gap: 4px; min-width: 0; }
    #${ROOT_ID} .th-item-title { font-weight: 800; color: var(--th-card-accent-strong); }
    #${ROOT_ID} .th-card-actions--icon .th-icon-btn {
      border-color: var(--th-card-accent-border);
      color: var(--th-card-accent-strong);
      background: rgba(255,255,255,0.58);
    }
    #${ROOT_ID} .th-card-actions--icon .th-icon-btn:hover {
      background: rgba(255,255,255,0.78);
    }
    #${ROOT_ID} .th-card-actions--icon .th-icon-btn.is-danger {
      color: #e18f7d;
      border-color: rgba(225, 143, 125, 0.36);
    }
    #${ROOT_ID} .th-item-editing-flag {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(95, 148, 216, 0.14);
      border: 1px solid rgba(95, 148, 216, 0.34);
      color: #28558c;
      font-size: 11px;
      font-weight: 700;
    }
    #${ROOT_ID} .th-item-stage { font-size: 11px; color: #7b6954; }
    #${ROOT_ID} .th-item-time,
    #${ROOT_ID} .th-detail-meta { font-size: 12px; color: #6e604f; }
    #${ROOT_ID} .th-item-summary,
    #${ROOT_ID} .th-detail-summary { font-size: 13px; line-height: 1.6; }
    #${ROOT_ID} .th-item-tags { display: flex; gap: 6px; flex-wrap: wrap; }
    #${ROOT_ID} .th-item-tags span { border-radius: 999px; background: #f0e7d9; padding: 2px 8px; font-size: 11px; }
    #${ROOT_ID} .th-detail-card.is-book-reader { gap: 12px; }
    #${ROOT_ID} .th-book-main-card {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 0;
      min-height: 0;
      height: 100%;
    }
    #${ROOT_ID} .th-book-main-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 12px clamp(16px, 3vw, 34px) 10px;
      border-bottom: 1px solid rgba(155, 128, 84, 0.16);
    }
    #${ROOT_ID} .th-book-main-title-wrap {
      min-width: 0;
      width: 100%;
      text-align: center;
    }
    #${ROOT_ID} .th-book-trigger-btn {
      flex: 0 0 auto;
      justify-self: end;
      min-height: 32px;
      padding: 7px 12px;
      white-space: nowrap;
    }
    #${ROOT_ID} .th-book-return-btn {
      flex: 0 0 auto;
      min-height: 34px;
      white-space: nowrap;
    }
    #${ROOT_ID} .th-book-reader-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    #${ROOT_ID} .th-book-pagination {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      align-self: end;
      padding: 8px clamp(16px, 3vw, 34px) 10px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      border-width: 1px 0 0;
      border-radius: 0 0 18px 18px;
      background: rgba(255,255,255,0.72);
    }
    #${ROOT_ID} .th-book-pagination-spacer {
      min-width: 0;
    }
    #${ROOT_ID} .th-book-pagination-main {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    #${ROOT_ID} .th-book-pagination-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
      min-width: 0;
    }
    #${ROOT_ID} .th-book-page-number-list {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    #${ROOT_ID} .th-book-page-arrow,
    #${ROOT_ID} .th-book-page-number {
      border: 0;
      background: transparent;
      color: #564431;
      font: inherit;
      font-size: 15px;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
      transition: 140ms ease;
    }
    #${ROOT_ID} .th-book-page-arrow {
      min-width: 28px;
      font-size: 18px;
    }
    #${ROOT_ID} .th-book-page-number {
      min-width: 22px;
      padding: 3px 4px;
      border-radius: 999px;
    }
    #${ROOT_ID} .th-book-page-arrow:hover,
    #${ROOT_ID} .th-book-page-number:hover {
      color: #8a5a16;
      background: rgba(255, 240, 207, 0.72);
    }
    #${ROOT_ID} .th-book-page-number.is-active {
      color: #8a5a16;
      background: #fff0cf;
      box-shadow: inset 0 0 0 1px rgba(191, 143, 68, 0.32);
    }
    #${ROOT_ID} .th-book-page-arrow:disabled {
      cursor: default;
      opacity: 0.35;
      background: transparent;
    }
    #${ROOT_ID} .th-book-reading-surface {
      min-height: 0;
      overflow: auto;
      padding: 34px clamp(16px, 3vw, 34px) 18px;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    #${ROOT_ID} .th-book-page-title {
      font-size: 16px;
      font-weight: 800;
      color: #443425;
      text-align: left;
      margin-bottom: 18px;
    }
    #${ROOT_ID} .th-book-main-body,
    #${ROOT_ID} .th-book-reader-body {
      all: revert;
      display: block;
      box-sizing: border-box;
      min-height: 0;
      max-width: 100%;
      color: #372b1f;
      background: transparent;
      font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.75;
      letter-spacing: 0;
      text-align: left;
      white-space: normal;
      overflow-wrap: break-word;
      word-break: normal;
      isolation: isolate;
      contain: style;
    }

    #${ROOT_ID} .th-book-main-body *,
    #${ROOT_ID} .th-book-main-body *::before,
    #${ROOT_ID} .th-book-main-body *::after,
    #${ROOT_ID} .th-book-reader-body *,
    #${ROOT_ID} .th-book-reader-body *::before,
    #${ROOT_ID} .th-book-reader-body *::after {
      all: revert;
      box-sizing: border-box;
      color: inherit;
      font-family: inherit;
      max-width: 100%;
    }
    #${ROOT_ID} .th-book-main-body > :first-child,
    #${ROOT_ID} .th-book-reader-body > :first-child { margin-top: 0; }
    #${ROOT_ID} .th-book-main-body > :last-child,
    #${ROOT_ID} .th-book-reader-body > :last-child { margin-bottom: 0; }
    #${ROOT_ID} .th-book-main-body h1,
    #${ROOT_ID} .th-book-main-body h2,
    #${ROOT_ID} .th-book-main-body h3,
    #${ROOT_ID} .th-book-main-body h4,
    #${ROOT_ID} .th-book-main-body h5,
    #${ROOT_ID} .th-book-main-body h6,
    #${ROOT_ID} .th-book-reader-body h1,
    #${ROOT_ID} .th-book-reader-body h2,
    #${ROOT_ID} .th-book-reader-body h3,
    #${ROOT_ID} .th-book-reader-body h4,
    #${ROOT_ID} .th-book-reader-body h5,
    #${ROOT_ID} .th-book-reader-body h6 {
      margin: 1.1em 0 0.45em;
      font-weight: 900;
      line-height: 1.35;
      color: #34281d;
    }
    #${ROOT_ID} .th-book-main-body p,
    #${ROOT_ID} .th-book-main-body ul,
    #${ROOT_ID} .th-book-main-body ol,
    #${ROOT_ID} .th-book-main-body blockquote,
    #${ROOT_ID} .th-book-main-body pre,
    #${ROOT_ID} .th-book-main-body table,
    #${ROOT_ID} .th-book-reader-body p,
    #${ROOT_ID} .th-book-reader-body ul,
    #${ROOT_ID} .th-book-reader-body ol,
    #${ROOT_ID} .th-book-reader-body blockquote,
    #${ROOT_ID} .th-book-reader-body pre,
    #${ROOT_ID} .th-book-reader-body table {
      margin: 0 0 1em;
      color: inherit;
      background: transparent;
      font: inherit;
      line-height: inherit;
    }
    #${ROOT_ID} .th-book-main-body h1 + p,
    #${ROOT_ID} .th-book-main-body h2 + p,
    #${ROOT_ID} .th-book-main-body h3 + p,
    #${ROOT_ID} .th-book-main-body h4 + p,
    #${ROOT_ID} .th-book-main-body h5 + p,
    #${ROOT_ID} .th-book-main-body h6 + p,
    #${ROOT_ID} .th-book-reader-body h1 + p,
    #${ROOT_ID} .th-book-reader-body h2 + p,
    #${ROOT_ID} .th-book-reader-body h3 + p,
    #${ROOT_ID} .th-book-reader-body h4 + p,
    #${ROOT_ID} .th-book-reader-body h5 + p,
    #${ROOT_ID} .th-book-reader-body h6 + p {
      margin-top: 0;
    }
    #${ROOT_ID} .th-book-main-body ul,
    #${ROOT_ID} .th-book-main-body ol,
    #${ROOT_ID} .th-book-reader-body ul,
    #${ROOT_ID} .th-book-reader-body ol {
      padding-left: 1.5em;
      list-style-position: outside;
    }
    #${ROOT_ID} .th-book-main-body blockquote,
    #${ROOT_ID} .th-book-reader-body blockquote {
      margin-left: 0;
      padding: 10px 12px;
      border-left: 3px solid rgba(191, 143, 68, 0.42);
      background: rgba(255, 248, 235, 0.85);
      color: #5d4a36;
      border-radius: 10px;
    }
    #${ROOT_ID} .th-book-main-body code,
    #${ROOT_ID} .th-book-reader-body code {
      padding: 0.12em 0.38em;
      border-radius: 6px;
      background: rgba(92, 73, 51, 0.08);
      font-family: Consolas, "SFMono-Regular", monospace;
      font-size: 0.92em;
    }
    #${ROOT_ID} .th-book-main-body pre,
    #${ROOT_ID} .th-book-reader-body pre {
      padding: 12px 14px;
      border-radius: 12px;
      background: #f7f1e6;
      overflow: auto;
    }
    #${ROOT_ID} .th-book-main-body pre code,
    #${ROOT_ID} .th-book-reader-body pre code {
      padding: 0;
      background: transparent;
    }
    #${ROOT_ID} .th-book-main-body hr,
    #${ROOT_ID} .th-book-reader-body hr {
      border: 0;
      border-top: 1px solid rgba(155, 128, 84, 0.22);
      margin: 1em 0;
    }
    #${ROOT_ID} .th-book-main-body img,
    #${ROOT_ID} .th-book-reader-body img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
    }

    #${ROOT_ID} .th-form-editing-notice {
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(223, 238, 255, 0.82);
      border: 1px solid rgba(95, 148, 216, 0.3);
      color: #32567f;
      font-size: 12px;
      line-height: 1.6;
    }
    #${ROOT_ID} .th-form-shell { display: grid; gap: 10px; }
    #${ROOT_ID} .th-form-field { display: grid; gap: 4px; }
    #${ROOT_ID} .th-form-field label { font-size: 12px; color: #6e604f; }
    #${ROOT_ID} .th-form-advanced {
      border: 1px solid rgba(155, 128, 84, 0.16);
      border-radius: 12px;
      background: rgba(255,255,255,0.44);
      padding: 8px 10px;
    }
    #${ROOT_ID} .th-form-advanced summary {
      cursor: pointer;
      color: #6e604f;
      font-size: 12px;
      font-weight: 800;
      list-style-position: inside;
    }
    #${ROOT_ID} .th-form-advanced[open] {
      display: grid;
      gap: 8px;
    }
    #${ROOT_ID} .th-form-actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 8px;
      align-items: stretch;
    }
    #${ROOT_ID} .th-form-actions .th-btn {
      min-width: 0;
      justify-content: center;
      text-align: center;
    }
    #${ROOT_ID} .th-form-shell input,
    #${ROOT_ID} .th-form-shell select,
    #${ROOT_ID} .th-form-shell textarea { width: 100%; padding: 10px 12px; }
    #${ROOT_ID} .th-tag-picker {
      display: grid;
      gap: 8px;
    }
    #${ROOT_ID} .th-selected-tag-list,
    #${ROOT_ID} .th-tag-option-list,
    #${ROOT_ID} .th-tag-color-tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    #${ROOT_ID} .th-form-tag-chip,
    #${ROOT_ID} .th-tag-option,
    #${ROOT_ID} .th-tag-color-tag {
      border: 1px solid rgba(155, 128, 84, 0.24);
      border-radius: 999px;
      background: rgba(255, 252, 246, 0.98);
      color: #4f3a26;
      padding: 6px 10px;
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1.2;
    }
    #${ROOT_ID} .th-form-tag-chip,
    #${ROOT_ID} .th-tag-option.is-active,
    #${ROOT_ID} .th-tag-color-tag.is-active {
      background: #fff0cf;
      border-color: rgba(191, 143, 68, 0.45);
      color: #7d5315;
    }
    #${ROOT_ID} .th-tag-search-row,
    #${ROOT_ID} .th-tag-color-toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }
    #${ROOT_ID} .th-tag-search-row .th-btn,
    #${ROOT_ID} .th-tag-color-toolbar .th-btn {
      white-space: nowrap;
      min-width: 84px;
    }
    #${ROOT_ID} .th-tag-picker-empty {
      color: #8a7864;
      font-size: 12px;
      line-height: 1.7;
    }
    #${ROOT_ID} .th-tag-color-dialog {
      width: min(780px, calc(100vw - 32px));
    }
    #${ROOT_ID} .th-tag-color-body {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 14px;
      min-height: 0;
    }
    #${ROOT_ID} .th-tag-color-tag-list {
      align-content: start;
      max-height: 420px;
      overflow: auto;
      padding-right: 4px;
    }
    #${ROOT_ID} .th-tag-color-editor {
      display: grid;
      gap: 12px;
      min-width: 0;
    }
    #${ROOT_ID} .th-tag-color-current {
      display: flex;
      align-items: center;
      min-height: 36px;
    }
    #${ROOT_ID} .th-tag-color-feedback,
    #${ROOT_ID} .th-tag-color-warning {
      border-radius: 12px;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.45;
    }
    #${ROOT_ID} .th-tag-color-feedback {
      border: 1px solid rgba(80, 150, 102, 0.24);
      background: rgba(237, 249, 240, 0.88);
      color: #2f7048;
    }
    #${ROOT_ID} .th-tag-color-warning {
      border: 1px solid rgba(191, 143, 68, 0.28);
      background: rgba(255, 246, 228, 0.92);
      color: #815715;
    }
    #${ROOT_ID} .th-tag-color-preview {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 7px 12px;
      background: var(--th-chip-bg);
      color: var(--th-chip-text);
      border: 1px solid var(--th-chip-border);
      font-weight: 800;
      font-size: 13px;
    }
    #${ROOT_ID} .th-color-palette {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    #${ROOT_ID} .th-color-swatch {
      min-height: 46px;
      border-radius: 12px;
      border: 1px solid var(--th-swatch-border);
      background: var(--th-swatch-bg);
      color: var(--th-swatch-text);
      font: inherit;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      padding: 8px;
      text-align: center;
    }
    #${ROOT_ID} .th-color-swatch:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(95, 70, 40, 0.12);
    }
    #${ROOT_ID} .th-color-hex-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    #${ROOT_ID} .th-color-hex-grid label {
      display: grid;
      gap: 4px;
      color: #6e604f;
      font-size: 12px;
      font-weight: 700;
    }
    #${ROOT_ID} .th-tag-color-toolbar input,
    #${ROOT_ID} .th-color-hex-grid input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid rgba(155, 128, 84, 0.26);
      border-radius: 12px;
      background: rgba(255, 252, 246, 0.98);
      color: #3a2d20;
      font: inherit;
    }
    #${ROOT_ID} .th-archive-policy-panel input,
    #${ROOT_ID} .th-archive-policy-panel textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid rgba(155, 128, 84, 0.26);
      border-radius: 12px;
      background: rgba(255, 252, 246, 0.98);
      color: #3a2d20;
      font: inherit;
    }
    #${ROOT_ID} .th-archive-policy-panel textarea {
      resize: vertical;
      min-height: 130px;
      font-family: Consolas, "SFMono-Regular", monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    #${ROOT_ID} .th-form-shell textarea { resize: vertical; min-height: 100px; }
    #${ROOT_ID} .th-empty {
      padding: 12px;
      border-radius: 12px;
      background: rgba(255,255,255,0.72);
      color: #7e6c58;
      border: 1px dashed rgba(155, 128, 84, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] {
      color: #e3e9f2;
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-ball {
      border-color: rgba(255, 255, 255, 0.14);
      background: rgba(22, 26, 32, 0.96);
      color: #f4f7fb;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5);
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-panel {
      border-color: #2a313d;
      background: rgba(15, 19, 24, 0.985);
      color: #e3e9f2;
      box-shadow: 0 30px 64px rgba(0, 0, 0, 0.6);
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-main,
    #${ROOT_ID}[data-theme='dark'] .th-calendar-side,
    #${ROOT_ID}[data-theme='dark'] .th-month-board,
    #${ROOT_ID}[data-theme='dark'] .th-week-block,
    #${ROOT_ID}[data-theme='dark'] .th-day-cell,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-group,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel,
    #${ROOT_ID}[data-theme='dark'] .th-form-advanced,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-empty,
    #${ROOT_ID}[data-theme='dark'] .th-reminder-summary,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell input,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell select,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell textarea,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-color-hex-grid input,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel input,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel textarea,
    #${ROOT_ID}[data-theme='dark'] .th-btn,
    #${ROOT_ID}[data-theme='dark'] .th-book-link {
      background: #1a2028;
      color: #e3e9f2;
      border-color: #303948;
    }

    #${ROOT_ID}[data-theme='dark'] [data-role="month-grid"],
    #${ROOT_ID}[data-theme='dark'] .th-side-head,
    #${ROOT_ID}[data-theme='dark'] .th-sidebar-tabs,
    #${ROOT_ID}[data-theme='dark'] .th-main-head,
    #${ROOT_ID}[data-theme='dark'] .th-week-head {
      background: #242c37;
      color: #e3e9f2;
      border-color: #303948;
    }

    #${ROOT_ID}[data-theme='dark'] .th-main-title,
    #${ROOT_ID}[data-theme='dark'] .th-month-title,
    #${ROOT_ID}[data-theme='dark'] .th-side-title,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-date,
    #${ROOT_ID}[data-theme='dark'] .th-day-number,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h1,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h2,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h3,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h4,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h5,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h6 {
      color: #f7fafc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-connectivity-button {
      background: rgba(29, 36, 48, 0.58);
      color: #b8c3d0;
      border-color: rgba(57, 69, 85, 0.68);
      box-shadow: none;
    }

    #${ROOT_ID}[data-theme='dark'] .th-connectivity-button:hover {
      background: #28313e;
    }

    #${ROOT_ID}[data-theme='dark'] .th-main-subtitle,
    #${ROOT_ID}[data-theme='dark'] .th-month-subtitle,
    #${ROOT_ID}[data-theme='dark'] .th-side-subtitle,
    #${ROOT_ID}[data-theme='dark'] .th-side-section-subtitle,
    #${ROOT_ID}[data-theme='dark'] .th-item-stage,
    #${ROOT_ID}[data-theme='dark'] .th-item-time,
    #${ROOT_ID}[data-theme='dark'] .th-detail-meta,
    #${ROOT_ID}[data-theme='dark'] .th-overflow,
    #${ROOT_ID}[data-theme='dark'] .th-form-field label,
    #${ROOT_ID}[data-theme='dark'] .th-form-advanced summary,
    #${ROOT_ID}[data-theme='dark'] .th-empty {
      color: #a7b4c4;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-summary,
    #${ROOT_ID}[data-theme='dark'] .th-detail-summary,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body,
    #${ROOT_ID}[data-theme='dark'] .th-book-reading-surface,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body {
      color: #dbe3ee;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-pagination {
      background: #171d25;
      border-color: #374353;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-pagination-status,
    #${ROOT_ID}[data-theme='dark'] .th-book-page-title {
      color: #f0f4fa;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-page-tab {
      background: #222b36;
      border-color: #3b4859;
      color: #dbe3ee;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-page-tab:hover {
      background: #2b3442;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-page-tab.is-active {
      background: #eef3f9;
      border-color: #ffffff;
      color: #16202c;
    }

    #${ROOT_ID}[data-theme='dark'] .th-btn:hover,
    #${ROOT_ID}[data-theme='dark'] .th-book-link:hover {
      background: #2b3442;
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog-backdrop {
      background: rgba(4, 8, 14, 0.6);
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog {
      background: rgba(24, 30, 38, 0.98);
      border-color: #364151;
      box-shadow: 0 28px 72px rgba(0, 0, 0, 0.56);
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog-title {
      color: #f5f8fc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog-desc,
    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog-summary-item,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-meta,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-export-field {
      color: #c4cfdb;
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-worldbook-dialog-summary,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-list {
      background: rgba(15, 20, 27, 0.82);
      border-color: #394555;
    }

    #${ROOT_ID}[data-theme='dark'] .th-worldbook-export-field input,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-item,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-empty,
    #${ROOT_ID}[data-theme='dark'] .th-managed-source-group,
    #${ROOT_ID}[data-theme='dark'] .th-managed-source-item,
    #${ROOT_ID}[data-theme='dark'] .th-managed-source-empty,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-move-panel,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-move-item {
      background: #1a2028;
      color: #e3e9f2;
      border-color: #303948;
    }

    #${ROOT_ID}[data-theme='dark'] .th-managed-source-title,
    #${ROOT_ID}[data-theme='dark'] .th-managed-source-path,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-move-head,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-move-option,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-move-item small {
      color: #c4cfdb;
    }

    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-item:hover,
    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-item.is-selected {
      background: rgba(88, 67, 35, 0.54);
      border-color: rgba(212, 171, 92, 0.5);
      color: #f5dba4;
    }

    #${ROOT_ID}[data-theme='dark'] .th-worldbook-picker-item em {
      background: rgba(212, 171, 92, 0.18);
      color: #f5dba4;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tab-button {
      background: #2b3440;
      color: #dce3ee;
      border-color: #425062;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 18px rgba(0, 0, 0, 0.24);
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar select {
      background: #171d25;
      color: #e3e9f2;
      border-color: #374353;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-toggle,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar-tip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-picker-empty,
    #${ROOT_ID}[data-theme='dark'] .th-color-hex-grid label {
      color: #a7b4c4;
    }

    #${ROOT_ID}[data-theme='dark'] .th-form-tag-chip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-option,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag {
      background: #222b36;
      border-color: #3b4859;
      color: #dbe3ee;
    }

    #${ROOT_ID}[data-theme='dark'] .th-form-tag-chip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-option.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag.is-active {
      background: #eef3f9;
      border-color: #ffffff;
      color: #16202c;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tag-color-feedback {
      background: rgba(44, 86, 61, 0.4);
      border-color: rgba(131, 201, 154, 0.22);
      color: #c5ecd1;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tag-color-warning {
      background: rgba(104, 76, 31, 0.44);
      border-color: rgba(255, 214, 120, 0.22);
      color: #ffe6aa;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tab-button.is-active {
      background: #eef3f9;
      color: #16202c;
      border-color: #ffffff;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.34), 0 10px 22px rgba(0, 0, 0, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] .th-primary-btn {
      background: #eef3f9;
      color: #16202c;
      border-color: #ffffff;
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] .th-tab-add-button.is-active {
      background: #eef3f9;
      border-color: #ffffff;
      color: #16202c;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18), 0 10px 22px rgba(0, 0, 0, 0.24);
    }

    #${ROOT_ID}[data-theme='dark'] .th-fab-add,
    #${ROOT_ID}[data-theme='dark'] .th-fab-list {
      background: #eef3f9;
      color: #16202c;
      border-color: #ffffff;
      box-shadow: 0 20px 34px rgba(0, 0, 0, 0.4);
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-muted {
      background: #131820;
      color: #7f8fa3;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected {
      background: #202833;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-today {
      box-shadow: inset 0 0 0 2px rgba(238, 243, 249, 0.76);
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-tags span {
      background: #2b3440;
      color: #dce3ee;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body blockquote {
      background: #171d25;
      color: #dbe3ee;
      border-left-color: rgba(255, 255, 255, 0.3);
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body code {
      background: rgba(255, 255, 255, 0.08);
      color: #f3f6fb;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body pre {
      background: #0f141a;
      color: #eef3f9;
    }

    #${ROOT_ID}[data-theme='dark'] .th-card-actions--icon .th-icon-btn {
      background: rgba(15, 19, 24, 0.22);
      border-color: rgba(255, 255, 255, 0.14);
      box-shadow: none;
    }

    #${ROOT_ID}[data-theme='dark'] .th-card-actions--icon .th-icon-btn:hover {
      background: rgba(15, 19, 24, 0.34);
    }

    #${ROOT_ID}[data-theme='dark'] .th-card-actions--icon .th-icon-btn.is-danger {
      color: #ffb9b9;
      border-color: rgba(255, 185, 185, 0.28);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival {
      background: #79561f;
      color: #fff1cc;
      border-color: rgba(255, 241, 204, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user {
      background: #315db0;
      color: #f5f8ff;
      border-color: rgba(245, 248, 255, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-archived {
      background: #5b495f;
      color: #f5eaf6;
      border-color: rgba(245, 234, 246, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-festival,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-festival {
      --th-card-accent: #79561f;
      --th-card-accent-soft: #5c4219;
      --th-card-accent-border: rgba(255, 241, 204, 0.18);
      --th-card-accent-strong: #fff1cc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-active {
      --th-card-accent: #315db0;
      --th-card-accent-soft: #264782;
      --th-card-accent-border: rgba(245, 248, 255, 0.16);
      --th-card-accent-strong: #f5f8ff;
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-archive,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-archive {
      --th-card-accent: #5b495f;
      --th-card-accent-soft: #47394a;
      --th-card-accent-border: rgba(245, 234, 246, 0.16);
      --th-card-accent-strong: #f5eaf6;
    }

    #${ROOT_ID} {
      --th-font-ui: "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
      --th-font-display: "Noto Serif SC", "Songti SC", "SimSun", serif;
      --th-shadow-soft: 0 24px 70px rgba(0, 0, 0, 0.28);
      --th-surface: #fff8ea;
      --th-surface-2: #f4ead7;
      --th-surface-3: #eadcc1;
      --th-ink: #3f2d1e;
      --th-muted: #8b7358;
      --th-line: rgba(108, 76, 38, 0.18);
      --th-line-strong: rgba(108, 76, 38, 0.32);
      --th-accent: #a56724;
      --th-accent-2: #d39a45;
      --th-accent-soft: rgba(218, 168, 84, 0.22);
      --th-event-festival: #efd189;
      --th-event-festival-ink: #6e4510;
      --th-event-user: #cdddf4;
      --th-event-user-ink: #244c79;
      --th-danger: #a64b3d;
      font-family: var(--th-font-ui);
      color: var(--th-ink);
    }

    #${ROOT_ID}[data-theme='dark'] {
      --th-surface: #0f1828;
      --th-surface-2: #142038;
      --th-surface-3: #1d2d49;
      --th-ink: #eef5ff;
      --th-muted: #a9bad6;
      --th-line: rgba(151, 184, 235, 0.16);
      --th-line-strong: rgba(191, 216, 255, 0.28);
      --th-accent: #38bdf8;
      --th-accent-2: #facc15;
      --th-accent-soft: rgba(56, 189, 248, 0.24);
      --th-event-festival: #facc15;
      --th-event-festival-ink: #23170a;
      --th-event-user: #38bdf8;
      --th-event-user-ink: #04131f;
      --th-danger: #fb7185;
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-calendar-ball {
      overflow: hidden;
      border-color: rgba(255, 250, 238, 0.78);
      border-radius: 20px;
      background:
        radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.82), transparent 35%),
        linear-gradient(145deg, #fff9ed, #efe1c8 54%, #d9c8a9);
      color: var(--th-accent);
      box-shadow:
        0 18px 42px rgba(72, 47, 20, 0.2),
        inset 0 0 0 1px rgba(104, 76, 44, 0.14);
      backdrop-filter: blur(8px);
      transition:
        transform 140ms ease,
        box-shadow 140ms ease,
        border-color 140ms ease;
    }

    #${ROOT_ID} .th-calendar-ball:hover {
      transform: translateY(-1px);
      border-color: rgba(165, 103, 36, 0.42);
      box-shadow:
        0 22px 48px rgba(72, 47, 20, 0.24),
        inset 0 0 0 1px rgba(104, 76, 44, 0.16);
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-ball {
      border-color: rgba(183, 211, 255, 0.24);
      background:
        radial-gradient(circle at 18% 18%, rgba(172, 202, 255, 0.86) 0 1px, transparent 1.8px),
        radial-gradient(circle at 58% 22%, rgba(255, 234, 180, 0.7) 0 1px, transparent 1.7px),
        radial-gradient(circle at 78% 64%, rgba(172, 202, 255, 0.64) 0 1px, transparent 1.8px),
        linear-gradient(145deg, #0b101b, #111a2b 50%, #070b13);
      background-size: 96px 96px, 82px 82px, 110px 110px, auto;
      color: #d7e7ff;
      box-shadow:
        0 20px 46px rgba(0, 0, 0, 0.52),
        inset 0 0 0 1px rgba(187, 214, 255, 0.1);
    }

    #${ROOT_ID} .th-calendar-panel {
      isolation: isolate;
      z-index: 1;
      border-radius: 30px;
      border-color: rgba(255, 250, 238, 0.78);
      padding: 18px;
      color: var(--th-ink);
      background:
        radial-gradient(circle at 8% 12%, rgba(255, 255, 255, 0.7) 0 1px, transparent 1.5px),
        radial-gradient(circle at 72% 22%, rgba(118, 78, 36, 0.08) 0 1px, transparent 1.8px),
        radial-gradient(circle at 30% 82%, rgba(118, 78, 36, 0.05) 0 1px, transparent 1.6px),
        linear-gradient(90deg, rgba(112, 72, 36, 0.035) 1px, transparent 1px),
        linear-gradient(0deg, rgba(112, 72, 36, 0.03) 1px, transparent 1px),
        linear-gradient(145deg, #fff9ed, #efe1c8 54%, #d9c8a9);
      background-size: auto, auto, auto, 28px 28px, 28px 28px, auto;
      box-shadow:
        var(--th-shadow-soft),
        inset 0 0 0 1px rgba(104, 76, 44, 0.14);
      backdrop-filter: none;
    }

    #${ROOT_ID}[data-open='true']::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 42%, rgba(8, 13, 24, 0.08), transparent 44%),
        rgba(2, 6, 14, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'][data-open='true']::before {
      background:
        radial-gradient(circle at 50% 42%, rgba(70, 116, 190, 0.08), transparent 44%),
        rgba(0, 0, 0, 0.28);
    }

    #${ROOT_ID} .th-calendar-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      opacity: 0.58;
      background:
        radial-gradient(circle at 20% 30%, rgba(93, 58, 25, 0.055), transparent 18%),
        radial-gradient(circle at 82% 70%, rgba(93, 58, 25, 0.045), transparent 16%),
        linear-gradient(105deg, transparent 0 38%, rgba(255, 255, 255, 0.12) 45%, transparent 54%);
      mix-blend-mode: multiply;
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-panel {
      border-color: rgba(183, 211, 255, 0.24);
      color: var(--th-ink);
      background:
        radial-gradient(circle at 18% 18%, rgba(172, 202, 255, 0.9) 0 1px, transparent 1.8px),
        radial-gradient(circle at 58% 22%, rgba(255, 234, 180, 0.72) 0 1px, transparent 1.7px),
        radial-gradient(circle at 78% 64%, rgba(172, 202, 255, 0.68) 0 1px, transparent 1.8px),
        radial-gradient(circle at 30% 74%, rgba(255, 255, 255, 0.58) 0 1px, transparent 1.6px),
        radial-gradient(circle at 78% 10%, rgba(76, 106, 176, 0.42), transparent 32%),
        radial-gradient(circle at 22% 78%, rgba(160, 108, 56, 0.22), transparent 34%),
        linear-gradient(145deg, #0b101b, #111a2b 50%, #070b13);
      background-size: 220px 220px, 190px 190px, 240px 240px, 160px 160px, auto, auto, auto;
      box-shadow:
        0 28px 80px rgba(0, 0, 0, 0.55),
        inset 0 0 0 1px rgba(187, 214, 255, 0.1);
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-panel::after {
      opacity: 0.55;
      background: radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.035), transparent 36%);
      mix-blend-mode: screen;
    }

    #${ROOT_ID} .th-calendar-shell {
      position: relative;
      z-index: 1;
      grid-template-columns: minmax(0, 1.5fr) minmax(400px, 0.88fr);
      min-height: 0;
    }

    #${ROOT_ID} .th-calendar-main,
    #${ROOT_ID} .th-calendar-side {
      border-color: var(--th-line);
      border-radius: 22px;
      background: rgba(255, 253, 247, 0.9);
      box-shadow:
        0 16px 34px rgba(72, 47, 20, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    #${ROOT_ID}[data-theme='dark'] .th-calendar-main,
    #${ROOT_ID}[data-theme='dark'] .th-calendar-side {
      border-color: var(--th-line);
      background: rgba(15, 24, 40, 0.84);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.05),
        0 18px 46px rgba(0, 0, 0, 0.32);
    }

    #${ROOT_ID} .th-main-head,
    #${ROOT_ID} .th-side-head {
      min-height: 72px;
      padding: 16px 18px;
      border-bottom-color: var(--th-line);
      background: rgba(255, 248, 234, 0.72);
    }

    #${ROOT_ID}[data-theme='dark'] .th-main-head,
    #${ROOT_ID}[data-theme='dark'] .th-side-head,
    #${ROOT_ID}[data-theme='dark'] .th-sidebar-tabs,
    #${ROOT_ID}[data-theme='dark'] .th-week-head {
      border-color: var(--th-line);
      background: rgba(20, 32, 56, 0.66);
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-main-title,
    #${ROOT_ID} .th-side-title,
    #${ROOT_ID} .th-month-title,
    #${ROOT_ID} .th-side-section-title,
    #${ROOT_ID} .th-agenda-date {
      color: var(--th-ink);
      font-family: var(--th-font-display);
      font-weight: 950;
      letter-spacing: 0.035em;
    }

    #${ROOT_ID} .th-main-title { font-size: 23px; }
    #${ROOT_ID} .th-side-title { font-size: 17px; }
    #${ROOT_ID} .th-month-title { font-size: 27px; }

    #${ROOT_ID} .th-connectivity-button {
      min-height: 30px;
      padding: 4px 11px 4px 9px;
      border-color: var(--th-line-strong);
      background: rgba(255, 248, 234, 0.74);
      color: var(--th-ink);
      font-family: var(--th-font-display);
      font-size: 16px;
      font-weight: 950;
      letter-spacing: 0.025em;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    #${ROOT_ID} .th-connectivity-button:hover {
      border-color: color-mix(in srgb, var(--th-accent) 56%, var(--th-line-strong));
      background: rgba(255, 247, 234, 0.94);
    }

    #${ROOT_ID}[data-theme='dark'] .th-connectivity-button {
      border-color: var(--th-line-strong);
      background: rgba(13, 16, 30, 0.74);
      color: var(--th-ink);
    }

    #${ROOT_ID}[data-theme='dark'] .th-connectivity-button:hover {
      background: rgba(20, 32, 56, 0.86);
    }

    #${ROOT_ID} .th-btn,
    #${ROOT_ID} .th-book-link,
    #${ROOT_ID} .th-tab-button,
    #${ROOT_ID} .th-form-shell input,
    #${ROOT_ID} .th-form-shell select,
    #${ROOT_ID} .th-form-shell textarea,
    #${ROOT_ID} .th-agenda-toolbar input,
    #${ROOT_ID} .th-agenda-toolbar select,
    #${ROOT_ID} .th-tag-color-toolbar input,
    #${ROOT_ID} .th-color-hex-grid input,
    #${ROOT_ID} .th-archive-policy-panel input,
    #${ROOT_ID} .th-archive-policy-panel textarea {
      border-color: var(--th-line-strong);
      color: var(--th-ink);
      background: rgba(255, 252, 246, 0.88);
      font-weight: 850;
    }

    #${ROOT_ID} .th-btn:hover,
    #${ROOT_ID} .th-book-link:hover,
    #${ROOT_ID} .th-tab-button:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--th-accent) 56%, var(--th-line-strong));
      background: rgba(255, 247, 234, 0.96);
    }

    #${ROOT_ID} .th-window-actions .th-btn,
    #${ROOT_ID} .th-icon-btn {
      border-radius: 12px;
    }

    #${ROOT_ID}[data-theme='dark'] .th-btn,
    #${ROOT_ID}[data-theme='dark'] .th-book-link,
    #${ROOT_ID}[data-theme='dark'] .th-tab-button,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell input,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell select,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell textarea,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar select,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-color-hex-grid input,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel input,
    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel textarea {
      border-color: rgba(178, 196, 235, 0.18);
      background: rgba(13, 16, 30, 0.74);
      color: var(--th-ink);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    #${ROOT_ID}[data-theme='dark'] .th-btn:hover,
    #${ROOT_ID}[data-theme='dark'] .th-book-link:hover,
    #${ROOT_ID}[data-theme='dark'] .th-tab-button:hover {
      background: rgba(20, 32, 56, 0.86);
    }

    #${ROOT_ID} .th-primary-btn,
    #${ROOT_ID} .th-tab-button.is-active,
    #${ROOT_ID} .th-tab-add-button.is-active {
      color: var(--th-event-festival-ink);
      background: var(--th-event-festival);
      border-color: color-mix(in srgb, var(--th-event-festival) 70%, #704411);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--th-event-festival) 20%, transparent);
    }

    #${ROOT_ID}[data-theme='dark'] .th-primary-btn,
    #${ROOT_ID}[data-theme='dark'] .th-tab-button.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-tab-add-button.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-fab-add,
    #${ROOT_ID}[data-theme='dark'] .th-fab-list {
      color: #eaf4ff;
      background:
        radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.18), transparent 34%),
        linear-gradient(135deg, rgba(116, 166, 238, 0.34), rgba(29, 48, 78, 0.86));
      border-color: rgba(184, 215, 255, 0.46);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.08),
        0 0 18px rgba(105, 160, 238, 0.18);
    }

    #${ROOT_ID} .th-month-header {
      padding: 0;
      gap: 14px;
    }

    #${ROOT_ID} .th-month-actions {
      gap: 8px;
      align-items: center;
    }

    #${ROOT_ID} .th-mobile-action-label {
      display: none;
    }

    #${ROOT_ID} .th-month-actions .th-btn {
      min-height: 40px;
      border-radius: 12px;
    }

    #${ROOT_ID} .th-festival-scope-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 128px;
      padding-inline: 18px;
      text-align: center;
      white-space: nowrap;
      line-height: 1;
    }

    #${ROOT_ID} .th-festival-scope-btn .th-scope-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      line-height: 1;
    }

    #${ROOT_ID} .th-festival-scope-control {
      display: inline-grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 3px;
      min-width: 174px;
      min-height: 40px;
      padding: 3px;
      border: 1px solid var(--th-line-strong);
      border-radius: 13px;
      background: rgba(255, 252, 246, 0.74);
    }

    #${ROOT_ID} .th-festival-scope-option {
      min-width: 0;
      min-height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--th-muted);
      font: inherit;
      font-size: 13px;
      font-weight: 900;
      cursor: pointer;
    }

    #${ROOT_ID} .th-festival-scope-option.is-active {
      background: var(--th-event-festival);
      color: var(--th-event-festival-ink);
      box-shadow: 0 4px 10px color-mix(in srgb, var(--th-event-festival) 22%, transparent);
    }

    #${ROOT_ID} .th-festival-scope-btn.is-all {
      background: color-mix(in srgb, var(--th-event-festival) 72%, var(--th-surface));
      border-color: color-mix(in srgb, var(--th-event-festival) 62%, var(--th-line));
      color: var(--th-event-festival-ink);
    }

    #${ROOT_ID} .th-festival-scope-btn.is-local {
      background: color-mix(in srgb, var(--th-accent-2) 28%, var(--th-surface));
      border-color: color-mix(in srgb, var(--th-accent-2) 54%, var(--th-line));
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-festival-scope-btn.is-none {
      background: color-mix(in srgb, var(--th-surface-2) 88%, transparent);
      border-color: var(--th-line);
      color: var(--th-muted);
    }

    @keyframes th-control-spring {
      0% { transform: scale(0.88); }
      34% { transform: scale(1.17); }
      56% { transform: scale(0.97); }
      76% { transform: scale(1.045); }
      100% { transform: scale(1); }
    }

    @keyframes th-arrow-nudge-left {
      0% { transform: translateX(0); }
      34% { transform: translateX(-5px); }
      62% { transform: translateX(2px); }
      100% { transform: translateX(0); }
    }

    @keyframes th-arrow-nudge-right {
      0% { transform: translateX(0); }
      34% { transform: translateX(5px); }
      62% { transform: translateX(-2px); }
      100% { transform: translateX(0); }
    }

    @keyframes th-soft-pop {
      0% { transform: scale(0.9); }
      42% { transform: scale(1.11); }
      68% { transform: scale(0.985); }
      100% { transform: scale(1); }
    }

    #${ROOT_ID} .th-month-nav-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      width: 48px;
      height: 42px;
      padding: 0;
      border-radius: 14px;
      color: color-mix(in srgb, var(--th-accent) 62%, var(--th-ink) 38%);
      transition:
        transform 220ms cubic-bezier(0.2, 0.82, 0.24, 1.35),
        border-color 160ms ease,
        color 160ms ease,
        background 160ms ease,
        box-shadow 160ms ease;
    }

    #${ROOT_ID} .th-month-nav-icon-btn {
      background: transparent;
      border-color: transparent;
      box-shadow: none;
    }

    #${ROOT_ID} .th-month-nav-icon {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 5px 8px color-mix(in srgb, var(--th-accent) 16%, transparent));
    }

    #${ROOT_ID} .th-month-today-btn {
      width: auto;
      min-width: 72px;
      padding-inline: 16px;
      color: var(--th-ink);
      font-weight: 900;
    }

    #${ROOT_ID} .th-month-nav-btn:hover {
      transform: scale(1.12) translateY(-1px) !important;
      color: color-mix(in srgb, var(--th-accent) 82%, var(--th-ink) 18%);
      border-color: color-mix(in srgb, var(--th-accent) 42%, transparent);
      background: color-mix(in srgb, var(--th-accent-soft) 64%, transparent);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--th-accent) 14%, transparent);
    }

    #${ROOT_ID} .th-month-nav-btn:active {
      transform: scale(0.9) !important;
      transition-duration: 80ms;
    }

    #${ROOT_ID} .th-month-nav-btn.is-pressing {
      transform: scale(0.88) !important;
      transition-duration: 80ms;
    }

    #${ROOT_ID} .th-month-nav-btn.is-springing {
      animation: th-control-spring 480ms cubic-bezier(0.18, 0.9, 0.22, 1.28) both !important;
    }

    #${ROOT_ID} .th-month-nav-btn[data-action='month-prev'].is-springing .th-month-nav-icon {
      animation: th-arrow-nudge-left 480ms cubic-bezier(0.18, 0.9, 0.22, 1.28) both;
    }

    #${ROOT_ID} .th-month-nav-btn[data-action='month-next'].is-springing .th-month-nav-icon {
      animation: th-arrow-nudge-right 480ms cubic-bezier(0.18, 0.9, 0.22, 1.28) both;
    }

    #${ROOT_ID}[data-theme='dark'] .th-month-nav-btn {
      color: #bfdbfe;
    }

    #${ROOT_ID}[data-theme='dark'] .th-month-nav-btn:hover {
      color: #eaf4ff;
      background: rgba(184, 215, 255, 0.12);
      border-color: rgba(184, 215, 255, 0.28);
      box-shadow: 0 0 18px rgba(96, 165, 250, 0.16);
    }

    #${ROOT_ID} [data-role="month-grid"] {
      padding: 16px;
      gap: 12px;
      background: transparent;
    }

    #${ROOT_ID} .th-month-board {
      border-color: color-mix(in srgb, var(--th-line-strong) 78%, transparent);
      border-radius: 18px;
      background: rgba(255, 249, 238, 0.72);
      box-shadow:
        0 10px 22px rgba(95, 66, 31, 0.055),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    #${ROOT_ID}[data-theme='dark'] .th-month-board {
      border-color: rgba(151, 184, 235, 0.18);
      background: rgba(10, 17, 30, 0.48);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
    }

    #${ROOT_ID} .th-week-head {
      min-height: 38px;
      border-bottom-color: var(--th-line);
      background: rgba(246, 236, 217, 0.56);
      border-bottom-style: dashed;
    }

    #${ROOT_ID} .th-week-head > div {
      color: var(--th-muted);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.16em;
      border-right-color: rgba(138, 103, 57, 0.16);
      border-right-style: dashed;
    }

    #${ROOT_ID}[data-theme='dark'] .th-week-head {
      border-bottom: 1px solid rgba(151, 184, 235, 0.16);
      background: linear-gradient(180deg, rgba(20, 32, 56, 0.76), rgba(15, 24, 40, 0.76));
    }

    #${ROOT_ID}[data-theme='dark'] .th-week-head > div {
      border-right-color: rgba(151, 184, 235, 0.1);
      border-right-style: solid;
      color: var(--th-muted);
      font-family: var(--th-font-display);
      font-size: 13px;
      letter-spacing: 0.2em;
      text-shadow: 0 0 10px rgba(173, 204, 255, 0.08);
    }

    #${ROOT_ID} .th-week-block {
      border-bottom-color: rgba(138, 103, 57, 0.15);
      border-bottom-style: dashed;
      background: transparent;
    }

    #${ROOT_ID} .th-day-cell {
      min-height: 92px;
      border-right-color: rgba(138, 103, 57, 0.15);
      border-right-style: dashed;
      border-top: 0;
      background: transparent;
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-day-cell.is-muted {
      background: rgba(244, 234, 215, 0.58);
      color: var(--th-muted);
    }

    #${ROOT_ID} .th-day-cell.is-selected {
      background: linear-gradient(135deg, rgba(218, 168, 84, 0.2), transparent 72%);
    }

    #${ROOT_ID} .th-day-cell.is-selected::after {
      content: '';
      position: absolute;
      inset: 4px;
      border: 1px solid rgba(165, 103, 36, 0.48);
      border-radius: 10px;
      pointer-events: none;
    }

    #${ROOT_ID} .th-day-cell.is-today {
      box-shadow: none;
    }

    #${ROOT_ID} .th-day-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 25px;
      height: 23px;
      padding: 0 6px;
      border-radius: 999px;
      color: var(--th-ink);
      font-size: 15px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-day-cell.is-today .th-day-number {
      color: #fffaf0;
      background: var(--th-accent);
      box-shadow: 0 0 0 3px rgba(165, 103, 36, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'] .th-week-block {
      border-bottom-color: rgba(151, 184, 235, 0.08);
      border-bottom-style: solid;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell {
      border-right-color: rgba(151, 184, 235, 0.075);
      border-right-style: solid;
      background: radial-gradient(circle at 50% 50%, rgba(104, 153, 230, 0.018), transparent 58%), transparent;
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-muted {
      background: rgba(255, 255, 255, 0.025);
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected {
      background: linear-gradient(135deg, rgba(104, 153, 230, 0.16), transparent 72%);
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected::after {
      border-color: rgba(158, 203, 255, 0.48);
    }

    #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-today .th-day-number {
      color: #0b1220;
      background: #d7e7ff;
      box-shadow: 0 0 18px rgba(184, 215, 255, 0.42);
    }

    #${ROOT_ID} .th-chip {
      border-radius: 7px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 900;
      box-shadow: 0 2px 0 rgba(117, 76, 27, 0.1);
    }

    #${ROOT_ID} .th-chip.is-festival {
      background: linear-gradient(90deg, #f6dda1, var(--th-event-festival));
      color: var(--th-event-festival-ink);
      border-color: rgba(126, 83, 22, 0.2);
    }

    #${ROOT_ID} .th-chip.is-user {
      background: linear-gradient(90deg, #dbe9fb, var(--th-event-user));
      color: var(--th-event-user-ink);
      border-color: rgba(95, 148, 216, 0.22);
    }

    #${ROOT_ID} .th-chip.is-archived {
      background: #e8e1db;
      color: #6d5745;
      border-color: rgba(122, 98, 74, 0.16);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-festival {
      background: linear-gradient(90deg, #e1c47d, var(--th-event-festival));
      color: var(--th-event-festival-ink);
      border-color: rgba(255, 231, 178, 0.24);
      box-shadow: 0 0 18px rgba(216, 169, 71, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-user {
      background: linear-gradient(90deg, #8dbaff, var(--th-event-user));
      color: var(--th-event-user-ink);
      border-color: rgba(184, 215, 255, 0.24);
      box-shadow: 0 0 18px rgba(112, 167, 255, 0.18);
    }

    #${ROOT_ID} .th-sidebar-tabs {
      padding: 12px 16px;
      border-bottom: 1px solid var(--th-line);
      background: transparent;
    }

    #${ROOT_ID} .th-side-body {
      padding: 16px;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--th-accent) 45%, transparent) transparent;
    }

    #${ROOT_ID} .th-agenda-toolbar,
    #${ROOT_ID} .th-archive-policy-panel,
    #${ROOT_ID} .th-detail-card,
    #${ROOT_ID} .th-agenda-group,
    #${ROOT_ID} .th-agenda-item,
    #${ROOT_ID} .th-form-advanced,
    #${ROOT_ID} .th-reminder-summary,
    #${ROOT_ID} .th-empty,
    #${ROOT_ID} .th-book-pagination {
      border-color: var(--th-line);
      background: rgba(255, 249, 238, 0.72);
      box-shadow:
        0 10px 22px rgba(95, 66, 31, 0.055),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    #${ROOT_ID}[data-theme='dark'] .th-archive-policy-panel,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-group,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-form-advanced,
    #${ROOT_ID}[data-theme='dark'] .th-reminder-summary,
    #${ROOT_ID}[data-theme='dark'] .th-empty,
    #${ROOT_ID}[data-theme='dark'] .th-book-pagination {
      border-color: rgba(151, 184, 235, 0.18);
      background: rgba(10, 18, 32, 0.72);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-toolbar {
      background: transparent !important;
      border-color: rgba(151, 184, 235, 0.14) !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-agenda-date {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 19px;
    }

    #${ROOT_ID} .th-agenda-date::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--th-accent-2);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--th-accent-2) 16%, transparent);
    }

    #${ROOT_ID} .th-item-top {
      display: grid;
      grid-template-columns: 5px minmax(0, 1fr) auto;
      align-items: center;
      margin: -12px -12px 0;
      border-bottom-color: var(--th-card-accent-border);
      background: color-mix(in srgb, var(--th-card-accent) 22%, transparent);
    }

    #${ROOT_ID} .th-item-top::before {
      content: '';
      align-self: stretch;
      border-radius: 999px;
      background: var(--th-card-accent);
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-top {
      background: linear-gradient(90deg, rgba(216, 183, 111, 0.2), rgba(20, 32, 55, 0.78) 62%, rgba(13, 22, 38, 0.92));
      border-bottom-color: rgba(216, 183, 111, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] .th-agenda-item.is-active .th-item-top,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card.is-active .th-item-top {
      background: linear-gradient(90deg, rgba(112, 167, 255, 0.22), rgba(20, 32, 55, 0.78) 62%, rgba(13, 22, 38, 0.92));
      border-bottom-color: rgba(112, 167, 255, 0.22);
    }

    #${ROOT_ID} .th-item-title {
      color: var(--th-card-accent-strong);
      font-weight: 950;
    }

    #${ROOT_ID} .th-festival-title-line {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      min-width: 0;
      width: 100%;
      line-height: 1.2;
    }

    #${ROOT_ID} .th-festival-title-line .th-item-title {
      min-width: 0;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-festival-title-icon {
      flex: 0 0 auto;
      display: inline-grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--th-card-accent-strong) 34%, var(--th-card-accent-border));
      background: color-mix(in srgb, var(--th-card-accent) 42%, rgba(255, 255, 255, 0.92));
      color: var(--th-card-accent-strong);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36);
      overflow: hidden;
    }

    #${ROOT_ID} .th-festival-title-svg {
      display: block;
      width: 18px;
      height: 18px;
    }

    #${ROOT_ID} .th-festival-title-svg path,
    #${ROOT_ID} .th-corner-marker-svg path {
      fill: currentColor !important;
    }

    #${ROOT_ID} .th-festival-title-dot {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--th-card-accent-strong);
    }

    #${ROOT_ID} .th-festival-location-label {
      justify-self: end;
      max-width: min(14em, 100%);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--th-card-accent-strong) 32%, var(--th-card-accent-border));
      background: color-mix(in srgb, var(--th-card-accent) 34%, rgba(255, 255, 255, 0.86));
      color: var(--th-card-accent-strong);
      font-size: 11px;
      font-weight: 950;
      letter-spacing: 0;
      line-height: 1.2;
    }

    #${ROOT_ID} .th-item-stage,
    #${ROOT_ID} .th-item-time,
    #${ROOT_ID} .th-detail-meta,
    #${ROOT_ID} .th-overflow,
    #${ROOT_ID} .th-form-field label,
    #${ROOT_ID} .th-form-advanced summary,
    #${ROOT_ID} .th-agenda-toggle,
    #${ROOT_ID} .th-tag-picker-empty,
    #${ROOT_ID} .th-color-hex-grid label {
      color: var(--th-muted);
    }

    #${ROOT_ID} .th-item-summary,
    #${ROOT_ID} .th-detail-summary,
    #${ROOT_ID} .th-book-main-body,
    #${ROOT_ID} .th-book-reading-surface,
    #${ROOT_ID} .th-book-reader-body {
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-item-tags span,
    #${ROOT_ID} .th-form-tag-chip,
    #${ROOT_ID} .th-tag-option,
    #${ROOT_ID} .th-tag-color-tag,
    #${ROOT_ID} .th-book-page-tab {
      border-color: var(--th-line);
      background: rgba(234, 220, 193, 0.58);
      color: var(--th-muted);
      font-weight: 900;
    }

    #${ROOT_ID}[data-theme='dark'] .th-item-tags span,
    #${ROOT_ID}[data-theme='dark'] .th-form-tag-chip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-option,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag,
    #${ROOT_ID}[data-theme='dark'] .th-book-page-tab {
      border-color: rgba(151, 184, 235, 0.18);
      background: rgba(184, 215, 255, 0.1);
      color: #c7d8f4;
    }

    #${ROOT_ID} .th-tools-menu {
      position: relative;
      display: inline-flex;
    }

    #${ROOT_ID} .th-tools-menu summary {
      list-style: none;
    }

    #${ROOT_ID} .th-tools-menu summary::-webkit-details-marker {
      display: none;
    }

    #${ROOT_ID} .th-menu-status-btn {
      position: relative;
      width: 34px;
      height: 34px;
      min-width: 34px;
      padding: 0;
      display: inline-grid;
      place-items: center;
      border-radius: 12px;
      cursor: pointer;
      overflow: hidden;
      transition:
        transform 220ms cubic-bezier(0.2, 0.82, 0.24, 1.35),
        border-color 160ms ease,
        background 160ms ease;
    }

    #${ROOT_ID} .th-menu-status-btn:hover {
      transform: scale(1.08);
    }

    #${ROOT_ID} .th-menu-status-btn:active {
      transform: scale(0.96);
    }

    #${ROOT_ID} .th-window-actions .th-btn.is-pressing {
      transform: scale(0.86) !important;
      transition-duration: 80ms;
    }

    #${ROOT_ID} .th-window-actions .th-btn.is-springing {
      animation: th-soft-pop 460ms cubic-bezier(0.18, 0.9, 0.22, 1.28) both !important;
    }

    #${ROOT_ID} .th-menu-bars {
      --th-menu-bar-color: color-mix(in srgb, var(--th-ink) 78%, var(--th-accent) 22%);
      width: 19px;
      height: 18px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      gap: 4px;
      transition: transform 260ms cubic-bezier(0.2, 0.82, 0.24, 1.25);
    }

    #${ROOT_ID} .th-menu-bar {
      width: 100%;
      height: 3px;
      border-radius: 999px;
      background: var(--th-menu-bar-color);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.18);
      transition:
        transform 260ms cubic-bezier(0.2, 0.82, 0.24, 1.25),
        opacity 160ms ease,
        background 160ms ease;
    }

    #${ROOT_ID} .th-tools-menu[open] .th-menu-bars {
      transform: rotate(-90deg);
    }

    #${ROOT_ID} .th-tools-menu[open] .th-menu-bar-2 {
      transform: translateY(7px) rotate(60deg);
      transform-origin: right;
    }

    #${ROOT_ID} .th-tools-menu[open] .th-menu-bar-1 {
      transform: translateY(14px) rotate(-60deg);
      transform-origin: left;
    }

    #${ROOT_ID} .th-tools-menu[open] .th-menu-bar-3 {
      opacity: 0;
      transform: scaleX(0.35);
    }

    #${ROOT_ID}[data-theme='dark'] .th-menu-bars {
      --th-menu-bar-color: color-mix(in srgb, #eaf4ff 82%, var(--th-accent) 18%);
    }

    #${ROOT_ID} .th-tool-menu-panel {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 8;
      display: grid;
      gap: 6px;
      min-width: 170px;
      padding: 8px;
      border: 1px solid var(--th-line-strong);
      border-radius: 14px;
      background: color-mix(in srgb, var(--th-surface) 94%, transparent);
      box-shadow: 0 16px 34px rgba(14, 8, 24, 0.24);
    }

    #${ROOT_ID} .th-tools-menu:not([open]) .th-tool-menu-panel {
      display: none;
    }

    #${ROOT_ID} .th-tools-menu--window .th-tool-menu-panel {
      left: auto;
      right: 0;
    }

    #${ROOT_ID} .th-tool-menu-item {
      min-height: 34px;
      padding: 7px 10px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: var(--th-ink);
      font: inherit;
      font-size: 12px;
      font-weight: 850;
      text-align: left;
      cursor: pointer;
    }

    #${ROOT_ID} .th-tool-menu-item:hover {
      background: color-mix(in srgb, var(--th-accent) 14%, transparent);
    }

    #${ROOT_ID} .th-tool-menu-item.th-connectivity-button {
      justify-content: flex-start;
      width: 100%;
      min-height: 34px;
      border-radius: 10px;
      font-family: var(--th-font-ui);
      font-size: 12px;
      letter-spacing: 0;
    }

    #${ROOT_ID}[data-theme='dark'] .th-tool-menu-panel {
      border-color: rgba(151, 184, 235, 0.24);
      background:
        radial-gradient(circle at 18% 10%, rgba(172, 202, 255, 0.08), transparent 36%),
        rgba(8, 13, 24, 0.96);
      box-shadow:
        0 16px 34px rgba(0, 0, 0, 0.44),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    #${ROOT_ID}[data-theme='dark'] .th-tool-menu-item {
      color: rgba(238, 245, 255, 0.9);
    }

    #${ROOT_ID} .th-btn:focus-visible,
    #${ROOT_ID} .th-book-link:focus-visible,
    #${ROOT_ID} .th-tab-button:focus-visible,
    #${ROOT_ID} .th-day-cell:focus-visible,
    #${ROOT_ID} input:focus-visible,
    #${ROOT_ID} select:focus-visible,
    #${ROOT_ID} textarea:focus-visible {
      outline: 3px solid color-mix(in srgb, var(--th-accent) 42%, transparent);
      outline-offset: 2px;
    }

    #${ROOT_ID} .th-calendar-panel {
      width: min(1480px, calc(100vw - 48px));
      height: min(900px, calc(100vh - 48px));
    }

    #${ROOT_ID}[data-panel-fullscreen='true'] .th-calendar-panel {
      left: 0 !important;
      top: 0 !important;
      width: 100vw;
      width: 100dvw;
      height: 100vh;
      height: 100dvh;
      max-width: none;
      max-height: none;
      border-radius: 0;
      padding: 12px;
    }

    #${ROOT_ID}[data-panel-fullscreen='true'] .th-main-head {
      cursor: default;
    }

    #${ROOT_ID} .th-calendar-main,
    #${ROOT_ID} .th-calendar-side {
      backdrop-filter: none;
    }

    #${ROOT_ID} .th-main-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: move;
    }

    #${ROOT_ID} .th-main-head-copy {
      display: none;
    }

    #${ROOT_ID} .th-window-actions {
      position: absolute;
      top: 18px;
      right: 18px;
      margin-left: 0;
    }

    #${ROOT_ID} .th-month-view {
      gap: 12px;
    }

    #${ROOT_ID} .th-month-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      align-items: center;
    }

    #${ROOT_ID} .th-month-title {
      max-width: none;
      line-height: 1.05;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-month-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    #${ROOT_ID} .th-month-actions .th-btn:not(.th-month-nav-btn) {
      transform: none !important;
    }

    #${ROOT_ID} .th-month-board,
    #${ROOT_ID} .th-month-grid,
    #${ROOT_ID} .th-week-block,
    #${ROOT_ID} .th-week-days {
      min-height: 0;
    }

    #${ROOT_ID} .th-month-grid {
      display: grid;
      grid-auto-rows: minmax(0, 1fr);
      height: 100%;
    }

    #${ROOT_ID} .th-month-board {
      height: 100%;
    }

    #${ROOT_ID} .th-week-block {
      display: grid;
      border-bottom: 1px dashed rgba(138, 103, 57, 0.15) !important;
      background: transparent !important;
    }

    #${ROOT_ID} .th-week-block:last-child {
      border-bottom: 0 !important;
    }

    #${ROOT_ID} .th-week-days {
      min-height: 0;
      height: 100%;
    }

    #${ROOT_ID} .th-day-cell {
      min-height: 0;
      padding: 8px 8px 6px;
      border: 0 !important;
      border-right: 1px dashed rgba(138, 103, 57, 0.15) !important;
      border-top: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    #${ROOT_ID} .th-day-cell:last-child {
      border-right: 0 !important;
    }

    #${ROOT_ID} .th-week-chip-grid {
      top: 42px;
      grid-auto-rows: 19px;
      row-gap: 4px;
    }

    #${ROOT_ID} .th-week-chip-bar {
      margin-inline: 8px;
    }

    #${ROOT_ID} .th-chip {
      min-height: 19px;
      padding: 3px 9px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 900;
      line-height: 1.2;
    }

    #${ROOT_ID} .th-sidebar-tabs {
      display: grid;
      grid-template-columns: minmax(96px, 1fr) minmax(70px, 0.76fr) 36px 40px;
      gap: 8px;
      align-items: center;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-tab-button,
    #${ROOT_ID} .th-sidebar-tabs .th-side-search-btn,
    #${ROOT_ID} .th-sidebar-tabs .th-tab-add-button {
      height: 36px;
      min-height: 36px;
      padding: 6px 10px;
      border-radius: 14px;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-side-search-btn,
    #${ROOT_ID} .th-sidebar-tabs .th-tab-add-button {
      width: 36px;
      min-width: 36px;
      padding: 0;
      display: inline-grid;
      place-items: center;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-tab-add-button {
      width: 40px;
      min-width: 40px;
      font-size: 21px;
    }

    #${ROOT_ID} .th-agenda-toolbar-row {
      display: grid;
      grid-template-columns: max-content minmax(120px, 1fr);
      align-items: center;
      gap: 14px;
    }

    #${ROOT_ID} .th-agenda-toolbar-row:first-child {
      display: none;
    }

    #${ROOT_ID} .th-agenda-toolbar input,
    #${ROOT_ID} .th-agenda-toolbar select {
      min-height: 40px;
      border-radius: 11px;
    }

    #${ROOT_ID} .th-agenda-toggle {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      width: fit-content;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-agenda-toggle .th-native-check {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    #${ROOT_ID} .th-check-proxy {
      display: inline-grid;
      place-items: center;
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      border: 1px solid color-mix(in srgb, var(--th-accent) 54%, var(--th-line-strong));
      border-radius: 999px;
      background: var(--th-accent-soft);
      color: var(--th-accent);
      font-size: 12px;
      font-weight: 950;
      line-height: 1;
    }

    #${ROOT_ID} .th-archive-policy-section {
      gap: 6px;
      padding: 0;
    }

    #${ROOT_ID} .th-policy-field-label {
      display: grid;
      gap: 2px;
      color: var(--th-ink);
    }

    #${ROOT_ID} .th-policy-field-label span {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.02em;
    }

    #${ROOT_ID} .th-policy-field-label small {
      color: var(--th-muted);
      font-size: 11px;
      font-weight: 650;
      line-height: 1.45;
    }

    #${ROOT_ID} .th-archive-policy-divider {
      height: 1px;
      margin: 4px 0 2px;
      background: linear-gradient(90deg, transparent, var(--th-line-strong), transparent);
    }

    #${ROOT_ID} .th-policy-tag-picker {
      gap: 5px;
    }

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

    @media (min-width: 981px) {
      #${ROOT_ID} .th-calendar-panel {
        width: min(1480px, calc(100vw - 48px));
        height: min(900px, calc(100vh - 48px));
        padding: 18px;
        border-radius: 30px;
      }

      #${ROOT_ID} .th-calendar-shell {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(400px, 0.88fr);
        gap: 16px;
      }

      #${ROOT_ID} .th-calendar-side {
        position: static !important;
        height: auto !important;
        max-height: none !important;
        transform: none !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        border-radius: 22px !important;
      }

      #${ROOT_ID} .th-sidebar-tabs {
        display: grid;
      }

      #${ROOT_ID} .th-mobile-side-close,
      #${ROOT_ID} .th-fab-add,
      #${ROOT_ID} .th-fab-list {
        display: none !important;
      }
    }

    @media (max-width: 980px) {
      #${ROOT_ID},
      #${ROOT_ID} * {
        max-width: 100vw;
        max-width: 100dvw;
        box-sizing: border-box;
      }
      #${ROOT_ID} {
        left: 0;
        top: 0;
        right: auto;
        bottom: auto;
        width: 100vw;
        width: 100dvw;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        transform: none;
      }
      #${ROOT_ID} .th-calendar-panel {
        left: 0 !important;
        top: 0 !important;
        right: auto !important;
        bottom: auto !important;
        width: 100vw;
        width: 100dvw;
        max-width: 100vw;
        max-width: 100dvw;
        height: 100vh;
        height: 100dvh;
        min-height: 100vh;
        min-height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        border-radius: 0;
        padding: 0;
        background: rgba(255, 252, 246, 0.985);
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        transform: none !important;
      }

      #${ROOT_ID} .th-calendar-shell {
        position: relative;
        display: block;
        height: 100%;
        min-height: 0;
      }
      #${ROOT_ID} .th-calendar-main,
      #${ROOT_ID} .th-calendar-side {
        border-radius: 0;
        border-left: 0;
        border-right: 0;
        min-height: 0;
      }
      #${ROOT_ID} .th-calendar-main {
        height: 100%;
        grid-template-rows: auto minmax(0, 1fr);
        border-bottom: 0;
      }
      #${ROOT_ID} .th-calendar-side {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        height: 100vh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        grid-template-rows: auto minmax(0, 1fr);
        border-top: 1px solid rgba(155, 128, 84, 0.14);
        border-bottom: 0;
        border-radius: 0;
        background: linear-gradient(180deg, rgba(248, 241, 229, 0.98), rgba(243, 236, 222, 0.98));
        transform: translateY(calc(100% + 12px));
        opacity: 0;
        pointer-events: none;
        transition: transform 180ms ease, opacity 180ms ease;
        box-shadow: 0 -18px 36px rgba(56, 38, 20, 0.22);
        z-index: 6;
      }
      #${ROOT_ID}[data-theme='dark'] .th-calendar-side {
        border-top-color: #2a313d;
        background: #1a2028;
        box-shadow: 0 -18px 36px rgba(0, 0, 0, 0.42);
      }
      #${ROOT_ID}[data-mobile-side-open='true'] .th-calendar-side {
        transform: translateY(0);
        opacity: 1;
        pointer-events: auto;
      }
      #${ROOT_ID} .th-side-head {
        padding: 12px 14px 10px;
        border-bottom: 1px solid rgba(155, 128, 84, 0.12);
        align-items: center;
      }
      #${ROOT_ID} .th-sidebar-tabs,
      #${ROOT_ID} .th-side-subtitle {
        display: none;
      }
      #${ROOT_ID} .th-side-title {
        font-size: 19px;
        line-height: 1.25;
      }
      #${ROOT_ID} .th-mobile-side-close {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        z-index: 12;
        display: inline-flex;
        justify-content: center;
        width: calc(100vw - 24px);
        width: calc(100dvw - 24px);
        min-width: 0;
        height: 48px;
        border-radius: 14px;
        font-size: 16px;
        font-weight: 900;
      }
      #${ROOT_ID} .th-side-body {
        padding: 0 12px calc(76px + env(safe-area-inset-bottom, 0px));
      }
      #${ROOT_ID} .th-main-head {
        cursor: default;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 10px 12px 8px;
        gap: 8px;
        align-items: center;
        min-height: 56px;
      }
      #${ROOT_ID} .th-main-head-copy {
        min-width: 0;
        gap: 6px;
        align-items: center;
        flex-wrap: nowrap;
        overflow: hidden;
      }
      #${ROOT_ID} .th-main-title {
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.2;
      }
      #${ROOT_ID} .th-connectivity-button {
        max-width: 96px;
        padding: 5px 8px;
        font-size: 10px;
        min-height: 28px;
      }
      #${ROOT_ID} .th-connectivity-text {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #${ROOT_ID} .th-managed-worldbook-dialog-layer {
        z-index: 30;
        display: none;
        padding: 0;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      #${ROOT_ID} .th-managed-worldbook-dialog-layer[data-open='true'] {
        display: flex;
        pointer-events: auto;
      }
      #${ROOT_ID} [data-role="tag-color-dialog-layer"] {
        z-index: 60;
        padding: 0;
        align-items: center;
        justify-content: center;
      }
      #${ROOT_ID}[data-tag-color-open='true'] .th-calendar-main,
      #${ROOT_ID}[data-tag-color-open='true'] .th-calendar-side,
      #${ROOT_ID}[data-tag-color-open='true'] .th-fab-add,
      #${ROOT_ID}[data-tag-color-open='true'] .th-fab-list {
        pointer-events: none;
      }
      #${ROOT_ID}[data-tag-color-open='true'] .th-fab-add,
      #${ROOT_ID}[data-tag-color-open='true'] .th-fab-list {
        display: none;
      }
      #${ROOT_ID} .th-managed-worldbook-dialog-backdrop {
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }
      #${ROOT_ID} [data-role="tag-color-dialog-layer"] .th-managed-worldbook-dialog-backdrop {
        background: rgba(8, 12, 18, 0.64);
      }
      #${ROOT_ID} .th-managed-worldbook-dialog {
        position: fixed;
        left: 50%;
        top: 50%;
        z-index: 1;
        width: min(560px, calc(100vw - 24px));
        width: min(560px, calc(100dvw - 24px));
        max-height: calc(100vh - 24px);
        max-height: calc(100dvh - 24px);
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        transform: translate(-50%, -50%);
      }
      #${ROOT_ID} .th-managed-source-board {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-worldbook-picker-list,
      #${ROOT_ID} .th-worldbook-move-list,
      #${ROOT_ID} .th-managed-source-list {
        max-height: min(28vh, 220px);
        max-height: min(28dvh, 220px);
      }
      #${ROOT_ID} .th-managed-worldbook-action-row {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-tag-color-dialog {
        display: flex;
        flex-direction: column;
        height: auto;
        min-height: 0;
        padding: 14px;
        overflow: hidden;
        background: rgba(255, 251, 245, 0.995);
      }
      #${ROOT_ID} .th-tag-color-dialog .th-managed-worldbook-dialog-head,
      #${ROOT_ID} .th-tag-color-dialog .th-tag-color-toolbar,
      #${ROOT_ID} .th-tag-color-dialog .th-tag-color-feedback,
      #${ROOT_ID} .th-tag-color-dialog .th-tag-color-warning {
        flex: 0 0 auto;
      }
      #${ROOT_ID} .th-tag-color-body {
        flex: 1 1 auto;
        min-height: 0;
        max-height: calc(100dvh - 260px);
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 10px;
      }
      #${ROOT_ID} .th-tag-color-tag-list {
        max-height: none;
        overflow: visible;
        padding-right: 0;
      }
      #${ROOT_ID} .th-tag-color-dialog .th-managed-worldbook-dialog-actions {
        flex: 0 0 auto;
        position: static;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 0 -14px -14px;
        padding: 8px 14px 12px;
        background: rgba(255, 251, 245, 0.995);
        border-top: 1px solid rgba(155, 128, 84, 0.16);
        box-shadow: 0 -10px 24px rgba(45, 31, 18, 0.08);
      }
      #${ROOT_ID} .th-tag-color-dialog .th-managed-worldbook-dialog-actions .th-btn {
        min-width: 0;
        padding: 8px 6px;
        min-height: 38px;
      }
      #${ROOT_ID}[data-theme='dark'] .th-tag-color-dialog {
        background: #171d25;
      }
      #${ROOT_ID}[data-theme='dark'] [data-role="tag-color-dialog-layer"] .th-managed-worldbook-dialog-backdrop {
        background: rgba(4, 8, 14, 0.72);
      }
      #${ROOT_ID}[data-theme='dark'] .th-tag-color-dialog .th-managed-worldbook-dialog-actions {
        background: #171d25;
        border-top-color: #364151;
      }
      #${ROOT_ID} .th-managed-worldbook-dialog-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #${ROOT_ID} .th-tag-color-dialog .th-managed-worldbook-dialog-actions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      #${ROOT_ID} .th-managed-worldbook-dialog-btn:last-child:nth-child(3) {
        grid-column: 1 / -1;
      }
      #${ROOT_ID}[data-reading-book='true'] .th-calendar-main {
        grid-template-rows: auto minmax(0, 1fr);
        background: #fffaf2;
      }
      #${ROOT_ID}[data-theme='dark'][data-reading-book='true'] .th-calendar-main {
        background: #1f2732;
      }
      #${ROOT_ID}[data-reading-book='true'] [data-role="month-grid"] {
        padding: 0;
        overflow: hidden;
      }
      #${ROOT_ID} .th-book-main-card {
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 0;
        height: 100%;
        min-height: 0;
        background: #fffaf2;
      }
      #${ROOT_ID}[data-theme='dark'] .th-book-main-card {
        background: #1f2732;
      }
      #${ROOT_ID} .th-book-main-head {
        position: sticky;
        top: 0;
        z-index: 3;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: center;
        gap: 0;
        padding: 12px clamp(16px, 3vw, 34px) 10px;
        background: rgba(255, 250, 242, 0.98);
        border-bottom: 1px solid rgba(155, 128, 84, 0.16);
      }
      #${ROOT_ID}[data-theme='dark'] .th-book-main-head {
        background: rgba(31, 39, 50, 0.98);
        border-bottom-color: rgba(255, 255, 255, 0.08);
      }
      #${ROOT_ID} .th-book-main-title-wrap {
        min-width: 0;
        max-width: none;
        width: 100%;
        justify-self: stretch;
        text-align: center;
      }
      #${ROOT_ID} .th-book-main-head .th-month-title {
        max-width: none !important;
        width: 100%;
        min-width: 0;
        font-size: clamp(22px, var(--th-book-title-size, 48px), 48px);
        line-height: 1.12;
        display: block;
        overflow: hidden;
        white-space: normal;
        word-break: normal;
        overflow-wrap: anywhere;
        text-overflow: clip;
        text-align: center;
        letter-spacing: 0.02em;
      }
      #${ROOT_ID} .th-book-main-head .th-month-subtitle {
        display: none;
      }
      #${ROOT_ID} .th-book-return-btn {
        justify-self: end;
        width: auto;
        min-width: 88px;
        padding: 8px 10px;
        white-space: nowrap;
        line-height: 1.25;
      }
      #${ROOT_ID} .th-book-pagination {
        position: sticky;
        bottom: 0;
        z-index: 2;
        align-self: end;
        margin: 0 0 -8px;
        padding: 8px clamp(16px, 3vw, 34px) 10px;
        border-width: 1px 0 0;
        border-radius: 0 0 18px 18px;
        background: rgba(255, 250, 242, 0.98);
        border-top-color: rgba(155, 128, 84, 0.16);
        box-shadow: 0 -10px 24px rgba(45, 31, 18, 0.08);
      }
      #${ROOT_ID}[data-theme='dark'] .th-book-pagination {
        background: rgba(31, 39, 50, 0.98);
        border-top-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.28);
      }
      #${ROOT_ID} .th-book-pagination-main {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      #${ROOT_ID} .th-book-page-number-list {
        flex-wrap: nowrap;
        max-width: min(70vw, 520px);
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      #${ROOT_ID} .th-book-page-number-list::-webkit-scrollbar {
        display: none;
      }
      #${ROOT_ID} .th-book-reading-surface {
        min-height: 0;
        overflow: auto;
        padding: 34px clamp(16px, 3vw, 34px) 18px;
      }
      #${ROOT_ID} .th-book-page-title,
      #${ROOT_ID} .th-book-main-body {
        width: min(100%, 58em);
        margin-left: 0;
        margin-right: auto;
      }
      #${ROOT_ID} .th-book-page-title {
        margin-top: 4px;
        margin-bottom: 24px;
        font-size: 18px;
        line-height: 1.35;
      }
      #${ROOT_ID} .th-book-main-body {
        font-size: 15px;
        line-height: 1.9;
        letter-spacing: 0.01em;
        text-align: left;
        overflow-wrap: break-word;
        word-break: normal;
      }
      #${ROOT_ID} .th-book-main-body p,
      #${ROOT_ID} .th-book-main-body ul,
      #${ROOT_ID} .th-book-main-body ol,
      #${ROOT_ID} .th-book-main-body blockquote,
      #${ROOT_ID} .th-book-main-body pre {
        margin: 0 0 1em;
      }
      #${ROOT_ID} .th-book-main-body h1,
      #${ROOT_ID} .th-book-main-body h2,
      #${ROOT_ID} .th-book-main-body h3 {
        margin-top: 1.2em;
        line-height: 1.35;
      }
      #${ROOT_ID} .th-main-title {
        font-size: 18px;
      }
      #${ROOT_ID} .th-main-subtitle {
        display: none;
      }
      #${ROOT_ID} .th-main-actions {
        display: flex;
        margin-left: auto;
        padding-right: 42px;
      }
      #${ROOT_ID} .th-view-toggle {
        display: none;
      }
      #${ROOT_ID} .th-window-actions {
        position: absolute;
        top: calc(10px + env(safe-area-inset-top, 0px));
        right: 10px;
        gap: 4px;
        align-self: center;
        justify-self: end;
        padding: 3px;
        border-radius: 14px;
      }
      #${ROOT_ID} .th-window-actions .th-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 9px;
      }
      #${ROOT_ID} .th-tag-search-row,
      #${ROOT_ID} .th-tag-color-toolbar,
      #${ROOT_ID} .th-color-hex-grid,
      #${ROOT_ID} .th-form-actions {
        grid-template-columns: 1fr;
      }
      #${ROOT_ID} .th-form-actions .th-primary-btn {
        order: -1;
      }
      #${ROOT_ID} .th-tag-color-body {
        grid-template-columns: 1fr;
      }
      #${ROOT_ID} .th-color-palette {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #${ROOT_ID} [data-role="month-grid"] {
        padding: 8px 8px 12px;
        gap: 8px;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }
      #${ROOT_ID} .th-reminder-summary {
        padding: 8px 10px;
      }
      #${ROOT_ID} .th-month-header {
        grid-template-columns: 1fr;
        gap: 8px;
        align-items: stretch;
      }
      #${ROOT_ID} .th-month-title {
        font-size: clamp(20px, 5.2vw, 24px);
      }
      #${ROOT_ID} .th-month-subtitle {
        font-size: 12px;
      }
      #${ROOT_ID} .th-month-actions {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      #${ROOT_ID} .th-month-actions .th-btn {
        min-width: 0;
        padding: 8px 6px;
        text-align: center;
      }
      #${ROOT_ID} .th-festival-scope-btn {
        grid-column: 1 / -1;
      }
      #${ROOT_ID} .th-festival-scope-control {
        grid-column: 1 / -1;
        width: 100%;
      }
      #${ROOT_ID} .th-week-head > div {
        padding: 8px 2px;
        text-align: center;
        font-size: 12px;
      }
      #${ROOT_ID} .th-week-days {
        min-height: calc(36px + var(--th-week-chip-rows) * 24px + 16px);
      }
      #${ROOT_ID} .th-day-cell {
        min-height: 78px;
        padding: 6px 3px 4px;
        gap: 4px;
        justify-content: flex-start;
      }
      #${ROOT_ID} .th-day-head {
        justify-content: center;
        align-items: flex-start;
      }
      #${ROOT_ID} .th-day-number { font-size: clamp(19px, 5vw, 22px); }
      #${ROOT_ID} .th-week-chip-grid {
        top: 34px;
        grid-auto-rows: 22px;
        row-gap: 3px;
      }
      #${ROOT_ID} .th-chip {
        min-height: 22px;
        font-size: clamp(10.5px, 2.85vw, 13px);
        padding: 3px 5px;
        line-height: 1.22;
        border-radius: 8px;
      }
      #${ROOT_ID} .th-week-chip-bar {
        margin: 0 2px;
      }
      #${ROOT_ID} .th-detail-card,
      #${ROOT_ID} .th-agenda-group {
        padding: 12px;
        border-radius: 14px;
      }
      #${ROOT_ID} .th-form-shell textarea {
        min-height: 88px;
      }
      #${ROOT_ID} .th-fab-add {
        display: inline-flex;
      }
      #${ROOT_ID} .th-fab-list {
        display: inline-flex;
      }

      #${ROOT_ID} .th-calendar-panel {
        overflow: hidden;
        border: 0;
        box-shadow: none;
      }

      #${ROOT_ID}[data-theme='dark'] .th-calendar-panel {
        background:
          radial-gradient(circle at 16% 8%, rgba(184, 215, 255, 0.12) 0 1px, transparent 1.8px),
          radial-gradient(circle at 66% 16%, rgba(250, 204, 21, 0.11) 0 1px, transparent 1.7px),
          linear-gradient(180deg, #09111f 0%, #0f1828 48%, #090f1a 100%) !important;
        background-size: 190px 190px, 230px 230px, auto !important;
      }

      #${ROOT_ID} .th-calendar-main {
        height: 100dvh;
        border: 0 !important;
        box-shadow: none !important;
      }

      #${ROOT_ID} .th-main-head {
        min-height: calc(54px + env(safe-area-inset-top, 0px));
        padding: calc(8px + env(safe-area-inset-top, 0px)) 10px 8px;
        border-bottom: 1px solid var(--th-line);
      }

      #${ROOT_ID} .th-window-actions .th-btn[data-action="toggle-panel-fullscreen"] {
        display: none;
      }

      #${ROOT_ID} .th-window-actions .th-btn,
      #${ROOT_ID} .th-menu-status-btn {
        width: 38px;
        height: 38px;
        min-width: 38px;
      }

      #${ROOT_ID} [data-role="month-grid"] {
        padding: 10px 10px calc(92px + env(safe-area-inset-bottom, 0px));
        overflow: auto;
        overscroll-behavior: contain;
      }

      #${ROOT_ID} .th-month-view {
        min-height: 100%;
        height: 100%;
      }

      #${ROOT_ID} .th-month-header {
        position: sticky;
        top: 0;
        z-index: 4;
        padding: 8px 2px 7px;
        border-bottom: 1px solid var(--th-line);
        background: color-mix(in srgb, var(--th-surface) 92%, transparent);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      #${ROOT_ID}[data-theme='dark'] .th-month-header {
        background: rgba(9, 17, 31, 0.9);
      }

      #${ROOT_ID} .th-month-title {
        font-size: clamp(20px, 5.7vw, 26px);
        text-align: center;
        white-space: normal;
      }

      #${ROOT_ID} .th-month-actions {
        width: min(100%, 392px);
        justify-self: center;
        display: grid;
        grid-template-columns: minmax(0, 1fr) repeat(3, 44px);
        gap: 6px;
        align-items: center;
        padding: 5px;
        border: 1px solid var(--th-line);
        border-radius: 17px;
        background: rgba(6, 11, 20, 0.24);
      }

      #${ROOT_ID} .th-month-actions .th-btn {
        min-width: 0;
        min-height: 34px;
        height: 34px;
        border-radius: 12px;
        padding: 0 8px;
        font-size: 13px;
        line-height: 1.15;
      }

      #${ROOT_ID} .th-month-nav-btn {
        width: 44px;
        padding: 0;
        font-size: 18px;
      }

      #${ROOT_ID} .th-desktop-action-label {
        display: none;
      }

      #${ROOT_ID} .th-mobile-action-label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      #${ROOT_ID} .th-festival-scope-btn {
        grid-column: auto;
        display: flex;
        justify-content: center;
        min-height: 34px;
        height: 34px;
        border-radius: 999px;
        padding: 0 10px;
        font-size: 12px;
      }

      #${ROOT_ID} .th-festival-scope-count {
        min-width: 34px;
        padding: 2px 6px;
        font-size: 10px;
      }

      #${ROOT_ID} .th-festival-scope-control {
        grid-column: auto;
        min-width: 0;
        min-height: 34px;
        padding: 2px;
        border-radius: 999px;
      }

      #${ROOT_ID} .th-festival-scope-option {
        min-height: 28px;
        padding: 0 6px;
        border-radius: 999px;
        font-size: 12px;
      }

      #${ROOT_ID} .th-month-board {
        min-height: 0;
        border-radius: 16px;
      }

      #${ROOT_ID} .th-week-head > div {
        min-height: 34px;
        letter-spacing: 0.08em;
      }

      #${ROOT_ID} .th-day-cell {
        min-height: 74px;
        padding: 5px 2px 4px;
        touch-action: manipulation;
      }

      #${ROOT_ID} .th-day-cell.is-selected::after {
        inset: 3px;
        border-radius: 9px;
      }

      #${ROOT_ID}[data-theme='dark'] .th-day-cell.is-selected::after {
        border-color: rgba(125, 211, 252, 0.72) !important;
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.06),
          0 0 18px rgba(56, 189, 248, 0.24);
      }

      #${ROOT_ID} .th-day-number {
        min-width: 24px;
        height: 24px;
        font-size: clamp(16px, 4.8vw, 20px);
      }

      #${ROOT_ID} .th-day-corner-markers {
        left: 3px;
        top: 3px;
        gap: 1px;
      }

      #${ROOT_ID} .th-corner-marker {
        width: 16px !important;
        height: 16px !important;
      }

      #${ROOT_ID} .th-corner-marker-svg {
        width: 10px !important;
        height: 10px !important;
      }

      #${ROOT_ID} .th-week-chip-grid {
        top: 33px;
        grid-auto-rows: 20px;
      }

      #${ROOT_ID} .th-chip {
        min-height: 20px;
        padding: 2px 5px;
        font-size: clamp(10px, 2.65vw, 12px);
      }

      #${ROOT_ID} .th-calendar-side {
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        bottom: 0 !important;
        height: min(88dvh, 760px) !important;
        max-height: calc(100dvh - 10px) !important;
        border: 1px solid var(--th-line) !important;
        border-bottom: 0 !important;
        border-radius: 24px 24px 0 0 !important;
        grid-template-rows: auto minmax(0, 1fr);
        transform: translateY(calc(100% + 18px));
        box-shadow: 0 -26px 48px rgba(28, 18, 8, 0.26);
        overflow: hidden;
      }

      #${ROOT_ID}[data-theme='dark'] .th-calendar-side {
        background:
          radial-gradient(circle at 18% 0%, rgba(125, 211, 252, 0.12), transparent 34%),
          linear-gradient(180deg, rgba(16, 27, 48, 0.98), rgba(8, 13, 24, 0.98)) !important;
        box-shadow: 0 -28px 56px rgba(0, 0, 0, 0.56);
      }

      #${ROOT_ID}[data-mobile-side-open='true'] .th-calendar-side {
        transform: translateY(0);
      }

      #${ROOT_ID} .th-side-head {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        min-height: 62px;
        padding: 22px 14px 10px;
        background: color-mix(in srgb, var(--th-surface-2) 84%, transparent);
      }

      #${ROOT_ID} .th-side-head::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 50%;
        width: 44px;
        height: 4px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--th-muted) 58%, transparent);
        transform: translateX(-50%);
      }

      #${ROOT_ID} .th-side-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${ROOT_ID} .th-mobile-side-close {
        position: static !important;
        width: auto !important;
        min-width: 86px;
        height: 40px;
        padding: 0 12px;
        border-radius: 12px;
        font-size: 13px;
      }

      #${ROOT_ID} .th-side-body {
        padding: 12px 12px calc(16px + env(safe-area-inset-bottom, 0px));
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      #${ROOT_ID} .th-agenda-toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        margin: -2px 0 12px;
        background: color-mix(in srgb, var(--th-surface) 94%, transparent) !important;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      #${ROOT_ID} .th-agenda-toolbar-row,
      #${ROOT_ID} .th-form-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
      }

      #${ROOT_ID} .th-agenda-toolbar input,
      #${ROOT_ID} .th-agenda-toolbar select,
      #${ROOT_ID} .th-form-shell input,
      #${ROOT_ID} .th-form-shell select,
      #${ROOT_ID} .th-form-shell textarea {
        min-height: 44px;
        font-size: 16px;
      }

      #${ROOT_ID} .th-form-actions {
        position: sticky;
        bottom: calc(-16px - env(safe-area-inset-bottom, 0px));
        z-index: 3;
        margin: 4px -12px calc(-16px - env(safe-area-inset-bottom, 0px));
        padding: 10px 12px calc(12px + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid var(--th-line);
        background: color-mix(in srgb, var(--th-surface) 96%, transparent);
      }

      #${ROOT_ID}[data-theme='dark'] .th-form-actions {
        background: rgba(8, 13, 24, 0.96);
      }

      #${ROOT_ID} .th-form-actions .th-btn,
      #${ROOT_ID} .th-card-actions--icon .th-icon-btn {
        min-height: 44px;
      }

      #${ROOT_ID} .th-card-actions--icon .th-icon-btn {
        width: 34px;
        min-width: 34px;
      }

      #${ROOT_ID} .th-fab-add,
      #${ROOT_ID} .th-fab-list {
        position: fixed;
        right: 16px;
        left: auto;
        width: 54px;
        height: 54px;
        z-index: 5;
        transition:
          opacity 160ms ease,
          transform 160ms ease;
      }

      #${ROOT_ID} .th-fab-add {
        bottom: calc(18px + env(safe-area-inset-bottom, 0px));
      }

      #${ROOT_ID} .th-fab-list {
        bottom: calc(82px + env(safe-area-inset-bottom, 0px));
      }

      #${ROOT_ID}[data-mobile-side-open='true'] .th-fab-add,
      #${ROOT_ID}[data-mobile-side-open='true'] .th-fab-list {
        opacity: 0;
        pointer-events: none;
        transform: translateY(12px);
      }
    }

    #${ROOT_ID} .th-chip.is-stage-bubble {
      justify-content: center;
      border-style: dashed !important;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0)),
        color-mix(in srgb, var(--th-chip-bg, #ffe6a6) 72%, #ffffff 28%) !important;
      color: color-mix(in srgb, var(--th-chip-text, #895710) 88%, #2f2418 12%) !important;
      border-color: color-mix(in srgb, var(--th-chip-border, rgba(201, 145, 40, 0.56)) 76%, #ffffff 24%) !important;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.32),
        0 2px 6px rgba(114, 79, 30, 0.12) !important;
    }

    #${ROOT_ID} .th-chip.is-stage-bubble::before {
      width: 6px !important;
      height: 6px !important;
      border-radius: 999px !important;
      background: currentColor !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent) !important;
    }

    #${ROOT_ID} .th-chip.is-stage-bubble.is-continue-left,
    #${ROOT_ID} .th-chip.is-stage-bubble.is-continue-right,
    #${ROOT_ID} .th-chip.is-stage-bubble.is-continue-left.is-continue-right {
      border-radius: 999px !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-chip.is-stage-bubble {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0)),
        color-mix(in srgb, var(--th-chip-bg, #ffe6a6) 42%, #08111f 58%) !important;
      color: color-mix(in srgb, var(--th-chip-bg, #ffe6a6) 28%, #ffffff 72%) !important;
      border-color: color-mix(in srgb, var(--th-chip-border, #d59a2d) 70%, #ffffff 30%) !important;
      text-shadow: none !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h1,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h2,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h3,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h4,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h5,
    #${ROOT_ID}[data-theme='dark'] .th-book-main-body h6,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h1,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h2,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h3,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h4,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h5,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body h6 {
      color: #f7fafc !important;
    }

    #${ROOT_ID}[data-theme='dark'] .th-book-main-body blockquote,
    #${ROOT_ID}[data-theme='dark'] .th-book-reader-body blockquote {
      color: #273143 !important;
      background: rgba(247, 241, 230, 0.92) !important;
      border-left-color: rgba(250, 204, 118, 0.68) !important;
    }
  `;
  hostDocument.head.appendChild(style);
}
