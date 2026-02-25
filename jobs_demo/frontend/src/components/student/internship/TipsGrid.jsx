import Card from "../../common/Card.jsx";
import Button from "../../common/Button.jsx";
import { FiBookOpen } from "react-icons/fi";

const TIPS = [
  {
    id: "t1",
    title: "How to Prepare for Technical Interviews",
    desc: "Essential tips and strategies for acing your technical interviews",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "t2",
    title: "Common HR Interview Questions",
    desc: "Most frequently asked questions and how to answer them",
    img: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "t3",
    title: "Body Language Tips",
    desc: "Non-verbal communication techniques for interviews",
    img: "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "t4",
    title: "Dress Code Guidelines",
    desc: "What to wear for different types of interviews",
    img: "https://images.unsplash.com/photo-1520975693411-4f2b8b7b1b86?auto=format&fit=crop&w=1200&q=60",
  },
];

export default function TipsGrid() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <FiBookOpen className="text-orange-600" />
        <h2 className="text-lg font-extrabold text-slate-900">Interview Tips</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIPS.map((t) => (
          <Card key={t.id} className="overflow-hidden border border-slate-200">
            <div className="h-28 w-full overflow-hidden">
              <img
                src={t.img}
                alt={t.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 space-y-2">
              <p className="font-extrabold text-slate-900 text-sm">{t.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{t.desc}</p>

              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={() => alert(`Read More: ${t.title}\n(Full article page in next step)`)}
                >
                  Read More
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Tips details page will be added in next step.
      </p>
    </section>
  );
}
