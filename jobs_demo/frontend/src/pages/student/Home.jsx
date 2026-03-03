import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiPhoneCall,
  FiMessageCircle,
  FiFileText,
} from "react-icons/fi";

import useAuth from "../../hooks/useAuth.js";
import { studentHome } from "../../services/studentService.js";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

import slide1 from "../../assets/images/student-home/slider-1.png";
import slide2 from "../../assets/images/student-home/slider-2.png";
import slide3 from "../../assets/images/student-home/slider-3.png";

import internshipBanner from "../../assets/images/student-home/internship-banner.png";
import govtBanner from "../../assets/images/student-home/govt-banner.png";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRange(min, max, suffix = "") {
  const a = Number(min || 0);
  const b = Number(max || 0);
  if (!a && !b) return "";
  if (a && b) return `₹${a.toLocaleString()} - ₹${b.toLocaleString()}${suffix}`;
  return `₹${(a || b).toLocaleString()}${suffix}`;
}

function mapJobFromApi(j) {
  if (!j) return null;

  const id = j._id || j.id;
  const company = j.companyName || j.company?.name || j.company || "Company";

  const salary =
    j.salaryText ||
    formatRange(j.salaryMin, j.salaryMax, "/mo") ||
    j.salary ||
    "₹20,000 - ₹30,000/mo";

  const location =
    j.location || [j.city, j.state].filter(Boolean).join(", ") || "India";

  return {
    id,
    company,
    title: j.title || j.jobTitle || "Job",
    location,
    salary,
    service: j.category || j.stream || j.service || "IT & Software",
    rating: Number(j.rating || 0) || null,
  };
}

function mapInternFromApi(i) {
  if (!i) return null;

  const id = i._id || i.id;
  const company = i.companyName || i.company?.name || i.company || "Company";
  const location = i.location || [i.city, i.state].filter(Boolean).join(", ") || "India";

  return {
    id,
    company,
    title: i.title || i.jobTitle || "Internship",
    location,
    stipend:
      i.stipendText ||
      formatRange(i.stipendMin, i.stipendMax, "/mo") ||
      i.stipend ||
      "₹15,000/mo",
  };
}

function isMongoId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isStudentView = location.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    jobs: [],
    internships: [],
    categories: [],
    stats: null,
    banners: [],
    announcements: [],
  });

  const slides = useMemo(
    () => {
      if (Array.isArray(data.banners) && data.banners.length) {
        return data.banners.slice(0, 8).map((b, idx) => ({
          titleBold: "",
          titleAccent: b.title || "Featured Opportunity",
          subtitle: b.subtitle || b.description || "Discover opportunities tailored for students.",
          cta: "Explore Now",
          image: toAbsoluteMediaUrl(b.imageUrl) || [slide1, slide2, slide3][idx % 3],
          tone: idx % 2 ? "blue" : "orange",
          linkUrl: b.linkUrl || "",
        }));
      }

      return [
        {
          titleBold: "Explore ",
          titleAccent: "10,000+ Jobs",
          subtitle: "Find Your Perfect Job Now!",
          cta: "Browse Jobs",
          image: slide1,
          tone: "orange",
          linkUrl: "/student/jobs",
        },
        {
          titleBold: "Explore ",
          titleAccent: "10,000+ Jobs",
          subtitle: "Find Your Perfect Job Now!",
          cta: "Browse Jobs",
          image: slide2,
          tone: "orange",
          linkUrl: "/student/jobs",
        },
        {
          titleBold: "One Click ",
          titleAccent: "Apply",
          subtitle: "Apply to Jobs Quickly & Easily",
          cta: "Simple Process",
          image: slide3,
          tone: "blue",
          linkUrl: "/student/jobs",
        },
      ];
    },
    [data.banners]
  );

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveSlide((s) => (s + 1) % slides.length);
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    setActiveSlide((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  const [q, setQ] = useState("");

  const openBannerLink = (url) => {
    const target = String(url || "").trim();
    if (!target) {
      nav(withBase("/jobs"));
      return;
    }
    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    if (!isStudentView && target.startsWith("/student/")) {
      nav(target.replace(/^\/student/, ""));
      return;
    }
    nav(target);
  };

  const runSearch = async () => {
    const nextQ = String(q || "").trim();
    nav(nextQ ? `${withBase("/jobs")}?q=${encodeURIComponent(nextQ)}` : withBase("/jobs"));
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await studentHome();
        if (!mounted) return;

        const payload = res?.data || {};
        const jobs = Array.isArray(payload.jobs)
          ? payload.jobs.map(mapJobFromApi).filter(Boolean)
          : [];
        const internships = Array.isArray(payload.internships)
          ? payload.internships.map(mapInternFromApi).filter(Boolean)
          : [];
        const categories = Array.isArray(payload.categories) ? payload.categories : [];
        const banners = Array.isArray(payload.banners) ? payload.banners : [];
        const announcements = Array.isArray(payload.announcements) ? payload.announcements : [];

        const stats = payload.stats || {
          liveJobs: payload?.liveJobs || 10000,
          topCompanies: payload?.topCompanies || 500,
          studentsHired: payload?.studentsHired || 50000,
        };

        setData({ jobs, internships, categories, stats, banners, announcements });
      } catch (e) {
        console.error("studentHome error:", e);
        setData({
          jobs: [],
          internships: [],
          categories: [],
          banners: [],
          announcements: [],
          stats: { liveJobs: 10000, topCompanies: 500, studentsHired: 50000 },
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredJobs = useMemo(() => {
    return (data.jobs || []).slice(0, 4);
  }, [data.jobs]);

  const welcomeName = useMemo(() => {
    const n = (user?.name || user?.fullName || user?.username || "John").trim();
    return n || "John";
  }, [user]);

  const avatarInitials = useMemo(() => initials(welcomeName), [welcomeName]);

  return (
    <div className="bg-[#f6f8ff]">
      <div className="w-full px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <section className="rounded-[22px] bg-white/60 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="relative overflow-hidden rounded-[18px] border border-white/70 bg-white">
            <div className="relative h-[220px] w-full sm:h-[240px] md:h-[250px]">
              <div
                className="absolute inset-0 flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {slides.map((s, idx) => (
                  <div
                    key={idx}
                    className="relative h-full w-full flex-shrink-0 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fff7ed] via-white to-[#eef4ff]" />
                    <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-orange-100/70 blur-2xl" />
                    <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-blue-100/70 blur-2xl" />

                    <div className="relative grid h-full grid-cols-1 items-center gap-6 p-5 md:grid-cols-2 md:p-7">
                      <div>
                        <h2 className="text-[22px] font-extrabold leading-tight text-slate-900 sm:text-[26px]">
                          {s.titleBold}
                          <span className="text-[#f97316]">{s.titleAccent}</span>
                        </h2>
                        <p className="mt-2 text-[12px] font-semibold text-slate-600 sm:text-[13px]">
                          • {s.subtitle}
                        </p>

                        <button
                          type="button"
                          onClick={() => openBannerLink(s.linkUrl)}
                          className={`mt-4 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[12px] font-extrabold text-white shadow-[0_12px_24px_rgba(249,115,22,0.25)]
                            ${s.tone === "blue" ? "bg-[#2563EB] hover:bg-blue-700" : "bg-[#F97316] hover:bg-orange-600"}`}
                        >
                          {s.cta}
                        </button>
                      </div>

                      <div className="hidden h-full items-center justify-end md:flex">
                        <img
                          src={s.image}
                          alt=""
                          className="h-[190px] w-auto select-none object-contain"
                          draggable="false"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveSlide((s) => (s - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                aria-label="Prev"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((s) => (s + 1) % slides.length)}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                aria-label="Next"
              >
                <FiChevronRight />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    className={`h-2 w-2 rounded-full transition ${
                      activeSlide === i ? "bg-[#f97316]" : "bg-slate-300"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[16px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.05)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                <FiSearch />
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-slate-900">Search Jobs</p>
                <p className="text-[11px] font-semibold text-slate-500">
                  Find jobs by role, skills, company...
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-2 md:max-w-[520px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job Title, Skills, or Company"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300 focus:bg-white"
              />
              <button
                type="button"
                onClick={runSearch}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#F97316] px-5 text-sm font-extrabold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                Search
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4 rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-blue-100">
                <div className="flex h-full w-full items-center justify-center text-lg font-extrabold text-[#F97316]">
                  {avatarInitials}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-[20px] font-extrabold text-slate-900">
                  Welcome Back, {welcomeName}!
                </h3>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-600">
                  Ready to explore new opportunities?
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-3 gap-3">
              <StatBox
                icon={<FiBriefcase className="text-[18px]" />}
                value={`${Number(data.stats?.liveJobs || 10000).toLocaleString()}+`}
                label="Live Jobs"
              />
              <StatBox
                icon={<FiTrendingUp className="text-[18px]" />}
                value={`${Number(data.stats?.topCompanies || 500).toLocaleString()}+`}
                label="Top Companies"
              />
              <StatBox
                icon={<FiShield className="text-[18px]" />}
                value={`${Number(data.stats?.studentsHired || 50000).toLocaleString()}+`}
                label="Students Hired"
              />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold text-slate-900">Featured Jobs</h2>
            <button
              type="button"
              onClick={() => nav(withBase("/jobs"))}
              className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#F97316] hover:text-orange-600"
            >
              View All Jobs <FiArrowRight />
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              Loading...
            </div>
          ) : featuredJobs.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredJobs.map((job, idx) => (
                <JobCard
                  key={job.id || idx}
                  job={job}
                  onClick={() =>
                    isMongoId(job.id) ? nav(withBase(`/jobs/${job.id}`)) : nav(withBase("/jobs"))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
              No jobs posted yet by companies.
            </div>
          )}
        </section>

        <section className="mt-10">
          <h3 className="mb-4 text-center text-[22px] font-extrabold text-slate-900">
            Internships & Government Jobs
          </h3>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BigBannerCard
              title="Internships"
              subtitle={`${Math.max(30, data.internships?.length || 0)}+ Open Positions`}
              button="Discover Internships"
              image={internshipBanner}
              tone="orange"
              onClick={() => nav(withBase("/internship"))}
            />

            <BigBannerCard
              title="Government Jobs"
              subtitle="100+ Latest Openings"
              button="Explore Govt. Jobs"
              image={govtBanner}
              tone="green"
              onClick={() => nav(withBase("/government"))}
            />
          </div>
        </section>

        {Array.isArray(data.announcements) && data.announcements.some((a) => String(a?.title || a?.description || "").trim().toLowerCase() !== "homepage") ? (
          <section className="mt-6 rounded-[18px] border border-orange-100 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-extrabold text-[#F97316]">
                Platform Announcements
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.announcements
                .filter((a) => String(a?.title || a?.description || "").trim().toLowerCase() !== "homepage")
                .slice(0, 4)
                .map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    {a.imageUrl ? (
                      <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img
                          src={toAbsoluteMediaUrl(a.imageUrl)}
                          alt={a.title || "Announcement"}
                          className="h-32 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                    <p className="text-sm font-extrabold text-slate-900">{a.title || "Announcement"}</p>
                    {a.description ? <p className="mt-1 text-xs font-semibold text-slate-600">{a.description}</p> : null}
                    {a.linkUrl ? (
                      <button
                        type="button"
                        onClick={() => openBannerLink(a.linkUrl)}
                        className="mt-2 text-xs font-extrabold text-[#2563EB] hover:text-blue-700"
                      >
                        View Details
                      </button>
                    ) : null}
                  </div>
                ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
            <QuickChip icon={<FiFileText />} label="Easy Apply" />
            <QuickChip icon={<FiTrendingUp />} label="Track Application" />
            <QuickChip icon={<FiPhoneCall />} label="Instant Contact" />
            <QuickChip icon={<FiMessageCircle />} label="Career Tips" />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label }) {
  return (
    <div className="rounded-[16px] border border-white/70 bg-white p-3 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
        {icon}
      </div>
      <p className="mt-2 text-[16px] font-extrabold text-slate-900">{value}</p>
      <p className="text-[12px] font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function JobCard({ job, onClick }) {
  const rating = job.rating ?? (4.2 + ((job.title?.length || 0) % 7) * 0.1);
  const ratingText = Math.min(5, Math.max(3.5, rating)).toFixed(1);

  const serviceTone =
    String(job.service || "").toLowerCase().includes("medical")
      ? "bg-orange-50 text-orange-700"
      : String(job.service || "").toLowerCase().includes("marketing")
      ? "bg-orange-50 text-orange-700"
      : "bg-blue-50 text-blue-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[18px] border border-white/70 bg-white p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_22px_52px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F97316]">
          <span className="text-[16px] font-extrabold">
            {initials(job.company)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-extrabold text-slate-900">
              {job.title}
            </p>
            {job?.isNew ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                New
              </span>
            ) : null}
          </div>

          <p className="truncate text-[12px] font-semibold text-slate-600">
            {job.company}
          </p>

          <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-slate-500">
            <FiMapPin className="text-[13px]" />
            <span className="truncate">{job.location}</span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-[14px] font-extrabold text-emerald-700">
        {job.salary}
      </p>

      <div className="mt-2">
        <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold ${serviceTone}`}>
          {job.service}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-1 text-[#F97316]">
          {Array.from({ length: 5 }).map((_, i) => (
            <FiStar
              key={i}
              className={`text-[14px] ${i < Math.round(Number(ratingText)) ? "" : "opacity-30"}`}
            />
          ))}
        </div>
        <span className="text-[12px] font-extrabold text-slate-700">{ratingText}</span>
      </div>

      <div className="mt-3 h-[1px] w-full bg-slate-100" />
      <p className="mt-2 text-[12px] font-semibold text-slate-500 group-hover:text-slate-700">
        Tap to view details
      </p>
    </button>
  );
}

function BigBannerCard({ title, subtitle, button, image, tone, onClick }) {
  const btnCls =
    tone === "green"
      ? "bg-emerald-600 hover:bg-emerald-700 shadow-[0_14px_30px_rgba(16,185,129,0.25)]"
      : "bg-[#F97316] hover:bg-orange-600 shadow-[0_14px_30px_rgba(249,115,22,0.25)]";

  const titleCls = tone === "green" ? "text-emerald-700" : "text-[#2563EB]";

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50" />
      <div className="relative p-4">
        <div className="flex items-center gap-3">
          <h4 className={`text-[20px] font-extrabold ${titleCls}`}>{title}</h4>
        </div>
        <p className="mt-1 text-[14px] font-semibold text-slate-700">{subtitle}</p>

        <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50">
          <img src={image} alt="" className="h-[160px] w-full object-cover" draggable="false" />
        </div>

        <button
          type="button"
          onClick={onClick}
          className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-[14px] font-extrabold text-white ${btnCls}`}
        >
          {button}
        </button>
      </div>
    </div>
  );
}

function QuickChip({ icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-extrabold text-slate-700 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-[#F97316]">
        {icon}
      </span>
      {label}
    </div>
  );
}
