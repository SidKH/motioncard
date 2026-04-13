import { type RefObject, useEffect, useState } from "react";

export type ElementSize = {
  readonly width: number;
  readonly height: number;
};

const ZERO: ElementSize = { width: 0, height: 0 };

/**
 * Tracks the element’s `getBoundingClientRect()` width and height, updating on resize.
 */
export function useElementSize(
  elementRef: RefObject<HTMLElement | null>,
): ElementSize {
  const [size, setSize] = useState<ElementSize>(ZERO);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ width: r.width, height: r.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [elementRef]);

  return size;
}
