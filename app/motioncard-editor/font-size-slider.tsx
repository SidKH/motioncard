"use client";

import { ALargeSmall } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { COMPOSITION_DEFAULT_PROPS } from "@/remotion/composition";
import { cn } from "@/lib/utils";

const FONT_SIZE_SLIDER_MIN = 0;
const FONT_SIZE_SLIDER_MAX = 100;
const FONT_SIZE_SLIDER_STEP = 10;

type FontSizeSliderProps = {
  readonly value: number;
  readonly onChange: (value: number) => void;
};

export function FontSizeSlider({ value, onChange }: FontSizeSliderProps) {
  const fallback = COMPOSITION_DEFAULT_PROPS.fontSizeProgress ?? 50;

  return (
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
          // Radix slider range doesn’t pick up muted foreground on this surface.
          "[&_[data-slot=slider-range]]:!bg-zinc-300 dark:[&_[data-slot=slider-range]]:!bg-zinc-500",
        )}
      >
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0] ?? fallback)}
          min={FONT_SIZE_SLIDER_MIN}
          max={FONT_SIZE_SLIDER_MAX}
          step={FONT_SIZE_SLIDER_STEP}
          className="w-full"
          aria-label="Font size"
        />
      </div>
    </div>
  );
}
