import { SignUp } from "@clerk/clerk-react";

export default function CompanySignup() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm border border-orange-100">
            Company Portal
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Create Company Account
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign up to post jobs and manage candidates.
          </p>
        </div>

        <SignUp
          routing="path"
          path="/company/signup"
          signInUrl="/company/login"
          afterSignUpUrl="/company/dashboard"
          afterSignInUrl="/company/dashboard"
        />
      </div>
    </div>
  );
}
