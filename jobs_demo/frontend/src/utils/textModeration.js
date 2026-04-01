const TEXT_BLOCK_RULES = [
  {
    reason: "Abusive language",
    patterns: ["fuck", "bitch", "bastard", "asshole", "motherfucker", "mf", "shit", "slut", "whore"],
  },
  {
    reason: "Hate speech",
    patterns: ["nigger", "faggot", "terrorist lover", "kill muslim", "kill hindu", "kill christian"],
  },
  {
    reason: "Sexual content",
    patterns: ["sex", "sexy", "sexual", "nude", "nudes", "porn", "xxx", "sex video", "escort", "onlyfans", "boobs", "breasts", "hot video"],
  },
  {
    reason: "Violence or threat",
    patterns: ["kill you", "murder", "bomb attack", "school shooting", "behead"],
  },
  {
    reason: "Illegal activity",
    patterns: ["sell drugs", "buy drugs", "fake certificate", "fake degree", "gun for sale", "human trafficking", "child porn"],
  },
];

function normalizeModerationText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(items = []) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function buildHaystacks(values = []) {
  const normalizedValues = values
    .map((value) => normalizeModerationText(value))
    .filter(Boolean);

  const source = normalizedValues.join(" ").trim();
  const collapsed = normalizedValues
    .map((value) =>
      value.replace(/\b(?:[a-z0-9]\s+){1,}[a-z0-9]\b/g, (match) =>
        match.replace(/\s+/g, "")
      )
    )
    .join(" ")
    .trim();

  return uniqueStrings([source, collapsed]);
}

export function scanUnsafeText(values = []) {
  const haystacks = buildHaystacks(values);
  if (!haystacks.length) {
    return { blocked: false, reasons: [], matchedTerms: [] };
  }

  const matchedTerms = [];
  const reasons = [];

  TEXT_BLOCK_RULES.forEach((rule) => {
    const ruleMatches = rule.patterns.filter((pattern) => {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
      return haystacks.some((source) => regex.test(source));
    });

    if (!ruleMatches.length) return;
    reasons.push(rule.reason);
    matchedTerms.push(...ruleMatches);
  });

  return {
    blocked: matchedTerms.length > 0,
    reasons: uniqueStrings(reasons),
    matchedTerms: uniqueStrings(matchedTerms),
  };
}
