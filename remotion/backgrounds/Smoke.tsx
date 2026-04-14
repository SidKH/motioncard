import {
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Muted gray top tint — dim highlight so the smoke column stays subtle. */
const DEFAULT_TOP_RGB: readonly [number, number, number] = [
  39 / 255,
  39 / 255,
  42 / 255,
];

/** Black — base stays as dark as possible. */
const DEFAULT_BOTTOM_RGB: readonly [number, number, number] = [0, 0, 0];

const STEP_MULT = 1.12;
const MAX_ITER = 56;
const WAVE_ITER = 3;

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 vUv;

void main() {
  vUv = vec2(a_position.x * 0.5 + 0.5, -a_position.y * 0.5 + 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_ES
/* mediump angles lose precision near 2π and cause a visible seam on looped clips. */
precision highp float;
#endif

varying vec2 vUv;

uniform float uPhase;
uniform vec2 uResolution;
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform float uIntensity;
uniform float uGlowAmount;
uniform float uPillarWidth;
uniform float uPillarHeight;
uniform float uNoiseIntensity;
uniform float uRotCos;
uniform float uRotSin;
uniform float uPillarRotCos;
uniform float uPillarRotSin;
uniform float uWaveSin;
uniform float uWaveCos;

const float STEP_MULT = ${STEP_MULT.toFixed(1)};
const int MAX_ITER = ${MAX_ITER};
const int WAVE_ITER = ${WAVE_ITER};

float tanh1(float x) {
  float c = clamp(x, -10.0, 10.0);
  float e2x = exp(2.0 * c);
  return (e2x - 1.0) / (e2x + 1.0);
}

vec3 tanh3(vec3 v) {
  return vec3(tanh1(v.x), tanh1(v.y), tanh1(v.z));
}

void main() {
  vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
  uv = vec2(
    uPillarRotCos * uv.x - uPillarRotSin * uv.y,
    uPillarRotSin * uv.x + uPillarRotCos * uv.y
  );

  vec3 ro = vec3(0.0, 0.0, -10.0);
  vec3 rd = normalize(vec3(uv, 1.0));

  float rotC = uRotCos;
  float rotS = uRotSin;

  vec3 col = vec3(0.0);
  float t = 0.1;

  for (int i = 0; i < MAX_ITER; i++) {
    vec3 p = ro + rd * t;
    p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

    vec3 q = p;
    // Keep phase out of q.y: sin(q.y * k + uPhase) would mix non-integer phase weights and break 2π loops.
    q.y = p.y * uPillarHeight;

    float freq = 1.0;
    float amp = 1.0;
    for (int j = 0; j < WAVE_ITER; j++) {
      q.xz = vec2(
        uWaveCos * q.x - uWaveSin * q.z,
        uWaveSin * q.x + uWaveCos * q.z
      );
      q += cos(q.zxy * freq - uPhase * float(j) * 2.0) * amp;
      freq *= 2.0;
      amp *= 0.48;
    }

    // Slow billow: use p for fractional scales + integer uPhase only (see q.y note above).
    vec2 billow = vec2(
      sin(p.y * uPillarHeight * 0.22 + uPhase * 1.0) + 0.45 * sin(dot(p.xz, vec2(0.74, 0.91)) + uPhase * 2.0),
      cos(p.y * uPillarHeight * 0.19 - uPhase * 1.0) + 0.4 * cos(dot(p.xz, vec2(-0.88, 0.67)) - uPhase * 2.0)
    );
    float fine = 0.16 * sin(dot(p.xz, vec2(1.7, -1.2)) + uPhase * 2.0 + p.y * uPillarHeight * 0.35);
    float d = length(cos(q.xz + billow * 0.28 + fine)) - 0.22;
    float bound = length(p.xz) - uPillarWidth;
    float k = 4.0;
    float h = max(k - abs(d - bound), 0.0);
    d = max(d, bound) + h * h * 0.0625 / k;
    // Softer falloff = more in-scattering along the ray (reads as thicker smoke).
    d = pow(abs(d) * 0.17 + 0.012, 0.72);

    float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
    vec3 smokeCol = mix(uBottomColor, uTopColor, grad);

    // Core column
    col += smokeCol / d;

    // Wide soft haze: extra volumetric fill outside the tight SDF (more "smoke in the air").
    float r = length(p.xz);
    float haze = exp(-pow(r / max(uPillarWidth * 2.1, 0.01), 2.0));
    haze *= 0.22 + 0.14 * sin(p.y * 0.28 + uPhase * 1.0)
      + 0.1 * sin(dot(p.xz, vec2(0.63, -0.77)) + uPhase * 2.0);
    float dHaze = pow(abs(0.42 + 0.11 * sin(p.y * uPillarHeight * 0.31 + dot(p.xz, vec2(0.4, 0.5)) + uPhase * 1.0)), 0.88);
    col += smokeCol * haze / max(dHaze, 0.035);

    t += d * STEP_MULT;
    if (t > 58.0) break;
  }

  float widthNorm = uPillarWidth / 3.0;
  col = tanh3(col * uGlowAmount / widthNorm);

  col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;

  gl_FragColor = vec4(col * uIntensity, 1.0);
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
  uTopColor: WebGLUniformLocation | null;
  uBottomColor: WebGLUniformLocation | null;
  uIntensity: WebGLUniformLocation | null;
  uGlowAmount: WebGLUniformLocation | null;
  uPillarWidth: WebGLUniformLocation | null;
  uPillarHeight: WebGLUniformLocation | null;
  uNoiseIntensity: WebGLUniformLocation | null;
  uRotCos: WebGLUniformLocation | null;
  uRotSin: WebGLUniformLocation | null;
  uPillarRotCos: WebGLUniformLocation | null;
  uPillarRotSin: WebGLUniformLocation | null;
  uWaveSin: WebGLUniformLocation | null;
  uWaveCos: WebGLUniformLocation | null;
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
  const uTopColor = gl.getUniformLocation(program, "uTopColor");
  const uBottomColor = gl.getUniformLocation(program, "uBottomColor");
  const uIntensity = gl.getUniformLocation(program, "uIntensity");
  const uGlowAmount = gl.getUniformLocation(program, "uGlowAmount");
  const uPillarWidth = gl.getUniformLocation(program, "uPillarWidth");
  const uPillarHeight = gl.getUniformLocation(program, "uPillarHeight");
  const uNoiseIntensity = gl.getUniformLocation(program, "uNoiseIntensity");
  const uRotCos = gl.getUniformLocation(program, "uRotCos");
  const uRotSin = gl.getUniformLocation(program, "uRotSin");
  const uPillarRotCos = gl.getUniformLocation(program, "uPillarRotCos");
  const uPillarRotSin = gl.getUniformLocation(program, "uPillarRotSin");
  const uWaveSin = gl.getUniformLocation(program, "uWaveSin");
  const uWaveCos = gl.getUniformLocation(program, "uWaveCos");

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
    uTopColor,
    uBottomColor,
    uIntensity,
    uGlowAmount,
    uPillarWidth,
    uPillarHeight,
    uNoiseIntensity,
    uRotCos,
    uRotSin,
    uPillarRotCos,
    uPillarRotSin,
    uWaveSin,
    uWaveCos,
  };
}

const TWO_PI = 2 * Math.PI;

/**
 * Phase in [0, 2π] over the composition so the last frame matches the first when looped.
 * Any `sin(phase * k)` / `cos(phase * k)` (in JS or GLSL) must use **integer** `k`, or the
 * endpoints disagree and the loop will jump.
 * Do not fold `uPhase` into coordinates that are later scaled by non-integers inside sin/cos.
 */
function pillarPhase(frame: number, durationInFrames: number): number {
  const n = Math.max(1, durationInFrames);
  if (n === 1) return 0;
  if (frame <= 0) return 0;
  if (frame >= n - 1) return TWO_PI;
  return (frame / (n - 1)) * TWO_PI;
}

function drawPillarCpuFallback(
  canvas: HTMLCanvasElement,
  bw: number,
  bh: number,
  frame: number,
  durationInFrames: number,
): void {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const phase = pillarPhase(frame, durationInFrames);
  const shift = 0.04 * Math.sin(phase);
  /** Bottom-left → top-right (canvas y grows downward). */
  const g = ctx.createLinearGradient(0, bh, bw, 0);
  const [tr, tg, tb] = DEFAULT_TOP_RGB;
  const [br, bg, bb] = DEFAULT_BOTTOM_RGB;
  g.addColorStop(
    Math.min(1, Math.max(0, 0.35 + shift)),
    `rgb(${Math.round(br * 255)}, ${Math.round(bg * 255)}, ${Math.round(bb * 255)})`,
  );
  g.addColorStop(
    Math.min(1, Math.max(0, 0.85 + shift)),
    `rgb(${Math.round(tr * 255)}, ${Math.round(tg * 255)}, ${Math.round(tb * 255)})`,
  );
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, bw, bh);
}

const WAVE_ANGLE = 0.4;
/** Extra swirl so the column reads less like a rigid beam and more like drifting smoke. */
const WAVE_ANGLE_WOBBLE = 0.22;

export function Smoke({
  widthPx,
  heightPx,
  visibleOpacity = 1,
  topRgb = DEFAULT_TOP_RGB,
  bottomRgb = DEFAULT_BOTTOM_RGB,
  intensity = 0.68,
  glowAmount = 0.0042,
  pillarWidth = 3.6,
  pillarHeight = 0.4,
  noiseIntensity = 0.62,
  pillarRotationDeg,
}: {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly visibleOpacity?: number;
  readonly topRgb?: readonly [number, number, number];
  readonly bottomRgb?: readonly [number, number, number];
  readonly intensity?: number;
  readonly glowAmount?: number;
  readonly pillarWidth?: number;
  readonly pillarHeight?: number;
  readonly noiseIntensity?: number;
  /** Omit to align the pillar with the bottom-left → top-right diagonal for the current size. */
  readonly pillarRotationDeg?: number;
}) {
  const effectivePillarRotationDeg =
    pillarRotationDeg ??
    (Math.atan2(heightPx, widthPx) * 180) / Math.PI;

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<GlResources | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender());

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

      const ctx = glRef.current;
      const phase = pillarPhase(frame, durationInFrames);
      const pillarRotRad = (effectivePillarRotationDeg * Math.PI) / 180;

      if (ctx) {
        const {
          gl,
          program,
          uPhase,
          uResolution,
          uTopColor,
          uBottomColor,
          uIntensity,
          uGlowAmount,
          uPillarWidth,
          uPillarHeight,
          uNoiseIntensity,
          uRotCos,
          uRotSin,
          uPillarRotCos,
          uPillarRotSin,
          uWaveSin,
          uWaveCos,
        } = ctx;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);

        if (uPhase) gl.uniform1f(uPhase, phase);
        if (uResolution) gl.uniform2f(uResolution, bw, bh);
        if (uTopColor) gl.uniform3f(uTopColor, topRgb[0], topRgb[1], topRgb[2]);
        if (uBottomColor)
          gl.uniform3f(uBottomColor, bottomRgb[0], bottomRgb[1], bottomRgb[2]);
        if (uIntensity) gl.uniform1f(uIntensity, intensity);
        if (uGlowAmount) gl.uniform1f(uGlowAmount, glowAmount);
        if (uPillarWidth) gl.uniform1f(uPillarWidth, pillarWidth);
        if (uPillarHeight) gl.uniform1f(uPillarHeight, pillarHeight);
        if (uNoiseIntensity) gl.uniform1f(uNoiseIntensity, noiseIntensity);
        if (uRotCos) gl.uniform1f(uRotCos, Math.cos(phase));
        if (uRotSin) gl.uniform1f(uRotSin, Math.sin(phase));
        if (uPillarRotCos) gl.uniform1f(uPillarRotCos, Math.cos(pillarRotRad));
        if (uPillarRotSin) gl.uniform1f(uPillarRotSin, Math.sin(pillarRotRad));
        const waveAngle =
          WAVE_ANGLE + WAVE_ANGLE_WOBBLE * Math.sin(phase);
        if (uWaveSin) gl.uniform1f(uWaveSin, Math.sin(waveAngle));
        if (uWaveCos) gl.uniform1f(uWaveCos, Math.cos(waveAngle));

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        drawPillarCpuFallback(canvas, bw, bh, frame, durationInFrames);
      }
    } finally {
      continueRender(handle);
    }
  }, [
    bottomRgb,
    continueRender,
    durationInFrames,
    frame,
    glowAmount,
    handle,
    heightPx,
    intensity,
    noiseIntensity,
    pillarHeight,
    effectivePillarRotationDeg,
    pillarWidth,
    topRgb,
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
