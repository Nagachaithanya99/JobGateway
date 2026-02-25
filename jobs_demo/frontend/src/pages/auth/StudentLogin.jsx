import { Navigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import LanguageSelector from "../../components/common/LanguageSelector.jsx";

function ThemeShell({ children }) {
  return (
    <div className="min-h-screen bg-[#e9edf7] px-4 py-8">
      <div className="mx-auto mb-3 flex max-w-5xl justify-end" data-no-translate="true">
        <LanguageSelector />
      </div>
      <div
        className="mx-auto max-w-5xl rounded-2xl border border-blue-200/60 p-6 shadow-xl"
        style={{
          background:
            "radial-gradient(circle at 20% 25%, rgba(59,130,246,0.18), transparent 32%), radial-gradient(circle at 85% 35%, rgba(99,102,241,0.15), transparent 30%), linear-gradient(180deg, #f7fbff 0%, #e7efff 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function StudentLogin() {
  return (
    <>
      <SignedOut>
        <ThemeShell>
          <div className="mx-auto max-w-[920px] rounded-2xl border border-blue-200/70 bg-white/60 p-6 shadow-lg backdrop-blur-sm">
            <section className="text-center">
              <h1 className="text-5xl font-bold text-[#1E3A8A]">Find Your Dream Job Today</h1>
              <p className="mt-2 text-xl text-slate-600">10,000+ companies are hiring on JobGateway</p>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
              <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-b from-[#f8fbff] to-[#e8f0ff] p-4">
                <div className="flex h-[220px] w-full items-center justify-center rounded-xl border border-blue-100 bg-white/70 text-5xl font-bold text-[#1E3A8A]">
                  STUDENT
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-blue-100 bg-white/80 p-3 text-center">
                  <div>
                    <p className="text-4xl font-bold text-[#1E3A8A]">25K+</p>
                    <p className="text-sm text-slate-500">Students</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-[#1E3A8A]">8K+</p>
                    <p className="text-sm text-slate-500">Jobs</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-[#1E3A8A]">3K+</p>
                    <p className="text-sm text-slate-500">Companies</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-blue-200/70 bg-white/75 p-5 backdrop-blur-sm">
                <h2 className="mb-1 text-center text-3xl font-bold text-[#1E3A8A]">Welcome Back!</h2>
                <p className="mb-4 text-center text-sm text-slate-500">Sign in to continue</p>

                <SignIn
                  routing="path"
                  path="/student/login"
                  signUpUrl="/student/signup"
                  fallbackRedirectUrl="/student"
                  forceRedirectUrl="/student"
                  appearance={{
                    variables: {
                      colorPrimary: "#f97316",
                      colorBackground: "rgba(255,255,255,0.50)",
                      colorInputBackground: "rgba(248,250,252,0.9)",
                      colorInputText: "#0f172a",
                      colorText: "#0f172a",
                    },
                    elements: {
                      card: "shadow-none border border-blue-200/60 bg-transparent",
                      headerTitle: "text-[#1E3A8A]",
                      headerSubtitle: "text-slate-500",
                      socialButtonsBlockButton: "bg-white border border-slate-200 text-slate-700",
                      formButtonPrimary: "bg-[#F97316] hover:bg-orange-600 text-white",
                      footerActionText: "text-slate-500",
                      footerActionLink: "text-[#2563EB]",
                    },
                  }}
                />
              </section>
            </div>
          </div>
        </ThemeShell>
      </SignedOut>

      <SignedIn>
        <Navigate to="/student" replace />
      </SignedIn>
    </>
  );
}
