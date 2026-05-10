import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiMapPin,
} from "react-icons/fi";
import StatusPopup from "../../components/common/StatusPopup.jsx";
import useAuth from "../../hooks/useAuth.js";
import api from "../../services/api.js";
import { studentApplyJob, studentMe, studentMyApplications } from "../../services/studentService.js";

import hero from "../../assets/images/student-internship/internship-details-hero.png";

function normalizeArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean);
  if (typeof x === "string") {
    return x
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function money(n) {
  const v = Number(n || 0);
  return `₹${v.toLocaleString("en-IN")}`;
}

function parseStipend(raw = "") {
  const nums = String(raw).match(/\d+/g) || [];
  const min = Number(nums[0] || 0);
  const max = Number(nums[1] || 0);
  return { min, max };
}

function readProfileCompletion(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload ?? {};
  const n = Number(data?.profileCompletion ?? data?.studentProfile?.profileCompletion ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function InternshipDetails() {
  const { id } = useParams();
  const { isAuthed, role } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const isStudentView = location.pathname.startsWith("/student");
  const withBase = (path) => `${isStudentView ? "/student" : ""}${path}`;
  const redirectToLogin = () => {
    const redirect = isStudentView
      ? `${location.pathname}${location.search || ""}`
      : `/student${location.pathname === "/" ? "" : location.pathname}${location.search || ""}`;
    if (isStudentView) {
      nav("/student/login");
      return;
    }
    nav(`/login?role=student&redirect=${encodeURIComponent(redirect)}`);
  };
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    variant: "info",
    badge: "Status",
    title: "",
    message: "",
    details: [],
    primaryLabel: "Done",
    primaryHref: "",
    secondaryLabel: "",
    onPrimary: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get(`/student/internships/${id}`);
        if (!mounted) return;
        setItem(res?.data || null);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.message || "Failed to load internship details.");
        setItem(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [appsRes, meRes] = await Promise.all([
          studentMyApplications({ page: 1, limit: 300 }),
          studentMe(),
        ]);
        if (!mounted) return;
        const appRows = Array.isArray(appsRes?.data?.items) ? appsRes.data.items : [];
        setAlreadyApplied(
          appRows.some((x) => String(x?.jobId || x?.job?._id || x?.job || "") === String(id))
        );
        setProfileCompletion(readProfileCompletion(meRes));
      } catch {
        if (mounted) {
          setAlreadyApplied(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const openPopup = (next) => {
    setPopup({
      open: true,
      variant: next.variant || "info",
      badge: next.badge || "Status",
      title: next.title || "",
      message: next.message || "",
      details: Array.isArray(next.details) ? next.details : [],
      primaryLabel: next.primaryLabel || "Done",
      primaryHref: next.primaryHref || "",
      secondaryLabel: next.secondaryLabel || "",
      onPrimary: next.onPrimary || null,
    });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, open: false, onPrimary: null, primaryHref: "" }));
  };

  const ensureLatestCompletion = async () => {
    try {
      const meRes = await studentMe();
      const value = readProfileCompletion(meRes);
      setProfileCompletion(value);
      return value;
    } catch {
      return profileCompletion;
    }
  };

  const responsibilities = useMemo(
    () => normalizeArray(item?.responsibilities),
    [item]
  );
  const requirements = useMemo(() => normalizeArray(item?.requirements), [item]);
  const skills = useMemo(() => normalizeArray(item?.skills), [item]);

  const onApplyNow = () => {
    if (!isAuthed || role !== "student") {
      redirectToLogin();
      return;
    }
    if (alreadyApplied) {
      openPopup({
        variant: "info",
        badge: "Already Applied",
        title: "Application already exists",
        message: "You already applied for this internship. You can wait for recruiter updates.",
      });
      return;
    }
    openPopup({
      variant: "info",
      badge: "Confirm Apply",
      title: "Apply with your saved profile",
      message: `We will use your current profile and resume for ${title || "this internship"}.`,
      primaryLabel: "Confirm Apply",
      secondaryLabel: "Cancel",
      onPrimary: async () => {
        try {
          const completion = await ensureLatestCompletion();
          if (completion < 100) {
            openPopup({
              variant: "warning",
              badge: "Complete Profile",
              title: "Finish your profile before applying",
              message: "Your profile needs to be fully completed before this application can be submitted.",
              details: [`Current profile completion: ${completion}%`],
              primaryLabel: "Complete Profile",
              primaryHref: "/student/profile",
              secondaryLabel: "Close",
            });
            return;
          }
          const res = await studentApplyJob(id);
          setAlreadyApplied(true);
          openPopup(
            res?.data?.alreadyApplied
              ? {
                  variant: "info",
                  badge: "Already Applied",
                  title: "Application already exists",
                  message: "You already applied for this internship. No duplicate application was created.",
                }
              : {
                  variant: "success",
                  badge: "Applied",
                  title: "Internship application submitted",
                  message: "Your internship application has been sent successfully.",
                }
          );
        } catch (e) {
          const status = Number(e?.response?.status || 0);
          if (status === 401 || status === 403) {
            redirectToLogin();
            return;
          }
          if (e?.response?.data?.profileIncomplete) {
            const completion = readProfileCompletion(e?.response);
            setProfileCompletion(completion);
            openPopup({
              variant: "warning",
              badge: "Complete Profile",
              title: "Finish your profile before applying",
              message: "Your profile needs to be fully completed before this application can be submitted.",
              details: [`Current profile completion: ${completion}%`],
              primaryLabel: "Complete Profile",
              primaryHref: "/student/profile",
              secondaryLabel: "Close",
            });
            return;
          }
          if (e?.response?.data?.alreadyApplied) {
            setAlreadyApplied(true);
            openPopup({
              variant: "info",
              badge: "Already Applied",
              title: "Application already exists",
              message: "You already applied for this internship. No duplicate application was created.",
            });
            return;
          }
          setErr(e?.response?.data?.message || "Apply failed. Please try again.");
          closePopup();
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="bg-[#F6F8FF] pb-24 md:pb-10">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/50 bg-white/70 p-6 text-sm text-slate-600 shadow-sm backdrop-blur">
            Loading internship details...
          </div>
        </div>
      </div>
    );
  }

  if (err && !item) {
    return (
      <div className="bg-[#F6F8FF] pb-24 md:pb-10">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {err}
          </div>
          <div className="mt-4">
            <Link
              to={withBase("/internship")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Internships
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const company = item?.company || "";
  const title = item?.title || "";
  const loc = item?.location || "";
  const dur = item?.duration || "";
  const stipend = parseStipend(item?.stipend || "");
  const website = item?.companyInfo?.website || item?.website || "";

  return (
    <div className="bg-[#F6F8FF] pb-24 md:pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute top-28 right-[-12rem] h-[22rem] w-[22rem] rounded-full bg-orange-200/35 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="w-full space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/55 bg-white/55 p-6 shadow-sm backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-br from-white/65 via-white/40 to-blue-50/40" />
          <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="text-sm text-slate-500">
                <Link to={withBase("/")} className="hover:text-[#2563EB]">
                  Home
                </Link>
                <span className="px-1.5">{" > "}</span>
                <Link to={withBase("/internship")} className="hover:text-[#2563EB]">
                  Internships
                </Link>
                <span className="px-1.5">{" > "}</span>
                <span className="text-slate-700">{title || "Details"}</span>
              </p>

              <div className="mt-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A]">
                  {title || "Internship"}
                </h1>
                {company ? (
                  <p className="mt-2 text-sm font-semibold text-slate-600">{company}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                  {loc ? (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin /> {loc}
                    </span>
                  ) : null}
                  {dur ? (
                    <span className="inline-flex items-center gap-1">
                      <FiBriefcase /> {dur}
                    </span>
                  ) : null}
                  {stipend.min || stipend.max ? (
                    <span className="font-semibold text-[#F97316]">
                      {money(stipend.min)} - {money(stipend.max)}/month
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onApplyNow}
                    className={`rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-sm ${
                      alreadyApplied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#F97316] hover:bg-orange-600"
                    }`}
                  >
                    {alreadyApplied ? "Applied" : "Apply Now"}
                  </button>

                  {website ? (
                    <a
                      href={
                        website.startsWith("http") ? website : `https://${website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-extrabold text-[#2563EB] hover:bg-blue-100"
                    >
                      Visit Company <FiExternalLink />
                    </a>
                  ) : null}

                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
                    <FiClock /> Updated recently
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[220px] w-full overflow-hidden rounded-[26px] border border-white/55 bg-white/70 shadow-sm backdrop-blur">
              <img
                src={hero}
                alt="Internship hero"
                className="h-full w-full object-cover"
                draggable="false"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-4">
            <section className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-[#0F172A]">Overview</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item?.description || item?.overview || ""}
              </p>
            </section>

            <section className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Responsibilities
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {responsibilities.map((x, i) => (
                  <li key={`${x}-${i}`} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[#2563EB]">
                      <FiCheckCircle className="h-4 w-4" />
                    </span>
                    <span className="leading-6">{x}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur">
              <h2 className="text-lg font-semibold text-[#0F172A]">Requirements</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {requirements.map((x, i) => (
                  <li key={`${x}-${i}`} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      ✓
                    </span>
                    <span className="leading-6">{x}</span>
                  </li>
                ))}
              </ul>
            </section>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <div className="rounded-[26px] border border-white/55 bg-white/70 p-4 shadow-sm backdrop-blur">
              <h3 className="text-base font-semibold text-[#0F172A]">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={onApplyNow}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white ${
                  alreadyApplied ? "bg-emerald-600 hover:bg-emerald-600" : "bg-[#F97316] hover:bg-orange-600"
                }`}
              >
                {alreadyApplied ? "Applied" : "Apply Now"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <StatusPopup
        open={popup.open}
        onClose={closePopup}
        variant={popup.variant}
        badge={popup.badge}
        title={popup.title}
        message={popup.message}
        details={popup.details}
        primaryLabel={popup.primaryLabel}
        primaryHref={popup.primaryHref}
        onPrimary={popup.onPrimary}
        secondaryLabel={popup.secondaryLabel}
      />
    </div>
  );
}

