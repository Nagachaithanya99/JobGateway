import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { bootstrapAuthSession } from "../../services/authService.js";
import AuthShell from "./AuthShell.jsx";
import CompanyProfileFields from "./CompanyProfileFields.jsx";
import { buildCompanyDraft, getRoleHomePath, getSelectableRole, sanitizeRedirect } from "./authFlow.js";

const primaryButtonClassName =
  "inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_44%,#f97316_100%)] px-6 text-lg font-bold text-white shadow-[0_16px_34px_rgba(37,99,235,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

export default function CompanyOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, user } = useUser();
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    website: "",
    phone: "",
    location: "",
    about: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;

    const draft = buildCompanyDraft(user.unsafeMetadata?.companyProfileDraft || {});
    setForm((current) => ({
      ...current,
      ...draft,
      companyName: draft.companyName || current.companyName || "",
    }));
  }, [isLoaded, user]);

  if (isLoaded && !user) {
    return <Navigate to="/company/login" replace />;
  }

  if (isLoaded && user) {
    const currentRole = getSelectableRole(user.publicMetadata?.role ?? user.unsafeMetadata?.role, "");

    if (currentRole && currentRole !== "company") {
      return <Navigate to={getRoleHomePath(currentRole)} replace />;
    }
  }

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const companyDraft = buildCompanyDraft({
      ...form,
      contactName: [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim(),
    });

    if (!companyDraft.companyName || !companyDraft.industry || !companyDraft.phone || !companyDraft.location) {
      setError("Company name, industry, phone, and location are required.");
      return;
    }

    try {
      setBusy(true);
      await bootstrapAuthSession({
        roleHint: "company",
        companyProfileDraft: companyDraft,
      });

      navigate(sanitizeRedirect(searchParams.get("redirect"), "company"), { replace: true });
    } catch (authError) {
      setError(authError?.response?.data?.message || authError?.message || "Failed to save company details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      mode="signup"
      title="Company Details"
      subtitle="Complete the company profile once so the backend account can be created correctly."
      panelTitle="Almost Done!"
      panelText="Add the company details now and we will take you straight to the company dashboard."
    >
      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <CompanyProfileFields values={form} onChange={updateField} required />

        <button className={primaryButtonClassName} type="submit" disabled={busy}>
          {busy ? "Saving Company..." : "Continue To Dashboard"}
        </button>
      </form>
    </AuthShell>
  );
}
