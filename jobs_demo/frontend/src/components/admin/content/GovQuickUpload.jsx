import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";

export default function GovQuickUpload({ government = [] }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-lg">Government Updates</h3>
        <button className="btn-primary px-4 py-2 flex items-center gap-2">
          <FiUpload /> Upload
        </button>
      </div>

      {government.map((g, i) => (
        <motion.div
          key={g.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="border rounded-2xl p-4 flex justify-between"
        >
          <div className="font-semibold">{g.title}</div>
          <div className="text-sm text-muted">{g.type}</div>
        </motion.div>
      ))}
    </div>
  );
}
