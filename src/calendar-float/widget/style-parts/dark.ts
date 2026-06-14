import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_DARK_STYLE = `
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
    #${ROOT_ID}[data-theme='dark'] .th-repeat-detail,
    #${ROOT_ID}[data-theme='dark'] .th-detail-card,
    #${ROOT_ID}[data-theme='dark'] .th-agenda-item,
    #${ROOT_ID}[data-theme='dark'] .th-empty,
    #${ROOT_ID}[data-theme='dark'] .th-reminder-summary,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell input,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell select,
    #${ROOT_ID}[data-theme='dark'] .th-form-shell textarea,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-toolbar input,
    #${ROOT_ID}[data-theme='dark'] .th-color-hex-grid input,
    #${ROOT_ID}[data-theme='dark'] .th-mvu-path-form input,
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

    #${ROOT_ID}[data-theme='dark'] .th-mvu-settings-dialog {
      background:
        radial-gradient(circle at 10% 0%, rgba(125, 211, 252, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(18, 25, 36, 0.98), rgba(10, 16, 28, 0.98));
      border-color: rgba(184, 215, 255, 0.18);
      box-shadow:
        0 30px 76px rgba(0, 0, 0, 0.58),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
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

    #${ROOT_ID}[data-theme='dark'] .th-mvu-settings-dialog .th-managed-worldbook-dialog-summary {
      background: transparent;
      border-color: transparent;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-settings-dialog .th-managed-worldbook-dialog-summary-item,
    #${ROOT_ID}[data-theme='dark'] .th-mvu-path-dialog {
      color: #dce7f7;
      background:
        linear-gradient(180deg, rgba(27, 37, 54, 0.9), rgba(13, 20, 34, 0.76));
      border-color: rgba(184, 215, 255, 0.15);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-path-form small {
      color: #9fb0c6;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-path-form input:focus {
      border-color: rgba(184, 215, 255, 0.62);
      background: rgba(11, 18, 31, 0.96);
      box-shadow:
        0 0 0 3px rgba(125, 211, 252, 0.16),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-action-group {
      color: #c4cfdb;
      background:
        linear-gradient(180deg, rgba(27, 37, 54, 0.76), rgba(13, 20, 34, 0.58));
      border-color: rgba(184, 215, 255, 0.14);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-action-group--danger {
      background:
        linear-gradient(180deg, rgba(58, 34, 34, 0.62), rgba(28, 18, 24, 0.58));
      border-color: rgba(248, 113, 113, 0.2);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-action-copy {
      color: #aebccc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-action-copy strong {
      color: #f5f8fc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-action-group--danger .th-mvu-action-copy strong {
      color: #fecaca;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-close-btn {
      background: rgba(15, 22, 34, 0.82);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-maintenance-details {
      background: rgba(12, 18, 29, 0.68);
      border-color: rgba(184, 215, 255, 0.14);
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-maintenance-details > summary {
      color: #f5f8fc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-maintenance-details > summary small {
      color: #aebccc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-mvu-maintenance-details > summary::after {
      background: rgba(125, 211, 252, 0.14);
      color: #dcecff;
    }

    #${ROOT_ID}[data-theme='dark'] .th-index-editor-settings-page-head h2,
    #${ROOT_ID}[data-theme='dark'] .th-index-editor-settings-block-head h3 {
      color: #f5f8fc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-index-editor-settings-page-head p,
    #${ROOT_ID}[data-theme='dark'] .th-index-editor-settings-block-head p {
      color: #aebccc;
    }

    #${ROOT_ID}[data-theme='dark'] .th-index-editor-settings-block {
      background:
        linear-gradient(180deg, rgba(27, 37, 54, 0.78), rgba(13, 20, 34, 0.66));
      border-color: rgba(184, 215, 255, 0.14);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag,
    #${ROOT_ID}[data-theme='dark'] .th-repeat-weekday {
      background: #222b36;
      border-color: #3b4859;
      color: #dbe3ee;
    }

    #${ROOT_ID}[data-theme='dark'] .th-form-tag-chip,
    #${ROOT_ID}[data-theme='dark'] .th-tag-option.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-tag-color-tag.is-active,
    #${ROOT_ID}[data-theme='dark'] .th-repeat-weekday.is-active {
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

    #${ROOT_ID}[data-theme='dark'] .th-tag-color-preview-note {
      color: #a7b4c4;
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
      width: 60px;
      height: 60px;
      border-color: rgba(255, 250, 238, 0.78);
      border-radius: 18px;
      background:
        radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.82), transparent 35%),
        linear-gradient(145deg, #fff9ed, #efe1c8 54%, #d9c8a9);
      color: var(--th-accent);
      font-size: 28px;
      box-shadow:
        0 8px 18px rgba(72, 47, 20, 0.18),
        inset 0 0 0 1px rgba(104, 76, 44, 0.14);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      transition:
        transform 140ms ease,
        box-shadow 140ms ease,
        border-color 140ms ease;
    }

    #${ROOT_ID} .th-calendar-ball:hover {
      transform: translateY(-1px);
      border-color: rgba(165, 103, 36, 0.42);
      box-shadow:
        0 10px 22px rgba(72, 47, 20, 0.2),
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
        0 10px 22px rgba(0, 0, 0, 0.46),
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
      background: color-mix(in srgb, var(--th-paper) 92%, white 8%);
      border-color: color-mix(in srgb, var(--th-accent) 28%, transparent);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.72),
        0 8px 18px color-mix(in srgb, var(--th-accent) 10%, transparent);
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
    #${ROOT_ID} .th-repeat-detail,
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
    #${ROOT_ID}[data-theme='dark'] .th-repeat-detail,
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
    #${ROOT_ID} .th-festival-title-svg circle,
    #${ROOT_ID} .th-festival-title-svg rect,
    #${ROOT_ID} .th-festival-title-svg polygon,
    #${ROOT_ID} .th-festival-title-svg polyline,
    #${ROOT_ID} .th-festival-title-svg line,
    #${ROOT_ID} .th-corner-marker-svg path,
    #${ROOT_ID} .th-corner-marker-svg circle,
    #${ROOT_ID} .th-corner-marker-svg rect,
    #${ROOT_ID} .th-corner-marker-svg polygon,
    #${ROOT_ID} .th-corner-marker-svg polyline,
    #${ROOT_ID} .th-corner-marker-svg line {
      fill: currentColor !important;
      stroke: currentColor !important;
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

`;
