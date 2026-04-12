import { AbsoluteFill, useVideoConfig } from "remotion";
import { TitleStripSilk } from "@/remotion/TitleStripSilk";

/** Shared metadata for Player + renderMediaOnWeb */
/** 20s at 30fps */
export const POC_COMPOSITION = {
  id: "poc-composition",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 600,
} as const;

/** Tailwind `zinc-50` */
const ZINC_50 = "#fafafa";

export function PocComposition() {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TitleStripSilk gridCellPx={72} widthPx={width} heightPx={height} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: ZINC_50,
          fontFamily: "system-ui, sans-serif",
          fontSize: Math.max(56, Math.round((width * 112) / 1920)),
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
      >
        Hello world
      </div>
    </AbsoluteFill>
  );
}
