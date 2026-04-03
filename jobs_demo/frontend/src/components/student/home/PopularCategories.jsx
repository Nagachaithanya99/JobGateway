import { showSweetAlert } from "../../../utils/sweetAlert.js";

const CATS = [
  { name: "IT & Software", emoji: "💻" },
  { name: "Marketing", emoji: "📣" },
  { name: "Healthcare", emoji: "🩺" },
  { name: "Finance", emoji: "💰" },
  { name: "Design", emoji: "🎨" },
];

export default function PopularCategories() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Popular Categories</h2>
        <button
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          onClick={() => void showSweetAlert("View all categories (next step)")}
        >
          View all →
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CATS.map((c) => (
          <button
            key={c.name}
            onClick={() => void showSweetAlert(`Open category: ${c.name} (next step)`)}
            className="text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-200 hover:shadow-sm transition"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-2 font-bold text-slate-900">{c.name}</div>
            <div className="text-xs text-slate-500 mt-1">Explore jobs</div>
          </button>
        ))}
      </div>
    </section>
  );
}
