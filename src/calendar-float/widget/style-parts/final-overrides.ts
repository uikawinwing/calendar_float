import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_FINAL_OVERRIDE_STYLE = `
    #${ROOT_ID} .th-calendar-side {
      grid-template-rows: 52px 50px minmax(0, 1fr) !important;
    }

    #${ROOT_ID} .th-side-head {
      grid-row: 1 !important;
      grid-column: 1 / -1 !important;
      min-height: 52px !important;
      height: 52px !important;
      padding: 0 154px 0 18px !important;
      display: flex !important;
      align-items: center !important;
      border-bottom: 0 !important;
      background: transparent !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 3 !important;
    }

    #${ROOT_ID} .th-side-head-copy {
      display: flex !important;
      align-items: center !important;
      min-height: 52px !important;
      height: 52px !important;
    }

    #${ROOT_ID} .th-side-title {
      line-height: 1 !important;
      transform: translateY(1px);
    }

    #${ROOT_ID} .th-sidebar-tabs {
      grid-row: 2 !important;
      grid-column: 1 / -1 !important;
      min-height: 50px !important;
      height: 50px !important;
      padding: 5px 16px !important;
      display: grid !important;
      grid-template-columns: minmax(118px, 1fr) minmax(92px, 0.85fr) 40px 40px !important;
      gap: 10px !important;
      align-items: center !important;
      border-bottom: 1px solid rgba(155, 128, 84, 0.1) !important;
      position: relative !important;
      z-index: 2 !important;
    }

    #${ROOT_ID} .th-side-body {
      grid-row: 3 !important;
      grid-column: 1 / -1 !important;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-tab-button,
    #${ROOT_ID} .th-sidebar-tabs .th-side-search-btn,
    #${ROOT_ID} .th-sidebar-tabs .th-tab-add-button {
      height: 40px !important;
      min-height: 40px !important;
      align-self: center !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #${ROOT_ID} .th-sidebar-tabs .th-side-search-btn,
    #${ROOT_ID} .th-sidebar-tabs .th-tab-add-button {
      width: 40px !important;
      min-width: 40px !important;
      padding: 0 !important;
      flex: 0 0 40px !important;
    }

    @media (max-width: 980px) {
      #${ROOT_ID} .th-calendar-side {
        grid-template-rows: auto auto minmax(0, 1fr) !important;
      }

      #${ROOT_ID} .th-side-head {
        grid-row: auto !important;
        grid-column: auto !important;
        min-height: 62px !important;
        height: auto !important;
        padding: 22px 14px 10px !important;
        border-bottom: 1px solid rgba(155, 128, 84, 0.12) !important;
        pointer-events: auto !important;
        z-index: 1 !important;
      }

      #${ROOT_ID} .th-side-head-copy {
        min-height: 0 !important;
        height: auto !important;
      }

      #${ROOT_ID} .th-sidebar-tabs {
        grid-row: auto !important;
        grid-column: auto !important;
        min-height: 0 !important;
        height: auto !important;
        padding: 10px 12px !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 40px 40px !important;
      }

      #${ROOT_ID} .th-side-body {
        grid-row: auto !important;
        grid-column: auto !important;
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
