import { type RefObject, useEffect } from "react";

export type UseTextareaAutoHeightOptions = {
  readonly text: string;
  readonly maxTextareaHeight: number;
  readonly remeasureKey: unknown;
};

export function useTextareaAutoHeight(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  options: UseTextareaAutoHeightOptions,
): void {
  const { text, maxTextareaHeight, remeasureKey } = options;
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || maxTextareaHeight <= 0) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, maxTextareaHeight);
    ta.style.height = `${next}px`;
  }, [textareaRef, text, maxTextareaHeight, remeasureKey]);
}
