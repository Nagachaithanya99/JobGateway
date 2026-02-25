import { useMemo, useState } from "react";
import Pagination from "../../common/Pagination.jsx";
import {
  FiInfo,
  FiMapPin,
  FiUsers,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiX,
  FiExternalLink,
  FiDownload,
} from "react-icons/fi";

const DEMO = [
  {
    id: "g1",
    title: "Junior Engineer (Civil)",
    dept: "Public Works Department",
    location: "Multiple Locations",
    eligibility: "B.E/B.Tech in Civil Engineering",
    vacancies: 150,
    salary: "₹35,000 - ₹55,000 per month",
    deadline: "15 March 2026",
    remaining: "26 days remaining",
    type: "PDF",
    notificationUrl: "", // next step: real PDF link
    applyUrl: "", // next step: real apply link
    details:
      "Junior Engineer role includes site supervision, quality checks, estimating, and reporting. You will work with civil teams and contractors.",
  },
  {
    id: "g2",
    title: "Staff Selection Commission - Combined Graduate Level",
    dept: "Staff Selection Commission",
    location: "All India",
    eligibility: "Bachelor's Degree",
    vacancies: 5000,
    salary: "₹25,000 - ₹80,000 per month",
    deadline: "20 March 2026",
    remaining: "31 days remaining",
    type: "Link",
    notificationUrl: "",
    applyUrl: "",
    details:
      "SSC CGL recruitment for multiple departments. Exam-based selection. Check syllabus, eligibility, and exam dates in the official notification.",
  },
  {
    id: "g3",
    title: "Bank Probationary Officer",
    dept: "State Bank of India",
    location: "Pan India",
    eligibility: "Graduate in any discipline",
    vacancies: 2000,
    salary: "₹27,000 - ₹54,000 per month",
    deadline: "10 March 2026",
    remaining: "21 days remaining",
    type: "PDF",
    notificationUrl: "",
    applyUrl: "",
    details:
      "PO role includes customer handling, banking operations, sales targets, and training. Selection via prelims, mains and interview.",
  },
  {
    id: "g4",
    title: "Indian Railway - Assistant Loco Pilot",
    dept: "Railway Recruitment Board",
    location: "Multiple Zones",
    eligibility: "ITI or Diploma",
    vacancies: 3500,
    salary: "₹19,900 - ₹34,400 per month",
    deadline: "25 March 2026",
    remaining: "36 days remaining",
    type: "PDF",
    notificationUrl: "",
    applyUrl: "",
    details:
      "ALP role includes assisting loco pilot, monitoring signals, and maintaining train operations safety and guidelines.",
  },
  {
    id: "g5",
    title: "Teaching Assistant",
    dept: "University Grants Commission",
    location: "Various Universities",
    eligibility: "Master’s Degree with NET",
    vacancies: 800,
    salary: "₹25,000 - ₹44,000 per month",
    deadline: "18 March 2026",
    remaining: "29 days remaining",
    type: "Note",
    notificationUrl: "",
    applyUrl: "",
    details:
      "Teaching assistant role includes assisting faculty, conducting tutorials, supporting labs, and academic evaluation tasks.",
  },
];

function StatCard({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <p className="text-xs text-slate-500 font-semibold">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

/* ---------------- Modal (custom UI) ---------------- */
function ActionModal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* box */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-orange-700">JobPortal</p>
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 grid place-items-center"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className="p-5">{children}</div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          {footer}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function GovRow({ item, onView, onApply, onDownload }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
          <p className="text-slate-600">{item.dept}</p>

          <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <FiMapPin className="text-orange-600" />
              <span>{item.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <FiUsers className="text-orange-600" />
              <span>{item.vacancies} Vacancies</span>
            </div>

            <div className="flex items-center gap-2 md:justify-end">
              <FiTrendingUp className="text-orange-600" />
              <span className="font-semibold">{item.salary}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <FiFileText className="text-orange-600" />
              {item.eligibility}
            </span>

            <span className="inline-flex items-center gap-2">
              <FiClock className="text-orange-600" />
              <b className="text-slate-900">Deadline:</b> {item.deadline}{" "}
              <span className="text-orange-700 font-semibold">
                ({item.remaining})
              </span>
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onView(item)}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition"
            >
              View Details
            </button>

            <button
              onClick={() => onApply(item)}
              className="px-4 py-2 rounded-lg border border-orange-200 text-orange-700 font-bold hover:bg-orange-50 transition"
            >
              Apply Now
            </button>

            <button
              onClick={() => onDownload(item)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
            >
              Download Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GovJobsList() {
  const [page, setPage] = useState(1);
  const pageSize = 4;

  // modal state
  const [modal, setModal] = useState({
    open: false,
    mode: "details", // details | apply | download
    item: null,
  });

  const openModal = (mode, item) => setModal({ open: true, mode, item });
  const closeModal = () => setModal({ open: false, mode: "details", item: null });

  const pages = Math.max(1, Math.ceil(DEMO.length / pageSize));
  const start = (page - 1) * pageSize;
  const slice = DEMO.slice(start, start + pageSize);

  const stats = useMemo(() => {
    const active = DEMO.length;
    const totalVacancies = DEMO.reduce((a, b) => a + (b.vacancies || 0), 0);
    const open = DEMO.length;
    const closingSoon = 0; // demo
    return { active, totalVacancies, open, closingSoon };
  }, []);

  const item = modal.item;

  const modalTitle =
    modal.mode === "details"
      ? "View Details"
      : modal.mode === "apply"
      ? "Apply Now"
      : "Download Notification";

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-orange-600 text-white grid place-items-center">
          <FiInfo />
        </div>
        <div>
          <p className="font-extrabold text-slate-900">
            Stay Updated with Latest Government Jobs
          </p>
          <p className="text-sm text-slate-600">
            Check application deadlines carefully and prepare well for the exams. All the best!
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Notifications" value={stats.active} />
        <StatCard label="Total Vacancies" value={stats.totalVacancies} tone="text-orange-600" />
        <StatCard label="Applications Open" value={stats.open} tone="text-green-600" />
        <StatCard label="Closing Soon" value={stats.closingSoon} tone="text-red-600" />
      </div>

      {/* List */}
      <div className="space-y-4">
        {slice.map((x) => (
          <GovRow
            key={x.id}
            item={x}
            onView={(it) => openModal("details", it)}
            onApply={(it) => openModal("apply", it)}
            onDownload={(it) => openModal("download", it)}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination page={page} pages={pages} onChange={setPage} />

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-extrabold text-slate-900">Exam Preparation Tips</h3>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>Start your preparation early and create a study schedule</li>
          <li>Practice previous year question papers and mock tests</li>
          <li>Stay updated with current affairs and general knowledge</li>
          <li>Read the official notification carefully before applying</li>
        </ul>
      </div>

      <p className="text-xs text-slate-500">
        Government jobs data + PDF/links will be connected in next step.
      </p>

      {/* ✅ Modal */}
      <ActionModal
        open={modal.open}
        onClose={closeModal}
        title={`${modalTitle}${item ? `: ${item.title}` : ""}`}
        footer={
          modal.mode === "apply" && item ? (
            <button
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition inline-flex items-center gap-2"
              onClick={() => {
                // next step: open item.applyUrl
                // window.open(item.applyUrl, "_blank");
                closeModal();
              }}
            >
              <FiExternalLink /> Continue
            </button>
          ) : modal.mode === "download" && item ? (
            <button
              className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition inline-flex items-center gap-2"
              onClick={() => {
                // next step: download item.notificationUrl
                // window.open(item.notificationUrl, "_blank");
                closeModal();
              }}
            >
              <FiDownload /> Download
            </button>
          ) : null
        }
      >
        {!item ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Department</p>
              <p className="font-bold text-slate-900">{item.dept}</p>

              <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-orange-600" /> {item.location}
                </div>
                <div className="flex items-center gap-2">
                  <FiUsers className="text-orange-600" /> {item.vacancies} Vacancies
                </div>
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="text-orange-600" /> {item.salary}
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-orange-600" /> Deadline:{" "}
                  <b className="text-slate-900">{item.deadline}</b>
                </div>
              </div>
            </div>

            {modal.mode === "details" && (
              <div>
                <p className="font-extrabold text-slate-900">About this job</p>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {item.details}
                </p>

                <div className="mt-3 text-xs text-slate-500">
                  Full details page (with PDF preview + apply link) will be added in next step.
                </div>
              </div>
            )}

            {modal.mode === "apply" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="font-extrabold text-slate-900">Apply Process</p>
                <p className="text-sm text-slate-700 mt-1">
                  In next step, this will open the official apply link and track application status.
                </p>
              </div>
            )}

            {modal.mode === "download" && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="font-extrabold text-slate-900">Notification File</p>
                <p className="text-sm text-slate-700 mt-1">
                  In next step, PDF will open/download from Cloudinary.
                </p>
              </div>
            )}
          </div>
        )}
      </ActionModal>
    </div>
  );
}
