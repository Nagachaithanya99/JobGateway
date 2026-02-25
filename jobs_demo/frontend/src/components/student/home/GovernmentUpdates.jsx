const items = [
  {
    title: "Junior Engineer (Civil)",
    dept: "Public Works Department",
    vacancies: "150 Vacancies",
    deadline: "15/03/2026",
  },
  {
    title: "Staff Selection Commission - Combined Graduate Level",
    dept: "Staff Selection Commission",
    vacancies: "5000 Vacancies",
    deadline: "20/03/2026",
  },
  {
    title: "Bank Probationary Officer",
    dept: "State Bank of India",
    vacancies: "2000 Vacancies",
    deadline: "10/03/2026",
  },
];

export default function GovernmentUpdates() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-4xl font-extrabold text-slate-900">
            Government Job Updates
          </h2>
          <button className="px-6 py-2 rounded-xl border border-orange-300 text-orange-700 font-semibold hover:bg-orange-50 transition">
            View All
          </button>
        </div>

        <div className="mt-10 space-y-6">
          {items.map((x) => (
            <div
              key={x.title}
              className="border border-slate-200 rounded-2xl shadow-sm bg-white p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{x.title}</h3>
                <div className="mt-2 text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{x.dept}</span>
                  <span>•</span>
                  <span>{x.vacancies}</span>
                  <span>•</span>
                  <span>
                    Deadline: <span className="text-red-600 font-semibold">{x.deadline}</span>
                  </span>
                </div>
              </div>

              <button className="px-7 py-2 rounded-xl border border-orange-300 text-orange-700 font-semibold hover:bg-orange-50 transition">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
