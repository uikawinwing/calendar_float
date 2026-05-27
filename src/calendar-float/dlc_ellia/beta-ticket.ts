import {
  CHAT_TICKET_ALPHA_STORE_PATH,
  LEGACY_TICKET_ALPHA_STORE_KEY,
  ROOT_ID,
} from '../constants';
import { formatDateKey, getDaysInMonth, parseWorldDateText } from '../date';
import { getLatestMessageVariableTarget } from '../storage';
import type { CalendarEventRecord } from '../types';

const ELLIA_BETA_TICKET_STYLE_ID = `${ROOT_ID}-dlc-ellia-beta-ticket-style`;
const ELLIA_BETA_TICKET_BOOK_ID_PREFIX = 'dlc-ellia-ticket:';
const ELLIA_CORE_KEY = '系统核心';
const ELLIA_CORE_VALUE = '艾莉亚';
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': String.fromCharCode(38, 97, 109, 112, 59),
  '<': String.fromCharCode(38, 108, 116, 59),
  '>': String.fromCharCode(38, 103, 116, 59),
  '"': String.fromCharCode(38, 113, 117, 111, 116, 59),
  "'": String.fromCharCode(38, 35, 51, 57, 59),
};

interface ElliaAlphaTicketFields {
  title: string;
  color: string;
  date: string;
  place: string;
  macro: string;
  micro: string;
  story: string;
}

interface ElliaAlphaTicketRecord {
  id: string;
  savedAt: string;
  time: string;
  location: string;
  raw: string;
  fields: ElliaAlphaTicketFields;
}

let hasWarnedElliaCoreMismatch = false;

export function ensureElliaBetaTicketStyle(hostDocument: Document): void {
  if (!hostDocument || hostDocument.getElementById(ELLIA_BETA_TICKET_STYLE_ID)) {
    return;
  }

  const style = hostDocument.createElement('style');
  style.id = ELLIA_BETA_TICKET_STYLE_ID;
  style.setAttribute('data-dlc', 'ellia-beta-ticket');
  style.textContent = `
    @import url('https://fontsapi.zeoseven.com/467/main/result.css');
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Noto+Serif+SC:wght@400;500;700&family=Oswald:wght@500&family=Birthstone&family=Bonheur+Royale&family=EB+Garamond:wght@400;500&display=swap');
    @import url('https://fontsapi.zeoseven.com/89/main/result.css');

    #${ROOT_ID} .th-chip.is-ellia-ticket {
      background: #f9f7f1;
      color: #5a524c;
      border: 1px solid #c5a059;
      font-weight: 800;
    }

    #${ROOT_ID} .dlc-ellia-ticket-reader {
      min-height: 0;
    }

    #${ROOT_ID} .dlc-ellia-ticket-reader .th-book-reading-surface {
      overflow: auto;
      padding: 18px;
      background: transparent;
      position: relative;
      contain: layout paint;
    }

    #${ROOT_ID} .dlc-ellia-ticket-reader-stage {
      width: min(100%, 750px);
      max-width: 750px;
      margin: 0 auto;
      position: relative;
      overflow: visible;
      isolation: isolate;
    }

    #${ROOT_ID} .dlc-ellia-ticket-original svg {
      flex: 0 0 auto;
      max-width: none;
      max-height: none;
    }

    #${ROOT_ID} .et-layout-wrap-v9 {
      position: relative;
      width: 100%;
      max-width: 750px;
      margin: 40px auto;
      font-family: 'NanoOldSong-A', 'EB Garamond', 'Noto Serif SC', serif;
      --gold: #c5a059;
      padding-top: 10px;
      box-sizing: content-box;
      color: #5a524c;
    }

    #${ROOT_ID} .et-fold-check-v9,
    #${ROOT_ID} .et-toggle-v9 {
      display: none;
    }

    #${ROOT_ID} .et-fold-spacer {
      height: 0;
      width: 100%;
      transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }

    #${ROOT_ID} .et-fold-check-v9:checked ~ .et-fold-spacer {
      height: 110px;
    }

    #${ROOT_ID} .et-stamp-real-v9 {
      position: absolute !important;
      top: -30px;
      right: -5px;
      z-index: 20;
      cursor: pointer;
      width: 60px !important;
      height: 70px !important;
      min-width: 60px !important;
      min-height: 70px !important;
      max-width: 60px !important;
      max-height: 70px !important;
      background-color: #fdfbf7;
      background-image: radial-gradient(transparent, transparent 50%, #fdfbf7 50%, #fdfbf7);
      background-size: 10px 10px;
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform: rotate(8deg);
      display: flex !important;
      align-items: center;
      justify-content: center;
      padding: 6px;
      box-sizing: border-box;
      overflow: visible;
    }

    #${ROOT_ID} .et-stamp-content {
      width: 100% !important;
      height: 100% !important;
      max-width: 48px !important;
      max-height: 58px !important;
      background: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    #${ROOT_ID} .et-stamp-inner-border {
      width: 90%;
      height: 90%;
      border: 1px dashed rgba(255,255,255,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
      box-sizing: border-box;
      color: #fff;
    }

    #${ROOT_ID} .et-stamp-text {
      font-family: 'Oswald', sans-serif;
      font-size: 8px;
      letter-spacing: 1px;
    }

    #${ROOT_ID} .et-stamp-val {
      font-family: 'Cinzel', serif;
      font-weight: bold;
      font-size: 12px;
    }

    #${ROOT_ID} .et-stamp-icon {
      width: 20px;
      height: 20px;
      max-width: 20px;
      max-height: 20px;
      opacity: 0.9;
      flex: 0 0 20px;
      overflow: hidden;
      display: block;
      line-height: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='%23fff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E");
      background-position: center;
      background-repeat: no-repeat;
      background-size: 20px 20px;
    }

    #${ROOT_ID} .et-stamp-icon > svg,
    #${ROOT_ID} .et-stamp-icon > svg[viewBox] {
      display: block !important;
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      min-height: 20px !important;
      max-width: 20px !important;
      max-height: 20px !important;
      aspect-ratio: 1 / 1 !important;
      overflow: hidden !important;
      transform: none !important;
    }

    #${ROOT_ID} .et-postmark {
      position: absolute;
      width: 50px;
      height: 50px;
      border: 2px solid rgba(40, 40, 40, 0.6);
      border-radius: 50%;
      top: -10px;
      right: -10px;
      pointer-events: none;
      opacity: 0.7;
      transform: rotate(-15deg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: rgba(40, 40, 40, 0.6);
      font-family: 'Courier New', monospace;
      mix-blend-mode: multiply;
    }

    #${ROOT_ID} .et-postmark::after {
      content: 'VOID STATION';
      font-weight: bold;
      text-align: center;
      width: 80%;
    }

    #${ROOT_ID} .et-stamp-real-v9:hover {
      transform: rotate(0) scale(1.1);
      z-index: 25;
    }

    #${ROOT_ID} .et-fold-check-v9:checked + .et-stamp-real-v9 {
      top: 10px;
      right: 50%;
      transform: translateX(50%) rotate(0) scale(1.2);
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
    }

    #${ROOT_ID} .et-fold-check-v9:checked + .et-stamp-real-v9 .et-stamp-content {
      background: #2c3e50;
    }

    #${ROOT_ID} .et-scene-v9 {
      width: 100%;
      -webkit-perspective: 2000px;
      perspective: 2000px;
      user-select: none;
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 2000px;
      opacity: 1;
      transform-origin: top center;
      overflow: visible;
    }

    #${ROOT_ID} .et-fold-check-v9:checked ~ .et-scene-v9 {
      max-height: 0;
      opacity: 0;
      transform: scale(0.95);
      margin: 0;
      padding: 0;
      overflow: hidden;
      pointer-events: none;
    }

    #${ROOT_ID} .et-container-v9 {
      display: flex;
      width: 100%;
      position: relative;
      align-items: stretch;
      cursor: pointer;
      -webkit-transform-style: preserve-3d;
      transform-style: preserve-3d;
    }

    #${ROOT_ID} .et-stub {
      width: 70px;
      flex-shrink: 0;
      background: #ece8e0;
      position: relative;
      z-index: 5;
      display: flex;
      flex-direction: row;
      filter: drop-shadow(2px 0 5px rgba(0,0,0,0.1));
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s;
    }

    #${ROOT_ID} .et-toggle-v9:checked + .et-container-v9 .et-stub {
      opacity: 0;
      transform: translate(-150px, 80px) rotate(-20deg);
      pointer-events: none;
      transition: all 0.6s ease-in 0s;
    }

    #${ROOT_ID} .et-stub-inner {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 25px 0;
      border-left: 4px solid var(--gold);
      border-top: 1px solid #d4d0c7;
      border-bottom: 1px solid #d4d0c7;
      width: 100%;
      box-sizing: border-box;
    }

    #${ROOT_ID} .et-eye-gold {
      width: 36px;
      height: 36px;
      max-width: 36px;
      max-height: 36px;
      margin-bottom: 25px;
      flex-shrink: 0;
      overflow: hidden;
      line-height: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='42' fill='none' stroke='%23c5a059' stroke-width='5'/%3E%3Cpath d='M15 35 L90 20 M50 5 L35 90 M50 5 L65 90 M90 20 L20 80 M15 35 L80 85 M30 55 L25 70' fill='none' stroke='%23c5a059' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-position: center;
      background-repeat: no-repeat;
      background-size: 36px 36px;
    }

    #${ROOT_ID} .et-eye-gold > svg,
    #${ROOT_ID} .et-eye-gold > svg[viewBox] {
      display: block !important;
      width: 36px !important;
      height: 36px !important;
      max-width: 36px !important;
      max-height: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      aspect-ratio: 1 / 1 !important;
      overflow: hidden !important;
      transform: none !important;
    }

    #${ROOT_ID} .et-stub-text {
      display: flex;
      gap: 15px;
      opacity: 0.6;
      flex: 1;
      justify-content: center;
    }

    #${ROOT_ID} .et-v-text {
      writing-mode: vertical-rl;
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      letter-spacing: 2px;
      color: #5a524c;
    }

    #${ROOT_ID} .et-rip-edge {
      width: 12px;
      height: 100%;
      background-image: radial-gradient(circle at 12px 50%, transparent 8px, #ece8e0 9px);
      background-size: 20px 20px;
      background-position: -10px 0;
      margin-right: -12px;
      position: relative;
      z-index: 6;
    }

    #${ROOT_ID} .et-main-wrapper {
      flex: 1;
      display: grid;
      grid-template-areas: 'card';
      -webkit-transform-style: preserve-3d;
      transform-style: preserve-3d;
      transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0s;
    }

    #${ROOT_ID} .et-toggle-v9:checked + .et-container-v9 .et-main-wrapper {
      transform: rotateY(-180deg);
      transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.4s;
    }

    #${ROOT_ID} .et-face {
      grid-area: card;
      position: relative;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      background: #f9f7f1;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border-radius: 0 4px 4px 0;
      display: flex;
      flex-direction: column;
      min-height: 340px;
      width: 100%;
      box-sizing: border-box;
    }

    #${ROOT_ID} .et-front {
      padding: 25px 35px;
      color: #5a524c;
      transform: rotateY(0deg);
    }

    #${ROOT_ID} .et-back {
      transform: rotateY(180deg);
      padding: 40px 50px;
      background: #fcfcfc;
    }

    #${ROOT_ID} .et-french-watermark-v9 {
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Bonheur Royale', cursive;
      font-size: 3.74em;
      font-weight: normal;
      color: var(--theme);
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
      width: auto;
      max-width: 85%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
    }

    #${ROOT_ID} .et-french-title-back-v9 {
      font-family: 'Bonheur Royale', cursive;
      font-size: 2.25em;
      color: #5a524c;
      opacity: 0.4;
      margin-bottom: 20px;
      text-align: center;
    }

    #${ROOT_ID} .et-bg-guilloche {
      position: absolute;
      inset: 0;
      opacity: 0.05;
      background-image: repeating-linear-gradient(45deg, var(--theme) 0, var(--theme) 1px, transparent 1px, transparent 6px);
      pointer-events: none;
      mix-blend-mode: multiply;
    }

    #${ROOT_ID} .et-corner {
      position: absolute;
      width: 35px;
      height: 35px;
      background-size: contain;
      background-repeat: no-repeat;
      opacity: 0.7;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23c5a059' stroke-width='2'%3E%3Cpath d='M2 50 L2 15 Q2 2 15 2 L50 2'/%3E%3Cpath d='M10 50 L10 20 Q10 10 20 10 L50 10' opacity='0.5'/%3E%3Cpath d='M2 25 Q15 25 25 15 Q25 2 25 2'/%3E%3C/svg%3E");
    }

    #${ROOT_ID} .c-tr { top: 0; right: 0; transform: scaleX(-1); }
    #${ROOT_ID} .c-tl { top: 0; left: 0; }
    #${ROOT_ID} .c-br { bottom: 0; right: 0; transform: scale(-1); }
    #${ROOT_ID} .c-bl { bottom: 0; left: 0; transform: scaleY(-1); }

    #${ROOT_ID} .et-journey-header {
      display: flex;
      align-items: flex-end;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 12px;
      margin-bottom: 20px;
      position: relative;
      z-index: 2;
      gap: 10px;
      flex-wrap: wrap;
    }

    #${ROOT_ID} .et-loc-box {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 120px;
    }

    #${ROOT_ID} .et-loc-box.to {
      text-align: right;
      align-items: flex-end;
    }

    #${ROOT_ID} .et-sub-label {
      font-size: 8px;
      letter-spacing: 2px;
      color: #999;
      text-transform: uppercase;
      font-family: 'Oswald', sans-serif;
    }

    #${ROOT_ID} .et-loc-val {
      font-size: 1.1em;
      font-weight: 600;
      color: #5a524c;
    }

    #${ROOT_ID} .et-loc-val.title {
      font-family: 'Cinzel', serif;
      font-size: 1.5em;
      color: var(--theme);
      text-shadow: 1px 1px 0 rgba(0,0,0,0.1);
    }

    #${ROOT_ID} .et-arrow-connector {
      flex: 0 0 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      opacity: 0.5;
      margin-bottom: 5px;
    }

    #${ROOT_ID} .et-line {
      height: 1px;
      flex: 1;
      background: var(--gold);
    }

    #${ROOT_ID} .et-dot {
      width: 4px;
      height: 4px;
      background: var(--gold);
      border-radius: 50%;
    }

    #${ROOT_ID} .et-content-grid {
      flex: 1;
      display: flex;
      gap: 25px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    #${ROOT_ID} .et-col-macro {
      flex: 6 1 300px;
      text-align: justify;
    }

    #${ROOT_ID} .et-col-micro {
      flex: 4 1 200px;
      display: flex;
      flex-direction: column;
    }

    #${ROOT_ID} .et-sect-head {
      font-size: 9px;
      color: var(--theme);
      font-weight: bold;
      margin-bottom: 6px;
      border-left: 3px solid var(--theme);
      padding-left: 6px;
    }

    #${ROOT_ID} .et-text-macro {
      font-size: 0.9em;
      line-height: 1.8;
      color: #5a524c;
      margin: 0;
    }

    #${ROOT_ID} .et-stamp-frame {
      border: 1px solid var(--gold);
      padding: 12px;
      position: relative;
      background: rgba(255,255,255,0.4);
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    #${ROOT_ID} .et-text-micro {
      font-size: 0.9em;
      font-style: italic;
      color: var(--theme);
      line-height: 1.6;
      flex: 1;
      margin: 0;
    }

    #${ROOT_ID} .et-stamp-mark {
      position: absolute;
      bottom: 5px;
      right: 5px;
      border: 1px solid var(--theme);
      color: var(--theme);
      font-size: 9px;
      padding: 2px 4px;
      transform: rotate(-10deg);
      font-family: 'Oswald', sans-serif;
      opacity: 0.6;
    }

    #${ROOT_ID} .et-strip-bottom {
      background: var(--gold);
      color: #fff;
      font-size: 9px;
      letter-spacing: 3px;
      padding: 4px 0;
      text-align: center;
      margin: 0 -35px -25px -35px;
    }

    #${ROOT_ID} .et-notebook-lines {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(#e5e5f0 1px, transparent 1px);
      background-size: 100% 26px;
      margin-top: 40px;
      pointer-events: none;
      opacity: 0.5;
    }

    #${ROOT_ID} .et-handwriting-v9 {
      font-family: 'JyunsaiKaai', cursive;
      font-size: 1.4em;
      line-height: 28px;
      color: #5a524c;
      z-index: 2;
      white-space: pre-wrap;
      margin-bottom: 30px;
      position: relative;
    }

    #${ROOT_ID} .et-signature-v9 {
      margin-top: auto;
      align-self: flex-end;
      font-family: 'Birthstone', cursive;
      font-size: 3.2em;
      color: var(--gold);
      transform: rotate(-5deg);
      position: relative;
      z-index: 2;
    }

    #${ROOT_ID} .et-loc-val.title,
    #${ROOT_ID} .et-sect-head,
    #${ROOT_ID} .et-text-micro,
    #${ROOT_ID} .et-stamp-mark {
      color: var(--theme-safe, var(--theme));
      border-color: var(--theme-safe, var(--theme));
    }

    #${ROOT_ID} .et-french-watermark-v9 {
      color: var(--theme-soft, var(--theme-safe, var(--theme)));
    }

    #${ROOT_ID} .et-stamp-mark {
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.04);
    }

    @media (max-width: 600px) {
      #${ROOT_ID} .et-container-v9 { flex-direction: column; }
      #${ROOT_ID} .et-stub {
        width: 100%;
        height: 60px;
        border-right: none;
        border-bottom: 2px dashed #ccc;
        border-left: none;
        border-top: 3px solid var(--gold);
        padding: 0 20px;
        box-sizing: border-box;
      }
      #${ROOT_ID} .et-stub-inner {
        flex-direction: row;
        padding: 0;
        justify-content: space-between;
        border: none;
      }
      #${ROOT_ID} .et-eye-gold { margin: 0; width: 30px; height: 30px; }
      #${ROOT_ID} .et-v-text { writing-mode: horizontal-tb; }
      #${ROOT_ID} .et-rip-edge { display: none; }
      #${ROOT_ID} .et-main-wrapper {
        width: 100%;
        min-height: 480px;
        display: grid;
        grid-template-areas: 'card';
      }
      #${ROOT_ID} .et-face {
        min-height: 100%;
        width: 100%;
        border-radius: 0 0 4px 4px;
      }
      #${ROOT_ID} .et-toggle-v9:checked + .et-container-v9 .et-stub {
        transform: translateY(-60px);
        opacity: 0;
      }
      #${ROOT_ID} .et-toggle-v9:checked + .et-container-v9 .et-main-wrapper {
        transform: rotateY(-180deg);
      }
      #${ROOT_ID} .et-stamp-real-v9 {
        top: 45px;
        right: 10px;
        transform: rotate(20deg);
        z-index: 30;
      }
      #${ROOT_ID} .et-french-watermark-v9 {
        font-size: 2.72em;
        top: 20px;
        white-space: normal;
        line-height: 1.1;
      }
    }
  `;
  hostDocument.head.appendChild(style);
}

function readChatVariables(): Record<string, unknown> {
  try {
    return getVariables({ type: 'chat' }) || {};
  } catch (error) {
    console.warn('[CalendarFloat][DLC:Ellia] 读取聊天变量失败', error);
    return {};
  }
}

function readLatestMessageVariables(): Record<string, unknown> {
  const target = getLatestMessageVariableTarget();
  if (!target) {
    return {};
  }
  try {
    return getVariables(target) || {};
  } catch (error) {
    console.warn('[CalendarFloat][DLC:Ellia] 读取最新消息变量失败', error);
    return {};
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asText(value: unknown): string {
  return String(value ?? '').trim();
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, key) => (isPlainRecord(current) ? current[key] : undefined), source);
}

function escapeElliaHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char] || char);
}

function toSafeDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 72) || 'ticket';
}

function normalizeSafeHexColor(value: unknown): string {
  const text = asText(value);
  const shortHex = text.match(/^#?([0-9a-fA-F]{3})$/);
  if (shortHex) {
    return `#${shortHex[1]
      .split('')
      .map(char => `${char}${char}`)
      .join('')}`;
  }

  const longHex = text.match(/^#?([0-9a-fA-F]{6})$/);
  if (longHex) {
    return `#${longHex[1]}`;
  }

  return '#8f5fc8';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractRawField(raw: string, field: string, nextFields: string[]): string {
  const escapedField = escapeRegExp(field);
  const nextPattern = nextFields.map(escapeRegExp).join('|');
  const pattern = nextPattern
    ? new RegExp(`${escapedField}::\\s*([\\s\\S]*?)(?=\\s+(?:${nextPattern})::|\\s*\\[/Ticket\\]|$)`, 'i')
    : new RegExp(`${escapedField}::\\s*([\\s\\S]*?)(?=\\s*\\[/Ticket\\]|$)`, 'i');
  return asText(raw.match(pattern)?.[1]);
}

function parseRawTicketFields(raw: string): ElliaAlphaTicketFields {
  return {
    title: extractRawField(raw, 'Title', ['Color', 'Date', 'Place', 'Macro', 'Micro', 'Story']),
    color: extractRawField(raw, 'Color', ['Date', 'Place', 'Macro', 'Micro', 'Story']),
    date: extractRawField(raw, 'Date', ['Place', 'Macro', 'Micro', 'Story']),
    place: extractRawField(raw, 'Place', ['Macro', 'Micro', 'Story']),
    macro: extractRawField(raw, 'Macro', ['Micro', 'Story']),
    micro: extractRawField(raw, 'Micro', ['Story']),
    story: extractRawField(raw, 'Story', []),
  };
}

function stableFallbackTicketId(value: Record<string, unknown>): string {
  const seed = [value.savedAt, value.time, value.location, value.raw].map(asText).join('|');
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ellia_ticket_${(hash >>> 0).toString(36)}`;
}

function sanitizeTicketRecord(value: unknown): ElliaAlphaTicketRecord | null {
  if (!isPlainRecord(value)) {
    return null;
  }

  const raw = asText(value.raw);
  const rawFields = raw ? parseRawTicketFields(raw) : null;
  const sourceFields = isPlainRecord(value.fields) ? value.fields : {};
  const fields: ElliaAlphaTicketFields = {
    title: asText(sourceFields.title) || rawFields?.title || '未命名票券',
    color: asText(sourceFields.color) || rawFields?.color || '#8f5fc8',
    date: asText(sourceFields.date) || rawFields?.date || '',
    place: asText(sourceFields.place) || rawFields?.place || '',
    macro: asText(sourceFields.macro) || rawFields?.macro || '',
    micro: asText(sourceFields.micro) || rawFields?.micro || '',
    story: asText(sourceFields.story) || rawFields?.story || '',
  };

  return {
    id: asText(value.id) || stableFallbackTicketId(value),
    savedAt: asText(value.savedAt),
    time: asText(value.time),
    location: asText(value.location),
    raw,
    fields,
  };
}

function readElliaTicketRecords(chatVariables: Record<string, unknown>): ElliaAlphaTicketRecord[] {
  const store = getByPath(chatVariables, CHAT_TICKET_ALPHA_STORE_PATH) ?? chatVariables[LEGACY_TICKET_ALPHA_STORE_KEY];
  if (!isPlainRecord(store) || !isPlainRecord(store.tickets)) {
    return [];
  }

  return Object.values(store.tickets)
    .map(sanitizeTicketRecord)
    .filter((ticket): ticket is ElliaAlphaTicketRecord => !!ticket)
    .sort((left, right) => left.savedAt.localeCompare(right.savedAt));
}

function warnElliaTicketCoreMismatchIfNeeded(variableSources: Record<string, unknown>[], ticketsCount: number): void {
  if (hasWarnedElliaCoreMismatch || ticketsCount <= 0 || variableSources.some(isElliaDlcUnlocked)) {
    return;
  }
  hasWarnedElliaCoreMismatch = true;
  const coreValue = variableSources.map(source => asText(source[ELLIA_CORE_KEY])).find(Boolean) || '未设置';
  toastr.warning(
    `检测到艾莉亚票券，但「系统核心」目前是「${coreValue}」。请检查 core 是否应为 Ellia / 艾莉亚。`,
    '月历悬浮球',
  );
}

function readElliaTicketRuntimeState(): { unlocked: boolean; tickets: ElliaAlphaTicketRecord[] } {
  const variableSources = [readChatVariables(), readLatestMessageVariables()];
  const ticketsById = new Map<string, ElliaAlphaTicketRecord>();
  variableSources.flatMap(readElliaTicketRecords).forEach(ticket => {
    ticketsById.set(ticket.id, ticket);
  });
  const tickets = [...ticketsById.values()].sort((left, right) => left.savedAt.localeCompare(right.savedAt));
  warnElliaTicketCoreMismatchIfNeeded(variableSources, tickets.length);
  return {
    unlocked: tickets.length > 0 || variableSources.some(isElliaDlcUnlocked),
    tickets,
  };
}

function parseFullTicketDate(ticket: ElliaAlphaTicketRecord) {
  return parseWorldDateText(ticket.time) || parseWorldDateText(ticket.fields.date) || parseWorldDateText(ticket.raw);
}

function parseTicketMonthDayText(value: unknown): { month: number; day: number } | null {
  const text = asText(value);
  if (!text) {
    return null;
  }

  const match =
    text.match(/^(\d{1,2})[-/月](\d{1,2})日?$/) ||
    text.match(/(?:^|[^\d])(\d{1,2})[-/月](\d{1,2})日?(?!\d)/);
  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!Number.isFinite(month) || month < 1 || month > 12 || !Number.isFinite(day) || day < 1 || day > 31) {
    return null;
  }
  return { month, day };
}

function parseTicketMonthDay(ticket: ElliaAlphaTicketRecord): { month: number; day: number } | null {
  return parseTicketMonthDayText(ticket.time) || parseTicketMonthDayText(ticket.fields.date) || parseTicketMonthDayText(ticket.raw);
}

function getYearFromDateKey(dateKey: string): number | null {
  const match = String(dateKey || '').match(/^(\d+)-\d{2}-\d{2}$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function buildTicketMonthDayDateKey(monthDay: { month: number; day: number }, year: number): string {
  return formatDateKey({
    year,
    month: monthDay.month,
    day: Math.min(monthDay.day, getDaysInMonth(year, monthDay.month)),
  });
}

function resolveTicketDateKey(ticket: ElliaAlphaTicketRecord, anchorDateKey = ''): string {
  const parsed = parseFullTicketDate(ticket);
  if (parsed) {
    return formatDateKey(parsed);
  }

  const monthDay = parseTicketMonthDay(ticket);
  const year = getYearFromDateKey(anchorDateKey);
  return monthDay && year ? buildTicketMonthDayDateKey(monthDay, year) : '';
}

function resolveTicketDateKeyForTargets(ticket: ElliaAlphaTicketRecord, dateKeys: string[], targetKeys: Set<string>): string {
  const parsed = parseFullTicketDate(ticket);
  if (parsed) {
    const dateKey = formatDateKey(parsed);
    return targetKeys.has(dateKey) ? dateKey : '';
  }

  const monthDay = parseTicketMonthDay(ticket);
  if (!monthDay) {
    return '';
  }

  for (const targetKey of dateKeys) {
    const year = getYearFromDateKey(targetKey);
    if (!year) {
      continue;
    }
    const dateKey = buildTicketMonthDayDateKey(monthDay, year);
    if (targetKeys.has(dateKey)) {
      return dateKey;
    }
  }
  return '';
}

function isElliaDlcUnlocked(chatVariables: Record<string, unknown>): boolean {
  return asText(chatVariables[ELLIA_CORE_KEY]) === ELLIA_CORE_VALUE;
}

export function isElliaBetaTicketBookId(bookId: string): boolean {
  return String(bookId || '').startsWith(ELLIA_BETA_TICKET_BOOK_ID_PREFIX);
}

function toElliaBetaTicketBookId(ticketId: string): string {
  return `${ELLIA_BETA_TICKET_BOOK_ID_PREFIX}${encodeURIComponent(ticketId)}`;
}

function getElliaBetaTicketRecordsForDate(dateKey: string): ElliaAlphaTicketRecord[] {
  if (!dateKey) {
    return [];
  }
  const runtimeState = readElliaTicketRuntimeState();
  if (!runtimeState.unlocked) {
    return [];
  }
  return runtimeState.tickets.filter(ticket => resolveTicketDateKey(ticket, dateKey) === dateKey);
}

function fromElliaBetaTicketBookId(bookId: string): string {
  if (!isElliaBetaTicketBookId(bookId)) {
    return '';
  }
  try {
    return decodeURIComponent(bookId.slice(ELLIA_BETA_TICKET_BOOK_ID_PREFIX.length));
  } catch (_) {
    return bookId.slice(ELLIA_BETA_TICKET_BOOK_ID_PREFIX.length);
  }
}

function renderElliaTicketEntry(ticket: ElliaAlphaTicketRecord): string {
  const title = ticket.fields.title || '艾莉亚票券';
  const date = ticket.fields.date || ticket.time || '未知日期';
  const place = ticket.fields.place || ticket.location || '未知地点';
  const bookId = toElliaBetaTicketBookId(ticket.id);
  return `<article class="th-detail-card is-active" data-action="open-book" data-book-id="${escapeElliaHtml(bookId)}"><div class="th-item-top"><div class="th-item-title-wrap"><div class="th-item-title">${escapeElliaHtml(title)}</div></div></div><div class="th-detail-summary">${escapeElliaHtml(date)} · ${escapeElliaHtml(place)}</div><div class="th-item-tags"><span>DLC</span><span>Ellia</span><span>票券</span></div><div class="th-detail-books"><button type="button" class="th-book-link" data-action="open-book" data-book-id="${escapeElliaHtml(bookId)}">查看票券正文</button></div></article>`;
}

export function buildElliaBetaTicketCalendarEventsForMonth(dateKeys: string[]): CalendarEventRecord[] {
  const targetKeys = new Set(dateKeys.filter(Boolean));
  if (!targetKeys.size) {
    return [];
  }

  const runtimeState = readElliaTicketRuntimeState();
  if (!runtimeState.unlocked) {
    return [];
  }

  return runtimeState.tickets
    .map(ticket => ({ ticket, dateKey: resolveTicketDateKeyForTargets(ticket, dateKeys, targetKeys) }))
    .filter(({ dateKey }) => targetKeys.has(dateKey))
    .map(({ ticket, dateKey }): CalendarEventRecord => {
      const [yearText, monthText, dayText] = dateKey.split('-');
      const point = { year: Number(yearText), month: Number(monthText), day: Number(dayText) };
      return {
        id: `ellia-ticket-chip-${ticket.id}`,
        title: ticket.fields.title || '艾莉亚票券',
        content: '艾莉亚票券',
        startText: ticket.time || ticket.fields.date || dateKey,
        endText: ticket.time || ticket.fields.date || dateKey,
        repeatRule: '无',
        type: '临时',
        source: 'active',
        range: { start: point, end: point },
        tags: ['DLC', 'Ellia', '票券'],
        allDay: true,
        relatedBookIds: [],
        metadata: { dlc: 'ellia', ticketId: ticket.id },
        color: {
          background: '#ead7ff',
          text: '#5d2e91',
          border: '#b98fe8',
        },
      };
    });
}

function renderElliaBetaTicket(ticket: ElliaAlphaTicketRecord, index: number, reader = false): string {
  const fields = ticket.fields;
  const theme = normalizeSafeHexColor(fields.color);
  const title = fields.title || '未命名票券';
  const date = fields.date || ticket.time || '未知日期';
  const place = fields.place || ticket.location || '未知地点';
  const domId = `ellia-beta-${index}-${toSafeDomId(ticket.id)}`;
  const rootClass = `et-layout-wrap-v9 dlc-ellia-ticket-original${reader ? ' is-reader' : ''}`;

  return `<div class="${rootClass}" style="--theme:${escapeElliaHtml(theme)};--theme-safe:${escapeElliaHtml(theme)};--theme-soft:${escapeElliaHtml(theme)}"><input type="checkbox" id="et-fold-${escapeElliaHtml(domId)}" class="et-fold-check-v9"><label class="et-stamp-real-v9" for="et-fold-${escapeElliaHtml(domId)}" title="Fold/Unfold"><div class="et-stamp-content"><div class="et-stamp-inner-border"><span class="et-stamp-text">TICKET</span><span class="et-stamp-val">50¢</span><div class="et-stamp-icon" aria-hidden="true"></div></div></div><div class="et-postmark"></div></label><div class="et-scene-v9"><input type="checkbox" id="et-flip-${escapeElliaHtml(domId)}" class="et-toggle-v9"><label class="et-container-v9" for="et-flip-${escapeElliaHtml(domId)}"><div class="et-stub"><div class="et-stub-inner"><div class="et-eye-gold" aria-hidden="true"></div><div class="et-stub-text"><span class="et-v-text">${escapeElliaHtml(date)}</span><span class="et-v-text">NO.617</span></div></div><div class="et-rip-edge"></div></div><div class="et-main-wrapper"><div class="et-face et-front"><div class="et-french-watermark-v9">Die unendliche Geschichte</div><div class="et-bg-guilloche"></div><div class="et-corner c-tl"></div><div class="et-corner c-tr"></div><div class="et-corner c-bl"></div><div class="et-corner c-br"></div><div class="et-journey-header"><div class="et-loc-box from"><span class="et-sub-label">DEPARTURE / 出发地</span><span class="et-loc-val">${escapeElliaHtml(place)}</span></div><div class="et-arrow-connector"><div class="et-line"></div><div class="et-dot"></div><div class="et-line"></div></div><div class="et-loc-box to"><span class="et-sub-label">DESTINATION / 抵达</span><span class="et-loc-val title">${escapeElliaHtml(title)}</span></div></div><div class="et-content-grid"><div class="et-col-macro"><div class="et-sect-head">ATMOSPHERE</div><p class="et-text-macro">${escapeElliaHtml(fields.macro || '（暂无氛围记录）')}</p></div><div class="et-col-micro"><div class="et-stamp-frame"><div class="et-sect-head">SPECTACLE · 奇观</div><p class="et-text-micro">${escapeElliaHtml(fields.micro || '（暂无奇观记录）')}</p><div class="et-stamp-mark">OBSERVED</div></div></div></div><div class="et-strip-bottom">ELLIA'S FATE LINE · PASSENGER: user · CLASS: DREAMER</div></div><div class="et-face et-back"><div class="et-notebook-lines"></div><div class="et-french-title-back-v9">Tu, was du willst</div><div class="et-handwriting-v9">${escapeElliaHtml(fields.story || '（暂无手记）')}</div><div class="et-signature-v9">— Ellia</div></div></div></label><div class="et-import-toast-v9" aria-live="polite"></div></div><div class="et-fold-spacer"></div></div>`;
}

export function renderElliaBetaTicketBookView(bookId: string): string {
  const ticketId = fromElliaBetaTicketBookId(bookId);
  const runtimeState = readElliaTicketRuntimeState();
  const tickets = runtimeState.unlocked ? runtimeState.tickets : [];
  const ticket = tickets.find(item => item.id === ticketId) ?? null;
  if (!ticket) {
    return `<article class="th-book-main-card dlc-ellia-ticket-reader"><div class="th-book-main-head"><div class="th-book-main-title-wrap"><div class="th-month-title">艾莉亚票券</div><div class="th-month-subtitle">票券不存在或 DLC 未解锁</div></div><button type="button" class="th-btn th-book-return-btn" data-action="close-book-reader">返回日期详情</button></div><div class="th-empty">无法读取这张票券。</div></article>`;
  }

  const title = ticket.fields.title || '未命名票券';
  return `<article class="th-book-main-card dlc-ellia-ticket-reader"><div class="th-book-main-head"><div class="th-book-main-title-wrap"><div class="th-month-title">${escapeElliaHtml(title)}</div><div class="th-month-subtitle">艾莉亚票券正文 · Beta Ticket Render</div></div><button type="button" class="th-btn th-book-return-btn" data-action="close-book-reader">返回日期详情</button></div><section class="th-book-reading-surface" aria-label="${escapeElliaHtml(title)}"><div class="dlc-ellia-ticket-reader-stage">${renderElliaBetaTicket(ticket, 0, true)}</div></section></article>`;
}

export function renderElliaBetaTicketAddOnForDate(dateKey: string): string {
  if (!dateKey) {
    return '';
  }

  const tickets = getElliaBetaTicketRecordsForDate(dateKey);
  if (!tickets.length) {
    return '';
  }

  return `<section class="th-side-section" aria-label="艾莉亚票券回忆">${tickets.map(renderElliaTicketEntry).join('')}</section>`;
}
