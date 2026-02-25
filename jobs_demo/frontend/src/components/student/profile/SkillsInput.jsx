import { useState } from "react";
import Button from "../../common/Button.jsx";
import Badge from "../../common/Badge.jsx";
import Input from "../../common/Input.jsx";

export default function SkillsInput({ value = [], onChange }) {
  const [skill, setSkill] = useState("");

  const add = () => {
    const s = skill.trim();
    if (!s) return;
    if (value.includes(s)) return;
    onChange([...value, s]);
    setSkill("");
  };

  const remove = (s) => onChange(value.filter((x) => x !== s));

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold">Skills</h3>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input label="Add Skill" value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="React, Nursing..." />
        </div>
        <div className="flex items-end">
          <Button onClick={add}>Add</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.length === 0 && <p className="text-sm text-slate-500">Add at least 3 skills.</p>}
        {value.map((s) => (
          <button
            key={s}
            onClick={() => remove(s)}
            className="hover:opacity-80"
            title="Click to remove"
          >
            <Badge tone="orange">{s} ✕</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
