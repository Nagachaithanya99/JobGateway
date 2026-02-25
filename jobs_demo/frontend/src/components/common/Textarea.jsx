export default function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block space-y-1">
      {label && <span className="label">{label}</span>}
      <textarea className={`input min-h-[100px] ${className}`} {...props} />
    </label>
  );
}
