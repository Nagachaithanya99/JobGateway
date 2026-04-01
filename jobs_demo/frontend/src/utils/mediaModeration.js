function clampDimensions(width, height, maxSide = 180) {
  if (!width || !height) return { width: maxSide, height: maxSide };
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function isSkinLike(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const ruleOne =
    r > 95 &&
    g > 40 &&
    b > 20 &&
    max - min > 15 &&
    Math.abs(r - g) > 15 &&
    r > g &&
    r > b;

  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const ruleTwo =
    nr > 0.35 &&
    ng > 0.2 &&
    nb > 0.12 &&
    nr > ng &&
    nr > nb &&
    Math.abs(nr - ng) > 0.03;

  return ruleOne || ruleTwo;
}

function analyzeImageData(imageData) {
  const pixels = imageData?.data || [];
  let visiblePixels = 0;
  let skinPixels = 0;
  let brightSkinPixels = 0;

  for (let index = 0; index < pixels.length; index += 16) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const a = pixels[index + 3];
    if (a < 40) continue;

    visiblePixels += 1;
    if (!isSkinLike(r, g, b)) continue;

    skinPixels += 1;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luma >= 80) {
      brightSkinPixels += 1;
    }
  }

  const skinRatio = visiblePixels ? skinPixels / visiblePixels : 0;
  const brightSkinRatio = visiblePixels ? brightSkinPixels / visiblePixels : 0;
  const unsafeScore = Math.min(1, skinRatio * 0.72 + brightSkinRatio * 0.28);
  const blocked =
    unsafeScore >= 0.58 ||
    (skinRatio >= 0.62 && brightSkinRatio >= 0.42);

  return {
    blocked,
    unsafeScore: Number(unsafeScore.toFixed(3)),
    skinRatio: Number(skinRatio.toFixed(3)),
    brightSkinRatio: Number(brightSkinRatio.toFixed(3)),
    reasons: blocked ? ["Possible explicit or unsafe visual content detected."] : [],
  };
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the selected image."));
    image.src = url;
  });
}

function loadVideoFromUrl(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Could not read the selected video."));
    video.src = url;
  });
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Could not inspect the selected video."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.currentTime = Math.max(0, Math.min(time, Math.max(0, Number(video.duration || 0) - 0.05)));
  });
}

function analyzeElementFrame(element, width, height) {
  const canvas = document.createElement("canvas");
  const dims = clampDimensions(width, height);
  canvas.width = dims.width;
  canvas.height = dims.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(element, 0, 0, dims.width, dims.height);
  return analyzeImageData(context.getImageData(0, 0, dims.width, dims.height));
}

function uniqueSortedNumbers(values = []) {
  return [...new Set(values.map((value) => Number(value.toFixed(3))))]
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);
}

export async function analyzeMediaFileSafety(file) {
  if (!file) {
    return {
      scanned: false,
      blocked: false,
      unsafeScore: 0,
      reasons: [],
      mediaKind: "unknown",
      framesScanned: 0,
      version: "free-visual-v1",
    };
  }

  const mimeType = String(file.type || "").toLowerCase();
  const objectUrl = URL.createObjectURL(file);

  try {
    if (mimeType.startsWith("image/")) {
      const image = await loadImageFromUrl(objectUrl);
      const frame = analyzeElementFrame(image, image.naturalWidth, image.naturalHeight);
      return {
        scanned: true,
        blocked: frame.blocked,
        unsafeScore: frame.unsafeScore,
        reasons: frame.reasons,
        mediaKind: "image",
        framesScanned: 1,
        version: "free-visual-v1",
      };
    }

    if (mimeType.startsWith("video/")) {
      const video = await loadVideoFromUrl(objectUrl);
      const duration = Math.max(1, Number(video.duration || 1));
      const checkpoints = uniqueSortedNumbers(
        [0.08, 0.18, 0.3, 0.42, 0.55, 0.68, 0.82, 0.94].map((ratio) => duration * ratio)
      );
      const results = [];

      for (const checkpoint of checkpoints) {
        await seekVideo(video, checkpoint);
        results.push(analyzeElementFrame(video, video.videoWidth, video.videoHeight));
      }

      const maxScore = Math.max(...results.map((item) => Number(item.unsafeScore || 0)), 0);
      const blockedCount = results.filter((item) => item.blocked).length;
      const blocked = blockedCount >= 2 || maxScore >= 0.66;

      return {
        scanned: true,
        blocked,
        unsafeScore: Number(maxScore.toFixed(3)),
        reasons: blocked ? ["A video frame may contain explicit or unsafe visual content."] : [],
        mediaKind: "video",
        framesScanned: results.length,
        version: "free-visual-v1",
      };
    }

    return {
      scanned: false,
      blocked: false,
      unsafeScore: 0,
      reasons: [],
      mediaKind: "other",
      framesScanned: 0,
      version: "free-visual-v1",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
