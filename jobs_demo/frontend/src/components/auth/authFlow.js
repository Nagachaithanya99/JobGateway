const PENDING_AUTH_KEY = "jobgateway.pendingAuth";

export const AUTH_ROLE_OPTIONS = [
  { value: "student", label: "Student / Candidate" },
  { value: "company", label: "Company" },
  { value: "admin", label: "Admin" },
];

export function getSelectableRole(value, fallback = "student") {
  const next = String(value || "").toLowerCase();
  return ["student", "company", "admin"].includes(next) ? next : fallback;
}

export function getRoleLoginPath(role) {
  if (role === "company") return "/company/login";
  if (role === "admin") return "/admin/login";
  return "/student/login";
}

export function getRoleSignupPath(role) {
  if (role === "company") return "/company/signup";
  if (role === "admin") return "/admin/signup";
  return "/student/signup";
}

export function getRoleHomePath(role) {
  if (role === "company") return "/company/dashboard";
  if (role === "admin") return "/admin";
  return "/student";
}

export function sanitizeRedirect(redirect, role) {
  const safeRedirect = String(redirect || "");
  if (!safeRedirect.startsWith("/")) {
    return getRoleHomePath(role);
  }

  if (role === "company" && !safeRedirect.startsWith("/company")) {
    return getRoleHomePath(role);
  }

  if (role === "student" && !safeRedirect.startsWith("/student")) {
    return getRoleHomePath(role);
  }

  if (role === "admin" && !safeRedirect.startsWith("/admin")) {
    return getRoleHomePath(role);
  }

  return safeRedirect;
}

export function buildFinishUrl({ mode, role, redirect } = {}) {
  const params = new URLSearchParams();
  params.set("mode", mode || "signin");
  params.set("role", getSelectableRole(role));

  if (redirect) {
    params.set("redirect", redirect);
  }

  return `/auth/finish?${params.toString()}`;
}

export function splitFullName(fullName) {
  const clean = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!clean) return { firstName: "", lastName: "" };

  const parts = clean.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function buildCompanyDraft(input = {}) {
  const source = input && typeof input === "object" ? input : {};

  return {
    contactName: String(source.contactName || source.fullName || "").trim(),
    companyName: String(source.companyName || source.name || "").trim(),
    industry: String(source.industry || "").trim(),
    website: String(source.website || "").trim(),
    phone: String(source.phone || "").trim(),
    location: String(source.location || "").trim(),
    about: String(source.about || "").trim(),
  };
}

export function hasCompanyDraftDetails(draft = {}) {
  return Object.values(buildCompanyDraft(draft)).some(Boolean);
}

export function buildUnsafeMetadata({ role, companyProfileDraft, fullName } = {}) {
  const metadata = {
    role: getSelectableRole(role),
  };

  const safeCompanyDraft = buildCompanyDraft({
    ...companyProfileDraft,
    contactName: fullName || companyProfileDraft?.contactName,
  });

  if (hasCompanyDraftDetails(safeCompanyDraft)) {
    metadata.companyProfileDraft = safeCompanyDraft;
  }

  if (fullName) {
    metadata.contactName = String(fullName).trim();
  }

  return metadata;
}

export function normalizeClerkError(error) {
  const first = Array.isArray(error?.errors) ? error.errors[0] : null;
  const message =
    first?.longMessage ||
    first?.message ||
    error?.message ||
    "Authentication failed. Please try again.";
  const code = first?.code || error?.code || "";

  return {
    message: String(message || "Authentication failed. Please try again."),
    code: String(code || ""),
  };
}

export function isAccountMissingError(error) {
  const { code, message } = normalizeClerkError(error);
  const normalizedCode = code.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  return (
    (normalizedCode.includes("identifier") && normalizedCode.includes("not")) ||
    normalizedMessage.includes("couldn't find your account") ||
    normalizedMessage.includes("cannot find your account") ||
    normalizedMessage.includes("account not found") ||
    normalizedMessage.includes("identifier not found")
  );
}

export function isAlreadySignedInError(error) {
  const { code, message } = normalizeClerkError(error);
  const normalizedCode = code.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedCode.includes("session_exists") ||
    normalizedCode.includes("already_signed") ||
    normalizedMessage.includes("already signed in") ||
    normalizedMessage.includes("already have an active session") ||
    normalizedMessage.includes("active session already exists")
  );
}

export function isPasswordStrategyError(error) {
  const { code, message } = normalizeClerkError(error);
  const normalizedCode = code.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedCode.includes("strategy") ||
    normalizedCode.includes("password") ||
    normalizedMessage.includes("verification strategy is not valid") ||
    normalizedMessage.includes("password is not enabled") ||
    normalizedMessage.includes("password is not supported")
  );
}

export function isExistingAccountError(error) {
  const { code, message } = normalizeClerkError(error);
  const normalizedCode = code.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedCode.includes("already_exists") ||
    normalizedCode.includes("identifier_exists") ||
    normalizedCode.includes("form_identifier_exists") ||
    normalizedCode.includes("already_registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already been used") ||
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already associated") ||
    normalizedMessage.includes("is taken")
  );
}

export function hasPasswordFirstFactor(factors = []) {
  return Array.isArray(factors)
    ? factors.some((factor) => String(factor?.strategy || "").toLowerCase() === "password")
    : false;
}

export function hasGoogleFirstFactor(factors = []) {
  return Array.isArray(factors)
    ? factors.some((factor) => String(factor?.strategy || "").toLowerCase() === "oauth_google")
    : false;
}

export function getEmailCodeFactor(factors = []) {
  if (!Array.isArray(factors)) return null;

  return (
    factors.find((factor) => String(factor?.strategy || "").toLowerCase() === "email_code") || null
  );
}

export function savePendingAuth(payload = {}) {
  try {
    sessionStorage.setItem(
      PENDING_AUTH_KEY,
      JSON.stringify({
        ...payload,
        role: getSelectableRole(payload.role),
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures and let Clerk continue.
  }
}

export function readPendingAuth() {
  try {
    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingAuth() {
  try {
    sessionStorage.removeItem(PENDING_AUTH_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function isRecentlyCreated(createdAt, windowMs = 5 * 60 * 1000) {
  if (!createdAt) return false;

  const time = new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return false;

  return Date.now() - time <= windowMs;
}
