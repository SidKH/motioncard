"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BACKGROUND_OPTIONS, type BackgroundId } from "@/remotion/composition";

type BackgroundSelectProps = {
  readonly value: BackgroundId;
  readonly onChange: (value: BackgroundId) => void;
};

export function BackgroundSelect({ value, onChange }: BackgroundSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const match = BACKGROUND_OPTIONS.find((o) => o.value === v);
        if (match) onChange(match.value);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Background"
        className="w-full sm:w-44"
      >
        <SelectValue placeholder="Background" />
      </SelectTrigger>
      <SelectContent>
        {BACKGROUND_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
