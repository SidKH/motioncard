"use client";

import { renderMediaOnWeb } from "@remotion/web-renderer";
import { ALargeSmall, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MotioncardPreview } from "@/app/motioncard-preview";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  POC_COMPOSITION,
  POC_COMPOSITION_DEFAULT_PROPS,
  PocComposition,
  type PocBackgroundId,
} from "@/remotion/composition";
import { cn } from "@/lib/utils";

function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb >= 1 ? mb.toFixed(1) : mb.toFixed(2)} MB`;
}

export function MotioncardEditor() {
  const [text, setText] = useState(POC_COMPOSITION_DEFAULT_PROPS.text);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [fontSizeProgress, setFontSizeProgress] = useState(50);
  const [background, setBackground] = useState<PocBackgroundId>(
    POC_COMPOSITION_DEFAULT_PROPS.background ?? "silk",
  );
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

  const handleClearRenderedVideo = useCallback(() => {
    setError(null);
    revokeLastUrl();
  }, [revokeLastUrl]);

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
        inputProps: { text, fontSizeProgress, background },
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
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <MotioncardPreview
            text={text}
            onTextChange={setText}
            fontSizeProgress={fontSizeProgress}
            background={background}
          />
          <p className="text-center text-sm text-zinc-500">
            Your message on animated backgrounds
          </p>
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-0 sm:px-6">
        <div className="w-full max-w-2xl rounded-none border-t border-border border-b-0 bg-card sm:rounded-t-4xl sm:border-x">
          <div className="flex flex-col gap-4 p-4">
            <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-4">
              <div className="flex min-w-0 w-full flex-row items-center gap-3 sm:flex-1 sm:gap-x-3">
                <div className="min-w-0 flex-1 sm:flex-none sm:shrink-0">
                  <Select
                    value={background}
                    onValueChange={(v) =>
                      setBackground(v as PocBackgroundId)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label="Background"
                      className="w-full sm:w-44"
                    >
                      <SelectValue placeholder="Background" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silk">Silk</SelectItem>
                      <SelectItem value="smoke">Smoke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  <span
                    className="inline-flex shrink-0 text-muted-foreground"
                    title="Font size"
                    aria-hidden
                  >
                    <ALargeSmall className="size-4" />
                  </span>
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      "[&_[data-slot=slider-range]]:!bg-zinc-300 dark:[&_[data-slot=slider-range]]:!bg-zinc-500",
                    )}
                  >
                    <Slider
                      value={[fontSizeProgress]}
                      onValueChange={(v) => setFontSizeProgress(v[0] ?? 50)}
                      min={0}
                      max={100}
                      step={10}
                      className="w-full"
                      aria-label="Font size"
                    />
                  </div>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-stretch gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                {lastVideoUrl && !isRendering ? (
                  <>
                    <Button
                      asChild
                      className="min-w-0 flex-1 justify-center sm:min-w-44 sm:w-auto sm:flex-initial"
                    >
                      <a href={lastVideoUrl} download="motioncard.mp4">
                        Download
                        {lastVideoBytes !== null
                          ? ` (${formatMegabytes(lastVideoBytes)})`
                          : null}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleClearRenderedVideo}
                      aria-label="Clear rendered video"
                      title="Clear rendered video"
                    >
                      <RotateCcw />
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="w-full min-w-44 justify-center sm:w-44"
                    onClick={handleRender}
                    disabled={isRendering}
                    aria-busy={isRendering}
                  >
                    {isRendering ? (
                      <>
                        Rendering{" "}
                        <span className="tabular-nums">
                          {renderProgress !== null
                            ? Math.round(renderProgress * 100)
                            : 0}
                          %
                        </span>
                      </>
                    ) : (
                      "Render video"
                    )}
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
