import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold">Forgot Password</h1>
        <p className="text-muted mt-2 text-sm">
          (UI only) We will connect this to backend email later.
        </p>

        <div className="mt-6">
          <Link to="/admin/login" className="text-brand-600 font-semibold">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
