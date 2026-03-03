import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import PublicNavbar from "./PublicNavbar.jsx";
import StudentFooter from "../student/layout/StudentFooter.jsx";

export default function PublicLayout() {
  const { isAuthed, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (isAuthed) {
    if (role === "student" || !role) {
      const isHome = location.pathname === "/";
      const nextPath = isHome ? "/student" : `/student${location.pathname}`;
      return <Navigate to={`${nextPath}${location.search || ""}`} replace />;
    }
    if (role === "company") {
      return <Navigate to="/company/dashboard" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <StudentFooter />
    </div>
  );
}
