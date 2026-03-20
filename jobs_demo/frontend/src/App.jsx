import { Routes, Route } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes.jsx";
import AdminRoutes from "./routes/AdminRoutes.jsx";
import StudentRoutes from "./routes/StudentRoutes.jsx";
import CompanyRoutes from "./routes/CompanyRoutes.jsx";
import NotFound from "./components/layout/NotFound.jsx";
import AutoTranslator from "./components/i18n/AutoTranslator.jsx";
import TranslationOverlay from "./components/i18n/TranslationOverlay.jsx";

export default function App() {
  return (
    <>
      <AutoTranslator />
      <TranslationOverlay />
      <Routes>
        <Route path="/*" element={<PublicRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/student/*" element={<StudentRoutes />} />
        <Route path="/company/*" element={<CompanyRoutes />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
