import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_RESPONSIVE_STYLE = `
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
      #${ROOT_ID} .th-calendar-ball {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        font-size: 23px;
        box-shadow:
          0 6px 14px rgba(72, 47, 20, 0.16),
          inset 0 0 0 1px rgba(104, 76, 44, 0.12);
      }
      #${ROOT_ID} .th-calendar-ball:hover {
        transform: none;
        box-shadow:
          0 6px 14px rgba(72, 47, 20, 0.16),
          inset 0 0 0 1px rgba(104, 76, 44, 0.12);
      }
      #${ROOT_ID}[data-theme='dark'] .th-calendar-ball {
        box-shadow:
          0 7px 16px rgba(0, 0, 0, 0.42),
          inset 0 0 0 1px rgba(187, 214, 255, 0.1);
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
      #${ROOT_ID} .th-index-editor-dialog {
        width: min(560px, calc(100vw - 24px));
        width: min(560px, calc(100dvw - 24px));
        height: min(92vh, 920px);
        height: min(92dvh, 920px);
        overflow: hidden;
      }
      #${ROOT_ID} .th-index-editor-kv,
      #${ROOT_ID} .th-index-editor-stat-grid,
      #${ROOT_ID} .th-index-editor-columns,
      #${ROOT_ID} .th-index-editor-workspace,
      #${ROOT_ID} .th-index-editor-form-row,
      #${ROOT_ID} .th-index-editor-edit-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-nav {
        height: 100%;
        max-height: none;
      }
      #${ROOT_ID} .th-index-editor-workspace[data-mobile-view='nav'] .th-index-editor-detail {
        display: none;
      }
      #${ROOT_ID} .th-index-editor-workspace[data-mobile-view='detail'] .th-index-editor-nav {
        display: none;
      }
      #${ROOT_ID} .th-index-editor-workspace[data-mobile-view='detail'] .th-index-editor-detail {
        display: block;
      }
      #${ROOT_ID} .th-index-editor-mobile-detail-bar {
        position: sticky;
        top: 0;
        z-index: 4;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        margin: 0 0 8px;
        padding: 0 0 8px;
        background: rgba(255, 252, 246, 0.96);
      }
      #${ROOT_ID} .th-index-editor-mobile-detail-bar .th-btn {
        min-width: 72px;
        padding: 7px 10px;
      }
      #${ROOT_ID} .th-index-editor-mobile-detail-bar strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #3b2d1f;
        font-size: 13px;
      }
      #${ROOT_ID} .th-index-editor-nav-actions,
      #${ROOT_ID} .th-index-editor-detail-tabs,
      #${ROOT_ID} .th-index-editor-stage-list-row {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-group-folder > summary {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-folder-count {
        justify-self: start;
      }
      #${ROOT_ID} .th-index-editor-folder-events {
        padding-left: 0;
      }
      #${ROOT_ID} .th-index-editor-stage-head {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-action-menu {
        width: 100%;
        justify-self: stretch;
      }
      #${ROOT_ID} .th-index-editor-action-menu > summary {
        width: 100%;
      }
      #${ROOT_ID} .th-index-editor-stage-actions,
      #${ROOT_ID} .th-index-editor-stage-actions .th-btn,
      #${ROOT_ID} .th-index-editor-stage-toolbar .th-btn {
        width: 100%;
      }
      #${ROOT_ID} .th-index-editor-edit-toolbar,
      #${ROOT_ID} .th-index-editor-edit-toolbar .th-btn {
        width: 100%;
      }
      #${ROOT_ID} .th-index-editor-edit-card-head {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-edit-card-actions,
      #${ROOT_ID} .th-index-editor-edit-card-actions .th-btn {
        width: 100%;
      }
      #${ROOT_ID} .th-index-editor-settings-page {
        gap: 12px;
      }
      #${ROOT_ID} .th-index-editor-settings-block {
        padding: 10px;
        border-radius: 14px;
      }
      #${ROOT_ID} .th-index-editor-month-alias-list {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-index-editor-month-alias-list .th-index-editor-edit-grid {
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
      #${ROOT_ID} .th-mvu-settings-dialog {
        gap: 12px;
        padding: 14px;
      }
      #${ROOT_ID} .th-mvu-settings-dialog .th-managed-worldbook-dialog-summary {
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
      }
      #${ROOT_ID} .th-mvu-settings-dialog .th-managed-worldbook-dialog-summary-item {
        min-height: 0;
        padding: 10px 12px;
      }
      #${ROOT_ID} .th-mvu-path-dialog {
        padding: 14px;
        border-radius: 16px;
      }
      #${ROOT_ID} .th-mvu-path-dialog .th-managed-worldbook-action-row {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-mvu-action-group {
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
        padding: 12px;
      }
      #${ROOT_ID} .th-mvu-action-copy {
        gap: 2px;
      }
      #${ROOT_ID} .th-mvu-action-buttons {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-mvu-action-buttons .th-managed-worldbook-dialog-btn,
      #${ROOT_ID} .th-mvu-close-btn {
        width: 100%;
        min-height: 42px;
      }
      #${ROOT_ID} .th-mvu-maintenance-details > summary {
        grid-template-columns: minmax(0, 1fr);
      }
      #${ROOT_ID} .th-mvu-maintenance-details > summary::after {
        justify-self: start;
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
      #${ROOT_ID} .th-index-editor-dialog > .th-index-editor-footer-actions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
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

      #${ROOT_ID} [data-role="month-grid"] {
        padding: 6px 0 calc(76px + env(safe-area-inset-bottom, 0px)) !important;
        background: color-mix(in srgb, var(--th-surface) 86%, #f7fbff 14%);
      }

      #${ROOT_ID} .th-month-board {
        border-inline: 0;
        border-radius: 0;
        background: color-mix(in srgb, var(--th-surface) 92%, #f7fbff 8%);
        box-shadow: none;
      }

      #${ROOT_ID} .th-week-head {
        min-height: 30px;
        background: transparent;
        border-bottom: 1px solid color-mix(in srgb, var(--th-line) 78%, transparent);
      }

      #${ROOT_ID} .th-week-head > div {
        min-height: 30px;
        padding: 0 1px;
        color: color-mix(in srgb, var(--th-muted) 84%, var(--th-ink) 16%);
        border-right: 1px solid color-mix(in srgb, var(--th-line) 62%, transparent);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
      }

      #${ROOT_ID} .th-week-block {
        border-bottom: 1px solid color-mix(in srgb, var(--th-line) 68%, transparent);
        background: transparent;
      }

      #${ROOT_ID} .th-week-days {
        min-height: calc(40px + var(--th-week-chip-rows) * 18px + 8px) !important;
      }

      #${ROOT_ID} .th-day-cell {
        min-height: 92px;
        padding: 5px 2px 3px;
        border-right: 1px solid color-mix(in srgb, var(--th-line) 62%, transparent);
        background: transparent;
        gap: 0;
      }

      #${ROOT_ID} .th-day-cell.is-muted {
        background: color-mix(in srgb, var(--th-surface-2) 66%, transparent);
      }

      #${ROOT_ID} .th-day-cell.is-selected {
        background: color-mix(in srgb, var(--th-accent-soft) 38%, transparent);
      }

      #${ROOT_ID} .th-day-cell.is-selected::after {
        display: none;
      }

      #${ROOT_ID} .th-day-head {
        min-height: 28px;
        padding: 0 2px;
        align-items: flex-start;
        justify-content: center;
      }

      #${ROOT_ID} .th-day-number {
        width: 28px;
        min-width: 28px;
        height: 28px;
        padding: 0;
        color: color-mix(in srgb, var(--th-ink) 82%, var(--th-muted) 18%);
        font-size: 18px;
        font-weight: 650;
        line-height: 28px;
      }

      #${ROOT_ID} .th-day-cell.is-muted .th-day-number {
        color: color-mix(in srgb, var(--th-muted) 76%, transparent);
      }

      #${ROOT_ID} .th-day-cell.is-today .th-day-number {
        color: #fffaf0;
        background: var(--th-accent);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--th-accent) 20%, transparent);
      }

      #${ROOT_ID} .th-week-chip-grid {
        top: 34px;
        grid-auto-rows: 18px;
        row-gap: 2px;
        padding: 0;
      }

      #${ROOT_ID} .th-week-chip-grid .th-chip,
      #${ROOT_ID} .th-chip {
        height: 18px;
        min-height: 18px;
        padding: 0 4px;
        border-width: 0;
        border-radius: 4px !important;
        box-shadow: none !important;
        gap: 0;
        font-size: 10.5px;
        font-weight: 750;
        line-height: 18px;
        text-shadow: none !important;
      }

      #${ROOT_ID} .th-chip::before {
        display: none !important;
      }

      #${ROOT_ID} .th-week-chip-bar {
        margin: 0 1px;
      }

      #${ROOT_ID} .th-chip.is-continue-left {
        width: calc(100% + 1px);
        margin-left: -1px;
        padding-left: 4px;
      }

      #${ROOT_ID} .th-chip.is-continue-right {
        width: calc(100% + 1px);
        margin-right: -1px;
        padding-right: 4px;
      }

      #${ROOT_ID} .th-chip.is-continue-left.is-continue-right {
        width: calc(100% + 2px);
      }

      #${ROOT_ID} .th-overflow {
        right: 2px;
        top: 2px;
        transform: none;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 999px;
        font-size: 9px;
      }

      #${ROOT_ID} .th-overflow-icon {
        display: none;
      }

      #${ROOT_ID}[data-selected-date='true'][data-tab='detail'] .th-calendar-side {
        height: min(48dvh, 420px) !important;
        max-height: calc(100dvh - 12px) !important;
      }

      #${ROOT_ID} .th-fab-add,
      #${ROOT_ID} .th-fab-list {
        right: 14px;
        left: auto;
        width: 48px;
        height: 48px;
        border-color: color-mix(in srgb, var(--th-line-strong) 74%, transparent);
        background: color-mix(in srgb, var(--th-surface) 94%, transparent);
        color: var(--th-ink);
        box-shadow: 0 8px 18px rgba(40, 27, 13, 0.18);
      }

      #${ROOT_ID} .th-fab-add {
        bottom: calc(14px + env(safe-area-inset-bottom, 0px));
        border-top-color: transparent;
        border-radius: 0 0 14px 14px;
        font-size: 28px;
      }

      #${ROOT_ID} .th-fab-list {
        bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        border-radius: 14px 14px 0 0;
        font-size: 20px;
      }

      #${ROOT_ID}[data-theme='dark'] [data-role="month-grid"],
      #${ROOT_ID}[data-theme='dark'] .th-month-board {
        background: #09111f;
      }

      #${ROOT_ID}[data-theme='dark'] .th-week-head,
      #${ROOT_ID}[data-theme='dark'] .th-week-block {
        border-color: rgba(151, 184, 235, 0.13);
      }

      #${ROOT_ID}[data-theme='dark'] .th-week-head > div,
      #${ROOT_ID}[data-theme='dark'] .th-day-cell {
        border-right-color: rgba(151, 184, 235, 0.11);
      }
    }

`;
