import { loadFont } from "@remotion/google-fonts/Inter";

/** Must match `POC_COMPOSITION.width` in composition.tsx */
export const POC_TITLE_FRAME_WIDTH = 1920;

/** Tailwind `zinc-50` — must match title in PocComposition */
export const POC_TITLE_COLOR = "#fafafa";

/** Soft halo for legibility on busy backgrounds (Player + rendered output). */
export const POC_TITLE_TEXT_SHADOW = "rgba(0, 0, 0, 0.5) 0px 0px 16px";

const { fontFamily: pocTitleFontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

/** Inter (Google Fonts), loaded for Remotion + preview overlay. */
export const POC_TITLE_FONT_FAMILY = pocTitleFontFamily;
export const POC_TITLE_FONT_WEIGHT = 400;
export const POC_TITLE_LETTER_SPACING = "-0.02em";

const TITLE_FONT_AT_REFERENCE_PX = 112;
const TITLE_FONT_MIN_PX = 56;

/** Slider 0–100: 0.5× … 1.0× … 1.5× (50 = default). */
export function getPocTitleFontSizeMultiplier(
  progress0to100: number,
): number {
  const t = Math.max(0, Math.min(100, progress0to100)) / 100;
  return 0.5 + t;
}

/**
 * Title size inside the Remotion frame (composition coordinates).
 * Uses a minimum so tiny frame widths stay readable in templates.
 */
export function getPocTitleFontSizePx(
  frameWidth: number,
  fontSizeProgress = 50,
): number {
  const base = Math.round(
    (frameWidth * TITLE_FONT_AT_REFERENCE_PX) / POC_TITLE_FRAME_WIDTH,
  );
  const scaled = Math.round(base * getPocTitleFontSizeMultiplier(fontSizeProgress));
  return Math.max(TITLE_FONT_MIN_PX, scaled);
}

/**
 * CSS font size for the preview overlay: matches “112px at 1920-wide frame” scaled
 * down by how wide the Player is on screen. No composition min — otherwise the
 * overlay stops shrinking below ~960px and looks larger than the scaled video.
 */
export function getPocTitleOverlayFontSizePx(
  displayWidthPx: number,
  fontSizeProgress = 50,
): number {
  const scaled = Math.round(
    (displayWidthPx * TITLE_FONT_AT_REFERENCE_PX) / POC_TITLE_FRAME_WIDTH,
  );
  const out = Math.round(scaled * getPocTitleFontSizeMultiplier(fontSizeProgress));
  return Math.max(1, out);
}

/** Horizontal / vertical padding around the title (10% width, 6% height). */
export const POC_TITLE_PADDING_X_RATIO = 0.1;
export const POC_TITLE_PADDING_Y_RATIO = 0.06;

export function getPocTitlePaddingPx(
  frameWidth: number,
  frameHeight: number,
): { readonly x: number; readonly y: number } {
  return {
    x: Math.round(frameWidth * POC_TITLE_PADDING_X_RATIO),
    y: Math.round(frameHeight * POC_TITLE_PADDING_Y_RATIO),
  };
}

/** Keeps multi-line title blocks readable and aligned with the overlay. */
export const POC_TITLE_LINE_HEIGHT = 1.25;
