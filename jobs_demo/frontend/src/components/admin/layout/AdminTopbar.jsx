import { FiSearch, FiBell } from "react-icons/fi";
import LanguageSelector from "../../common/LanguageSelector.jsx";
import { useI18n } from "../../../context/I18nContext.jsx";

export default function AdminTopbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder={t("search.anything")}
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <LanguageSelector compact />
          <button className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center">
            <FiBell className="text-slate-600" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-600" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <span className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 font-extrabold grid place-items-center">
              A
            </span>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-extrabold text-slate-900">Admin User</div>
              <div className="text-xs text-slate-500">Super Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
