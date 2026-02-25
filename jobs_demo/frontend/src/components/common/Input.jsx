import { Link } from "react-router-dom";

export default function Input({
  label,
  icon,
  rightLink,
  className = "",
  ...props
}) {
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
          className={`input ${icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  );
}
