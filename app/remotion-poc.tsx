"use client";

import { renderMediaOnWeb } from "@remotion/web-renderer";
import { useCallback, useEffect, useRef, useState } from "react";
import { PocPreviewWithOverlay } from "@/app/poc-preview-with-overlay";
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
  const lastVideoBlobUrlRef = useRef<string | null>(null);

  const revokeLastUrl = useCallback(() => {
    if (lastVideoBlobUrlRef.current) {
      URL.revokeObjectURL(lastVideoBlobUrlRef.current);
      lastVideoBlobUrlRef.current = null;
    }
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

  const handleRender = async () => {
    setError(null);
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
      <PocPreviewWithOverlay text={text} onTextChange={setText} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRender}
            disabled={isRendering}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRendering ? "Rendering…" : "Render video in browser"}
          </button>
          {progress !== null && !error && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {Math.round(progress * 100)}%
            </span>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {lastVideoUrl && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              Rendered output
            </p>
            <video
              className="w-full max-w-md rounded-lg border border-border"
              src={lastVideoUrl}
              controls
            />
            <a
              href={lastVideoUrl}
              download="remotion-poc.mp4"
              className="inline-flex w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Download MP4
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
