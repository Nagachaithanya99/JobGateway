import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiFileText,
  FiLayers,
  FiMapPin,
  FiShield,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { Link } from "react-router-dom";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function postedAgo(createdAt) {
  if (!createdAt) return "Recently added";

  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

function formatDeadline(deadline) {
  if (!deadline) return "";

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return String(deadline);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;/|]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function summarize(text, maxLength = 180) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function salaryLabel(job = {}) {
  if (job?.showSalary === false) return "Compensation not disclosed";
  return job?.salaryText || "Compensation not disclosed";
}

function experienceLabel(job = {}) {
  return job?.experienceText || job?.experience || "Experience not specified";
}

function openingsLabel(openings) {
  const count = Number(openings || 0);
  if (!Number.isFinite(count) || count <= 0) return "";
  return count === 1 ? "1 opening" : `${count} openings`;
}

function screeningLabel(count) {
  const total = Number(count || 0);
  if (!Number.isFinite(total) || total <= 0) return "";
  return total === 1 ? "1 screening question" : `${total} screening questions`;
}

function MetaPill({ icon: Icon, label, tone = "default" }) {
  if (!label) return null;

  const tones = {
    default: "border-slate-200 bg-slate-100 text-slate-700",
    featured: "border-orange-200 bg-orange-50 text-[#c45500]",
    emphasis: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    subtle: "border-slate-200 bg-white text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-extrabold ${tones[tone] || tones.default}`}
    >
      {Icon ? <Icon className="text-[13px]" /> : null}
      {label}
    </span>
  );
}

function StatCard({ icon, label, value, accent = false }) {
  const Icon = icon;
  return (
    <div className="rounded-[14px] border border-slate-200/80 bg-[#fcfcfd] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        <Icon className="text-[13px]" />
        {label}
      </div>
      <p className={`mt-1.5 text-[13px] font-extrabold ${accent ? "text-emerald-700" : "text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

export default function JobCard({
  job,
  detailsHref,
  onQuickApply,
  isApplying = false,
  isApplied = false,
}) {
  const jobId = String(job?._id || job?.id || "");
  const title = job?.title || "Job";
  const company = job?.companyName || job?.company?.name || "Company";
  const companyLogo = job?.companyLogo || job?.logoUrl || job?.company?.logoUrl || "";
  const location = job?.location || [job?.city, job?.state].filter(Boolean).join(", ") || "Location not provided";
  const hierarchy = [job?.stream, job?.category, job?.subCategory].filter(Boolean).join(" / ");
  const summary = summarize(job?.overview || job?.description);
  const skills = normalizeList(job?.skills).slice(0, 4);
  const benefits = normalizeList(job?.benefits).slice(0, 2);
  const deadline = formatDeadline(job?.deadline);
  const screening = screeningLabel(job?.questionsCount);
  const openings = openingsLabel(job?.openings);
  const posted = postedAgo(job?.createdAt);
  const requirementBadges = [
    job?.oneClickApply ? "1-click apply" : "",
    job?.requireResume ? "Resume required" : "",
    job?.requireProfile100 ? "100% profile required" : "",
    screening,
  ].filter(Boolean);

  return (
    <article className="flex h-full flex-col rounded-[20px] border border-slate-200/70 bg-white/80 p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-b from-orange-400 to-orange-500 text-[17px] font-extrabold text-white shadow-sm">
          {companyLogo ? (
            <img src={companyLogo} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(company) || "JG"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[20px] font-extrabold text-slate-900">{title}</h3>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-slate-600">{company}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-[#fcfcfd] px-2.5 py-1 text-[11px] font-bold text-slate-500">
                <FiClock className="text-[12px]" />
                {posted}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {job?.boostActive ? <MetaPill icon={FiZap} label="Featured" tone="featured" /> : null}
            {job?.jobType ? <MetaPill label={job.jobType} tone="subtle" /> : null}
            {job?.workMode ? <MetaPill label={job.workMode} tone="subtle" /> : null}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatCard icon={FiMapPin} label="Location" value={location} />
        <StatCard icon={FiBriefcase} label="Experience" value={experienceLabel(job)} />
        <StatCard
          icon={FiLayers}
          label="Compensation"
          value={salaryLabel(job)}
          accent={job?.showSalary !== false && !!job?.salaryText}
        />
        <StatCard
          icon={FiCalendar}
          label="Timeline"
          value={deadline ? `Apply by ${deadline}` : "Applications open"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hierarchy ? <MetaPill icon={FiLayers} label={hierarchy} /> : null}
        {openings ? <MetaPill icon={FiUsers} label={openings} tone="info" /> : null}
      </div>

      {summary ? (
        <p className="mt-3 overflow-hidden text-[13px] leading-5 text-slate-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {summary}
        </p>
      ) : null}

      {skills.length || benefits.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={`skill-${skill}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700"
            >
              {skill}
            </span>
          ))}
          {benefits.map((benefit) => (
            <span
              key={`benefit-${benefit}`}
              className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-[#c45500]"
            >
              {benefit}
            </span>
          ))}
        </div>
      ) : null}

      {requirementBadges.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {requirementBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
            >
              <FiShield className="text-[11px] text-slate-400" />
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {screening ? <MetaPill icon={FiFileText} label={screening} /> : null}
        <MetaPill label={job?.boostActive ? "Priority listing" : "Standard listing"} tone="subtle" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {detailsHref ? (
          <Link
            to={detailsHref}
            className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-center text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-50"
          >
            View Details
          </Link>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => onQuickApply?.(jobId)}
          disabled={!jobId || isApplying}
          className={`rounded-[14px] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_10px_25px_rgba(255,122,0,0.35)] transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isApplied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#ff7a00] hover:bg-[#ff6a00]"
          }`}
        >
          {isApplying ? "Applying..." : isApplied ? "Applied" : "Quick Apply"}
        </button>
      </div>
    </article>
  );
}
