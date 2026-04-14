import { type RefObject, useEffect } from "react";

export function useMountFocusCaretEnd(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
): void {
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const placeCaretAtEnd = () => {
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    };
    placeCaretAtEnd();
    // Selection can still be wrong immediately after focus; one rAF defers until after layout.
    requestAnimationFrame(placeCaretAtEnd);
  }, [textareaRef]);
}
