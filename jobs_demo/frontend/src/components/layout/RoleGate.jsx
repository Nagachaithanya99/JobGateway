import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RoleGate({ allow = [], children }) {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (!role || !allow.includes(role)) {
    if (role === "student") return <Navigate to="/student" replace />;
    if (role === "company") return <Navigate to="/company/dashboard" replace />;
    if (role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/public" replace />;
  }

  return children;
}
