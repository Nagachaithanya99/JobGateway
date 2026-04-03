import Button from "../../common/Button.jsx";
import { showSweetAlert } from "../../../utils/sweetAlert.js";

export default function HeroBanner() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-r from-sky-50 to-orange-50">
      <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8 items-center">
        {/* Left content */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700">
            ✨ Find Jobs • Internships • Career Tips
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-slate-900">
            Find Your Dream Job <span className="text-orange-600">&amp; Internship</span>
          </h1>

          <p className="text-slate-600 max-w-xl">
            Discover opportunities, apply faster, and improve your interview skills with our Internship Hub.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => void showSweetAlert("Apply Job Now (link will be connected in next step)")}
              className="px-6"
            >
              Apply Job Now
            </Button>

            <Button
              variant="outline"
              onClick={() => void showSweetAlert("Hire Now (company portal will be added in next step)")}
              className="px-6"
            >
              Hire Now
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 pt-2">
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
              ✅ Verified Listings
            </span>
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
              ⚡ Quick Apply
            </span>
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200">
              🎯 Interview Prep
            </span>
          </div>
        </div>

        {/* Right image */}
        <div className="relative">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sky-200/40 blur-2xl" />

          <div className="rounded-2xl overflow-hidden border border-white/60 shadow-sm bg-white">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop"
              alt="Career banner"
              className="h-60 md:h-72 w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
