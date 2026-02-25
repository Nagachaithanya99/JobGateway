import { motion } from "framer-motion";
import { FiDroplet } from "react-icons/fi";

const THEMES = [
  { key: "orange", label: "Orange (Default)" },
  { key: "blue", label: "Blue" },
  { key: "green", label: "Green" },
];

export default function ThemeSettings({ theme, onChange }) {
  const th = theme || { accent: "orange" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted font-semibold">Appearance</div>
          <h3 className="text-lg font-extrabold mt-1">Theme Switcher</h3>
          <p className="text-sm text-muted mt-1">
            Choose accent color for admin UI (UI only)
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
          <FiDroplet />
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const active = th.accent === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange?.({ ...th, accent: t.key })}
              className={`p-4 rounded-2xl border text-left transition ${
                active
                  ? "border-brand-300 bg-brand-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-semibold text-ink">{t.label}</div>
              <div className="text-xs text-muted mt-1">
                Accent: <b className="text-ink">{t.key}</b>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500" />
                <span className="w-5 h-5 rounded-full bg-blue-500" />
                <span className="w-5 h-5 rounded-full bg-green-500" />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
