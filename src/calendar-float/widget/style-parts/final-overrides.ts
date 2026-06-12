import { ROOT_ID } from '../../constants';

export const CALENDAR_WIDGET_FINAL_OVERRIDE_STYLE = `
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
