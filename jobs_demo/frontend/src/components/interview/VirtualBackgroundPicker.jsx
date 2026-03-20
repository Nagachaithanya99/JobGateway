import { useState } from "react";
import { FiCheck, FiImage } from "react-icons/fi";

export default function VirtualBackgroundPicker({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.id === value) || options[0];

  return (
    <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-[#0d1f17] px-3 py-2 text-xs font-semibold text-emerald-50 shadow-lg"
      >
        <FiImage />
        <span>Background</span>
        <span className="hidden rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-100 sm:inline">
          {activeOption?.label}
        </span>
      </button>

      {open ? (
        <div className="w-[292px] rounded-2xl border border-emerald-300/20 bg-[#14241d] p-3 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Virtual Background</p>
              <p className="mt-1 text-[11px] text-emerald-100/75">Matte green styles with sharp video output.</p>
              <p className="mt-1 text-[10px] text-emerald-200/60">4K is requested automatically when your camera and browser support it.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full bg-emerald-100/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-50"
            >
              Close
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {options.map((option) => {
              const selected = option.id === value;
              return (
                <button
                  key={option.id}
                  onClick={() => onChange(option.id)}
                  className={`rounded-xl border p-2 text-left transition ${
                    selected
                      ? "border-emerald-300 bg-emerald-400/10"
                      : "border-emerald-100/10 bg-[#182c23] hover:border-emerald-200/30"
                  }`}
                >
                  <div className="relative h-16 overflow-hidden rounded-lg" style={option.previewStyle}>
                    {selected ? (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-300 text-slate-950">
                        <FiCheck className="text-sm" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-semibold">{option.label}</p>
                  <p className="mt-1 text-[10px] text-emerald-50/70">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
