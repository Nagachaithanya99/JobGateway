import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiLogIn,
  FiSearch,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";

const AUTH_SLIDE_MS = 5800;

const AUTH_SLIDES = [
  {
    src: "/videos/jobs-hero-cartoon-office.mp4",
    eyebrow: "Portal Login",
    title: "Secure access for every role in one job portal",
    description:
      "Students, recruiters, and admins can enter the right workflow quickly without changing the sign in flow.",
    icon: FiLogIn,
    overlay:
      "linear-gradient(145deg, rgba(11, 35, 114, 0.82) 0%, rgba(37, 99, 235, 0.72) 38%, rgba(59, 130, 246, 0.42) 66%, rgba(249, 115, 22, 0.28) 100%)",
  },
  {
    src: "/videos/jobs-hero-anime-meeting.mp4",
    eyebrow: "Company Work",
    title: "See daily company workspaces, hiring meetings, and team collaboration",
    description:
      "This slide keeps the same illustrated look while showing company-side work, discussion, and office movement around active roles.",
    icon: FiUserCheck,
    overlay:
      "linear-gradient(145deg, rgba(15, 23, 42, 0.72) 0%, rgba(29, 78, 216, 0.68) 34%, rgba(59, 130, 246, 0.34) 68%, rgba(249, 115, 22, 0.24) 100%)",
  },
  {
    src: "/videos/auth-showcase-hiring.mp4",
    eyebrow: "Hiring Flow",
    title: "Post openings, review applicants, and move hiring faster in one place",
    description:
      "Recruiter-facing motion keeps this slide tied to job posting, shortlisting, and the employer-side flow of the portal.",
    icon: FiBriefcase,
    overlay:
      "linear-gradient(145deg, rgba(15, 23, 42, 0.76) 0%, rgba(37, 99, 235, 0.64) 34%, rgba(99, 102, 241, 0.34) 68%, rgba(249, 115, 22, 0.26) 100%)",
  },
  {
    src: "/videos/jobs-hero-collaboration.mp4",
    eyebrow: "Company Team",
    title: "Keep company teams aligned on openings, reviews, and hiring decisions",
    description:
      "This slide now shows another employer-side scene with team collaboration, internal review, and day-to-day company hiring work.",
    icon: FiUserCheck,
    overlay:
      "linear-gradient(145deg, rgba(15, 23, 42, 0.76) 0%, rgba(30, 64, 175, 0.62) 34%, rgba(56, 189, 248, 0.3) 66%, rgba(249, 115, 22, 0.22) 100%)",
  },
  {
    src: "/videos/jobs-hero-cartoon-search.mp4",
    eyebrow: "Find Jobs",
    title: "Search fresher roles, internships, and saved matches with the same style",
    description:
      "The final slide closes the auth story with job search, saved roles, and candidate browsing in the same illustrated portal mood.",
    icon: FiSearch,
    overlay:
      "linear-gradient(145deg, rgba(15, 23, 42, 0.74) 0%, rgba(29, 78, 216, 0.64) 34%, rgba(56, 189, 248, 0.28) 66%, rgba(249, 115, 22, 0.24) 100%)",
  },
];

function SlideDot({ active, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`h-2.5 rounded-full transition ${
        active ? "w-9 bg-white" : "w-2.5 bg-white/35 hover:bg-white/55"
      }`}
    />
  );
}

export default function AuthShowcase({
  panelTitle,
  panelText,
  panelActionLabel,
  panelActionTo,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const activeSlide = AUTH_SLIDES[currentSlide];
  const ActiveIcon = activeSlide.icon;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % AUTH_SLIDES.length);
    }, AUTH_SLIDE_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full overflow-hidden rounded-[34px] border border-white/50 bg-[#0f1c5a] text-white shadow-[0_28px_90px_rgba(37,99,235,0.20)]">
      <div className="absolute inset-0">
        {AUTH_SLIDES.map((slide, index) => (
          <video
            key={slide.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={slide.src} type="video/mp4" />
          </video>
        ))}
        <div
          className="absolute inset-0 transition-[background] duration-700"
          style={{ background: activeSlide.overlay }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(96,165,250,0.38),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.18),transparent_18%),radial-gradient(circle_at_82%_86%,rgba(249,115,22,0.26),transparent_24%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between px-7 py-8 sm:px-9 sm:py-10">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/88 backdrop-blur-md">
              <FiShield className="text-[13px]" />
              <span>Job Portal Access</span>
            </div>

            <div className="flex items-center gap-2">
              {AUTH_SLIDES.map((slide, index) => (
                <SlideDot
                  key={slide.eyebrow}
                  label={`Show ${slide.eyebrow}`}
                  active={index === currentSlide}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 max-w-[430px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/88 backdrop-blur-md">
              <ActiveIcon className="text-[13px]" />
              <span>{activeSlide.eyebrow}</span>
            </div>

            <h2 className="mt-5 max-w-[420px] text-[28px] font-black leading-[1.06] tracking-[-0.04em] text-white sm:text-[34px]">
              {activeSlide.title}
            </h2>
            <p className="mt-4 max-w-[380px] text-[15px] leading-7 text-white/80">
              {activeSlide.description}
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <h3 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">{panelTitle}</h3>
          <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-white/88 sm:text-[1.35rem] sm:leading-9">
            {panelText}
          </p>

          {panelActionLabel && panelActionTo ? (
            <Link
              to={panelActionTo}
              className="mt-9 inline-flex min-h-14 min-w-48 items-center justify-center rounded-full border border-white/60 bg-white/10 px-8 text-lg font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:bg-white hover:text-[#1d4ed8]"
            >
              {panelActionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
