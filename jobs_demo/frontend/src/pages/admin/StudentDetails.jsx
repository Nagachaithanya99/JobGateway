import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTrash2,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

import {
  adminDeleteStudent,
  adminGetStudent,
  adminToggleStudentStatus,
} from "../../services/adminService";
import ResumePreviewModal from "../../components/common/ResumePreviewModal.jsx";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    void loadStudent();
  }, [id]);

  async function loadStudent() {
    setLoading(true);
    const res = await adminGetStudent(id);
    setStudent(res);
    setLoading(false);
  }

  async function toggleStatus(next) {
    await adminToggleStudentStatus(student.id, next);
    void loadStudent();
  }

  async function deleteStudent() {
    await adminDeleteStudent(student.id);
    navigate("/admin/students");
  }

  if (loading) return <div className="rounded-2xl bg-white p-6 shadow-sm">Loading...</div>;
  if (!student) return <div className="rounded-2xl bg-white p-6 shadow-sm">Student not found.</div>;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/admin/students")}
        className="text-sm font-semibold text-[#2563EB] hover:underline"
      >
        Back to Students
      </button>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row">
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>

            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <FiMail /> {student.email}
              </div>
              <div className="flex items-center gap-2">
                <FiPhone /> {student.phone || "-"}
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin /> {student.location || "-"}
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-[#2563EB]">
                {student.status}
              </span>
              <span className="ml-3 text-sm text-slate-500">
                Completion: {student.completion}%
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {student.status === "active" ? (
                <button
                  type="button"
                  onClick={() => toggleStatus("suspended")}
                  className="btn-danger"
                >
                  <FiUserX /> Suspend
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleStatus("active")}
                  className="btn-primary"
                >
                  <FiUserCheck /> Activate
                </button>
              )}

              <a href={`mailto:${student.email}`} className="btn-outline">
                <FiMail /> Email
              </a>

              <button type="button" onClick={deleteStudent} className="btn-danger">
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[320px]">
            <div className="rounded-xl border p-4">
              <div className="text-sm font-semibold">Resume</div>
              {student.resumeUrl || student.resumeData ? (
                <button
                  type="button"
                  onClick={() => setResumeOpen(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border py-2 hover:bg-slate-50"
                >
                  <FiFileText /> View Resume
                </button>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                  Resume not available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="font-semibold">Skills</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(student.skills || []).map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {skill}
              </span>
            ))}
            {(!student.skills || student.skills.length === 0) && (
              <span className="text-sm text-slate-500">No skills listed.</span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="font-semibold">Applied Jobs</div>
          <div className="mt-3 space-y-2">
            {(student.applications || []).map((app) => (
              <div key={app.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{app.jobTitle}</div>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {app.sourceLabel || "Application"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {app.company} • {app.date}
                </div>
                <div className="mt-1 text-xs capitalize text-[#2563EB]">
                  {app.status}
                </div>
              </div>
            ))}
            {student.applications.length === 0 && (
              <div className="text-sm text-slate-500">No applications yet.</div>
            )}
          </div>
        </div>
      </div>

      <ResumePreviewModal
        open={resumeOpen}
        resumeUrl={student.resumeUrl || ""}
        resumeData={student.resumeData || null}
        applicantName={student.name || "Student"}
        onClose={() => setResumeOpen(false)}
      />
    </div>
  );
}
