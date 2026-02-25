import { Navigate } from "react-router-dom";
import { SignUp, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";

function AdminRoleBlock() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const rawRole = user?.publicMetadata?.role ?? user?.unsafeMetadata?.role;
  const role = typeof rawRole === "string" ? rawRole.toLowerCase() : "";

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-700">Admin Access Required</h1>
        <p className="mt-2 text-sm text-red-700">
          Your Clerk account is signed in but does not have <code>role=admin</code> in metadata.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminSignup() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <SignedOut>
        <SignUp
          routing="path"
          path="/admin/signup"
          signInUrl="/admin/login"
          forceRedirectUrl="/admin"
          fallbackRedirectUrl="/admin"
        />
      </SignedOut>

      <SignedIn>
        <AdminRoleBlock />
      </SignedIn>
    </div>
  );
}
