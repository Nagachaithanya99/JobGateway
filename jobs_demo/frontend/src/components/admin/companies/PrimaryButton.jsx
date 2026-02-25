export default function PrimaryButton({ children, onClick, variant = "primary", className = "" }) {
  const variants = {
    primary: "bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8]",
    outline: "bg-white text-[#2563EB] border-blue-200 hover:bg-blue-50",
    danger: "bg-white text-red-600 border-red-200 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
