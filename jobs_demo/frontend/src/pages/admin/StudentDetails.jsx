// frontend/src/pages/admin/StudentDetails.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiFileText,
} from "react-icons/fi";

import {
  adminGetStudent,
  adminToggleStudentStatus,
  adminDeleteStudent,
} from "../../services/adminService";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [id]);

  async function loadStudent() {
    setLoading(true);
    const res = await adminGetStudent(id);
    setStudent(res);
    setLoading(false);
  }

  async function toggleStatus(next) {
    await adminToggleStudentStatus(student.id, next);
    loadStudent();
  }

  async function deleteStudent() {
    await adminDeleteStudent(student.id);
    navigate("/admin/students");
  }

  if (loading) return <div className="bg-white p-6 rounded-2xl shadow-sm">Loading...</div>;
  if (!student) return <div className="bg-white p-6 rounded-2xl shadow-sm">Student not found.</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/admin/students")}
        className="text-sm font-semibold text-[#2563EB] hover:underline"
      >
        ← Back to Students
      </button>

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
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
              <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize bg-blue-50 border-blue-200 text-[#2563EB]">
                {student.status}
              </span>
              <span className="ml-3 text-sm text-slate-500">
                Completion: {student.completion}%
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              {student.status === "active" ? (
                <button
                  onClick={() => toggleStatus("suspended")}
                  className="btn-danger"
                >
                  <FiUserX /> Suspend
                </button>
              ) : (
                <button
                  onClick={() => toggleStatus("active")}
                  className="btn-primary"
                >
                  <FiUserCheck /> Activate
                </button>
              )}

              <a
                href={`mailto:${student.email}`}
                className="btn-outline"
              >
                <FiMail /> Email
              </a>

              <button onClick={deleteStudent} className="btn-danger">
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[320px]">
            <div className="border rounded-xl p-4">
              <div className="text-sm font-semibold">Resume</div>
              <a
                href={student.resumeUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 border rounded-lg py-2 hover:bg-slate-50"
              >
                <FiFileText /> View Resume
              </a>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <div className="font-semibold">Skills</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(student.skills || []).map((sk) => (
              <span key={sk} className="bg-slate-100 px-3 py-1 rounded-full text-xs">
                {sk}
              </span>
            ))}
            {(!student.skills || student.skills.length === 0) && (
              <span className="text-slate-500 text-sm">No skills listed.</span>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="mt-6">
          <div className="font-semibold">Applied Jobs</div>
          <div className="mt-3 space-y-2">
            {(student.applications || []).map((app) => (
              <div key={app.id} className="border rounded-lg p-3">
                <div className="font-semibold">{app.jobTitle}</div>
                <div className="text-xs text-slate-500">
                  {app.company} • {app.date}
                </div>
                <div className="mt-1 text-xs text-[#2563EB] capitalize">
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
    </div>
  );
}