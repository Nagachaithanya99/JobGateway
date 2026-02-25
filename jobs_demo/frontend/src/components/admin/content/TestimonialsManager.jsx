import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

export default function TestimonialsManager({ testimonials = [] }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-lg">Testimonials</h3>
        <button className="btn-primary px-4 py-2 flex items-center gap-2">
          <FiPlus /> Add
        </button>
      </div>

      {testimonials.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="border rounded-2xl p-4"
        >
          <div className="font-semibold">{t.name}</div>
          <div className="text-sm text-muted">
            {t.role} at {t.company}
          </div>
          <p className="mt-2 text-sm">{t.message}</p>
        </motion.div>
      ))}
    </div>
  );
}
