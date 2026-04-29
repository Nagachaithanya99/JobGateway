import { useState } from "react";
import { FiLock, FiLogIn, FiUser } from "react-icons/fi";
import { Navigate, useNavigate } from "react-router-dom";
import { ADMIN_LOGIN_CONFIG } from "../../config/adminLoginConfig.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { loginLocalAdmin } from "../../services/adminAuthService.js";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthed, role, login } = useAuth();
  const [form, setForm] = useState({
    username: ADMIN_LOGIN_CONFIG.username,
    email: ADMIN_LOGIN_CONFIG.email,
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isAuthed && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const data = await loginLocalAdmin(form);
      login({ token: data.token, user: data.user });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[linear-gradient(145deg,#0f172a_0%,#1d4ed8_52%,#f97316_100%)] p-10 text-white md:block">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Admin Console</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight">JobGateway Control Room</h1>
            <p className="mt-4 text-sm leading-6 text-blue-50">
              Only the admin username, email, and password configured in code can open this area.
            </p>
          </div>

          <div className="p-6 text-slate-900 sm:p-10">
            <div className="mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                <FiLock className="text-xl" />
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight">Admin Login</h2>
              <p className="mt-2 text-sm text-slate-500">Sign in with the configured admin account.</p>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Admin Username</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
                  <FiUser className="text-slate-400" />
                  <input name="username" value={form.username} onChange={update} className="h-14 flex-1 outline-none" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Admin Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update}
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={update}
                  autoComplete="current-password"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-base font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                <FiLogIn />
                {busy ? "Signing In..." : "Login As Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
