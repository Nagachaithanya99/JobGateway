import { useCallback, useEffect, useRef, useState } from "react";

const ORIGINAL_BACKGROUND_ID = "none";
const DEFAULT_BACKGROUND_ID = ORIGINAL_BACKGROUND_ID;

export const VIRTUAL_BACKGROUND_OPTIONS = [
  {
    id: ORIGINAL_BACKGROUND_ID,
    label: "Original",
    description: "Keep the real room",
    previewStyle: {
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
    },
  },
  {
    id: DEFAULT_BACKGROUND_ID,
    label: "Emerald Matte",
    description: "Deep matte green studio",
    previewStyle: {
      background:
        "radial-gradient(circle at 22% 18%, rgba(187,247,208,0.22), transparent 30%), linear-gradient(135deg, #0b2217 0%, #103426 42%, #1f7a5a 100%)",
    },
  },
  {
    id: "jade-aura",
    label: "Jade Aura",
    description: "Rich green with soft glow",
    previewStyle: {
      background:
        "radial-gradient(circle at 26% 22%, rgba(220,252,231,0.3), transparent 28%), linear-gradient(135deg, #06281d 0%, #0f5d45 45%, #6ee7b7 100%)",
    },
  },
  {
    id: "sage-studio",
    label: "Sage Studio",
    description: "Muted matte green room",
    previewStyle: {
      background:
        "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.18), transparent 26%), linear-gradient(135deg, #12281e 0%, #3d6a53 48%, #adcdb2 100%)",
    },
  },
  {
    id: "mint-fade",
    label: "Mint Fade",
    description: "Soft premium mint matte",
    previewStyle: {
      background:
        "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.24), transparent 24%), linear-gradient(135deg, #0c3025 0%, #1f8a68 40%, #d1fae5 100%)",
    },
  },
  {
    id: "green-room",
    label: "Green Room",
    description: "Structured matte backdrop",
    previewStyle: {
      backgroundColor: "#08150f",
      backgroundImage:
        "linear-gradient(rgba(167,243,208,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.12) 1px, transparent 1px), radial-gradient(circle at 18% 18%, rgba(52,211,153,0.2), transparent 28%)",
      backgroundSize: "24px 24px, 24px 24px, auto",
      backgroundPosition: "0 0, 0 0, center",
    },
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toEven(value) {
  const rounded = Math.max(2, Math.round(Number(value) || 2));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

function waitForVideoReady(videoEl) {
  if (!videoEl) return Promise.resolve();
  if (videoEl.readyState >= 2 && videoEl.videoWidth && videoEl.videoHeight) {
    return Promise.resolve(videoEl.play?.()).catch(() => {});
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      videoEl.removeEventListener("loadedmetadata", done);
      videoEl.removeEventListener("canplay", done);
      Promise.resolve(videoEl.play?.()).catch(() => {}).finally(resolve);
    };

    videoEl.addEventListener("loadedmetadata", done, { once: true });
    videoEl.addEventListener("canplay", done, { once: true });
    setTimeout(done, 300);
  });
}

function resolveCanvasSize(track, videoEl) {
  const settings = track?.getSettings?.() || {};
  const rawWidth = Number(settings.width || videoEl?.videoWidth || 1920);
  const rawHeight = Number(settings.height || videoEl?.videoHeight || Math.round(rawWidth * 9 / 16));
  const width = toEven(clamp(rawWidth, 320, 3840));
  const height = toEven(clamp(rawHeight, 180, 2160));
  return { width, height };
}

function paintBackground(ctx, width, height, backgroundId) {
  ctx.clearRect(0, 0, width, height);

  if (backgroundId === ORIGINAL_BACKGROUND_ID) {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (backgroundId === DEFAULT_BACKGROUND_ID) {
    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, "#0b2217");
    fill.addColorStop(0.45, "#103426");
    fill.addColorStop(1, "#1f7a5a");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.2, height * 0.16, 0, width * 0.2, height * 0.16, width * 0.55);
    glow.addColorStop(0, "rgba(187, 247, 208, 0.24)");
    glow.addColorStop(1, "rgba(187, 247, 208, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundId === "jade-aura") {
    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, "#06281d");
    fill.addColorStop(0.45, "#0f5d45");
    fill.addColorStop(1, "#6ee7b7");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.22, height * 0.18, 0, width * 0.22, height * 0.18, width * 0.48);
    glow.addColorStop(0, "rgba(220, 252, 231, 0.3)");
    glow.addColorStop(1, "rgba(220, 252, 231, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundId === "sage-studio") {
    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, "#12281e");
    fill.addColorStop(0.42, "#3d6a53");
    fill.addColorStop(1, "#adcdb2");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.22, height * 0.16, 0, width * 0.22, height * 0.16, width * 0.5);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundId === "mint-fade") {
    const fill = ctx.createLinearGradient(0, 0, width, height);
    fill.addColorStop(0, "#0c3025");
    fill.addColorStop(0.42, "#1f8a68");
    fill.addColorStop(1, "#d1fae5");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.24, height * 0.18, 0, width * 0.24, height * 0.18, width * 0.46);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.24)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundId === "green-room") {
    ctx.fillStyle = "#08150f";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(167, 243, 208, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(width * 0.18, height * 0.18, 0, width * 0.18, height * 0.18, width * 0.4);
    glow.addColorStop(0, "rgba(52, 211, 153, 0.2)");
    glow.addColorStop(1, "rgba(52, 211, 153, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  const vignette = ctx.createLinearGradient(0, height, width, 0);
  vignette.addColorStop(0, "rgba(15, 23, 42, 0.28)");
  vignette.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function applyChromaKey(sourceCtx, width, height) {
  const frame = sourceCtx.getImageData(0, 0, width, height);
  const { data } = frame;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    if (green < 60 || delta < 10) continue;

    let hue = 0;
    if (delta > 0) {
      if (max === red) hue = ((green - blue) / delta) % 6;
      else if (max === green) hue = (blue - red) / delta + 2;
      else hue = (red - green) / delta + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }

    if (hue < 45 || hue > 170) continue;

    const saturation = max === 0 ? 0 : delta / max;
    const greenDominance = green - (red * 0.72 + blue * 0.58);
    if (saturation < 0.14 || greenDominance < 6) continue;

    const hueWeight = 1 - clamp(Math.abs(hue - 105) / 65, 0, 1);
    const saturationWeight = clamp((saturation - 0.14) / 0.5, 0, 1);
    const dominanceWeight = clamp((greenDominance - 6) / 72, 0, 1);
    const removal = clamp(
      hueWeight * 0.38 + saturationWeight * 0.24 + dominanceWeight * 0.52 - 0.12,
      0,
      1,
    );

    if (removal <= 0) continue;

    data[index + 3] = Math.round(255 * (1 - removal));

    if (data[index + 3] > 0 && green > red && green > blue) {
      data[index + 1] = Math.round(green * (1 - removal * 0.38));
    }
  }

  sourceCtx.putImageData(frame, 0, 0);
}

export default function useVirtualBackground(previewVideoRef) {
  const [selectedBackground, setSelectedBackground] = useState(DEFAULT_BACKGROUND_ID);
  const selectedBackgroundRef = useRef(DEFAULT_BACKGROUND_ID);
  const sourceStreamRef = useRef(null);
  const sourceTrackRef = useRef(null);
  const sourceVideoRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const renderCanvasRef = useRef(null);
  const previewStreamRef = useRef(null);
  const processedTrackRef = useRef(null);
  const sendersRef = useRef(new Set());
  const rafRef = useRef(0);
  const startPromiseRef = useRef(null);

  const attachPreview = useCallback((stream) => {
    const el = previewVideoRef?.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream || null;
    }
    if (stream) {
      Promise.resolve(el.play?.()).catch(() => {});
    }
  }, [previewVideoRef]);

  const replaceSenderTrack = useCallback(async (track) => {
    const senders = Array.from(sendersRef.current || []);
    if (!senders.length) return;

    await Promise.all(
      senders.map(async (sender) => {
        if (!sender || sender.track === track) return;
        try {
          await sender.replaceTrack(track || null);
        } catch {
          // ignore closed peer connection races
        }
      }),
    );
  }, []);

  const removeSender = useCallback((sender) => {
    if (!sender) return;
    try {
      sendersRef.current.delete(sender);
    } catch {
      // ignore unexpected sender cleanup issues
    }
  }, []);

  const stopProcessing = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (processedTrackRef.current) {
      processedTrackRef.current.stop();
      processedTrackRef.current = null;
    }
    previewStreamRef.current = null;
    renderCanvasRef.current = null;
    sourceCanvasRef.current = null;
    startPromiseRef.current = null;
  }, []);

  const ensureSourceVideo = useCallback(async (stream) => {
    if (!stream) return null;
    let video = sourceVideoRef.current;
    if (!video) {
      video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      sourceVideoRef.current = video;
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    await waitForVideoReady(video);
    return video;
  }, []);

  const ensureProcessedTrack = useCallback(async () => {
    if (processedTrackRef.current) {
      processedTrackRef.current.enabled = Boolean(sourceTrackRef.current?.enabled);
      attachPreview(previewStreamRef.current);
      await replaceSenderTrack(processedTrackRef.current);
      return processedTrackRef.current;
    }

    if (startPromiseRef.current) return startPromiseRef.current;

    startPromiseRef.current = (async () => {
      const stream = sourceStreamRef.current;
      const track = sourceTrackRef.current;
      if (!stream || !track) return null;

      const sourceVideo = await ensureSourceVideo(stream);
      if (!sourceVideo) return null;

      const { width, height } = resolveCanvasSize(track, sourceVideo);
      const sourceCanvas = document.createElement("canvas");
      const renderCanvas = document.createElement("canvas");
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      renderCanvas.width = width;
      renderCanvas.height = height;

      const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
      const renderCtx = renderCanvas.getContext("2d");
      if (!sourceCtx || !renderCtx) return null;

      sourceCtx.imageSmoothingEnabled = true;
      sourceCtx.imageSmoothingQuality = "high";
      renderCtx.imageSmoothingEnabled = true;
      renderCtx.imageSmoothingQuality = "high";

      const outputStream = renderCanvas.captureStream(30);
      const processedTrack = outputStream.getVideoTracks()[0];
      if (!processedTrack) return null;

      try {
        processedTrack.contentHint = "detail";
      } catch {
        // ignore unsupported browsers
      }

      processedTrack.enabled = Boolean(track.enabled);
      sourceCanvasRef.current = sourceCanvas;
      renderCanvasRef.current = renderCanvas;
      processedTrackRef.current = processedTrack;
      previewStreamRef.current = new MediaStream([processedTrack]);

      const drawFrame = () => {
        const currentVideo = sourceVideoRef.current;
        if (!currentVideo || currentVideo.readyState < 2) {
          rafRef.current = requestAnimationFrame(drawFrame);
          return;
        }

        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.drawImage(currentVideo, 0, 0, width, height);
        applyChromaKey(sourceCtx, width, height);

        paintBackground(renderCtx, width, height, selectedBackgroundRef.current);
        renderCtx.drawImage(sourceCanvas, 0, 0, width, height);
        rafRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
      attachPreview(previewStreamRef.current);
      await replaceSenderTrack(processedTrack);
      return processedTrack;
    })();

    try {
      return await startPromiseRef.current;
    } finally {
      startPromiseRef.current = null;
    }
  }, [attachPreview, ensureSourceVideo, replaceSenderTrack]);

  const bindStream = useCallback(async (stream) => {
    const videoTrack = stream?.getVideoTracks?.()[0] || null;
    sourceStreamRef.current = stream || null;
    sourceTrackRef.current = videoTrack;

    if (!videoTrack) {
      stopProcessing();
      attachPreview(null);
      return null;
    }

    await ensureSourceVideo(stream);

    if (selectedBackgroundRef.current === ORIGINAL_BACKGROUND_ID) {
      await replaceSenderTrack(videoTrack);
      stopProcessing();
      attachPreview(stream);
      return videoTrack;
    }

    return ensureProcessedTrack();
  }, [attachPreview, ensureProcessedTrack, ensureSourceVideo, replaceSenderTrack, stopProcessing]);

  const getOutgoingVideoTrack = useCallback(async (stream) => {
    if (stream && sourceStreamRef.current !== stream) {
      await bindStream(stream);
    }

    if (selectedBackgroundRef.current === ORIGINAL_BACKGROUND_ID) {
      return sourceTrackRef.current || null;
    }

    return ensureProcessedTrack();
  }, [bindStream, ensureProcessedTrack]);

  const bindVideoSender = useCallback(async (sender) => {
    if (!sender) return;
    sendersRef.current.add(sender);
    const activeTrack = selectedBackgroundRef.current === ORIGINAL_BACKGROUND_ID
      ? sourceTrackRef.current
      : processedTrackRef.current || sourceTrackRef.current;
    try {
      await sender.replaceTrack(activeTrack || null);
    } catch {
      removeSender(sender);
    }
  }, [removeSender]);

  const syncVideoEnabled = useCallback((enabled) => {
    if (processedTrackRef.current) {
      processedTrackRef.current.enabled = Boolean(enabled);
    }
  }, []);

  const reset = useCallback(() => {
    sendersRef.current.clear();
    stopProcessing();
    sourceStreamRef.current = null;
    sourceTrackRef.current = null;

    if (sourceVideoRef.current) {
      try {
        sourceVideoRef.current.pause();
      } catch {
        // ignore
      }
      sourceVideoRef.current.srcObject = null;
    }

    attachPreview(null);
  }, [attachPreview, stopProcessing]);

  useEffect(() => {
    selectedBackgroundRef.current = selectedBackground;

    if (!sourceTrackRef.current) return undefined;

    let cancelled = false;
    const syncSelection = async () => {
      if (selectedBackground === ORIGINAL_BACKGROUND_ID) {
        await replaceSenderTrack(sourceTrackRef.current);
        if (cancelled) return;
        stopProcessing();
        attachPreview(sourceStreamRef.current);
        return;
      }

      await ensureProcessedTrack();
    };

    syncSelection().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [attachPreview, ensureProcessedTrack, replaceSenderTrack, selectedBackground, stopProcessing]);

  useEffect(() => () => reset(), [reset]);

  return {
    backgroundOptions: VIRTUAL_BACKGROUND_OPTIONS,
    bindStream,
    bindVideoSender,
    removeSender,
    getOutgoingVideoTrack,
    reset,
    selectedBackground,
    setSelectedBackground,
    syncVideoEnabled,
  };
}
