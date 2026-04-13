"use client";

import { Player } from "@remotion/player";
import { useEffect, useRef } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import {
  POC_COMPOSITION,
  PocComposition,
  type PocBackgroundId,
} from "@/remotion/composition";
import {
  getPocTitleOverlayFontSizePx,
  getPocTitlePaddingPx,
  POC_TITLE_COLOR,
  POC_TITLE_FONT_FAMILY,
  POC_TITLE_FONT_WEIGHT,
  POC_TITLE_LETTER_SPACING,
  POC_TITLE_LINE_HEIGHT,
  POC_TITLE_TEXT_SHADOW,
} from "@/remotion/pocTitleTypography";

type MotioncardPreviewProps = {
  readonly text: string;
  readonly onTextChange: (value: string) => void;
  readonly fontSizeProgress: number;
  readonly background: PocBackgroundId;
};

type MotioncardTitleOverlayProps = {
  readonly text: string;
  readonly onTextChange: (value: string) => void;
  readonly pad: { readonly x: number; readonly y: number };
  readonly fontPx: number;
  readonly maxTextareaHeight: number;
};

/** DOM title editor stacked on the Player; `PocComposition` uses `hideTitle` so text is not drawn twice. */
function MotioncardTitleOverlay({
  text,
  onTextChange,
  pad,
  fontPx,
  maxTextareaHeight,
}: MotioncardTitleOverlayProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || maxTextareaHeight <= 0) return;
    // Reset height so scrollHeight reflects full content; then clamp to the padded region.
    ta.style.height = "auto";
    const next = Math.min(ta.scrollHeight, maxTextareaHeight);
    ta.style.height = `${next}px`;
  }, [text, maxTextareaHeight, fontPx]);

  return (
    <div
      // Outer layer ignores pointer events so the Player stays interactive outside the textarea.
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
          textShadow: POC_TITLE_TEXT_SHADOW,
        }}
        placeholder="Type here…"
      />
    </div>
  );
}

export function MotioncardPreview({
  text,
  onTextChange,
  fontSizeProgress,
  background,
}: MotioncardPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width: w, height: h } = useElementSize(wrapRef);

  const measured = w > 0 && h > 0;
  const pad = measured ? getPocTitlePaddingPx(w, h) : { x: 0, y: 0 };
  const fontPx = measured
    ? getPocTitleOverlayFontSizePx(w, fontSizeProgress)
    : 0;
  const maxTextareaHeight = measured ? Math.max(0, h - 2 * pad.y) : 0;

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-2xl border border-border bg-media-canvas shadow-sm"
    >
      <Player
        // New background: remount so Player/composition state does not mix across assets.
        key={background}
        component={PocComposition}
        inputProps={{ text, hideTitle: true, fontSizeProgress, background }}
        durationInFrames={POC_COMPOSITION.durationInFrames}
        fps={POC_COMPOSITION.fps}
        compositionWidth={POC_COMPOSITION.width}
        compositionHeight={POC_COMPOSITION.height}
        loop
        autoPlay
        acknowledgeRemotionLicense
        style={{ width: "100%", display: "block" }}
      />
      {measured ? (
        <MotioncardTitleOverlay
          text={text}
          onTextChange={onTextChange}
          pad={pad}
          fontPx={fontPx}
          maxTextareaHeight={maxTextareaHeight}
        />
      ) : null}
    </div>
  );
}
