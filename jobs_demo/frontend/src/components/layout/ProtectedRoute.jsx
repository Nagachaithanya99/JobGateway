import { Navigate, useLocation } from "react-router-dom";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useAuth as useAppAuth } from "../../context/AuthContext.jsx";

function pickLoginPath(pathname) {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/company")) return "/company/login";
  if (pathname.startsWith("/student")) return "/student/login";
  return "/";
}

export default function ProtectedRoute({ children, role }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const appAuth = useAppAuth();
  const { pathname } = useLocation();

  if (!isLoaded) return null;

  const loginPath = pickLoginPath(pathname);
  const requiredRole = String(role || "").toLowerCase();
  const rawClerkRole = user?.publicMetadata?.role ?? user?.unsafeMetadata?.role;
  const clerkRole = typeof rawClerkRole === "string" ? rawClerkRole.toLowerCase() : "";
  const currentRole = clerkRole || String(appAuth?.role || "").toLowerCase();
  const hasLocalAdmin = Boolean(appAuth?.localAdminToken && String(appAuth?.role || "").toLowerCase() === "admin");

  if (requiredRole === "admin") {
    if (hasLocalAdmin) return children;
    if (!isUserLoaded) return null;
    if (!isSignedIn) return <Navigate to={loginPath} replace />;
    if (currentRole !== "admin") return <Navigate to="/" replace />;
    return children;
  }

  // Non-admin can use Clerk or existing local demo auth
  const ok = isSignedIn;
  if (!ok) return <Navigate to={loginPath} replace />;

  if (requiredRole && currentRole && currentRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
