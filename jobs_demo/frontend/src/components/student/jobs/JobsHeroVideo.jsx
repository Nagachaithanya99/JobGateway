import { useEffect, useState } from "react";
import { FiBriefcase, FiLayers, FiMapPin, FiZap } from "react-icons/fi";

const HERO_POSTER = "/images/jobs-hero.png";
const HERO_SLIDES = [
  {
    src: "/videos/jobs-hero-meeting.mp4",
    tag: "Hiring Meeting",
    title: "Real teams discussing openings and interviews",
    description:
      "Professional meeting footage for recruitment planning, shortlisting, and hiring conversations inside the jobs portal hero.",
  },
  {
    src: "/videos/jobs-hero-anime-meeting.mp4",
    tag: "Animated Office Meeting",
    title: "A character-style office scene moving into a company meeting",
    description:
      "A stylized 4K animated business clip that feels like a character entering a company meeting and joining a professional office discussion.",
  },
  {
    src: "/videos/jobs-hero-candidate.mp4",
    tag: "Candidate Search",
    title: "A candidate exploring roles from a focused laptop workspace",
    description:
      "A more portal-focused scene showing individual job search, profile review, and application browsing instead of a generic office floor.",
  },
  {
    src: "/videos/jobs-hero-presentation.mp4",
    tag: "Career Presentation",
    title: "Presentations, updates, and hiring momentum in one view",
    description:
      "Presenter-led footage that fits assessment rounds, reporting, and career-focused storytelling on the portal.",
  },
  {
    src: "/videos/jobs-hero-videocall.mp4",
    tag: "Remote Screening",
    title: "Video-call interviews and recruiter conversations",
    description:
      "A remote-first scene for online screening, recruiter coordination, and digital interview experiences inside the portal hero.",
  },
  {
    src: "/videos/jobs-hero-collaboration.mp4",
    tag: "Team Collaboration",
    title: "Shortlisting, teamwork, and shared hiring decisions",
    description:
      "Collaborative office footage for recruiter teamwork, team approvals, and realistic hiring activity around live roles.",
  },
  {
    src: "/videos/jobs-hero-cartoon-search.mp4",
    tag: "Animated Job Hunt",
    title: "A cartoon-style candidate exploring jobs from a laptop",
    description:
      "An animated 4K scene that brings back the lighter cartoon job-search feel as the final slide in the hero rotation.",
  },
];
const ROTATE_MS = 7000;

export default function JobsHeroVideo({ totalJobs, locationCount, streamCount }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const statItems = [
    { value: `${totalJobs.toLocaleString()}+`, label: "Open Roles", icon: FiBriefcase },
    { value: `${locationCount}+`, label: "Locations", icon: FiMapPin },
    { value: `${streamCount}+`, label: "Streams", icon: FiLayers },
    { value: "Fast Apply", label: "Quick Flow", icon: FiZap },
  ];
  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative isolate overflow-hidden rounded-[30px] border border-white/70 bg-[#091325] shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (
          <video
            key={slide.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={slide.src} type="video/mp4" />
          </video>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,16,32,0.78)_0%,rgba(8,16,32,0.50)_32%,rgba(8,16,32,0.18)_60%,rgba(8,16,32,0.46)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(255,122,0,0.18),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(54,104,255,0.22),transparent_30%)]" />
      </div>

      <div className="relative flex min-h-[360px] flex-col justify-between px-7 pb-[88px] pt-7 md:min-h-[430px] md:px-9 md:pb-[110px] md:pt-9 xl:min-h-[470px]">
        <div className="max-w-[680px]">
          <div className="text-[12px] font-semibold text-white/72">
            <span>Home</span>
            <span className="mx-2 text-white/40">/</span>
            <span className="text-white">Jobs</span>
          </div>

          <div className="mt-5">
            <p className="inline-flex items-center rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">
              {activeSlide.tag}
            </p>
            <h1 className="mt-4 text-[40px] font-black leading-[0.98] tracking-[-0.04em] text-white md:text-[58px]">
              {totalJobs.toLocaleString()} Jobs Available
            </h1>
            <p className="mt-4 max-w-[620px] text-[20px] font-black leading-tight text-white md:text-[28px]">
              {activeSlide.title}
            </p>
            <p className="mt-4 max-w-[560px] text-[14px] leading-6 text-slate-200/88 md:text-[15px]">
              {activeSlide.description}
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statItems.map(({ value, label, icon }) => {
            const Icon = icon;
            return (
              <div
                key={label}
                className="rounded-[18px] border border-white/14 bg-white/10 px-4 py-3 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 text-orange-300">
                  <Icon className="text-[14px]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/72">
                    {label}
                  </span>
                </div>
                <p className="mt-2 text-[20px] font-black tracking-[-0.03em] text-white">{value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
