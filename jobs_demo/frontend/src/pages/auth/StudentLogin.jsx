import { Navigate, useSearchParams } from "react-router-dom";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

export default function StudentLogin() {
  const [params] = useSearchParams();
  const redirectParam = String(params.get("redirect") || "");
  const safeRedirect = redirectParam.startsWith("/student")
    ? redirectParam
    : redirectParam.startsWith("/")
    ? `/student${redirectParam === "/" ? "" : redirectParam}`
    : "/student";

  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">Student Login</h1>
            <p className="mb-4 text-center text-sm text-slate-500">Sign in to continue</p>
            <SignIn
              routing="path"
              path="/student/login"
              signUpUrl="/student/signup"
              fallbackRedirectUrl={safeRedirect}
              forceRedirectUrl={safeRedirect}
            />
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <Navigate to="/student" replace />
      </SignedIn>
    </>
  );
}
