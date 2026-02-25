import Card from "../../common/Card.jsx";

const list = [
  { name: "Akash", msg: "Profile completion helped me get shortlisted quickly." },
  { name: "Divya", msg: "One-click apply is super fast. Love the clean UI." },
  { name: "Rohan", msg: "Tracking status made everything clear and stress-free." },
];

export default function Testimonials() {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-extrabold">Student Testimonials</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {list.map((t) => (
          <Card key={t.name} className="p-5">
            <p className="text-slate-700">“{t.msg}”</p>
            <p className="mt-3 text-sm font-extrabold text-brand-700">— {t.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
