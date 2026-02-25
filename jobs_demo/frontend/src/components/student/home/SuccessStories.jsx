const stories = [
  {
    quote:
      "This platform helped me land my dream job! The interview preparation resources were invaluable.",
    name: "Priya Sharma",
    role: "Software Engineer at Google",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "Excellent job listings and easy application process. Highly recommended for students and fresh graduates.",
    name: "Amit Patel",
    role: "Product Manager at Amazon",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "The mock tests and interview tips gave me confidence. Found my job within 2 weeks of registration!",
    name: "Sneha Reddy",
    role: "Data Analyst at Microsoft",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

export default function SuccessStories() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-center text-slate-900">
          Success Stories
        </h2>

        <div className="mt-10 grid lg:grid-cols-3 gap-8">
          {stories.map((s) => (
            <div key={s.name} className="border border-slate-200 rounded-2xl shadow-sm bg-white p-8">
              <div className="h-12 w-12 rounded-xl border border-orange-200 text-orange-600 grid place-items-center font-black text-2xl">
                “
              </div>
              <p className="mt-4 text-slate-700 italic leading-relaxed">
                "{s.quote}"
              </p>

              <div className="mt-8 flex items-center gap-4">
                <img src={s.img} alt={s.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="font-extrabold text-slate-900">{s.name}</p>
                  <p className="text-slate-600 text-sm">{s.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-10" />
      </div>
    </section>
  );
}
