import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function Input({
  label,
  icon,
  rightLink,
  className = "",
  type = "text",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {label ? <label className="text-sm font-semibold">{label}</label> : <span />}
        {rightLink ? (
          <Link to={rightLink.to} className="text-xs font-semibold text-brand-600">
            {rightLink.text}
          </Link>
        ) : null}
      </div>

      <div className="relative">
        {icon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        ) : null}
        <input
          {...props}
          type={isPassword && showPassword ? "text" : type}
          className={`input ${icon ? "pl-10" : ""} ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-brand-600"
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
