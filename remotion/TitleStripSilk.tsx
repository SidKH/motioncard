import {
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Tailwind `zinc-800` — darker silk sheen so white title text stays readable. */
const SILK_TINT_RGB: readonly [number, number, number] = [
  39 / 255,
  39 / 255,
  42 / 255,
];

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = vec3(a_position, 0.0);
  vUv = vec2(a_position.x * 0.5 + 0.5, -a_position.y * 0.5 + 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;
varying vec3 vPosition;

uniform float uPhi;
uniform vec3  uColor;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float phi        = uPhi;

  tex.y += 0.038 * sin(8.0 * tex.x - phi);
  tex.x += 0.028 * sin(7.0 * tex.y + phi);

  float inner = 5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y)) +
                sin(20.0 * (tex.x + tex.y));
  float pattern = 0.6 + 0.4 * sin(inner + phi);

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
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
  uPhi: WebGLUniformLocation | null;
  uColor: WebGLUniformLocation | null;
  uScale: WebGLUniformLocation | null;
  uRotation: WebGLUniformLocation | null;
  uNoiseIntensity: WebGLUniformLocation | null;
};

function getWebglContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const opts = {
    alpha: false,
    antialias: false,
    premultipliedAlpha: false,
    /**
     * Required for Remotion / Puppeteer screenshots: the default drawing buffer is cleared
     * after compositing, so still/video frames often capture an empty canvas.
     */
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
  const uPhi = gl.getUniformLocation(program, "uPhi");
  const uColor = gl.getUniformLocation(program, "uColor");
  const uScale = gl.getUniformLocation(program, "uScale");
  const uRotation = gl.getUniformLocation(program, "uRotation");
  const uNoiseIntensity = gl.getUniformLocation(program, "uNoiseIntensity");

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
    uPhi,
    uColor,
    uScale,
    uRotation,
    uNoiseIntensity,
  };
}

const E = Math.E;

/**
 * Phase [0, 2π] over the composition: first and last frames are the same point on the circle
 * (φ = 2π ≡ 0), so every `sin(· ± φ)` in the shader loops with zero seam.
 */
function silkPhi(frame: number, durationInFrames: number): number {
  const n = Math.max(1, durationInFrames);
  if (n === 1) return 0;
  return (frame / (n - 1)) * (2 * Math.PI);
}

function silkRotation(phi: number): number {
  return 0.12 + 0.04 * Math.sin(phi);
}

function fract(x: number): number {
  return x - Math.floor(x);
}

/** Same `noise(vec2)` as the fragment shader (uses GL-style `fragX` / `fragY`). */
function noiseGlFrag(fragX: number, fragY: number): number {
  const G = E;
  const rx = G * Math.sin(G * fragX);
  const ry = G * Math.sin(G * fragY);
  return fract(rx * ry * (1 + fragX));
}

function rotateUvs(
  uvX: number,
  uvY: number,
  angle: number,
): { x: number; y: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: c * uvX - s * uvY,
    y: s * uvX + c * uvY,
  };
}

/**
 * Software raster when WebGL is unavailable — same sampling as the fragment shader (full resolution).
 */
function drawSilkCpu(
  canvas: HTMLCanvasElement,
  bw: number,
  bh: number,
  frame: number,
  gridCellPx: number,
  durationInFrames: number,
): void {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const img = ctx.createImageData(bw, bh);
  const phi = silkPhi(frame, durationInFrames);
  const uScale = 0.85 + Math.min(0.35, gridCellPx / 72) * 0.25;
  const uRotation = silkRotation(phi);
  const uNoiseIntensity = 1.1;
  const [cr, cg, cb] = SILK_TINT_RGB;

  for (let iy = 0; iy < bh; iy++) {
    for (let ix = 0; ix < bw; ix++) {
      const px = ix;
      const py = iy;
      const vUvX = (px + 0.5) / bw;
      const vUvY = (py + 0.5) / bh;
      const fragX = px + 0.5;
      const fragY = bh - py - 0.5;

      const rnd = noiseGlFrag(fragX, fragY);
      const scaledX = vUvX * uScale;
      const scaledY = vUvY * uScale;
      const uv = rotateUvs(scaledX, scaledY, uRotation);
      let texX = uv.x * uScale;
      let texY = uv.y * uScale;
      texY += 0.038 * Math.sin(8.0 * texX - phi);
      texX += 0.028 * Math.sin(7.0 * texY + phi);

      const inner =
        5.0 * (texX + texY + Math.cos(3.0 * texX + 5.0 * texY)) +
        Math.sin(20.0 * (texX + texY));
      const pattern = 0.6 + 0.4 * Math.sin(inner + phi);

      let r = cr * pattern - (rnd / 15.0) * uNoiseIntensity;
      let g = cg * pattern - (rnd / 15.0) * uNoiseIntensity;
      let b = cb * pattern - (rnd / 15.0) * uNoiseIntensity;
      r = Math.min(1, Math.max(0, r));
      g = Math.min(1, Math.max(0, g));
      b = Math.min(1, Math.max(0, b));

      const i = (iy * bw + ix) * 4;
      img.data[i] = Math.round(r * 255);
      img.data[i + 1] = Math.round(g * 255);
      img.data[i + 2] = Math.round(b * 255);
      img.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
}

/**
 * Animated silk shader behind intro title strips — same math as a R3F `ShaderMaterial`
 * plane, driven deterministically by composition frame (no `requestAnimationFrame`).
 */
export function TitleStripSilk({
  gridCellPx,
  widthPx,
  heightPx,
  visibleOpacity = 1,
}: {
  readonly gridCellPx: number;
  /** Drawable area (matches intro strip inner box; DOM measurement is unreliable in Remotion). */
  readonly widthPx: number;
  readonly heightPx: number;
  readonly visibleOpacity?: number;
}) {
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

      /** Backing store = composition pixels (Remotion shader docs — no `devicePixelRatio`). */
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
      if (ctx) {
        const {
          gl,
          program,
          uPhi,
          uColor,
          uScale,
          uRotation,
          uNoiseIntensity,
        } = ctx;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);

        const phi = silkPhi(frame, durationInFrames);
        const scale = 0.85 + Math.min(0.35, gridCellPx / 72) * 0.25;
        const rotation = silkRotation(phi);

        if (uPhi) gl.uniform1f(uPhi, phi);
        if (uColor)
          gl.uniform3f(
            uColor,
            SILK_TINT_RGB[0],
            SILK_TINT_RGB[1],
            SILK_TINT_RGB[2],
          );
        if (uScale) gl.uniform1f(uScale, scale);
        if (uRotation) gl.uniform1f(uRotation, rotation);
        if (uNoiseIntensity) gl.uniform1f(uNoiseIntensity, 1.1);

        gl.clearColor(9 / 255, 9 / 255, 11 / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        drawSilkCpu(canvas, bw, bh, frame, gridCellPx, durationInFrames);
      }
    } finally {
      continueRender(handle);
    }
  }, [
    continueRender,
    durationInFrames,
    frame,
    gridCellPx,
    heightPx,
    handle,
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
