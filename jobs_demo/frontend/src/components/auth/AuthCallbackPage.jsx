import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import {
  buildUnsafeMetadata,
  getRoleLoginPath,
  getRoleSignupPath,
  getSelectableRole,
  readPendingAuth,
} from "./authFlow.js";

export default function AuthCallbackPage() {
  const pending = readPendingAuth();
  const role = getSelectableRole(pending?.role);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#2563eb]/15 border-t-[#f97316]" />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Finishing authentication</h1>
        <p className="mt-2 text-sm text-slate-500">Please wait while we complete your Clerk session.</p>

        <div className="sr-only">
          <AuthenticateWithRedirectCallback
            signInUrl={getRoleLoginPath(role)}
            signUpUrl={getRoleSignupPath(role)}
            continueSignUpUrl={getRoleSignupPath(role)}
            unsafeMetadata={buildUnsafeMetadata({
              role,
              companyProfileDraft: pending?.companyProfileDraft,
              fullName: pending?.fullName,
            })}
          />
        </div>
      </div>
    </div>
  );
}
