import { FiEdit2, FiEye, FiPower, FiTrash2 } from "react-icons/fi";

function IconButton({ label, onClick, tone = "default", icon }) {
  const tones = {
    default: "border-blue-200 text-[#2563EB] hover:bg-blue-50",
    warning: "border-orange-200 text-[#F97316] hover:bg-orange-50",
    danger: "border-red-200 text-red-600 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${tones[tone]}`}
    >
      {icon}
    </button>
  );
}

export default function ActionMenu({ row, onView, onEdit, onToggleStatus, onDelete }) {
  const active = String(row?.status || "").toLowerCase() === "active";

  return (
    <div className="flex items-center justify-end gap-2">
      <IconButton label="View" onClick={onView} icon={<FiEye />} />
      <IconButton label="Edit" onClick={onEdit} icon={<FiEdit2 />} />
      <IconButton
        label={active ? "Suspend" : "Activate"}
        onClick={onToggleStatus}
        tone="warning"
        icon={<FiPower />}
      />
      <IconButton label="Delete" onClick={onDelete} tone="danger" icon={<FiTrash2 />} />
    </div>
  );
}
