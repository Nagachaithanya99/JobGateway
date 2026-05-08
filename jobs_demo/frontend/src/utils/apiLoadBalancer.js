const DEFAULT_COOLDOWN_MS = 20000;
const DEFAULT_FAILURE_THRESHOLD = 2;
const DEFAULT_LATENCY_MS = 500;

function nowMs() {
  return Date.now();
}

function normalizeBaseUrl(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

function isSafeRetryMethod(method = "get") {
  return ["get", "head", "options"].includes(String(method || "get").toLowerCase());
}

export function createApiLoadBalancer(baseUrls = [], options = {}) {
  const urls = [...new Set(baseUrls.map(normalizeBaseUrl).filter(Boolean))];
  const cooldownMs = Number(options.cooldownMs || DEFAULT_COOLDOWN_MS);
  const failureThreshold = Number(options.failureThreshold || DEFAULT_FAILURE_THRESHOLD);
  const fallbackLatencyMs = Number(options.fallbackLatencyMs || DEFAULT_LATENCY_MS);
  let cursor = 0;

  const nodes = urls.map((url) => ({
    url,
    healthy: true,
    failures: 0,
    latencyMs: fallbackLatencyMs,
    openUntil: 0,
    inFlight: 0,
    lastUsedAt: 0,
  }));

  function getNodes() {
    return nodes.map((node) => ({ ...node }));
  }

  function getNode(url) {
    const normalized = normalizeBaseUrl(url);
    return nodes.find((node) => node.url === normalized) || null;
  }

  function scoreNode(node, index) {
    const openPenalty = node.openUntil > nowMs() ? 100000 : 0;
    const healthPenalty = node.healthy ? 0 : 50000;
    const latency = Number.isFinite(node.latencyMs) ? node.latencyMs : fallbackLatencyMs;
    const rotationPenalty = (index - cursor + nodes.length) % Math.max(nodes.length, 1);
    return openPenalty + healthPenalty + latency + node.inFlight * 125 + node.failures * 250 + rotationPenalty;
  }

  function pick(preferredUrl = "") {
    if (!nodes.length) return "";

    const preferredNode = getNode(preferredUrl);
    if (preferredNode && preferredNode.openUntil <= nowMs()) {
      preferredNode.inFlight += 1;
      preferredNode.lastUsedAt = nowMs();
      return preferredNode.url;
    }

    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    nodes.forEach((node, index) => {
      const score = scoreNode(node, index);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    cursor = (bestIndex + 1) % nodes.length;
    nodes[bestIndex].inFlight += 1;
    nodes[bestIndex].lastUsedAt = nowMs();
    return nodes[bestIndex].url;
  }

  function release(url) {
    const node = getNode(url);
    if (!node) return;
    node.inFlight = Math.max(0, node.inFlight - 1);
  }

  function markSuccess(url, latencyMs = fallbackLatencyMs) {
    const node = getNode(url);
    if (!node) return;
    const safeLatency = Number.isFinite(Number(latencyMs)) ? Number(latencyMs) : fallbackLatencyMs;
    node.healthy = true;
    node.failures = 0;
    node.openUntil = 0;
    node.latencyMs = Math.round(node.latencyMs * 0.7 + safeLatency * 0.3);
    release(url);
  }

  function markFailure(url) {
    const node = getNode(url);
    if (!node) return;
    node.failures += 1;
    node.healthy = false;
    if (node.failures >= failureThreshold) {
      node.openUntil = nowMs() + cooldownMs;
    }
    release(url);
  }

  function shouldRetry(error) {
    const config = error?.config || {};
    if (!isSafeRetryMethod(config.method)) return false;
    if (config.__jgRetried) return false;
    if (nodes.length <= 1) return false;

    const status = Number(error?.response?.status || 0);
    return !status || [408, 429, 500, 502, 503, 504].includes(status);
  }

  return {
    getNodes,
    markFailure,
    markSuccess,
    pick,
    shouldRetry,
  };
}
