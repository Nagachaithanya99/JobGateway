import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";

function getRole(search) {
  const p = new URLSearchParams(search);
  const r = p.get("role");
  return ["student", "company", "admin"].includes(r) ? r : "student";
}

export default function UniversalLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const role = useMemo(() => getRole(loc.search), [loc.search]);

  useEffect(() => {
    if (role === "admin") {
      nav("/admin/login", { replace: true });
    }
  }, [nav, role]);

  const redirect = useMemo(() => {
    const p = new URLSearchParams(loc.search);
    const r = p.get("redirect");
    if (r) return r;

    if (role === "company") return "/company/dashboard";
    return "/student/home";
  }, [loc.search, role]);

  const [email, setEmail] = useState(role === "company" ? "company@test.com" : "student@test.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");

    if (role === "admin") {
      nav("/admin/login", { replace: true });
      return;
    }

    // ✅ student/company demo (allowed)
    login({
      token: `demo-${role}-token`,
      user: { role, name: role.toUpperCase(), email },
    });

    nav(redirect, { replace: true });
  };

  return (
    <div className="min-h-[80vh] grid place-items-center">
      <Card className="p-8 w-full max-w-md">
        <h1 className="text-2xl font-extrabold">
          {role.toUpperCase()} <span className="text-brand-600">Login</span>
        </h1>

        {err ? (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {err}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <Button className="w-full" type="submit">
            Login
          </Button>

        </form>
      </Card>
    </div>
  );
}
