import {
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** zinc-400 — soft ray tint on dark ground. */
const DEFAULT_RAYS_RGB: readonly [number, number, number] = [
  161 / 255,
  161 / 255,
  170 / 255,
];

/** Overall ray brightness multiplier (below 1 dims the effect). */
const RAYS_INTENSITY = 0.72;

const TWO_PI = 2 * Math.PI;

export type LightRaysOrigin =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

function getAnchorAndDir(
  origin: LightRaysOrigin,
  w: number,
  h: number,
): { anchor: [number, number]; dir: [number, number] } {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h], dir: [0, 1] };
    case "top-right":
      return { anchor: [w, -outside * h], dir: [0, 1] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case "bottom-center":
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default:
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
}

/**
 * Phase in [0, 2π] over the composition so the last frame matches the first when looped.
 * Use only `sin(uPhase * k)` / `cos(uPhase * k)` with **integer** k in the shader (see SmokePillar).
 */
function raysPhase(frame: number, durationInFrames: number): number {
  const n = Math.max(1, durationInFrames);
  if (n === 1) return 0;
  if (frame <= 0) return 0;
  if (frame >= n - 1) return TWO_PI;
  return (frame / (n - 1)) * TWO_PI;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uPhase;
uniform vec2  uResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform float noiseAmount;
uniform float distortion;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uIntensity;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(uPhase * 2.0 + length(sourceToCoord) * 0.01) * 0.2;

  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = uResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);

  float fadeFalloff = clamp((uResolution.x * fadeDistance - distance) / (uResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(uPhase * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + uPhase * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + uPhase * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 coord = vec2(fragCoord.x, uResolution.y - fragCoord.y);

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, rayDir, coord, 36.2214, 21.11349, uSpeed1);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, uSpeed2);

  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / uResolution.y);
  vec3 zincHi = vec3(0.88, 0.88, 0.90);
  vec3 zincLo = vec3(0.42, 0.42, 0.46);
  vec3 zincMix = mix(zincLo, zincHi, brightness);
  fragColor.rgb *= zincMix * raysColor;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= uIntensity;
  gl_FragColor = fragColor;
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

type GlResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uPhase: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  rayPos: WebGLUniformLocation | null;
  rayDir: WebGLUniformLocation | null;
  raysColor: WebGLUniformLocation | null;
  lightSpread: WebGLUniformLocation | null;
  rayLength: WebGLUniformLocation | null;
  pulsating: WebGLUniformLocation | null;
  fadeDistance: WebGLUniformLocation | null;
  saturation: WebGLUniformLocation | null;
  noiseAmount: WebGLUniformLocation | null;
  distortion: WebGLUniformLocation | null;
  uSpeed1: WebGLUniformLocation | null;
  uSpeed2: WebGLUniformLocation | null;
  uIntensity: WebGLUniformLocation | null;
};

function getWebglContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const opts = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  };
  return canvas.getContext("webgl", opts) as WebGLRenderingContext | null;
}

function initGlResources(canvas: HTMLCanvasElement): GlResources | null {
  const gl = getWebglContext(canvas);
  if (!gl) return null;

  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  const aPosition = gl.getAttribLocation(program, "a_position");

  const uPhase = gl.getUniformLocation(program, "uPhase");
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const rayPos = gl.getUniformLocation(program, "rayPos");
  const rayDir = gl.getUniformLocation(program, "rayDir");
  const raysColor = gl.getUniformLocation(program, "raysColor");
  const lightSpread = gl.getUniformLocation(program, "lightSpread");
  const rayLength = gl.getUniformLocation(program, "rayLength");
  const pulsating = gl.getUniformLocation(program, "pulsating");
  const fadeDistance = gl.getUniformLocation(program, "fadeDistance");
  const saturation = gl.getUniformLocation(program, "saturation");
  const noiseAmount = gl.getUniformLocation(program, "noiseAmount");
  const distortion = gl.getUniformLocation(program, "distortion");
  const uSpeed1 = gl.getUniformLocation(program, "uSpeed1");
  const uSpeed2 = gl.getUniformLocation(program, "uSpeed2");
  const uIntensity = gl.getUniformLocation(program, "uIntensity");

  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);

  return {
    gl,
    program,
    buffer,
    uPhase,
    uResolution,
    rayPos,
    rayDir,
    raysColor,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    noiseAmount,
    distortion,
    uSpeed1,
    uSpeed2,
    uIntensity,
  };
}

function drawRaysCpuFallback(
  canvas: HTMLCanvasElement,
  bw: number,
  bh: number,
  phase: number,
): void {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const g = ctx.createRadialGradient(
    bw * 0.5,
    -bh * 0.15,
    0,
    bw * 0.5,
    bh * 0.5,
    Math.max(bw, bh) * 0.9,
  );
  const pulse = 0.75 + 0.25 * Math.sin(phase * 2);
  g.addColorStop(0, `rgba(161, 161, 170, ${0.22 * pulse * RAYS_INTENSITY})`);
  g.addColorStop(0.45, `rgba(63, 63, 70, ${0.06 * pulse * RAYS_INTENSITY})`);
  g.addColorStop(1, "rgb(9, 9, 11)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, bw, bh);
}

export function LightRays({
  widthPx,
  heightPx,
  visibleOpacity = 1,
  raysOrigin = "top-center",
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1,
  saturation = 0.92,
  noiseAmount = 0.06,
  distortion = 0,
  raysRgb = DEFAULT_RAYS_RGB,
}: {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly visibleOpacity?: number;
  readonly raysOrigin?: LightRaysOrigin;
  readonly raysSpeed?: number;
  readonly lightSpread?: number;
  readonly rayLength?: number;
  readonly pulsating?: boolean;
  readonly fadeDistance?: number;
  readonly saturation?: number;
  readonly noiseAmount?: number;
  readonly distortion?: number;
  readonly raysRgb?: readonly [number, number, number];
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GlResources | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender());

  const speedInt = Math.max(1, Math.round(raysSpeed));
  /** Integer scales so `sin(uPhase * k)` loops with the composition (see `raysPhase`). */
  const layer1Speed = Math.max(1, Math.round(1.5 * speedInt));
  const layer2Speed = Math.max(1, Math.round(1.1 * speedInt));

  useLayoutEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const bw = Math.max(1, Math.floor(widthPx));
      const bh = Math.max(1, Math.floor(heightPx));

      canvas.style.width = `${bw}px`;
      canvas.style.height = `${bh}px`;

      const sizeChanged = canvas.width !== bw || canvas.height !== bh;
      if (sizeChanged) {
        canvas.width = bw;
        canvas.height = bh;
        glRef.current = null;
      }

      if (!glRef.current) {
        glRef.current = initGlResources(canvas);
      }

      const phase = raysPhase(frame, durationInFrames);
      const { anchor, dir } = getAnchorAndDir(raysOrigin, bw, bh);

      const ctx = glRef.current;
      if (ctx) {
        const {
          gl,
          program,
          uPhase,
          uResolution,
          rayPos: uRayPos,
          rayDir: uRayDir,
          raysColor,
          lightSpread: uLightSpread,
          rayLength: uRayLength,
          pulsating: uPulsating,
          fadeDistance: uFadeDist,
          saturation: uSat,
          noiseAmount: uNoise,
          distortion: uDistort,
          uSpeed1: uS1,
          uSpeed2: uS2,
          uIntensity: uInt,
        } = ctx;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);

        if (uPhase) gl.uniform1f(uPhase, phase);
        if (uResolution) gl.uniform2f(uResolution, bw, bh);
        if (uRayPos) gl.uniform2f(uRayPos, anchor[0], anchor[1]);
        if (uRayDir) gl.uniform2f(uRayDir, dir[0], dir[1]);
        if (raysColor) gl.uniform3f(raysColor, raysRgb[0], raysRgb[1], raysRgb[2]);
        if (uLightSpread) gl.uniform1f(uLightSpread, lightSpread);
        if (uRayLength) gl.uniform1f(uRayLength, rayLength);
        if (uPulsating) gl.uniform1f(uPulsating, pulsating ? 1 : 0);
        if (uFadeDist) gl.uniform1f(uFadeDist, fadeDistance);
        if (uSat) gl.uniform1f(uSat, saturation);
        if (uNoise) gl.uniform1f(uNoise, noiseAmount);
        if (uDistort) gl.uniform1f(uDistort, distortion);
        if (uS1) gl.uniform1f(uS1, layer1Speed);
        if (uS2) gl.uniform1f(uS2, layer2Speed);
        if (uInt) gl.uniform1f(uInt, RAYS_INTENSITY);

        gl.clearColor(9 / 255, 9 / 255, 11 / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        drawRaysCpuFallback(canvas, bw, bh, phase);
      }
    } finally {
      continueRender(handle);
    }
  }, [
    continueRender,
    distortion,
    durationInFrames,
    fadeDistance,
    frame,
    handle,
    heightPx,
    lightSpread,
    noiseAmount,
    pulsating,
    rayLength,
    raysOrigin,
    raysRgb,
    saturation,
    layer1Speed,
    layer2Speed,
    widthPx,
  ]);

  useEffect(() => {
    return () => {
      const ctx = glRef.current;
      if (!ctx) return;
      const { gl, program, buffer } = ctx;
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
      glRef.current = null;
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-0 overflow-hidden"
      aria-hidden
      style={{
        opacity: visibleOpacity,
        width: widthPx,
        height: heightPx,
      }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
