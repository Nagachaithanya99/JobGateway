import { Link } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      <div className="container-app py-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-black leading-tight">
              Find Jobs Faster with <span className="text-brand-600">JobGateway</span>
            </h1>

            <p className="text-slate-600 text-lg">
              Browse jobs by stream/category/subcategory. Apply once using your saved profile and track every status.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/public/login?role=student">
                <Button>Student Login</Button>
              </Link>

              <Link to="/public/login?role=admin">
                <Button variant="outline">Admin Login</Button>
              </Link>

              <Button variant="outline">Company Portal (next phase)</Button>
            </div>

            <div className="flex gap-3 pt-2 text-sm text-slate-600">
              <span className="font-semibold">Clean UI</span>
              <span>•</span>
              <span className="font-semibold">One-click apply</span>
              <span>•</span>
              <span className="font-semibold">Track status</span>
            </div>
          </div>

          <Card className="p-6">
            <div className="space-y-3">
              <p className="text-sm font-bold text-brand-700">Demo Preview</p>
              <div className="rounded-xl overflow-hidden border border-slate-100 bg-white">
                <div className="p-4">
                  <p className="font-extrabold">Featured</p>
                  <p className="text-slate-600 text-sm">Staff Nurse • Bengaluru • ₹3.5L–₹5L</p>
                </div>
                <div className="border-t border-slate-100 p-4 flex gap-2">
                  <span className="px-2 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">Medical</span>
                  <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 text-xs font-bold">Full-time</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Video hero UI integration will be added next step.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
