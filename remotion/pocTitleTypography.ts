/** Must match `POC_COMPOSITION.width` in composition.tsx */
export const POC_TITLE_FRAME_WIDTH = 1920;

/** Tailwind `zinc-50` — must match title in PocComposition */
export const POC_TITLE_COLOR = "#fafafa";

export const POC_TITLE_FONT_FAMILY = "system-ui, sans-serif";
export const POC_TITLE_FONT_WEIGHT = 400;
export const POC_TITLE_LETTER_SPACING = "-0.02em";

const TITLE_FONT_AT_REFERENCE_PX = 112;
const TITLE_FONT_MIN_PX = 56;

/**
 * Title size inside the Remotion frame (composition coordinates).
 * Uses a minimum so tiny frame widths stay readable in templates.
 */
export function getPocTitleFontSizePx(frameWidth: number): number {
  return Math.max(
    TITLE_FONT_MIN_PX,
    Math.round((frameWidth * TITLE_FONT_AT_REFERENCE_PX) / POC_TITLE_FRAME_WIDTH),
  );
}

/**
 * CSS font size for the preview overlay: matches “112px at 1920-wide frame” scaled
 * down by how wide the Player is on screen. No composition min — otherwise the
 * overlay stops shrinking below ~960px and looks larger than the scaled video.
 */
export function getPocTitleOverlayFontSizePx(displayWidthPx: number): number {
  const scaled = Math.round(
    (displayWidthPx * TITLE_FONT_AT_REFERENCE_PX) / POC_TITLE_FRAME_WIDTH,
  );
  return Math.max(1, scaled);
}

/** Horizontal / vertical padding around the title (fraction of frame width / height). */
export const POC_TITLE_PADDING_X_RATIO = 0.05;
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
