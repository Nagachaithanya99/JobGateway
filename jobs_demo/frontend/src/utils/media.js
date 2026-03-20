export function toAbsoluteMediaUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api");
  const origin = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

export const SPEECH_AUDIO_CONSTRAINTS = {
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  channelCount: { ideal: 1 },
  sampleRate: { ideal: 48000 },
  sampleSize: { ideal: 16 },
  latency: { ideal: 0.01 },
  voiceIsolation: { ideal: true },
  suppressLocalAudioPlayback: { ideal: true },
  googEchoCancellation: true,
  googAutoGainControl: true,
  googNoiseSuppression: true,
  googHighpassFilter: true,
  googTypingNoiseDetection: true,
  googAudioMirroring: false,
};

export const ULTRA_HD_VIDEO_CONSTRAINTS = {
  facingMode: "user",
  width: { ideal: 3840, max: 3840 },
  height: { ideal: 2160, max: 2160 },
  aspectRatio: { ideal: 16 / 9 },
  frameRate: { ideal: 30, max: 60 },
  resizeMode: "none",
};

export async function optimizeSpeechTrack(track) {
  if (!track || track.kind !== "audio") return;

  try {
    track.contentHint = "speech";
  } catch {
    // ignore unsupported browsers
  }

  const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() || {} : {};
  const nextConstraints = {};

  if ("echoCancellation" in capabilities) nextConstraints.echoCancellation = true;
  if ("noiseSuppression" in capabilities) nextConstraints.noiseSuppression = true;
  if ("autoGainControl" in capabilities) nextConstraints.autoGainControl = true;
  if ("channelCount" in capabilities) nextConstraints.channelCount = 1;
  if ("sampleRate" in capabilities) nextConstraints.sampleRate = 48000;
  if ("sampleSize" in capabilities) nextConstraints.sampleSize = 16;
  if ("latency" in capabilities) nextConstraints.latency = 0.01;
  if ("voiceIsolation" in capabilities) nextConstraints.voiceIsolation = true;
  if ("suppressLocalAudioPlayback" in capabilities) nextConstraints.suppressLocalAudioPlayback = true;

  if (!Object.keys(nextConstraints).length || typeof track.applyConstraints !== "function") return;

  try {
    await track.applyConstraints(nextConstraints);
  } catch {
    // ignore partial browser support failures
  }
}

export async function optimizeSpeechStream(stream) {
  if (!stream) return stream;
  const tasks = stream.getAudioTracks().map((track) => optimizeSpeechTrack(track));
  await Promise.allSettled(tasks);
  return stream;
}

export async function optimizeVideoTrack(track) {
  if (!track || track.kind !== "video") return;

  try {
    track.contentHint = "detail";
  } catch {
    // ignore unsupported browsers
  }

  const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() || {} : {};
  const nextConstraints = {};

  if (capabilities.width) {
    nextConstraints.width = Math.min(Number(capabilities.width.max || 3840), 3840);
  }
  if (capabilities.height) {
    nextConstraints.height = Math.min(Number(capabilities.height.max || 2160), 2160);
  }
  if (capabilities.frameRate) {
    nextConstraints.frameRate = Math.min(Number(capabilities.frameRate.max || 30), 30);
  }
  if (capabilities.aspectRatio) {
    nextConstraints.aspectRatio = 16 / 9;
  }
  if (capabilities.resizeMode) {
    const modes = Array.isArray(capabilities.resizeMode) ? capabilities.resizeMode : [capabilities.resizeMode];
    if (modes.includes("none")) nextConstraints.resizeMode = "none";
  }

  if (!Object.keys(nextConstraints).length || typeof track.applyConstraints !== "function") return;

  try {
    await track.applyConstraints(nextConstraints);
  } catch {
    // ignore browsers/cameras that cannot reach requested quality
  }
}

export async function optimizeVideoStream(stream) {
  if (!stream) return stream;
  const tasks = stream.getVideoTracks().map((track) => optimizeVideoTrack(track));
  await Promise.allSettled(tasks);
  return stream;
}
