import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export interface CameraState {
  active: boolean;
  error: string | null;
  /** Devices available via enumerateDevices (label only populated after permission). */
  devices: MediaDeviceInfo[];
  /** Index into `devices` of the currently selected track. */
  deviceIndex: number;
}

/**
 * Continuous camera QR scanner.
 * Captures frames on a rAF-like interval, downscales for performance,
 * and calls `onDecode` the first time a QR is found (then pauses).
 */
export function useCameraScanner(onDecode: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const [state, setState] = useState<CameraState>({
    active: false,
    error: null,
    devices: [],
    deviceIndex: 0,
  });

  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((s) => ({ ...s, active: false }));
  }, []);

  const scanLoop = useCallback(() => {
    if (stoppedRef.current) return;
    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w > 0 && h > 0) {
        if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
        const canvas = canvasRef.current;
        // Downscale large frames to keep decode fast.
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              onDecode(code.data);
              stop();
              return;
            }
          } catch {
            // ignore frame read errors
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [onDecode, stop]);

  const start = useCallback(
    async (deviceIndex?: number) => {
      stoppedRef.current = false;
      setState((s) => ({ ...s, error: null }));
      if (!navigator.mediaDevices?.getUserMedia) {
        setState((s) => ({ ...s, error: "unsupported" }));
        return;
      }
      // Stop any prior stream first.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      try {
        // Gather devices (labels fill in after permission is granted).
        const all: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        const idx = deviceIndex ?? state.deviceIndex;
        const constraints: MediaStreamConstraints = {
          video:
            cams.length > 0 && idx < cams.length
              ? { deviceId: { exact: cams[idx].deviceId } }
              : { facingMode: "environment" },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        // Refresh device list now that labels are available.
        const refreshed = await navigator.mediaDevices.enumerateDevices();
        const cams2 = refreshed.filter((d) => d.kind === "videoinput");
        setState({
          active: true,
          error: null,
          devices: cams2,
          deviceIndex: Math.min(idx, Math.max(0, cams2.length - 1)),
        });
        rafRef.current = requestAnimationFrame(scanLoop);
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setState((s) => ({ ...s, error: "denied", active: false }));
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setState((s) => ({ ...s, error: "notfound", active: false }));
        } else {
          setState((s) => ({
            ...s,
            error: e instanceof Error ? e.message : String(e),
            active: false,
          }));
        }
      }
    },
    [scanLoop, state.deviceIndex],
  );

  const switchCamera = useCallback(() => {
    setState((s) => {
      const next = s.devices.length > 0 ? (s.deviceIndex + 1) % s.devices.length : 0;
      // restart with new index
      void start(next);
      return { ...s, deviceIndex: next };
    });
  }, [start]);

  // Cleanup on unmount.
  useEffect(() => stop, [stop]);

  return { videoRef, state, start, stop, switchCamera };
}
