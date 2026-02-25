import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";

function ThemedShell({ children }) {
  return (
    <div className="min-h-screen bg-[#070b1b] px-4 py-8">
      <div
        className="mx-auto max-w-5xl rounded-2xl border border-orange-300/20 p-6 shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at 15% 25%, rgba(249,115,22,0.35), transparent 30%), radial-gradient(circle at 85% 35%, rgba(249,115,22,0.25), transparent 28%), radial-gradient(circle at 50% 85%, rgba(249,115,22,0.22), transparent 32%), linear-gradient(180deg, #0b1024 0%, #070b1b 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AdminRoleBlock() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const nav = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const rawRole = user?.publicMetadata?.role ?? user?.unsafeMetadata?.role;
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "";

  if (role !== "admin") {
    return (
      <ThemedShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200/30 bg-red-950/30 p-6">
          <h1 className="text-xl font-semibold text-red-200">Admin Access Required</h1>
          <p className="mt-2 text-sm text-red-100">
            Your Clerk account is signed in but does not have <code>role=admin</code> in metadata.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-4 rounded-lg border border-red-300/40 bg-black/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-900/30"
          >
            Sign out
          </button>
        </div>
      </ThemedShell>
    );
  }

  return (
    <ThemedShell>
      <div className="mx-auto max-w-[620px] pt-6 text-center">
        <p className="text-2xl font-semibold leading-none text-slate-300/90">Admin Control Panel</p>
        <div className="mt-2 text-7xl leading-none">🛡️</div>
      </div>

      <div className="relative mx-auto -mt-2 w-full max-w-[560px] rounded-2xl border border-slate-200/25 bg-slate-900/45 p-6 text-left text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-3 text-3xl leading-none text-slate-300 hover:text-white"
        >
          ×
        </button>
        {!dismissed ? (
          <>
            <div className="flex items-start gap-3">
              <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#FF8A2B] text-2xl text-white shadow-[0_0_22px_rgba(249,115,22,0.7)]">
                ✓
              </div>
              <div>
                <h2 className="text-4xl font-bold leading-none text-slate-100">Welcome Admin!</h2>
                <p className="mt-1 text-lg text-slate-300">You have successfully logged in.</p>
              </div>
            </div>

            <div className="my-5 h-px bg-white/20" />

            <div className="space-y-3 text-[28px]">
              <p className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-slate-300">
                  <span className="mr-3 text-[#FF8A2B]">•</span>
                  Account Status
                </span>
                <span className="font-medium text-slate-100">
                  <span className="mr-2 text-green-400">●</span>Active
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-300">
                  <span className="mr-3 text-[#FF8A2B]">•</span>
                  Plan
                </span>
                <span className="font-medium text-slate-100">Unlimited</span>
              </p>
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => nav("/admin")}
          className="mt-6 w-full rounded-xl border border-orange-300/40 bg-gradient-to-b from-[#f28a4c] to-[#c94f1f] px-5 py-3 text-[30px] font-semibold text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] hover:brightness-110"
        >
          Go to Admin Dashboard
        </button>
      </div>
    </ThemedShell>
  );
}

export default function AdminLogin() {
  return (
    <>
      <SignedOut>
        <ThemedShell>
          <div className="mx-auto max-w-md rounded-2xl border border-orange-200/30 bg-white/10 p-6 backdrop-blur-md">
            <h1 className="mb-1 text-center text-4xl font-bold text-slate-100">Admin Control Panel</h1>
            <p className="mb-4 text-center text-sm text-slate-300">Secure admin access</p>

            <SignIn
              routing="path"
              path="/admin/login"
              signUpUrl="/admin/signup"
              fallbackRedirectUrl="/admin/login"
              forceRedirectUrl="/admin/login"
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
          </div>
        </ThemedShell>
      </SignedOut>

      <SignedIn>
        <AdminRoleBlock />
      </SignedIn>
    </>
  );
}
