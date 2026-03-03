import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
  { to: "/internship", label: "Internships" },
  { to: "/government", label: "Government Jobs" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const navLinkClass = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-50 text-[#2563EB]"
      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
  }`;

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold">
          <span className="text-[#2563EB]">Job</span>
          <span className="text-[#F97316]">Gateway</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
