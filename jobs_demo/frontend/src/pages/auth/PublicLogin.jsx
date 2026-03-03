import { useMemo } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const roleRoutes = {
  student: "/student/login",
  company: "/company/login",
  admin: "/admin/login",
};

export default function PublicLogin() {
  const { isAuthed, role: authRole } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const roleParam = String(params.get("role") || "student").toLowerCase();
  const selectedRole = roleParam in roleRoutes ? roleParam : "student";
  const redirect = String(params.get("redirect") || "");

  const roleButtons = useMemo(
    () => [
      { id: "student", label: "Student" },
      { id: "company", label: "Company" },
      { id: "admin", label: "Admin" },
    ],
    []
  );

  const continueToRole = () => {
    const target = roleRoutes[selectedRole] || roleRoutes.student;
    nav(redirect ? `${target}?redirect=${encodeURIComponent(redirect)}` : target);
  };

  if (isAuthed) {
    if (authRole === "student" || !authRole) return <Navigate to="/student" replace />;
    if (authRole === "company") return <Navigate to="/company/dashboard" replace />;
    if (authRole === "admin") return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Select role to continue.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {roleButtons.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                params.set("role", item.id);
                setParams(params, { replace: true });
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                selectedRole === item.id
                  ? "border-blue-200 bg-blue-50 text-[#2563EB]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={continueToRole}
          className="mt-5 w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          New user?{" "}
          <Link to={`/register?role=${selectedRole}`} className="font-semibold text-[#2563EB] hover:text-blue-700">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
