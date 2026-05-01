import { useEffect, useMemo, useState } from "react";
import { useClerk, useSignIn, useSignUp } from "@clerk/clerk-react";
import { FcGoogle } from "react-icons/fc";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { showSweetAlert } from "../../utils/sweetAlert.js";
import AuthShell from "./AuthShell.jsx";
import CompanyProfileFields from "./CompanyProfileFields.jsx";
import {
  AUTH_ROLE_OPTIONS,
  buildCompanyDraft,
  buildFinishUrl,
  buildUnsafeMetadata,
  getEmailCodeFactor,
  getRoleHomePath,
  getRoleLoginPath,
  getRoleSignupPath,
  getSelectableRole,
  hasGoogleFirstFactor,
  hasCompanyDraftDetails,
  hasPasswordFirstFactor,
  isAccountMissingError,
  isAlreadySignedInError,
  isExistingAccountError,
  isPasswordStrategyError,
  normalizeClerkError,
  sanitizeRedirect,
  savePendingAuth,
  splitFullName,
} from "./authFlow.js";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
const primaryButtonClassName =
  "inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_44%,#f97316_100%)] px-6 text-lg font-bold text-white shadow-[0_16px_34px_rgba(37,99,235,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-slate-600">{label}</div>
      {children}
    </label>
  );
}

function Alert({ tone = "error", children }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>{children}</div>;
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <div className="h-px flex-1 bg-slate-300" />
      <span>{children}</span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

function validateEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function validateCompanyDraft(draft) {
  if (!draft.companyName) return "Company name is required.";
  if (!draft.industry) return "Industry is required for company registration.";
  if (!draft.phone) return "Phone is required for company registration.";
  if (!draft.location) return "Location is required for company registration.";
  return "";
}

export default function AuthPage({ mode = "signin", fixedRole = null, initialRole = null }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, isAuthed, role: authRole, loading: authLoading } = useAuth();
  const { setActive, signOut } = useClerk();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();

  const isSignInMode = mode === "signin";
  const fallbackRole = getSelectableRole(initialRole || fixedRole || "student");
  const roleFromQuery = getSelectableRole(searchParams.get("role"), fallbackRole);
  const selectedRole = fixedRole || roleFromQuery;
  const redirectParam = searchParams.get("redirect") || "";
  const registered = searchParams.get("registered") === "1";
  const existing = searchParams.get("existing") === "1";
  const prefilledEmail = searchParams.get("email") || "";

  const [role, setRole] = useState(selectedRole);
  const [form, setForm] = useState({
    fullName: "",
    email: prefilledEmail,
    password: "",
    confirmPassword: "",
    companyName: "",
    industry: "",
    website: "",
    phone: "",
    location: "",
    about: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setRole(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    if (!prefilledEmail) return;
    setForm((current) => (current.email ? current : { ...current, email: prefilledEmail }));
  }, [prefilledEmail]);

  const companyDraft = useMemo(
    () =>
      buildCompanyDraft({
        ...form,
        contactName: form.fullName,
      }),
    [form],
  );
  const isVerificationStep = verificationStep === "signin" || verificationStep === "signup";

  const switchRole = (nextRole) => {
    const normalizedRole = getSelectableRole(nextRole);

    if (!fixedRole && normalizedRole === "admin") {
      navigate("/admin/login", { replace: true });
      return;
    }

    setRole(normalizedRole);

    if (fixedRole) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("role", normalizedRole);
    setSearchParams(nextParams, { replace: true });
  };

  const safeRedirect = sanitizeRedirect(redirectParam, role);
  const loginParams = new URLSearchParams();
  const signupParams = new URLSearchParams();

  if (!fixedRole) {
    loginParams.set("role", role);
    signupParams.set("role", role);
  }

  if (redirectParam) {
    loginParams.set("redirect", safeRedirect);
    signupParams.set("redirect", safeRedirect);
  }

  const loginPath = `${getRoleLoginPath(role)}${loginParams.toString() ? `?${loginParams.toString()}` : ""}`;
  const signupPath = `${getRoleSignupPath(role)}${signupParams.toString() ? `?${signupParams.toString()}` : ""}`;

  const redirectToAuthedArea = useMemo(
    () => getRoleHomePath(authRole || role),
    [authRole, role],
  );

  if (!authLoading && isAuthed) {
    return <Navigate to={redirectToAuthedArea} replace />;
  }

  if (!fixedRole && role === "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const continueExistingSession = () => {
    navigate(buildFinishUrl({ mode: "signin", role: authRole || role, redirect: safeRedirect }), {
      replace: true,
    });
  };

  const redirectToLoginAfterSignup = async ({ email, sessionId } = {}) => {
    if (sessionId) {
      try {
        await setActive({ session: sessionId });
      } catch {
        // Continue; some Clerk flows already have the session active.
      }
    }

    try {
      await signOut();
    } catch {
      // Continue to the sign-in screen even if there is no active session to clear.
    }

    setVerificationStep("");
    setVerificationCode("");

    const nextParams = new URLSearchParams();
    nextParams.set("registered", "1");
    if (email) nextParams.set("email", email);
    if (redirectParam) nextParams.set("redirect", safeRedirect);

    navigate(`${getRoleLoginPath(role)}?${nextParams.toString()}`, { replace: true });
  };

  const redirectToLoginForExistingAccount = () => {
    const nextParams = new URLSearchParams();
    nextParams.set("existing", "1");
    if (form.email.trim()) nextParams.set("email", form.email.trim());
    if (redirectParam) nextParams.set("redirect", safeRedirect);

    navigate(`${getRoleLoginPath(role)}?${nextParams.toString()}`, { replace: true });
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateSignUp = ({ requireName = true, requireEmail = true, requirePassword = true } = {}) => {
    if (requireName && !form.fullName.trim()) return "Name is required.";
    if (requireEmail && !validateEmail(form.email)) return "Enter a valid email address.";
    if (requirePassword && form.password.trim().length < 8) return "Password must be at least 8 characters.";
    if (requirePassword && form.password !== form.confirmPassword) return "Passwords do not match.";
    if (role === "company") return validateCompanyDraft(companyDraft);
    return "";
  };

  const completeSignIn = async (attempt) => {
    if (attempt.status !== "complete" || !attempt.createdSessionId) {
      return false;
    }

    await setActive({ session: attempt.createdSessionId });
    setVerificationStep("");
    setVerificationCode("");
    login({ user: { role } });
    navigate(buildFinishUrl({ mode: "signin", role, redirect: safeRedirect }), { replace: true });
    return true;
  };

  const handleSecondFactor = async (attempt) => {
    if (attempt.status !== "needs_second_factor") {
      return false;
    }

    const emailCodeFactor = getEmailCodeFactor(attempt.supportedSecondFactors);
    if (!emailCodeFactor) {
      throw new Error("This sign-in requires extra verification that is not available in this form.");
    }

    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailCodeFactor.emailAddressId,
    });

    setVerificationStep("signin");
    setVerificationCode("");
    setSuccess("We sent a sign-in code to your email. Enter it below to finish sign in.");
    return true;
  };

  const handleEmailSignIn = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!validateEmail(form.email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (!signInLoaded) return;

    setBusy("signin-email");

    try {
      const start = await signIn.create({
        identifier: form.email.trim(),
      });

      const firstFactors = Array.isArray(start?.supportedFirstFactors) ? start.supportedFirstFactors : [];

      if (!hasPasswordFirstFactor(firstFactors)) {
        if (hasGoogleFirstFactor(firstFactors)) {
          const message = "This account is configured for Google sign-in. Use Continue with Google to continue.";
          setError(message);
          if (role === "admin") {
            await showSweetAlert(message, "error", { title: "Unauthorized" });
          }
          return;
        }

        const message = "This account cannot sign in with email and password. Use the available sign-in method for this account.";
        setError(message);
        if (role === "admin") {
          await showSweetAlert(message, "error", { title: "Unauthorized" });
        }
        return;
      }

      const attempt = await signIn.attemptFirstFactor({
        strategy: "password",
        password: form.password,
      });

      if (await completeSignIn(attempt)) {
        return;
      }

      if (await handleSecondFactor(attempt)) {
        return;
      }

      throw new Error("We could not finish sign in. Please try again.");
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      if (isPasswordStrategyError(clerkError)) {
        const message = "This account cannot sign in with email and password. Use Continue with Google for this account.";
        setError(message);
        if (role === "admin") {
          await showSweetAlert(message, "error", { title: "Unauthorized" });
        }
        return;
      }

      if (isAccountMissingError(clerkError)) {
        const message =
          role === "admin"
            ? "Unauthorized: admin account not found. Please use the configured admin credentials or use Continue with Google if your admin account is setup."
            : "Account not found. Please check your email or sign up first.";
        setError(message);
        if (role === "admin") {
          await showSweetAlert(message, "error", { title: "Unauthorized" });
        }

        const nextParams = new URLSearchParams();
        nextParams.set("role", role);
        nextParams.set("email", form.email.trim());
        if (redirectParam) nextParams.set("redirect", safeRedirect);

        navigate(`${fixedRole ? getRoleSignupPath(role) : "/register"}?${nextParams.toString()}`, {
          replace: true,
        });
        return;
      }

      const normalized = normalizeClerkError(clerkError);
      setError(normalized.message);
      if (role === "admin") {
        await showSweetAlert(normalized.message, "error", { title: "Unauthorized" });
      }
    } finally {
      setBusy("");
    }
  };

  const handleVerifySignIn = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    if (!signInLoaded) return;

    setBusy("signin-verify");

    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: verificationCode.trim(),
      });

      if (await completeSignIn(attempt)) {
        return;
      }

      throw new Error("Verification is not complete yet. Please try the code again.");
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      if (isExistingAccountError(clerkError)) {
        redirectToLoginForExistingAccount();
        return;
      }

      setError(normalizeClerkError(clerkError).message);
    } finally {
      setBusy("");
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    if (!signInLoaded) return;

    setBusy("signin-google");

    try {
      savePendingAuth({
        mode: "signin",
        role,
        redirect: safeRedirect,
      });

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/callback",
        redirectUrlComplete: buildFinishUrl({ mode: "signin", role, redirect: safeRedirect }),
        continueSignIn: true,
        continueSignUp: true,
      });
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      const normalized = normalizeClerkError(clerkError);
      setError(normalized.message);
      if (role === "admin") {
        await showSweetAlert(normalized.message, "error", { title: "Unauthorized" });
      }
      setBusy("");
    }
  };

  const handleEmailSignUp = async (event) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateSignUp();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!signUpLoaded) return;

    setBusy("signup-email");

    try {
      const { firstName, lastName } = splitFullName(form.fullName);
      const unsafeMetadata = buildUnsafeMetadata({
        role,
        companyProfileDraft: role === "company" ? companyDraft : null,
        fullName: form.fullName,
      });

      const attempt = await signUp.create({
        firstName,
        lastName,
        emailAddress: form.email.trim(),
        password: form.password,
        unsafeMetadata,
      });

      if (attempt.status === "complete") {
        await redirectToLoginAfterSignup({
          email: form.email.trim(),
          sessionId: attempt.createdSessionId,
        });
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationStep("signup");
      setVerificationCode("");
      setSuccess("We sent a verification code to your email. Enter it below to finish sign up.");
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      setError(normalizeClerkError(clerkError).message);
    } finally {
      setBusy("");
    }
  };

  const handleVerifySignUp = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!verificationCode.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    if (!signUpLoaded) return;

    setBusy("signup-verify");

    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (attempt.status !== "complete") {
        throw new Error("Verification is not complete yet. Please try the code again.");
      }

      await redirectToLoginAfterSignup({
        email: form.email.trim(),
        sessionId: attempt.createdSessionId,
      });
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      setError(normalizeClerkError(clerkError).message);
    } finally {
      setBusy("");
    }
  };

  const handleGoogleSignUp = async () => {
    clearMessages();

    const validationError = validateSignUp({
      requireName: role === "company",
      requireEmail: false,
      requirePassword: false,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!signUpLoaded) return;

    setBusy("signup-google");

    try {
      savePendingAuth({
        mode: "signup",
        role,
        companyProfileDraft: role === "company" ? companyDraft : null,
        fullName: form.fullName,
      });

      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/callback",
        redirectUrlComplete: buildFinishUrl({ mode: "signup", role }),
        continueSignIn: true,
        continueSignUp: true,
        unsafeMetadata: buildUnsafeMetadata({
          role,
          companyProfileDraft: role === "company" ? companyDraft : null,
          fullName: form.fullName,
        }),
      });
    } catch (clerkError) {
      if (isAlreadySignedInError(clerkError)) {
        continueExistingSession();
        return;
      }

      setError(normalizeClerkError(clerkError).message);
      setBusy("");
    }
  };

  const panelCopy = isSignInMode
    ? {
        title: "Hello, Friend!",
        text: "Register with your personal details to use all site features.",
        actionLabel: "Sign Up",
        actionTo: signupPath,
      }
    : {
      title: "Welcome Back!",
      text: "Keep your profile connected and continue with the right account type.",
      actionLabel: "Sign In",
      actionTo: loginPath,
      };

  return (
      <AuthShell
      mode={isSignInMode ? "signin" : "signup"}
      title={
        verificationStep === "signin"
          ? "Verify Sign In"
          : verificationStep === "signup"
            ? "Verify Email"
            : isSignInMode
              ? "Sign In"
              : "Sign Up"
      }
      subtitle={
        verificationStep === "signin"
          ? "Complete sign in with the code sent to your inbox."
          : verificationStep === "signup"
            ? "Complete your registration with the code sent to your inbox."
          : isSignInMode
            ? "Use your email and password or continue with Google."
            : "Create the right account and finish setup in one place."
      }
      panelTitle={panelCopy.title}
      panelText={panelCopy.text}
      panelActionLabel={panelCopy.actionLabel}
      panelActionTo={panelCopy.actionTo}
    >
      <div className="space-y-4">
        {registered ? <Alert tone="success">Account created. Sign in to continue.</Alert> : null}
        {existing ? <Alert tone="success">Account already exists. Sign in to continue.</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        {error ? <Alert>{error}</Alert> : null}
      </div>

      {!fixedRole && !isVerificationStep ? (
        <div className="mb-5 mt-5">
          <Field label="Account Type">
            <select className={inputClassName} value={role} onChange={(event) => switchRole(event.target.value)}>
              {AUTH_ROLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        <div className="mt-5" />
      )}

      {isVerificationStep ? (
        <form className="space-y-5" onSubmit={verificationStep === "signin" ? handleVerifySignIn : handleVerifySignUp}>
          <Field label="Verification Code">
            <input
              className={inputClassName}
              type="text"
              inputMode="numeric"
              name="verificationCode"
              placeholder="Enter email code"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
            />
          </Field>

          <button
            className={primaryButtonClassName}
            type="submit"
            disabled={busy === "signin-verify" || busy === "signup-verify"}
          >
            {busy === "signin-verify" || busy === "signup-verify" ? "Verifying..." : "Verify And Continue"}
          </button>

          <button
            type="button"
            className="w-full text-sm font-semibold text-[#2563eb] hover:text-[#f97316]"
            onClick={() => {
              setVerificationStep("");
              setVerificationCode("");
              clearMessages();
            }}
          >
            {verificationStep === "signin" ? "Back to sign in" : "Back to sign up"}
          </button>
        </form>
      ) : isSignInMode ? (
        <form className="space-y-5" onSubmit={handleEmailSignIn}>
          <Field label="Email">
            <input
              className={inputClassName}
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
            />
          </Field>

          <Field label="Password">
            <input
              className={inputClassName}
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
            />
          </Field>

          <div className="flex justify-end">
            <Link to="/forgot" className="text-sm font-medium text-[#2563eb] hover:text-[#f97316]">
              Forgot Password?
            </Link>
          </div>

          <button className={primaryButtonClassName} type="submit" disabled={busy === "signin-email"}>
            {busy === "signin-email" ? "Signing In..." : "Sign In"}
          </button>

          <Divider>or continue with Google</Divider>

          <button
            type="button"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={handleGoogleSignIn}
            disabled={busy === "signin-google"}
          >
            <FcGoogle className="h-6 w-6" />
            <span>{busy === "signin-google" ? "Opening Google..." : "Continue with Google"}</span>
          </button>
        </form>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={handleGoogleSignUp}
            disabled={busy === "signup-google"}
          >
            <FcGoogle className="h-6 w-6" />
            <span>{busy === "signup-google" ? "Opening Google..." : "Continue with Google"}</span>
          </button>

          <Divider>or sign up with email</Divider>

          <form className="space-y-5" onSubmit={handleEmailSignUp}>
            <Field label={role === "company" ? "Contact Name" : "Your Name"}>
              <input
                className={inputClassName}
                type="text"
                name="fullName"
                placeholder={role === "company" ? "Contact person name" : "Your full name"}
                autoComplete="name"
                value={form.fullName}
                onChange={updateField}
              />
            </Field>

            <Field label="Email">
              <input
                className={inputClassName}
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
              />
            </Field>

            {role === "company" ? (
              <CompanyProfileFields values={form} onChange={updateField} required />
            ) : null}

            <Field label="Password">
              <input
                className={inputClassName}
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
              />
            </Field>

            <Field label="Confirm Password">
              <input
                className={inputClassName}
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={updateField}
              />
            </Field>

            <button className={primaryButtonClassName} type="submit" disabled={busy === "signup-email"}>
              {busy === "signup-email" ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </div>
      )}

      {!isSignInMode && role === "company" && hasCompanyDraftDetails(companyDraft) ? (
        <p className="mt-5 text-sm text-slate-600">
          Company details are saved to Clerk and synced to the backend after the first sign in.
        </p>
      ) : null}
    </AuthShell>
  );
}
