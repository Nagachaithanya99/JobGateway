import { motion } from "framer-motion";

export default function HeroDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-40 -top-10 h-[480px] w-[480px] rounded-full bg-orange-500/20 blur-3xl" />

      <svg
        className="absolute -bottom-16 left-0 w-full opacity-90"
        viewBox="0 0 1440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 224L60 208C120 192 240 160 360 138.7C480 117 600 107 720 122.7C840 139 960 181 1080 181.3C1200 181 1320 139 1380 117.3L1440 96V320H0V224Z"
          fill="url(#blueGrad)"
        />
        <path
          d="M0 260L80 240C160 220 320 180 480 186.7C640 193 800 247 960 256C1120 265 1280 229 1360 210.7L1440 192V320H0V260Z"
          fill="url(#orangeGrad)"
          opacity="0.85"
        />
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#2563EB" stopOpacity="0.25" />
            <stop offset="1" stopColor="#2563EB" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="#F97316" stopOpacity="0.05" />
            <stop offset="1" stopColor="#F97316" stopOpacity="0.25" />
          </linearGradient>
        </defs>
      </svg>

      <motion.div
        className="absolute right-[18%] top-12"
        initial={{ y: 0, rotate: -6, opacity: 0.9 }}
        animate={{ y: [0, -10, 0], rotate: [-6, -2, -6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path
            d="M21.8 4.2L3.1 11.3c-.9.3-.9 1.6 0 1.9l6.7 2.4 2.4 6.7c.3.9 1.6.9 1.9 0l7.1-18.7c.3-.8-.5-1.6-1.4-1.4Z"
            fill="#2563EB"
            opacity="0.9"
          />
          <path d="M9.8 15.6l10.4-10.4" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute right-10 top-24"
        initial={{ opacity: 0.65 }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Z"
            fill="#F97316"
          />
          <path
            d="M20 14l.8 2.8L23 18l-2.2.8L20 22l-.8-3.2L17 18l2.2-1.2L20 14Z"
            fill="#2563EB"
            opacity="0.9"
          />
        </svg>
      </motion.div>
    </div>
  );
}
