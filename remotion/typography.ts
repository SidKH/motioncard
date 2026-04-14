import type { CSSProperties } from "react";
import { loadFont } from "@remotion/google-fonts/Inter";
import { FRAME_WIDTH } from "@/remotion/constants";

const { fontFamily: titleFontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

/** Shared by `Composition` and the preview overlay so on-canvas and DOM text match. */
export const TITLE_TEXT_STYLE = {
  color: "#fafafa",
  fontFamily: titleFontFamily,
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.25,
  textShadow: "rgba(0, 0, 0, 0.5) 0px 0px 16px",
} as const satisfies CSSProperties;

const TITLE_FONT_AT_REFERENCE_PX = 112;

export function getTitleFontSizeMultiplier(progress0to100: number): number {
  const t = Math.max(0, Math.min(100, progress0to100)) / 100;
  return 0.5 + t;
}

export function getTitleFontSizePx(
  frameWidth: number,
  fontSizeProgress = 50,
): number {
  const base = Math.round(
    (frameWidth * TITLE_FONT_AT_REFERENCE_PX) / FRAME_WIDTH,
  );
  return Math.round(base * getTitleFontSizeMultiplier(fontSizeProgress));
}

/**
 * Preview overlay: same scale as `getTitleFontSizePx` but driven by Player width.
 * A higher floor would make the HTML title larger than the scaled video in a narrow Player.
 */
export function getTitleOverlayFontSizePx(
  displayWidthPx: number,
  fontSizeProgress = 50,
): number {
  const scaled = Math.round(
    (displayWidthPx * TITLE_FONT_AT_REFERENCE_PX) / FRAME_WIDTH,
  );
  const out = Math.round(
    scaled * getTitleFontSizeMultiplier(fontSizeProgress),
  );
  return Math.max(1, out);
}

export const TITLE_PADDING_X_RATIO = 0.1;
export const TITLE_PADDING_Y_RATIO = 0.06;

export function getTitlePaddingPx(
  frameWidth: number,
  frameHeight: number,
): { readonly x: number; readonly y: number } {
  return {
    x: Math.round(frameWidth * TITLE_PADDING_X_RATIO),
    y: Math.round(frameHeight * TITLE_PADDING_Y_RATIO),
  };
}
