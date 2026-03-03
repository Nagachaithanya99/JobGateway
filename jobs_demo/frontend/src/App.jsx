import { Routes, Route } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes.jsx";
import AdminRoutes from "./routes/AdminRoutes.jsx";
import StudentRoutes from "./routes/StudentRoutes.jsx";
import CompanyRoutes from "./routes/CompanyRoutes.jsx";
import NotFound from "./components/layout/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/student/*" element={<StudentRoutes />} />
      <Route path="/company/*" element={<CompanyRoutes />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
