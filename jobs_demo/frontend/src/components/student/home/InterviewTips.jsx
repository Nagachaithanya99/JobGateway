const tips = [
  {
    title: "How to Prepare for Technical Interviews",
    desc: "Essential tips and strategies for acing your technical interviews",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop",
  },
  {
    title: "Common HR Interview Questions",
    desc: "Most frequently asked questions and how to answer them",
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop",
  },
  {
    title: "Body Language Tips",
    desc: "Non-verbal communication techniques for interviews",
    img: "https://images.unsplash.com/photo-1523958203904-cdcb402031fd?w=1200&auto=format&fit=crop",
  },
  {
    title: "Dress Code Guidelines",
    desc: "What to wear for different types of interviews",
    img: "https://images.unsplash.com/photo-1520975958225-6c62f1e3f0d4?w=1200&auto=format&fit=crop",
  },
];

export default function InterviewTips() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-4xl font-extrabold text-slate-900">Interview Tips</h2>
          <button className="px-6 py-2 rounded-xl border border-orange-300 text-orange-700 font-semibold hover:bg-orange-50 transition">
            View All Tips
          </button>
        </div>

        <div className="mt-10 grid lg:grid-cols-4 gap-6">
          {tips.map((t) => (
            <div key={t.title} className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <img src={t.img} alt={t.title} className="h-44 w-full object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-extrabold text-slate-900">{t.title}</h3>
                <p className="mt-3 text-slate-600">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
