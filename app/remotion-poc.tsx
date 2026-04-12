"use client";

import { Player } from "@remotion/player";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  POC_COMPOSITION,
  POC_COMPOSITION_DEFAULT_PROPS,
  PocComposition,
} from "@/remotion/composition";

export function RemotionPoc() {
  const [text, setText] = useState(POC_COMPOSITION_DEFAULT_PROPS.text);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [lastVideoUrl, setLastVideoUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const lastVideoBlobUrlRef = useRef<string | null>(null);
  const lastVideoBlobRef = useRef<Blob | null>(null);

  const revokeLastUrl = useCallback(() => {
    if (lastVideoBlobUrlRef.current) {
      URL.revokeObjectURL(lastVideoBlobUrlRef.current);
      lastVideoBlobUrlRef.current = null;
    }
    lastVideoBlobRef.current = null;
    setLastVideoUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (lastVideoBlobUrlRef.current) {
        URL.revokeObjectURL(lastVideoBlobUrlRef.current);
        lastVideoBlobUrlRef.current = null;
      }
    };
  }, []);

  const handleCopyVideo = useCallback(async () => {
    const blob = lastVideoBlobRef.current;
    if (!blob) return;
    try {
      const type = blob.type || "video/mp4";
      await navigator.clipboard.write([
        new ClipboardItem({
          [type]: blob,
        }),
      ]);
      setCopyFeedback("copied");
      window.setTimeout(() => setCopyFeedback("idle"), 2000);
    } catch {
      setCopyFeedback("error");
      window.setTimeout(() => setCopyFeedback("idle"), 2500);
    }
  }, []);

  const handleRender = async () => {
    setError(null);
    setCopyFeedback("idle");
    revokeLastUrl();
    setProgress(0);
    setIsRendering(true);
    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: POC_COMPOSITION.id,
          component: PocComposition,
          defaultProps: POC_COMPOSITION_DEFAULT_PROPS,
          durationInFrames: POC_COMPOSITION.durationInFrames,
          fps: POC_COMPOSITION.fps,
          width: POC_COMPOSITION.width,
          height: POC_COMPOSITION.height,
          calculateMetadata: null,
        },
        inputProps: { text },
        onProgress: ({ progress: p }) => setProgress(p),
      });
      const blob = await getBlob();
      lastVideoBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      lastVideoBlobUrlRef.current = url;
      setLastVideoUrl(url);
      setProgress(1);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setProgress(null);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Preview
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Remotion Player (same composition as client-side render).
        </p>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Text
          </span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-500 dark:focus:border-zinc-500"
            placeholder="Enter on-screen text"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-black shadow-sm dark:border-zinc-800">
          <Player
            component={PocComposition}
            inputProps={{ text }}
            durationInFrames={POC_COMPOSITION.durationInFrames}
            fps={POC_COMPOSITION.fps}
            compositionWidth={POC_COMPOSITION.width}
            compositionHeight={POC_COMPOSITION.height}
            loop
            autoPlay
            acknowledgeRemotionLicense
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Client-side render
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Uses <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">renderMediaOnWeb</code>{" "}
          from <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">@remotion/web-renderer</code>
          . Requires WebCodecs (Chrome 94+, Firefox 130+, Safari 26+).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRender}
            disabled={isRendering}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isRendering ? "Rendering…" : "Render video in browser"}
          </button>
          {progress !== null && !error && (
            <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
              {Math.round(progress * 100)}%
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {lastVideoUrl && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Rendered output
            </p>
            <video
              className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800"
              src={lastVideoUrl}
              controls
            />
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleCopyVideo}
                className="inline-flex w-fit text-sm font-medium text-orange-600 underline-offset-4 hover:underline dark:text-orange-400"
              >
                {copyFeedback === "copied"
                  ? "Copied to clipboard"
                  : copyFeedback === "error"
                    ? "Copy not supported"
                    : "Copy"}
              </button>
              <a
                href={lastVideoUrl}
                download="remotion-poc.mp4"
                className="inline-flex w-fit text-sm font-medium text-orange-600 underline-offset-4 hover:underline dark:text-orange-400"
              >
                Download MP4
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
