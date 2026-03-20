import { useEffect, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { bootstrapAuthSession } from "../../services/authService.js";
import {
  buildCompanyDraft,
  clearPendingAuth,
  getRoleHomePath,
  getRoleLoginPath,
  getSelectableRole,
  hasCompanyDraftDetails,
  isRecentlyCreated,
  readPendingAuth,
  sanitizeRedirect,
} from "./authFlow.js";

export default function AuthFinishPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const pending = readPendingAuth();
  const fallbackRole = getSelectableRole(searchParams.get("role") || pending?.role);
  const fallbackLoginPath = getRoleLoginPath(fallbackRole);
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Checking your session...");

  useEffect(() => {
    if (!isLoaded) return;

    const currentParams = new URLSearchParams(searchKey);
    const mode = String(currentParams.get("mode") || pending?.mode || "signin").toLowerCase();
    const roleHint = getSelectableRole(currentParams.get("role") || pending?.role);
    const redirect = currentParams.get("redirect") || pending?.redirect || "";

    if (!isSignedIn) {
      clearPendingAuth();
      navigate(getRoleLoginPath(roleHint), { replace: true });
      return;
    }

    let cancelled = false;

    async function finishAuth() {
      try {
        const userCompanyDraft = buildCompanyDraft(user?.unsafeMetadata?.companyProfileDraft || {});
        const pendingCompanyDraft = buildCompanyDraft(pending?.companyProfileDraft || {});
        const companyProfileDraft = hasCompanyDraftDetails(pendingCompanyDraft)
          ? pendingCompanyDraft
          : userCompanyDraft;

        const needsCompanyOnboarding =
          mode === "signin" &&
          roleHint === "company" &&
          isRecentlyCreated(user?.createdAt) &&
          !hasCompanyDraftDetails(companyProfileDraft);

        if (needsCompanyOnboarding) {
          clearPendingAuth();
          navigate(`/auth/company-details?redirect=${encodeURIComponent(sanitizeRedirect(redirect, "company"))}`, {
            replace: true,
          });
          return;
        }

        setStatus("Syncing your account with the backend...");
        const payload = {
          roleHint,
          companyProfileDraft:
            roleHint === "company" && hasCompanyDraftDetails(companyProfileDraft)
              ? companyProfileDraft
              : undefined,
        };

        const data = await bootstrapAuthSession(payload);
        const resolvedRole = getSelectableRole(data?.user?.role || roleHint);
        const destination = sanitizeRedirect(redirect, resolvedRole);

        clearPendingAuth();

        if (cancelled) return;

        if (mode === "signup") {
          setStatus("Redirecting to your account...");
          navigate(destination || getRoleHomePath(resolvedRole), { replace: true });
          return;
        }

        navigate(destination || getRoleHomePath(resolvedRole), { replace: true });
      } catch (authError) {
        console.error("Auth finish failed:", authError);
        clearPendingAuth();

        if (cancelled) return;

        setError(authError?.response?.data?.message || authError?.message || "We could not finish the sign-in flow.");
      }
    }

    finishAuth();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, navigate, searchKey, user]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to={fallbackLoginPath} replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#2563eb]/15 border-t-[#f97316]" />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Finishing sign in</h1>
        <p className="mt-2 text-sm text-slate-500">{status}</p>
        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
