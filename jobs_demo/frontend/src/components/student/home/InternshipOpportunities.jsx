import Button from "../../common/Button.jsx";

const INTERNS = [
  {
    id: "i1",
    role: "Sales Intern",
    company: "CareerGate",
    location: "Bengaluru",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "i2",
    role: "Web Developer Intern",
    company: "DevNest",
    location: "Remote",
    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "i3",
    role: "Digital Marketing Intern",
    company: "GrowthLab",
    location: "Hyderabad",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function InternshipOpportunities() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Internship Opportunities</h2>
        <button
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          onClick={() => alert("View all internships (next step)")}
        >
          View all →
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {INTERNS.map((x) => (
          <div
            key={x.id}
            className="rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-sm transition"
          >
            <img src={x.img} alt={x.role} className="h-36 w-full object-cover" />
            <div className="p-4 space-y-2">
              <div className="font-extrabold text-slate-900">{x.role}</div>
              <div className="text-sm text-slate-600">
                {x.company} • {x.location}
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={() => alert(`Apply Internship: ${x.role} (next step)`)}
                  className="w-full"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => alert(`Details: ${x.role} (next step)`)}
                  className="w-full"
                >
                  Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Internship details page + apply flow will be connected in next step.
      </p>
    </section>
  );
}
