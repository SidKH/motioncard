"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMegabytes } from "@/lib/format-megabytes";

type VideoExportActionsProps = {
  readonly videoBlobUrl: string | null;
  readonly videoBlobSize: number | null;
  readonly isRendering: boolean;
  readonly renderProgress: number | null;
  readonly onRender: () => void;
  readonly onClearRendered: () => void;
};

export function VideoExportActions({
  videoBlobUrl,
  videoBlobSize,
  isRendering,
  renderProgress,
  onRender,
  onClearRendered,
}: VideoExportActionsProps) {
  return (
    <div className="flex w-full shrink-0 items-center justify-stretch gap-2 sm:ml-auto sm:w-auto sm:justify-end">
      {videoBlobUrl && !isRendering ? (
        <>
          <Button
            asChild
            className="min-w-0 flex-1 justify-center sm:min-w-44 sm:w-auto sm:flex-initial"
          >
            <a href={videoBlobUrl} download="motioncard.mp4">
              Download
              {videoBlobSize !== null
                ? ` (${formatMegabytes(videoBlobSize)})`
                : null}
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onClearRendered}
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
          onClick={onRender}
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
  );
}
