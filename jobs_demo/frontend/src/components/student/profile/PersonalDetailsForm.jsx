import Input from "../../common/Input.jsx";

export default function PersonalDetailsForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <h3 className="font-extrabold">Personal Details</h3>
      <Input label="Full Name" value={value.fullName} onChange={(e) => set("fullName", e.target.value)} />
      <Input label="Phone" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
      <Input label="City" value={value.city} onChange={(e) => set("city", e.target.value)} />
    </div>
  );
}
