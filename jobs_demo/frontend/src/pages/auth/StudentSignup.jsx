import { SignUp } from "@clerk/clerk-react";
import LanguageSelector from "../../components/common/LanguageSelector.jsx";

export default function StudentSignup() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end" data-no-translate="true">
          <LanguageSelector />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
            Student Portal
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
            Create Student Account
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign up to browse jobs and track applications.
          </p>
        </div>

        <SignUp
          routing="path"
          path="/student/signup"
          signInUrl="/student/login"
          fallbackRedirectUrl="/student"
        />
        </div>
      </div>
    </div>
  );
}
