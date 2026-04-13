import { AbsoluteFill, useVideoConfig } from "remotion";
import { TitleStripSilk } from "@/remotion/TitleStripSilk";
import { SmokePillar } from "@/remotion/SmokePillar";
import {
  getPocTitleFontSizePx,
  getPocTitlePaddingPx,
  POC_TITLE_COLOR,
  POC_TITLE_FONT_FAMILY,
  POC_TITLE_FONT_WEIGHT,
  POC_TITLE_LETTER_SPACING,
  POC_TITLE_LINE_HEIGHT,
  POC_TITLE_TEXT_SHADOW,
} from "@/remotion/pocTitleTypography";

/** Shared metadata for Player + renderMediaOnWeb */
export const POC_COMPOSITION = {
  id: "poc-composition",
  width: 1920,
  height: 1080,
  fps: 30,
  /** Silk uses `phase = 2π·frame/duration` → seamless loop for any duration ≥ 1. */
  durationInFrames: 300,
} as const;

export type PocBackgroundId = "silk" | "smoke";

export type PocCompositionProps = {
  readonly text: string;
  /** 0–100; 50 = default scale (see `getPocTitleFontSizeMultiplier`). */
  readonly fontSizeProgress?: number;
  /** Animated background behind the title. */
  readonly background?: PocBackgroundId;
  /** Preview-only: skip drawing title when an HTML overlay shows the same text. */
  readonly hideTitle?: boolean;
};

export const POC_COMPOSITION_DEFAULT_PROPS: PocCompositionProps = {
  text: "Hello world",
  fontSizeProgress: 50,
  background: "silk",
};

export function PocComposition({
  text,
  fontSizeProgress = 50,
  background = "silk",
  hideTitle,
}: PocCompositionProps) {
  const { width, height } = useVideoConfig();
  const pad = getPocTitlePaddingPx(width, height);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {background === "smoke" ? (
        <SmokePillar widthPx={width} heightPx={height} />
      ) : (
        <TitleStripSilk gridCellPx={72} widthPx={width} heightPx={height} />
      )}
      {!hideTitle && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
            padding: `${pad.y}px ${pad.x}px`,
          }}
        >
          <div
            style={{
              color: POC_TITLE_COLOR,
              fontFamily: POC_TITLE_FONT_FAMILY,
              fontSize: getPocTitleFontSizePx(width, fontSizeProgress),
              fontWeight: POC_TITLE_FONT_WEIGHT,
              letterSpacing: POC_TITLE_LETTER_SPACING,
              lineHeight: POC_TITLE_LINE_HEIGHT,
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              maxHeight: "100%",
              overflow: "hidden",
              textShadow: POC_TITLE_TEXT_SHADOW,
            }}
          >
            {text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
