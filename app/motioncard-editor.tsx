"use client";

import { useState } from "react";
import { MotioncardPreview } from "@/app/motioncard-preview";
import { BackgroundSelect } from "@/app/motioncard-editor/background-select";
import { FontSizeSlider } from "@/app/motioncard-editor/font-size-slider";
import { VideoExportActions } from "@/app/motioncard-editor/video-export-actions";
import { COMPOSITION_DEFAULT_PROPS, type BackgroundId } from "@/remotion/composition";
import { useMotioncardWebRender } from "@/lib/hooks/use-motioncard-web-render";

export function MotioncardEditor() {
  const [text, setText] = useState(COMPOSITION_DEFAULT_PROPS.text);
  const [fontSizeProgress, setFontSizeProgress] = useState(
    COMPOSITION_DEFAULT_PROPS.fontSizeProgress ?? 50,
  );
  const [background, setBackground] = useState<BackgroundId>(
    COMPOSITION_DEFAULT_PROPS.background ?? "silk",
  );

  const {
    videoBlobUrl,
    videoBlobSize,
    error,
    renderProgress,
    isRendering,
    render,
    clearRenderResult,
  } = useMotioncardWebRender({ text, fontSizeProgress, background });

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
                  <BackgroundSelect value={background} onChange={setBackground} />
                </div>
                <FontSizeSlider
                  value={fontSizeProgress}
                  onChange={setFontSizeProgress}
                />
              </div>
              <VideoExportActions
                videoBlobUrl={videoBlobUrl}
                videoBlobSize={videoBlobSize}
                isRendering={isRendering}
                renderProgress={renderProgress}
                onRender={render}
                onClearRendered={clearRenderResult}
              />
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
