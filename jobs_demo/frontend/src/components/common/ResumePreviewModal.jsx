import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { toAbsoluteMediaUrl } from "../../utils/media.js";

function safeObj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeArr(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function toDisplayList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return item.split(/[\n,;/|]+/g);
        if (item && typeof item === "object") {
          return String(item.name || item.skill || item.title || "").split(/[\n,;/|]+/g);
        }
        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,;/|]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function formatEducation(item) {
  if (typeof item === "string") return item.trim();

  const row = safeObj(item);
  const degree = firstNonEmpty(row.degree, row.qualification, row.course, row.title, row.fieldOfStudy, row.branch);
  const college = firstNonEmpty(row.college, row.institution, row.school, row.university);
  const duration = firstNonEmpty(row.duration, row.year, [row.startYear, row.endYear].filter(Boolean).join(" - "));

  return {
    title: degree || college || "Education",
    subtitle: degree && college ? college : duration || "",
    meta: degree && college ? duration : "",
  };
}

function formatExperience(item) {
  if (typeof item === "string") {
    return {
      title: item.trim(),
      subtitle: "",
      meta: "",
      description: "",
    };
  }

  const row = safeObj(item);
  const role = firstNonEmpty(row.role, row.title, row.position, row.designation);
  const company = firstNonEmpty(row.company, row.organization, row.employer);
  const duration = firstNonEmpty(row.duration, [row.startDate, row.endDate].filter(Boolean).join(" - "));
  const description = firstNonEmpty(row.description, row.summary, row.details);

  return {
    title: role || company || "Experience",
    subtitle: role && company ? company : duration || "",
    meta: role && company ? duration : "",
    description,
  };
}

function formatProject(item) {
  if (typeof item === "string") {
    return {
      title: item.trim(),
      subtitle: "",
      meta: "",
      description: "",
    };
  }

  const row = safeObj(item);
  return {
    title: firstNonEmpty(row.name, row.title) || "Project",
    subtitle: firstNonEmpty(row.role, row.techStack, row.stack),
    meta: firstNonEmpty(row.link, row.url),
    description: firstNonEmpty(row.description, row.summary),
  };
}

function hasStructuredResume(resumeData = {}) {
  const resume = safeObj(resumeData);
  const personal = safeObj(resume.personal);

  return Boolean(
    firstNonEmpty(personal.name, personal.email, personal.phone, resume.summary) ||
      safeArr(resume.education).length ||
      safeArr(resume.skills).length ||
      safeArr(resume.experience).length ||
      safeArr(resume.projects).length ||
      safeArr(resume.certs).length,
  );
}

function SectionBlock({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ResumeDataPreview({ resumeData, applicantName }) {
  const resume = safeObj(resumeData);
  const personal = safeObj(resume.personal);
  const skills = toDisplayList(resume.skills);
  const education = safeArr(resume.education).map(formatEducation).filter((item) => item.title);
  const experience = safeArr(resume.experience).map(formatExperience).filter((item) => item.title);
  const projects = safeArr(resume.projects).map(formatProject).filter((item) => item.title);
  const certs = safeArr(resume.certs).map((item) => {
    if (typeof item === "string") return item.trim();
    return firstNonEmpty(item?.name, item?.title, item?.certificate);
  }).filter(Boolean);

  return (
    <div className="space-y-4 rounded-[28px] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 sm:p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {firstNonEmpty(personal.name, applicantName) || "Resume"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {firstNonEmpty(resume.summary) || "Structured resume preview generated from the student's profile and resume builder data."}
            </p>
          </div>

          <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
            {firstNonEmpty(personal.email) ? <span>{personal.email}</span> : null}
            {firstNonEmpty(personal.phone) ? <span>{personal.phone}</span> : null}
            {firstNonEmpty(personal.location) ? <span>{personal.location}</span> : null}
            {firstNonEmpty(personal.linkedin) ? <span>{personal.linkedin}</span> : null}
            {firstNonEmpty(personal.portfolio) ? <span>{personal.portfolio}</span> : null}
          </div>
        </div>
      </section>

      {skills.length ? (
        <SectionBlock title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]"
              >
                {skill}
              </span>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {education.length ? (
        <SectionBlock title="Education">
          <div className="space-y-4">
            {education.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    {item.subtitle ? <p className="text-sm text-slate-600">{item.subtitle}</p> : null}
                  </div>
                  {item.meta ? <span className="text-xs font-semibold text-slate-500">{item.meta}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {experience.length ? (
        <SectionBlock title="Experience">
          <div className="space-y-4">
            {experience.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    {item.subtitle ? <p className="text-sm text-slate-600">{item.subtitle}</p> : null}
                  </div>
                  {item.meta ? <span className="text-xs font-semibold text-slate-500">{item.meta}</span> : null}
                </div>
                {item.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
              </article>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {projects.length ? (
        <SectionBlock title="Projects">
          <div className="space-y-4">
            {projects.map((item, index) => (
              <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    {item.subtitle ? <p className="text-sm text-slate-600">{item.subtitle}</p> : null}
                  </div>
                  {item.meta ? <span className="break-all text-xs font-semibold text-slate-500">{item.meta}</span> : null}
                </div>
                {item.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p> : null}
              </article>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {certs.length ? (
        <SectionBlock title="Certifications">
          <div className="flex flex-wrap gap-2">
            {certs.map((cert) => (
              <span
                key={cert}
                className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                {cert}
              </span>
            ))}
          </div>
        </SectionBlock>
      ) : null}
    </div>
  );
}

export default function ResumePreviewModal({
  open,
  resumeUrl = "",
  resumeData = null,
  applicantName = "Candidate",
  onClose,
}) {
  const absoluteUrl = toAbsoluteMediaUrl(resumeUrl);
  const hasResumeData = hasStructuredResume(resumeData);
  const pathname = absoluteUrl ? new URL(absoluteUrl, window.location.origin).pathname.toLowerCase() : "";
  const isPreviewableFile = absoluteUrl && !pathname.match(/\.(doc|docx)$/i);
  const [fileState, setFileState] = useState("idle");

  useEffect(() => {
    if (!open || !absoluteUrl || hasResumeData) {
      setFileState("idle");
      return undefined;
    }

    let active = true;
    setFileState("checking");

    fetch(absoluteUrl, {
      method: "HEAD",
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => {
        if (!active) return;
        setFileState(response.ok ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setFileState("missing");
      });

    return () => {
      active = false;
    };
  }, [absoluteUrl, hasResumeData, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${applicantName} Resume`}
      widthClass="max-w-6xl"
    >
      {!absoluteUrl && !hasResumeData ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Resume not available.
        </div>
      ) : (
        <div className="space-y-4">
          {absoluteUrl ? (
            <div className="flex justify-end">
              <a
                href={absoluteUrl}
                download
                className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
              >
                Download Resume
              </a>
            </div>
          ) : null}

          {hasResumeData ? (
            <ResumeDataPreview resumeData={resumeData} applicantName={applicantName} />
          ) : fileState === "idle" || fileState === "checking" ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              Loading resume preview...
            </div>
          ) : fileState === "missing" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Resume file was not found on the server. Ask the student to upload the resume again.
            </div>
          ) : isPreviewableFile ? (
            <div className="h-[72vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <iframe
                title={`${applicantName} resume preview`}
                src={absoluteUrl}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              This resume was uploaded as a Word document, so inline preview is not available here yet.
              Please use the download button to open the original file.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
