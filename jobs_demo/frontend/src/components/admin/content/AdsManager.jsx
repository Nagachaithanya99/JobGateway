import { motion } from "framer-motion";
import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function AdsManager({ ads = [] }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-lg">Homepage Ads</h3>
          <p className="text-sm text-muted">Manage banner ads</p>
        </div>
        <button className="btn-primary px-4 py-2 flex items-center gap-2">
          <FiPlus /> Add Ad
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border rounded-2xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{ad.title}</div>
              <div className="text-xs text-muted mt-1">
                Status: {ad.active ? "Active" : "Inactive"}
              </div>
            </div>
            <button className="text-red-600">
              <FiTrash2 />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
