import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Shared metadata for Player + renderMediaOnWeb */
/** 20s at 30fps */
export const POC_COMPOSITION = {
  id: "poc-composition",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 600,
} as const;

/** How many full 360° turns happen over the whole clip */
const FULL_ROTATIONS = 12;

/**
 * Square spins continuously (linear angle) so many full rotations are visible.
 */
export function PocComposition() {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  /** Same visual ratio as the old 72px square on a 320px-wide canvas */
  const squareSize = Math.round((width * 72) / 320);

  const rotation = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [0, 360 * FULL_ROTATIONS],
    {
      easing: Easing.linear,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: squareSize,
          height: squareSize,
          backgroundColor: "#f97316",
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </AbsoluteFill>
  );
}
