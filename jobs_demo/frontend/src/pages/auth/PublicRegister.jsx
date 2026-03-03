import { useMemo } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

const roleRoutes = {
  student: "/student/signup",
  company: "/company/signup",
  admin: "/admin/signup",
};

export default function PublicRegister() {
  const { isAuthed, role: authRole } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const roleParam = String(params.get("role") || "student").toLowerCase();
  const selectedRole = roleParam in roleRoutes ? roleParam : "student";

  const roleButtons = useMemo(
    () => [
      { id: "student", label: "Student" },
      { id: "company", label: "Company" },
      { id: "admin", label: "Admin" },
    ],
    []
  );

  if (isAuthed) {
    if (authRole === "student" || !authRole) return <Navigate to="/student" replace />;
    if (authRole === "company") return <Navigate to="/company/dashboard" replace />;
    if (authRole === "admin") return <Navigate to="/admin" replace />;
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Create Account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Default registration is Student. You can also register Company or Admin.
        </p>

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
          onClick={() => nav(roleRoutes[selectedRole] || roleRoutes.student)}
          className="mt-5 w-full rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Already have account?{" "}
          <Link to={`/login?role=${selectedRole}`} className="font-semibold text-[#2563EB] hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
