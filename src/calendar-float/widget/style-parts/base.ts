import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_BASE_STYLE = `
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

    #${ROOT_ID} .th-index-editor-dialog {
      display: flex;
      flex-direction: column;
      width: min(1360px, calc(100vw - 32px));
      height: min(92vh, 920px);
      height: min(92dvh, 920px);
      overflow: hidden;
    }

    #${ROOT_ID} .th-index-editor-dialog > .th-managed-worldbook-dialog-head,
    #${ROOT_ID} .th-index-editor-dialog > .th-index-editor-summary-bar,
    #${ROOT_ID} .th-index-editor-dialog > .th-index-editor-status,
    #${ROOT_ID} .th-index-editor-dialog > .th-managed-worldbook-dialog-actions {
      flex: 0 0 auto;
    }

    #${ROOT_ID} .th-index-editor-dialog > .th-index-editor-footer-actions {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 8px;
    }

    #${ROOT_ID} .th-index-editor-footer-actions .th-btn {
      min-width: 0;
      min-height: 36px;
      padding-block: 8px;
      justify-content: center;
      text-align: center;
    }

    #${ROOT_ID} .th-index-editor-status {
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.18);
      font-size: 13px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-index-editor-status.is-loading {
      background: rgba(238, 244, 255, 0.82);
      color: #31547f;
    }

    #${ROOT_ID} .th-index-editor-status.is-success {
      background: rgba(224, 247, 232, 0.82);
      color: #23643d;
    }

    #${ROOT_ID} .th-index-editor-status.is-warning {
      background: rgba(255, 244, 204, 0.86);
      color: #7a5a00;
    }

    #${ROOT_ID} .th-index-editor-status.is-danger {
      background: rgba(255, 228, 228, 0.86);
      color: #8e2c2c;
    }

    #${ROOT_ID} .th-index-editor-summary-bar {
      display: grid;
      gap: 6px;
      padding: 9px 10px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(250, 245, 236, 0.72);
    }

    #${ROOT_ID} .th-index-editor-summary-line {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      align-items: center;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-summary-pill,
    #${ROOT_ID} .th-index-editor-summary-item,
    #${ROOT_ID} .th-index-editor-date-pill {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      border-radius: 999px;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-index-editor-summary-pill {
      padding: 4px 9px;
      font-size: 12px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-summary-pill.is-loading {
      background: rgba(238, 244, 255, 0.82);
      color: #31547f;
    }

    #${ROOT_ID} .th-index-editor-summary-pill.is-success {
      background: rgba(224, 247, 232, 0.82);
      color: #23643d;
    }

    #${ROOT_ID} .th-index-editor-summary-pill.is-warning {
      background: rgba(255, 244, 204, 0.86);
      color: #7a5a00;
    }

    #${ROOT_ID} .th-index-editor-summary-pill.is-danger {
      background: rgba(255, 228, 228, 0.86);
      color: #8e2c2c;
    }

    #${ROOT_ID} .th-index-editor-summary-item {
      gap: 5px;
      max-width: 260px;
      padding: 4px 8px;
      background: rgba(255, 252, 246, 0.72);
      color: #594632;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #${ROOT_ID} .th-index-editor-summary-item b {
      color: #8a735a;
      font-size: 10px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-summary-details {
      color: #6d5a45;
      font-size: 12px;
    }

    #${ROOT_ID} .th-index-editor-summary-details > summary {
      width: fit-content;
      cursor: pointer;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-summary-message {
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(255, 244, 204, 0.76);
      color: #7a5a00;
      font-size: 12px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-index-editor-summary-message.is-success {
      background: rgba(224, 247, 232, 0.72);
      color: #23643d;
    }

    #${ROOT_ID} .th-index-editor-summary-message.is-danger {
      background: rgba(255, 228, 228, 0.78);
      color: #8e2c2c;
    }

    #${ROOT_ID} .th-index-editor-section {
      display: grid;
      gap: 10px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255, 255, 255, 0.58);
    }

    #${ROOT_ID} .th-index-editor-section h3 {
      margin: 0;
      font-size: 13px;
      color: #4d3a26;
    }

    #${ROOT_ID} .th-index-editor-kv,
    #${ROOT_ID} .th-index-editor-stat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    #${ROOT_ID} .th-index-editor-kv span,
    #${ROOT_ID} .th-index-editor-stat-grid span {
      display: block;
      font-size: 11px;
      color: #806d57;
    }

    #${ROOT_ID} .th-index-editor-kv b,
    #${ROOT_ID} .th-index-editor-stat-grid b {
      display: block;
      min-width: 0;
      overflow-wrap: anywhere;
      color: #3b2d1f;
      font-size: 13px;
    }

    #${ROOT_ID} .th-index-editor-columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding-top: 8px;
    }

    #${ROOT_ID} .th-index-editor-details summary {
      cursor: pointer;
      color: #6d5a45;
      font-size: 12px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-index-editor-details ul,
    #${ROOT_ID} .th-index-editor-issues ul {
      margin: 6px 0 0;
      padding-left: 18px;
      color: #5d4a35;
      font-size: 12px;
      line-height: 1.55;
    }

    #${ROOT_ID} .th-index-editor-muted {
      color: #978777;
    }

    #${ROOT_ID} .th-index-editor-mini-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    #${ROOT_ID} .th-index-editor-mini-list span {
      max-width: 100%;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(238, 226, 207, 0.8);
      color: #55412b;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-issues {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.14);
    }

    #${ROOT_ID} .th-index-editor-issues.is-success {
      background: rgba(224, 247, 232, 0.52);
    }

    #${ROOT_ID} .th-index-editor-issues.is-warning {
      background: rgba(255, 244, 204, 0.58);
    }

    #${ROOT_ID} .th-index-editor-issues.is-danger {
      background: rgba(255, 228, 228, 0.58);
    }

    #${ROOT_ID} .th-index-editor-section details {
      display: grid;
      gap: 8px;
    }

    #${ROOT_ID} .th-index-editor-section summary {
      cursor: pointer;
      color: #5d4a35;
      font-size: 12px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-index-editor-group-folder {
      padding: 0;
      border: 1px solid rgba(155, 128, 84, 0.16);
      border-radius: 10px;
      background: rgba(255, 253, 248, 0.72);
    }

    #${ROOT_ID} .th-index-editor-group-folder > summary {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(96px, auto) auto;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      list-style-position: inside;
    }

    #${ROOT_ID} .th-index-editor-folder-name,
    #${ROOT_ID} .th-index-editor-folder-id,
    #${ROOT_ID} .th-index-editor-folder-count {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-folder-name {
      color: #473520;
      font-size: 13px;
    }

    #${ROOT_ID} .th-index-editor-folder-id,
    #${ROOT_ID} .th-index-editor-folder-count {
      color: #8a765d;
      font-size: 11px;
      font-weight: 700;
    }

    #${ROOT_ID} .th-index-editor-folder-count {
      justify-self: end;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-index-editor-folder-body {
      display: grid;
      gap: 10px;
      padding: 0 10px 10px;
    }

    #${ROOT_ID} .th-index-editor-folder-events {
      padding-top: 0;
      padding-left: 14px;
      border-left: 2px solid rgba(155, 128, 84, 0.12);
    }

    #${ROOT_ID} .th-index-editor-stage-folder {
      padding: 8px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.18);
      border-left: 3px solid rgba(167, 120, 48, 0.34);
      background: rgba(255, 252, 246, 0.72);
    }

    #${ROOT_ID} .th-index-editor-stage-folder > summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    #${ROOT_ID} .th-index-editor-stage-list {
      display: grid;
      gap: 8px;
      padding-top: 8px;
    }

    #${ROOT_ID} .th-index-editor-stage-toolbar {
      display: flex;
      justify-content: flex-start;
      padding-top: 8px;
    }

    #${ROOT_ID} .th-index-editor-stage-card {
      display: grid;
      gap: 8px;
      padding: 9px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.13);
      background: rgba(255, 255, 255, 0.7);
    }

    #${ROOT_ID} .th-index-editor-stage-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      color: #8a765d;
      font-size: 11px;
    }

    #${ROOT_ID} .th-index-editor-stage-head strong {
      min-width: 0;
      color: #4d3a26;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-stage-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      justify-content: flex-end;
    }

    #${ROOT_ID} .th-index-editor-edit-list {
      display: grid;
      gap: 10px;
      padding-top: 8px;
    }

    #${ROOT_ID} .th-index-editor-edit-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    #${ROOT_ID} .th-index-editor-workspace {
      display: grid;
      grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
      gap: 14px;
      align-items: stretch;
      min-height: 0;
      height: 100%;
    }

    #${ROOT_ID} .th-index-editor-scroll-root {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    #${ROOT_ID} .th-index-editor-structured-editor {
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    #${ROOT_ID} .th-index-editor-nav {
      display: grid;
      align-content: start;
      gap: 12px;
      height: 100%;
      min-width: 0;
      max-height: none;
      overflow: auto;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      background: rgba(250, 245, 236, 0.72);
    }

    #${ROOT_ID} .th-index-editor-nav-section {
      display: grid;
      gap: 7px;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-nav-title,
    #${ROOT_ID} .th-index-editor-nav-folder-label {
      color: #6f583d;
      font-size: 11px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-nav-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
    }

    #${ROOT_ID} .th-index-editor-nav-actions .th-btn {
      width: 100%;
      min-width: 0;
      padding-inline: 8px;
    }

    #${ROOT_ID} .th-index-editor-nav-folder {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-nav-children {
      display: grid;
      gap: 5px;
      min-width: 0;
      padding-left: 10px;
      border-left: 1px solid rgba(155, 128, 84, 0.16);
    }

    #${ROOT_ID} .th-index-editor-nav-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 7px;
      align-items: center;
      width: 100%;
      min-width: 0;
      padding: 7px 9px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: #4f3a26;
      font: inherit;
      font-size: 12px;
      font-weight: 800;
      text-align: left;
      cursor: pointer;
    }

    #${ROOT_ID} .th-index-editor-nav-item:hover {
      border-color: rgba(155, 128, 84, 0.22);
      background: rgba(255, 252, 246, 0.74);
    }

    #${ROOT_ID} .th-index-editor-nav-item.is-active {
      border-color: rgba(178, 127, 49, 0.32);
      background: rgba(255, 239, 207, 0.82);
      color: #6d4614;
    }

    #${ROOT_ID} .th-index-editor-nav-item span,
    #${ROOT_ID} .th-index-editor-nav-item b {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #${ROOT_ID} .th-index-editor-nav-item b {
      color: #90785e;
      font-size: 10px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-nav-item.is-folder {
      background: rgba(255, 252, 246, 0.44);
    }

    #${ROOT_ID} .th-index-editor-nav-item.is-folder span::before {
      content: '▸';
      display: inline-block;
      width: 1em;
      color: #9b8054;
    }

    #${ROOT_ID} .th-index-editor-nav-folder[data-expanded='true'] > .th-index-editor-nav-item.is-folder span::before {
      content: '▾';
    }

    #${ROOT_ID} .th-index-editor-nav-item.is-tab {
      justify-content: center;
      text-align: center;
    }

    #${ROOT_ID} .th-index-editor-detail {
      min-width: 0;
      height: 100%;
      overflow: auto;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
      padding-right: 4px;
    }

    #${ROOT_ID} .th-index-editor-mobile-detail-bar {
      display: none;
    }

    #${ROOT_ID} .th-index-editor-detail > .th-index-editor-edit-card,
    #${ROOT_ID} .th-index-editor-detail > .th-index-editor-section,
    #${ROOT_ID} .th-index-editor-detail > details {
      max-width: 860px;
    }

    #${ROOT_ID} .th-index-editor-detail-tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }

    #${ROOT_ID} .th-index-editor-date-pill {
      justify-content: center;
      padding: 3px 8px;
      background: rgba(255, 239, 207, 0.9);
      color: #74511d;
      font-size: 11px;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0;
    }

    #${ROOT_ID} .th-index-editor-event-meta-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    #${ROOT_ID} .th-index-editor-overview {
      display: grid;
      gap: 12px;
      max-width: 620px;
      padding: 18px;
      border-radius: 12px;
      border: 1px dashed rgba(155, 128, 84, 0.24);
      background: rgba(255, 252, 246, 0.64);
      color: #5d4a35;
    }

    #${ROOT_ID} .th-index-editor-overview-title {
      font-size: 14px;
      font-weight: 900;
      color: #3b2d1f;
    }

    #${ROOT_ID} .th-index-editor-overview-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
    }

    #${ROOT_ID} .th-index-editor-overview-grid span {
      padding: 5px 9px;
      border-radius: 999px;
      background: rgba(238, 226, 207, 0.72);
    }

    #${ROOT_ID} .th-index-editor-empty {
      padding: 9px 10px;
      border-radius: 8px;
      border: 1px dashed rgba(155, 128, 84, 0.22);
      color: #8a765d;
      background: rgba(255, 252, 246, 0.58);
      font-size: 12px;
      line-height: 1.45;
    }

    #${ROOT_ID} .th-index-editor-stage-list-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      min-width: 0;
      padding: 7px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.12);
      background: rgba(255, 255, 255, 0.68);
    }

    #${ROOT_ID} .th-index-editor-edit-card {
      display: grid;
      gap: 8px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.14);
      background: rgba(255, 251, 245, 0.72);
    }

    #${ROOT_ID} .th-index-editor-edit-card.is-invalid {
      border-color: rgba(190, 58, 58, 0.52);
      background: rgba(255, 244, 244, 0.88);
    }

    #${ROOT_ID} .th-index-editor-edit-card.has-warning {
      border-color: rgba(190, 145, 38, 0.48);
      background: rgba(255, 249, 232, 0.88);
    }

    #${ROOT_ID} .th-index-editor-edit-card-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: start;
    }

    #${ROOT_ID} .th-index-editor-edit-card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
    }

    #${ROOT_ID} .th-index-editor-card-heading {
      display: grid;
      gap: 5px;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-card-title {
      min-width: 0;
      color: #3f2d1b;
      font-size: 13px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-card-meta span {
      max-width: 100%;
      padding: 3px 7px;
      border-radius: 999px;
      background: rgba(238, 226, 207, 0.72);
      color: #756149;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-action-menu {
      min-width: 118px;
      justify-self: end;
    }

    #${ROOT_ID} .th-index-editor-action-menu > summary {
      padding: 7px 10px;
      border: 1px solid rgba(155, 128, 84, 0.26);
      border-radius: 10px;
      background: rgba(255, 252, 246, 0.9);
      color: #5c4630;
      list-style-position: inside;
      text-align: center;
    }

    #${ROOT_ID} .th-index-editor-action-menu[open] > summary {
      border-color: rgba(155, 128, 84, 0.42);
      background: rgba(248, 239, 224, 0.94);
    }

    #${ROOT_ID} .th-index-editor-action-menu .th-index-editor-edit-card-actions {
      margin-top: 6px;
      padding: 7px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      border-radius: 10px;
      background: rgba(255, 252, 246, 0.95);
    }

    #${ROOT_ID} .th-index-editor-edit-card strong {
      min-width: 0;
      color: #4d3a26;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    #${ROOT_ID} .th-index-editor-field-section {
      display: grid;
      gap: 8px;
      min-width: 0;
    }

    #${ROOT_ID} .th-index-editor-field-section + .th-index-editor-field-section,
    #${ROOT_ID} .th-index-editor-field-section + .th-index-editor-stage-folder,
    #${ROOT_ID} .th-index-editor-stage-folder + .th-index-editor-advanced-fields,
    #${ROOT_ID} .th-index-editor-row-issues + .th-index-editor-stage-folder {
      margin-top: 2px;
      padding-top: 10px;
      border-top: 1px solid rgba(155, 128, 84, 0.12);
    }

    #${ROOT_ID} .th-index-editor-field-section-title {
      color: #765c3e;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0;
    }

    #${ROOT_ID} .th-index-editor-advanced-fields {
      padding: 8px;
      border-radius: 10px;
      border: 1px dashed rgba(155, 128, 84, 0.22);
      background: rgba(250, 246, 239, 0.7);
    }

    #${ROOT_ID} .th-index-editor-advanced-fields > summary {
      color: #735d45;
      font-size: 11px;
      font-weight: 900;
    }

    #${ROOT_ID} .th-index-editor-advanced-fields .th-index-editor-edit-grid {
      padding-top: 8px;
    }

    #${ROOT_ID} .th-index-editor-edit-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      align-items: start;
    }

    #${ROOT_ID} .th-index-editor-edit-grid.is-compact {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    #${ROOT_ID} .th-index-editor-form-stack {
      display: grid;
      gap: 9px;
    }

    #${ROOT_ID} .th-index-editor-form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      align-items: start;
    }

    #${ROOT_ID} .th-index-editor-form-row.is-date-range,
    #${ROOT_ID} .th-index-editor-form-row.is-recurrence {
      max-width: 620px;
    }

    #${ROOT_ID} .th-index-editor-conditional-field.is-hidden {
      display: none;
    }

    #${ROOT_ID} .th-index-editor-field.is-wide {
      grid-column: 1 / -1;
    }

    #${ROOT_ID} .th-index-editor-field {
      display: grid;
      gap: 5px;
      min-width: 0;
      color: #6d5a45;
      font-size: 11px;
      font-weight: 800;
    }

    #${ROOT_ID} .th-index-editor-field input,
    #${ROOT_ID} .th-index-editor-field select,
    #${ROOT_ID} .th-index-editor-field textarea {
      width: 100%;
      min-width: 0;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.24);
      background: rgba(255, 255, 255, 0.9);
      color: #3b2d1f;
      font-family: inherit;
      font-size: 12px;
      line-height: 1.45;
      padding: 8px 9px;
      outline: none;
    }

    #${ROOT_ID} .th-index-editor-field textarea {
      min-height: 72px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    #${ROOT_ID} .th-index-editor-field.is-id-list textarea {
      min-height: 230px;
      font-size: 12px;
      line-height: 1.45;
      white-space: pre;
      overflow: auto;
    }

    #${ROOT_ID} .th-index-editor-field input:focus,
    #${ROOT_ID} .th-index-editor-field select:focus,
    #${ROOT_ID} .th-index-editor-field textarea:focus {
      border-color: rgba(185, 137, 48, 0.58);
      box-shadow: 0 0 0 3px rgba(235, 190, 90, 0.18);
    }

    #${ROOT_ID} .th-index-editor-row-issues {
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      font-size: 12px;
      line-height: 1.5;
    }

    #${ROOT_ID} .th-index-editor-row-issues strong {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
    }

    #${ROOT_ID} .th-index-editor-row-issues ul {
      margin: 0;
      padding-left: 18px;
    }

    #${ROOT_ID} .th-index-editor-row-issues.is-danger {
      border-color: rgba(190, 58, 58, 0.2);
      background: rgba(255, 228, 228, 0.78);
      color: #8e2c2c;
    }

    #${ROOT_ID} .th-index-editor-row-issues.is-warning {
      border-color: rgba(190, 145, 38, 0.2);
      background: rgba(255, 244, 204, 0.78);
      color: #7a5a00;
    }

    #${ROOT_ID} .th-index-editor-yaml {
      min-height: 340px;
      max-height: 480px;
      margin: 0;
      padding: 12px;
      overflow: auto;
      border-radius: 12px;
      background: rgba(50, 38, 28, 0.92);
      color: #fff7e8;
      font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
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
    #${ROOT_ID} .th-form-field[hidden] { display: none; }
    #${ROOT_ID} .th-form-field label { font-size: 12px; color: #6e604f; }
    #${ROOT_ID} .th-repeat-detail,
    #${ROOT_ID} .th-repeat-detail-group {
      display: grid;
      gap: 8px;
    }
    #${ROOT_ID} .th-repeat-detail[hidden],
    #${ROOT_ID} .th-repeat-detail-group[hidden],
    #${ROOT_ID} .th-repeat-inline[hidden] {
      display: none;
    }
    #${ROOT_ID} .th-repeat-detail {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(155, 128, 84, 0.16);
      background: rgba(255,255,255,0.44);
    }
    #${ROOT_ID} .th-repeat-detail-group label {
      font-size: 12px;
      color: #6e604f;
      font-weight: 700;
    }
    #${ROOT_ID} .th-repeat-weekday-list {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 6px;
    }
    #${ROOT_ID} .th-repeat-weekday {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      border: 1px solid rgba(155, 128, 84, 0.22);
      border-radius: 999px;
      background: rgba(255, 252, 246, 0.92);
      color: #5a4936;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
    }
    #${ROOT_ID} .th-repeat-weekday input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    #${ROOT_ID} .th-repeat-weekday.is-active {
      background: #fff0cf;
      border-color: rgba(191, 143, 68, 0.48);
      color: #7d5315;
    }
    #${ROOT_ID} .th-repeat-inline {
      display: grid;
      grid-template-columns: repeat(4, auto);
      gap: 7px;
      align-items: center;
      justify-content: start;
      color: #6e604f;
      font-size: 12px;
      font-weight: 700;
    }
    #${ROOT_ID} .th-repeat-inline input {
      width: 76px;
      padding: 9px 10px;
      text-align: center;
    }
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

`;
