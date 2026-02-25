import Input from "../../common/Input.jsx";

export default function EducationForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold">Education</h3>
      <Input label="Degree" value={value.degree} onChange={(e) => set("degree", e.target.value)} />
      <Input label="College" value={value.college} onChange={(e) => set("college", e.target.value)} />
      <Input label="Year" value={value.year} onChange={(e) => set("year", e.target.value)} placeholder="2026" />
    </div>
  );
}
