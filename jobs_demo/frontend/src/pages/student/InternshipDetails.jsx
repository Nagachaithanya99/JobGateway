import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiMapPin,
} from "react-icons/fi";
import Modal from "../../components/common/Modal.jsx";
import useAuth from "../../hooks/useAuth.js";
import api from "../../services/api.js";
import { studentApplyJob } from "../../services/studentService.js";

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

export default function InternshipDetails() {
  const { id } = useParams();
  const { user, isAuthed, role } = useAuth();
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
  const completion = Number(user?.profileCompletion ?? 0);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [applyModal, setApplyModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

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
    if (completion < 100) {
      setProfileModal(true);
      return;
    }
    setApplyModal(true);
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
                    className="rounded-xl bg-[#F97316] px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-orange-600"
                  >
                    Apply Now
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
                className="mt-4 w-full rounded-xl bg-[#F97316] px-4 py-3 text-sm font-extrabold text-white hover:bg-orange-600"
              >
                Apply Now
              </button>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={applyModal}
        onClose={() => setApplyModal(false)}
        title="Confirm Application"
        footer={
          <>
            <button
              type="button"
              onClick={() => setApplyModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await studentApplyJob(id);
                  setApplyModal(false);
                  setSuccessModal(true);
                } catch (e) {
                  const status = Number(e?.response?.status || 0);
                  if (status === 401 || status === 403) {
                    setApplyModal(false);
                    redirectToLogin();
                    return;
                  }
                  setErr(e?.response?.data?.message || "Apply failed. Please try again.");
                  setApplyModal(false);
                }
              }}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Confirm Apply
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          We will use your saved profile and resume for{" "}
          <span className="font-semibold text-[#0F172A]">{title}</span>.
        </p>
      </Modal>

      <Modal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        title="Complete your profile to apply"
        footer={
          <>
            <button
              type="button"
              onClick={() => setProfileModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <Link
              to="/student/profile"
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Complete Profile
            </Link>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Your profile completion is below 100%. Complete your profile before applying.
          <span className="ml-2 font-semibold text-[#F97316]">{completion}%</span>
        </p>
      </Modal>

      <Modal
        open={successModal}
        onClose={() => setSuccessModal(false)}
        title="Application Submitted"
        footer={
          <button
            type="button"
            onClick={() => setSuccessModal(false)}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Done
          </button>
        }
      >
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <FiCheckCircle className="text-green-600" />
          Internship application submitted successfully.
        </div>
      </Modal>
    </div>
  );
}

