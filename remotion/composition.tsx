import { AbsoluteFill, useVideoConfig } from "remotion";
import { FRAME_HEIGHT, FRAME_WIDTH } from "@/remotion/constants";
import { Rays } from "@/remotion/backgrounds/Rays";
import { Silk } from "@/remotion/backgrounds/Silk";
import { Smoke } from "@/remotion/backgrounds/Smoke";
import {
  getTitleFontSizePx,
  getTitlePaddingPx,
  TITLE_TEXT_STYLE,
} from "@/remotion/typography";

/** Shared metadata for Player + renderMediaOnWeb */
export const COMPOSITION = {
  id: "motioncard-composition",
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  fps: 60,
  /** Silk uses `phase = 2π·frame/duration` → seamless loop for any duration ≥ 1. */
  durationInFrames: 600,
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
        <Smoke widthPx={width} heightPx={height} />
      ) : background === "rays" ? (
        <Rays widthPx={width} heightPx={height} />
      ) : (
        <Silk gridCellPx={72} widthPx={width} heightPx={height} />
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
              ...TITLE_TEXT_STYLE,
              fontSize: getTitleFontSizePx(width, fontSizeProgress),
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              maxWidth: "100%",
              maxHeight: "100%",
              overflow: "hidden",
            }}
          >
            {text}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
