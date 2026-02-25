import { motion } from "framer-motion";

export default function InternshipManager({ internship }) {
  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-extrabold text-lg">Internship Content</h3>

      {["tips", "questions", "mockTests"].map((type) => (
        <div key={type}>
          <div className="font-semibold capitalize">{type}</div>
          <div className="mt-2 space-y-2">
            {(internship[type] || []).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border rounded-xl px-4 py-2"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
