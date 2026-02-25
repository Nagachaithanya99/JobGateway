import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";

function ThemeShell({ children }) {
  return (
    <div className="min-h-screen bg-[#070b1b] px-4 py-8">
      <div
        className="mx-auto max-w-5xl rounded-2xl border border-orange-300/20 p-6 shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at 16% 26%, rgba(249,115,22,0.30), transparent 30%), radial-gradient(circle at 86% 24%, rgba(249,115,22,0.26), transparent 30%), radial-gradient(circle at 70% 86%, rgba(249,115,22,0.22), transparent 34%), linear-gradient(180deg, #0b1024 0%, #070b1b 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CompanySignedInPopup() {
  const nav = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [dismissed, setDismissed] = useState(false);

  const rawRole = user?.publicMetadata?.role ?? user?.unsafeMetadata?.role;
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "";
  const companyName = user?.organizationMemberships?.[0]?.organization?.name || user?.firstName || "Company";

  if (role && role !== "company") {
    return (
      <ThemeShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200/30 bg-red-950/30 p-6">
          <h1 className="text-xl font-semibold text-red-200">Company Access Required</h1>
          <p className="mt-2 text-sm text-red-100">
            Your Clerk account is signed in but does not have <code>role=company</code> in metadata.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 rounded-lg border border-red-300/40 bg-black/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900/30"
          >
            Sign out
          </button>
        </div>
      </ThemeShell>
    );
  }

  return (
    <ThemeShell>
      <div className="mx-auto max-w-[620px] pt-6 text-center">
        <p className="text-2xl font-semibold leading-none text-slate-300/90">JobGateway</p>
      </div>

      <div className="relative mx-auto mt-4 w-full max-w-[560px] rounded-2xl border border-slate-200/25 bg-slate-900/45 p-6 text-left text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-3 text-3xl leading-none text-slate-300 hover:text-white"
        >
          x
        </button>

        {!dismissed ? (
          <>
            <div className="flex items-start gap-3">
              <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FF8A2B] text-sm font-bold text-white shadow-[0_0_22px_rgba(249,115,22,0.7)]">
                OK
              </div>
              <div>
                <h2 className="text-4xl font-bold leading-none text-slate-100">Welcome {companyName}!</h2>
                <p className="mt-1 text-lg text-slate-300">You have successfully logged in as a company.</p>
              </div>
            </div>

            <div className="my-5 h-px bg-white/20" />

            <div className="space-y-3 text-[28px]">
              <p className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-slate-300">
                  <span className="mr-3 text-[#FF8A2B]">*</span>
                  Plan
                </span>
                <span className="font-medium text-slate-100">5 Jobs</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-300">
                  <span className="mr-3 text-[#3b82f6]">*</span>
                  Applications Remaining
                </span>
                <span className="font-medium text-slate-100">400</span>
              </p>
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => nav("/company/dashboard")}
          className="mt-6 w-full rounded-xl border border-orange-300/40 bg-gradient-to-b from-[#f28a4c] to-[#c94f1f] px-5 py-3 text-[30px] font-semibold text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] hover:brightness-110"
        >
          Go to Company Dashboard
        </button>
      </div>
    </ThemeShell>
  );
}

export default function CompanyLogin() {
  return (
    <>
      <SignedOut>
        <ThemeShell>
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <section className="rounded-2xl border border-orange-200/20 bg-slate-900/35 p-6 text-white backdrop-blur-sm">
              <h1 className="text-5xl font-bold leading-tight text-slate-100">Hire Smart. Hire Fast.</h1>
              <ul className="mt-4 space-y-2 text-lg text-slate-300">
                <li><span className="mr-2 text-[#FF8A2B]">*</span>AI Candidate Matching</li>
                <li><span className="mr-2 text-[#FF8A2B]">*</span>Smart Resume Ranking</li>
                <li><span className="mr-2 text-[#FF8A2B]">*</span>Video Interviews</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-orange-200/20 bg-white/10 p-5 backdrop-blur-md">
              <h2 className="mb-1 text-center text-2xl font-bold text-slate-100">Login as Company</h2>
              <p className="mb-4 text-center text-sm text-slate-300">Use your company account to continue</p>

              <SignIn
                routing="path"
                path="/company/login"
                signUpUrl="/company/signup"
                fallbackRedirectUrl="/company/login"
                forceRedirectUrl="/company/login"
                appearance={{
                  variables: {
                    colorPrimary: "#f97316",
                    colorBackground: "rgba(15, 23, 42, 0.55)",
                    colorInputBackground: "rgba(15, 23, 42, 0.7)",
                    colorInputText: "#e2e8f0",
                    colorText: "#e2e8f0",
                  },
                  elements: {
                    card: "shadow-none border border-orange-200/20 bg-transparent",
                    headerTitle: "text-slate-100",
                    headerSubtitle: "text-slate-300",
                    socialButtonsBlockButton: "bg-slate-900/40 border border-slate-600/40 text-slate-200",
                    formButtonPrimary: "bg-[#F97316] hover:bg-orange-600 text-white",
                    footerActionText: "text-slate-300",
                    footerActionLink: "text-orange-300",
                  },
                }}
              />
            </section>
          </div>
        </ThemeShell>
      </SignedOut>

      <SignedIn>
        <CompanySignedInPopup />
      </SignedIn>
    </>
  );
}
