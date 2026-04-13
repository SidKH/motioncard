import { AbsoluteFill, useVideoConfig } from "remotion";
import { LightRays } from "@/remotion/LightRays";
import { TitleStripSilk } from "@/remotion/TitleStripSilk";
import { SmokePillar } from "@/remotion/SmokePillar";
import {
  getTitleFontSizePx,
  getTitlePaddingPx,
  TITLE_COLOR,
  TITLE_FONT_FAMILY,
  TITLE_FONT_WEIGHT,
  TITLE_LETTER_SPACING,
  TITLE_LINE_HEIGHT,
  TITLE_TEXT_SHADOW,
} from "@/remotion/typography";

/** Shared metadata for Player + renderMediaOnWeb */
export const COMPOSITION = {
  id: "motioncard-composition",
  width: 1920,
  height: 1080,
  fps: 30,
  /** Silk uses `phase = 2π·frame/duration` → seamless loop for any duration ≥ 1. */
  durationInFrames: 300,
} as const;

export type BackgroundId = "silk" | "smoke" | "rays";

export type CompositionProps = {
  readonly text: string;
  /** 0–100; 50 = default scale (see `getTitleFontSizeMultiplier`). */
  readonly fontSizeProgress?: number;
  /** Animated background behind the title. */
  readonly background?: BackgroundId;
  /** Preview-only: skip drawing title when an HTML overlay shows the same text. */
  readonly hideTitle?: boolean;
};

export const COMPOSITION_DEFAULT_PROPS: CompositionProps = {
  text: "Hello world",
  fontSizeProgress: 50,
  background: "silk",
};

export function Composition({
  text,
  fontSizeProgress = 50,
  background = "silk",
  hideTitle,
}: CompositionProps) {
  const { width, height } = useVideoConfig();
  const pad = getTitlePaddingPx(width, height);

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
      ) : background === "rays" ? (
        <LightRays widthPx={width} heightPx={height} />
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
              color: TITLE_COLOR,
              fontFamily: TITLE_FONT_FAMILY,
              fontSize: getTitleFontSizePx(width, fontSizeProgress),
              fontWeight: TITLE_FONT_WEIGHT,
              letterSpacing: TITLE_LETTER_SPACING,
              lineHeight: TITLE_LINE_HEIGHT,
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              maxHeight: "100%",
              overflow: "hidden",
              textShadow: TITLE_TEXT_SHADOW,
            }}
          >
            {text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
