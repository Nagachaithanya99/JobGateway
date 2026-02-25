import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { adminGetApplicant, adminUpdateApplicantStatus } from "../../services/adminService";

function StatusBadge({ value }) {
  const v = String(value || "").toLowerCase();
  const cls =
    v === "shortlisted"
      ? "bg-green-50 border-green-200 text-green-700"
      : v === "hold"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : v === "rejected"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-blue-50 border-blue-200 text-[#2563EB]";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {value}
    </span>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {label}
    </button>
  );
}

export default function ApplicantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await adminGetApplicant(id);
        if (!mounted) return;
        setData(res || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load applicant profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const appliedJobs = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: data.job?.id || "job_1",
        title: data.job?.title || "-",
        company: data.job?.companyName || "-",
        date: data.appliedAt || "-",
        status: data.status || "applied",
      },
    ];
  }, [data]);

  const changeStatus = async (status) => {
    setSaving(true);
    setError("");
    try {
      const res = await adminUpdateApplicantStatus(id, status);
      if (res?.application) {
        setData(res.application);
      } else {
        setData((prev) => ({ ...prev, status }));
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-800">Applicant not found.</p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Go Back
        </button>
      </div>
    );
  }

  const student = data.student || {};

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-medium text-slate-400">Dashboard &gt; Applicants &gt; Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-[#0F172A] sm:text-3xl">Applicant Profile</h1>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "Student")}&background=DBEAFE&color=2563EB&bold=true`}
              alt={student.name || "Student"}
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-[#0F172A]">{student.name || "Student"}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {student.education || "-"} | {student.experience || "-"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge value={data.status} />
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
                  Profile Completion {student.profileCompletion || 0}%
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-600 sm:grid-cols-2">
                <p className="flex items-center gap-2"><FiMail /> {student.email || "-"}</p>
                <p className="flex items-center gap-2"><FiPhone /> {student.phone || "-"}</p>
                <p className="flex items-center gap-2"><FiMapPin /> {student.location || "-"}</p>
                <p className="flex items-center gap-2"><FiUser /> Applied: {data.appliedAt || "-"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => changeStatus("shortlisted")}
              className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Shortlist
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => changeStatus("hold")}
              className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Hold
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => changeStatus("rejected")}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
            <a
              href={student.email ? `mailto:${student.email}` : "#"}
              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
            >
              Send Email
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "overview"} label="Overview" onClick={() => setTab("overview")} />
          <TabButton active={tab === "education"} label="Education" onClick={() => setTab("education")} />
          <TabButton active={tab === "skills"} label="Skills" onClick={() => setTab("skills")} />
          <TabButton active={tab === "experience"} label="Experience" onClick={() => setTab("experience")} />
          <TabButton active={tab === "applied"} label="Applied Jobs" onClick={() => setTab("applied")} />
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
          {tab === "overview" ? (
            <div className="space-y-3">
              <p>
                Professional summary: Motivated candidate with strong domain fundamentals and a consistent application record.
              </p>
              <div className="flex flex-wrap gap-2">
                {(student.skills || []).map((skill) => (
                  <span key={skill} className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
                    {skill}
                  </span>
                ))}
              </div>
              {student.resumeUrl ? (
                <a href={student.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
                  Download Resume
                </a>
              ) : (
                <p className="text-xs text-slate-500">Resume not available</p>
              )}
            </div>
          ) : null}

          {tab === "education" ? (
            <div>
              <p className="font-semibold text-slate-800">Highest Education</p>
              <p className="mt-1">{student.education || "Not provided"}</p>
            </div>
          ) : null}

          {tab === "skills" ? (
            <div className="flex flex-wrap gap-2">
              {(student.skills || []).map((skill) => (
                <span key={skill} className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2563EB]">
                  {skill}
                </span>
              ))}
            </div>
          ) : null}

          {tab === "experience" ? (
            <div>
              <p className="font-semibold text-slate-800">Experience</p>
              <p className="mt-1">{student.experience || "Not provided"}</p>
            </div>
          ) : null}

          {tab === "applied" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Job</th>
                    <th className="py-2">Company</th>
                    <th className="py-2">Applied Date</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appliedJobs.map((job) => (
                    <tr key={job.id} className="border-t border-slate-100">
                      <td className="py-2 text-slate-700">{job.title}</td>
                      <td className="py-2 text-slate-700">{job.company}</td>
                      <td className="py-2 text-slate-600">{job.date}</td>
                      <td className="py-2"><StatusBadge value={job.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
