import type { CSSProperties } from "react";

/** space between the text and its looping copy */
export const MARQUEE_GAP_PX = 48;
const SPEED_PX_PER_S = 38;
// share of each loop spent resting at the start (matches the keyframes)
const REST_SHARE = 0.18;

const EDGE_MASK =
  "linear-gradient(to right, transparent 0px, black 8px, black calc(100% - 16px), transparent 100%)";
const END_MASK =
  "linear-gradient(to right, black 0px, black calc(100% - 14px), transparent 100%)";

/** fade for text that overflows but is not scrolling right now */
export const OVERFLOW_MASK: CSSProperties = {
  maskImage: END_MASK,
  WebkitMaskImage: END_MASK,
};

/**
 * styles for a `.marquee-track` that scrolls right to left and loops: the track
 * holds the text plus a copy `MARQUEE_GAP_PX` behind it, so one loop moves it
 * by exactly one text width + gap and the copy lands where the text started
 */
export function marqueeStyles(contentWidth: number): {
  host: CSSProperties;
  track: CSSProperties;
} {
  const distance = contentWidth + MARQUEE_GAP_PX;
  const durationMs = ((distance / SPEED_PX_PER_S) * 1000) / (1 - REST_SHARE);
  return {
    host: { maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK },
    track: {
      "--marquee-distance": `-${distance}px`,
      "--marquee-duration": `${Math.round(durationMs)}ms`,
    } as CSSProperties,
  };
}
