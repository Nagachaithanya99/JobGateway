import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { studentGetGovernmentJobDetails } from "../../services/studentService.js";

const HERO_IMG = "/images/student-government/gov-details-hero.png";

function fmt(v) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pick(obj, keys, fallback = "") {
  for (const k of keys) {
    const val = obj?.[k];
    if (typeof val === "string" && val.trim()) return val;
  }
  return fallback;
}

export default function GovernmentJobDetails() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) {
          setNotFound(true);
          return;
        }

        setErr("");
        setLoading(true);
        setNotFound(false);

        const res = await studentGetGovernmentJobDetails(id);
        if (!mounted) return;

        const data = res?.data || null;
        if (!data?.id && !data?._id) {
          setNotFound(true);
          setItem(null);
        } else {
          setItem(data);
        }
      } catch (e) {
        console.error("government details error:", e);
        if (!mounted) return;
        if (e?.response?.status === 404) {
          setNotFound(true);
          setItem(null);
        } else {
          setErr(e?.response?.data?.message || "Failed to load government job details.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const view = useMemo(() => {
    if (!item) return null;

    const data = item.data || {};
    const eligibility = Array.isArray(item.eligibility)
      ? item.eligibility
      : Array.isArray(data.eligibility)
      ? data.eligibility
      : [];
    const selectionProcess = Array.isArray(item.selectionProcess)
      ? item.selectionProcess
      : Array.isArray(data.selectionProcess)
      ? data.selectionProcess
      : [];

    return {
      title: item.title || data.title || "",
      department: item.department || data.department || item.source || "",
      summary: item.summary || data.shortDescription || data.summary || item.description || "",
      eligibility,
      selectionProcess,
      startDate: item.startDate || data.applicationStartDate || data.startDate || "",
      endDate: item.endDate || data.applicationEndDate || data.endDate || "",
      examType: item.examType || data.examType || "",
      state: item.state || data.state || "",
      vacancies: item.vacancies ?? data.vacancies ?? "",
      qualification: item.qualification || data.qualification || "",
      pdfUrl: pick(item, ["pdfUrl", "fileUrl"], pick(data, ["attachmentUrl", "pdfUrl"], "")),
      officialWebsite: pick(item, ["officialWebsite", "link"], pick(data, ["officialWebsite"], "")),
      applicationLink: pick(item, ["applicationLink", "link"], pick(data, ["applicationLink", "externalUrl"], "")),
      publishedAt: item.publishedAt || item.createdAt,
      source: item.source || data.source || "",
    };
  }, [item]);

  if (notFound) return <Navigate to="/student/government" replace />;

  return (
    <div className="bg-[#F8FAFC] pb-10">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading details...
          </div>
        ) : null}

        {!loading && err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {err}
          </div>
        ) : null}

        {!loading && view ? (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="p-5">
                  <p className="text-sm text-slate-500">
                    <Link to="/student" className="hover:text-[#F97316]">
                      Home
                    </Link>
                    <span className="px-1.5">{">"}</span>
                    <Link to="/student/government" className="hover:text-[#F97316]">
                      Government Jobs
                    </Link>
                    <span className="px-1.5">{">"}</span>
                    <span className="text-slate-700">{view.title || "Details"}</span>
                  </p>

                  <h1 className="mt-3 text-3xl font-bold text-[#0F172A]">{view.title || "Government Update"}</h1>
                  {view.department ? (
                    <p className="mt-1 text-sm text-slate-600">{view.department}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {view.examType ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-[#2563EB]">
                        {view.examType}
                      </span>
                    ) : null}
                    {view.state ? (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                        {view.state}
                      </span>
                    ) : null}
                    {view.qualification ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                        {view.qualification}
                      </span>
                    ) : null}
                  </div>

                  {view.publishedAt ? (
                    <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                      <FiCalendar />
                      Published: {fmt(view.publishedAt)}
                    </p>
                  ) : null}
                </div>

                <div className="bg-slate-50 p-3 lg:p-4">
                  <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={HERO_IMG}
                      alt="Government job details"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <main className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#0F172A]">Official Notification Summary</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{view.summary || ""}</p>
                </section>

                {view.eligibility.length ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#0F172A]">Eligibility Criteria</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {view.eligibility.map((x, idx) => (
                        <li key={`${x}-${idx}`}>{x}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {view.selectionProcess.length ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#0F172A]">Selection Process</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {view.selectionProcess.map((x, idx) => (
                        <span
                          key={`${x}-${idx}`}
                          className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#F97316]"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#0F172A]">Important Dates</h2>
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">Application Start</th>
                          <td className="px-4 py-3 text-slate-700">
                            {view.startDate ? fmt(view.startDate) : "-"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">Application End</th>
                          <td className="px-4 py-3 text-slate-700">
                            {view.endDate ? fmt(view.endDate) : "-"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-50 px-4 py-3 font-semibold text-slate-700">Exam Type</th>
                          <td className="px-4 py-3 text-slate-700">{view.examType || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </main>

              <aside className="lg:sticky lg:top-20 lg:h-fit">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">
                    <FiFileText />
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    {view.state ? <p>{view.state}</p> : null}
                    {view.vacancies ? <p>{view.vacancies} Vacancies</p> : null}
                    {view.qualification ? <p>{view.qualification}</p> : null}
                    {view.source ? <p className="text-xs text-slate-500">Source: {view.source}</p> : null}
                  </div>

                  <div className="mt-4 space-y-2">
                    {view.pdfUrl ? (
                      <a
                        href={view.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <FiDownload /> Download Official PDF
                      </a>
                    ) : null}

                    {view.officialWebsite ? (
                      <a
                        href={view.officialWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50"
                      >
                        <FiExternalLink /> Visit Official Website
                      </a>
                    ) : null}

                    {view.applicationLink ? (
                      <a
                        href={view.applicationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Apply Now
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5" />
                      <p>Always verify official notification before making payments.</p>
                    </div>
                  </div>

                  <Link
                    to="/student/government"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to Government Jobs
                  </Link>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
