import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// role: "admin" | "company" | "student"
// redirectTo: "/admin" | "/company" | "/student"
export default function RoleLoginGuard({ role, redirectTo, children }) {
  const { loading, isAuthed, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isAuthed) return;

    const myRole = user?.role;

    // ✅ if already logged in as same role -> go dashboard
    if (myRole === role) {
      navigate(redirectTo, { replace: true });
      return;
    }

    // ✅ logged in but different role -> block + go to their dashboard
    alert(
      `You already logged in as "${myRole}". Please logout to login as "${role}".`
    );
    navigate(`/${myRole}`, { replace: true, state: { from: loc.pathname } });
  }, [loading, isAuthed, user, role, redirectTo, navigate, loc.pathname]);

  if (loading) return null;
  return children;
}
