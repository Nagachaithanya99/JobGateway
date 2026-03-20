import Loader from "../common/Loader.jsx";
import { useI18n } from "../../context/I18nContext.jsx";

export default function TranslationOverlay() {
  const { translating } = useI18n();

  if (!translating) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-white/96 backdrop-blur-sm" data-no-translate="true">
      <div className="w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-2xl">
        <Loader label="Updating language..." />
      </div>
    </div>
  );
}
