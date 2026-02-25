export default function Pagination({ page, pages, onChange }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-md border border-slate-200 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
      >
        Previous
      </button>

      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`h-8 w-8 rounded-md border text-sm font-bold transition ${
            n === page
              ? "bg-orange-600 border-orange-600 text-white"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="px-3 py-1.5 rounded-md border border-slate-200 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
      >
        Next
      </button>
    </div>
  );
}
