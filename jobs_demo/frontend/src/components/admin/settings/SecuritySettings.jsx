import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiKey, FiLock, FiShield, FiCheckCircle } from "react-icons/fi";
import { showSweetToast } from "../../../utils/sweetAlert.js";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition border ${
        checked ? "bg-brand-500 border-brand-500" : "bg-slate-200 border-slate-200"
      }`}
      aria-label="toggle"
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SecuritySettings({ security, onChange }) {
  const sec = security || { twoFactor: false };

  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const ok = useMemo(() => {
    if (!pw.next) return false;
    if (pw.next.length < 6) return false;
    if (pw.next !== pw.confirm) return false;
    return true;
  }, [pw]);

  const submit = (e) => {
    e.preventDefault();
    // UI only
    void showSweetToast("Password updated (UI only)", "success");
    setPw({ current: "", next: "", confirm: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted font-semibold">Security</div>
          <h3 className="text-lg font-extrabold mt-1">Account Security</h3>
          <p className="text-sm text-muted mt-1">
            Manage password and two-factor authentication
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <FiShield />
        </div>
      </div>

      {/* 2FA */}
      <div className="mt-6 flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <FiLock />
          </div>
          <div>
            <div className="font-semibold text-ink">Two-factor authentication</div>
            <div className="text-xs text-muted mt-1">
              Recommended for admin accounts
            </div>
          </div>
        </div>

        <Toggle
          checked={!!sec.twoFactor}
          onChange={(v) => onChange?.({ ...sec, twoFactor: v })}
        />
      </div>

      {/* Password */}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiKey /> Change Password
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="password"
            className="input"
            placeholder="Current password"
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
          />
          <input
            type="password"
            className="input"
            placeholder="New password (min 6)"
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
          />
          <input
            type="password"
            className="input"
            placeholder="Confirm new password"
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted">
            {ok ? (
              <span className="inline-flex items-center gap-1 text-green-700">
                <FiCheckCircle /> Ready to update
              </span>
            ) : (
              "New password must be 6+ chars and match confirm"
            )}
          </div>

          <button
            type="submit"
            disabled={!ok}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
        </div>
      </form>
    </motion.div>
  );
}
