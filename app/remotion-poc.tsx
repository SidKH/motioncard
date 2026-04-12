"use client";

import { renderMediaOnWeb } from "@remotion/web-renderer";
import { ALargeSmall } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PocPreviewWithOverlay } from "@/app/poc-preview-with-overlay";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  POC_COMPOSITION,
  POC_COMPOSITION_DEFAULT_PROPS,
  PocComposition,
} from "@/remotion/composition";

function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb >= 1 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
}

export function RemotionPoc() {
  const [text, setText] = useState(POC_COMPOSITION_DEFAULT_PROPS.text);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [fontSizeProgress, setFontSizeProgress] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [lastVideoUrl, setLastVideoUrl] = useState<string | null>(null);
  const [lastVideoBytes, setLastVideoBytes] = useState<number | null>(null);
  const lastVideoBlobUrlRef = useRef<string | null>(null);

  const revokeLastUrl = useCallback(() => {
    if (lastVideoBlobUrlRef.current) {
      URL.revokeObjectURL(lastVideoBlobUrlRef.current);
      lastVideoBlobUrlRef.current = null;
    }
    setLastVideoUrl(null);
    setLastVideoBytes(null);
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
    setRenderProgress(0);
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
        inputProps: { text, fontSizeProgress },
        onProgress: ({ progress: p }) => setRenderProgress(p),
      });
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      lastVideoBlobUrlRef.current = url;
      setLastVideoUrl(url);
      setLastVideoBytes(blob.size);
      setRenderProgress(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setRenderProgress(null);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-6">
        <div className="w-full max-w-2xl">
          <PocPreviewWithOverlay
            text={text}
            onTextChange={setText}
            fontSizeProgress={fontSizeProgress}
          />
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-6">
        <div className="w-full max-w-2xl rounded-t-lg border-x border-t border-border border-b-0 bg-white/3">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex w-full min-w-0 items-center gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className="inline-flex shrink-0 text-muted-foreground"
                  title="Font size"
                  aria-hidden
                >
                  <ALargeSmall className="size-4" />
                </span>
                <Slider
                  value={[fontSizeProgress]}
                  onValueChange={(v) => setFontSizeProgress(v[0] ?? 50)}
                  min={0}
                  max={100}
                  step={1}
                  className="min-w-0 flex-1"
                  aria-label="Font size"
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {lastVideoUrl && !isRendering ? (
                  <Button asChild className="min-w-36 justify-center">
                    <a href={lastVideoUrl} download="remotion-poc.mp4">
                      Download
                      {lastVideoBytes !== null
                        ? ` (${formatMegabytes(lastVideoBytes)})`
                        : null}
                    </a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-36 justify-center"
                    onClick={handleRender}
                    disabled={isRendering}
                  >
                    {isRendering
                      ? `Rendering ${renderProgress !== null ? Math.round(renderProgress * 100) : 0}%`
                      : "Render video"}
                  </Button>
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
