import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

export default function PlacedStudentsManager({ placed = [] }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-lg">Placed Students</h3>
        <button className="btn-primary px-4 py-2 flex items-center gap-2">
          <FiPlus /> Add
        </button>
      </div>

      {placed.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="border rounded-2xl p-4 flex justify-between"
        >
          <div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-muted">{p.company}</div>
          </div>
          <div className="font-bold text-brand-600">{p.package}</div>
        </motion.div>
      ))}
    </div>
  );
}
