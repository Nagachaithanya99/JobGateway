import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoutes from "./routes/PublicRoutes.jsx";
import AdminRoutes from "./routes/AdminRoutes.jsx";
import StudentRoutes from "./routes/StudentRoutes.jsx";
import CompanyRoutes from "./routes/CompanyRoutes.jsx";
import NotFound from "./components/layout/NotFound.jsx";

import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { wireClerkToken } from "./services/initClerkApiAuth.js";

export default function App() {
  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      wireClerkToken(getToken);
    }
  }, [isLoaded, getToken]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student" replace />} />

      <Route path="/*" element={<PublicRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/student/*" element={<StudentRoutes />} />
      <Route path="/company/*" element={<CompanyRoutes />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
