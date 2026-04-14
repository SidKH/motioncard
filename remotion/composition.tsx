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

// Kept in sync with Player and renderMediaOnWeb (shared duration, dimensions, fps).
export const COMPOSITION = {
  id: "motioncard-composition",
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  fps: 60,
  // Backgrounds read this via useVideoConfig; phase maps first/last frame so each loop is seamless.
  durationInFrames: 600,
} as const;

export type BackgroundId = "silk" | "smoke" | "rays";

export type CompositionProps = {
  readonly text: string;
  // 0–100; 50 matches the default in getTitleFontSizeMultiplier.
  readonly fontSizeProgress?: number;
  readonly background?: BackgroundId;
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
