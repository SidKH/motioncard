"use client";

import { Player } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import { POC_COMPOSITION, PocComposition } from "@/remotion/composition";
import {
  getPocTitleOverlayFontSizePx,
  getPocTitlePaddingPx,
  POC_TITLE_COLOR,
  POC_TITLE_FONT_FAMILY,
  POC_TITLE_FONT_WEIGHT,
  POC_TITLE_LETTER_SPACING,
  POC_TITLE_LINE_HEIGHT,
} from "@/remotion/pocTitleTypography";

type PocPreviewWithOverlayProps = {
  readonly text: string;
  readonly onTextChange: (value: string) => void;
};

export function PocPreviewWithOverlay({
  text,
  onTextChange,
}: PocPreviewWithOverlayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const placeCaretAtEnd = () => {
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    };
    placeCaretAtEnd();
    requestAnimationFrame(placeCaretAtEnd);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setDisplaySize({ w: r.width, h: r.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = displaySize.w > 0 ? displaySize.w : 480;
  const h = displaySize.h > 0 ? displaySize.h : Math.round((480 * 9) / 16);
  const pad = getPocTitlePaddingPx(w, h);
  const fontPx = getPocTitleOverlayFontSizePx(w);
  const maxTextareaHeight = Math.max(0, h - 2 * pad.y);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || maxTextareaHeight <= 0) return;
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, maxTextareaHeight);
    ta.style.height = `${next}px`;
  }, [text, maxTextareaHeight, fontPx]);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-lg border border-border bg-media-canvas shadow-sm"
    >
      <Player
        component={PocComposition}
        inputProps={{ text, hideTitle: true }}
        durationInFrames={POC_COMPOSITION.durationInFrames}
        fps={POC_COMPOSITION.fps}
        compositionWidth={POC_COMPOSITION.width}
        compositionHeight={POC_COMPOSITION.height}
        loop
        autoPlay
        acknowledgeRemotionLicense
        style={{ width: "100%", display: "block" }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{
          paddingLeft: pad.x,
          paddingRight: pad.x,
          paddingTop: pad.y,
          paddingBottom: pad.y,
          boxSizing: "border-box",
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label="On-screen text"
          rows={1}
          className="pointer-events-auto min-h-0 w-full max-w-full resize-none overflow-y-auto border-0 bg-transparent text-center outline-none ring-0 placeholder:text-muted-foreground/40 focus:ring-0"
          style={{
            color: POC_TITLE_COLOR,
            caretColor: POC_TITLE_COLOR,
            fontFamily: POC_TITLE_FONT_FAMILY,
            fontSize: fontPx,
            fontWeight: POC_TITLE_FONT_WEIGHT,
            letterSpacing: POC_TITLE_LETTER_SPACING,
            lineHeight: POC_TITLE_LINE_HEIGHT,
            maxHeight: maxTextareaHeight,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
          placeholder="Type here…"
        />
      </div>
    </div>
  );
}
