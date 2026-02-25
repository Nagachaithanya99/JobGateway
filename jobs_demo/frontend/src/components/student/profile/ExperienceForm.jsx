import Input from "../../common/Input.jsx";
import Textarea from "../../common/Textarea.jsx";

export default function ExperienceForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold">Experience</h3>
      <Input label="Years of experience" value={value.years} onChange={(e) => set("years", e.target.value)} placeholder="0, 1, 2..." />
      <Input label="Recent role" value={value.role} onChange={(e) => set("role", e.target.value)} placeholder="Staff Nurse, React Dev..." />
      <Textarea label="Summary" value={value.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Describe your work..." />
    </div>
  );
}
