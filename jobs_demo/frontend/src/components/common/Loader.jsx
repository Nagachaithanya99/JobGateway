export default function Loader({ label = "Loading..." }) {
  return (
    <div className="w-full py-10 flex items-center justify-center gap-3 text-slate-600">
      <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-brand-500 animate-spin" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
