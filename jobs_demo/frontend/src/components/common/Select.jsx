export default function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block space-y-1">
      {label && <span className="label">{label}</span>}
      <select className={`input ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}
