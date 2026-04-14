import { renderMediaOnWeb } from "@remotion/web-renderer";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  COMPOSITION,
  COMPOSITION_DEFAULT_PROPS,
  Composition,
  RENDER_WEB_VIDEO_BITRATE,
  type BackgroundId,
} from "@/remotion/composition";

function revokeObjectUrlRef(ref: MutableRefObject<string | null>) {
  if (ref.current) {
    URL.revokeObjectURL(ref.current);
    ref.current = null;
  }
}

export function useMotioncardWebRender(params: {
  readonly text: string;
  readonly fontSizeProgress: number;
  readonly background: BackgroundId;
}) {
  const { text, fontSizeProgress, background } = params;
  const videoBlobUrlRef = useRef<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlobSize, setVideoBlobSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const clearBlobResult = useCallback(() => {
    revokeObjectUrlRef(videoBlobUrlRef);
    setVideoBlobUrl(null);
    setVideoBlobSize(null);
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrlRef(videoBlobUrlRef);
    };
  }, []);

  const assignBlobResult = useCallback((blob: Blob) => {
    const next = URL.createObjectURL(blob);
    videoBlobUrlRef.current = next;
    setVideoBlobUrl(next);
    setVideoBlobSize(blob.size);
  }, []);

  const render = useCallback(async () => {
    setError(null);
    clearBlobResult();
    setRenderProgress(0);
    setIsRendering(true);
    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          id: COMPOSITION.id,
          component: Composition,
          defaultProps: COMPOSITION_DEFAULT_PROPS,
          durationInFrames: COMPOSITION.durationInFrames,
          fps: COMPOSITION.fps,
          width: COMPOSITION.width,
          height: COMPOSITION.height,
          calculateMetadata: null,
        },
        inputProps: { text, fontSizeProgress, background },
        licenseKey: "free-license",
        videoBitrate: RENDER_WEB_VIDEO_BITRATE,
        muted: true,
        scale: 1,
        onProgress: ({ progress: p }) => setRenderProgress(p),
      });
      const blob = await getBlob();
      assignBlobResult(blob);
      setRenderProgress(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setRenderProgress(null);
    } finally {
      setIsRendering(false);
    }
  }, [text, fontSizeProgress, background, clearBlobResult, assignBlobResult]);

  const clearRenderResult = useCallback(() => {
    setError(null);
    clearBlobResult();
  }, [clearBlobResult]);

  return {
    videoBlobUrl,
    videoBlobSize,
    error,
    renderProgress,
    isRendering,
    render,
    clearRenderResult,
  };
}
