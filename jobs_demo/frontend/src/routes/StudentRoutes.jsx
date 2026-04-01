import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import RoleGate from "../components/layout/RoleGate.jsx";

import StudentLayout from "../components/student/layout/StudentLayout";
import StudentLogin from "../pages/auth/StudentLogin.jsx";
import StudentSignup from "../pages/auth/StudentSignup.jsx";

import Home from "../pages/student/Home";
import Jobs from "../pages/student/Jobs";
import JobDetails from "../pages/student/JobDetails";
import MyJobs from "../pages/student/MyJobs";
import SavedJobs from "../pages/student/SavedJobs";
import Notifications from "../pages/student/Notifications";
import Messages from "../pages/student/Messages";
import Profile from "../pages/student/Profile";
import Internship from "../pages/student/Internship";
import InternshipDetails from "../pages/student/InternshipDetails";
import GovernmentJobs from "../pages/student/GovernmentJobs";
import GovernmentJobDetails from "../pages/student/GovernmentJobDetails";
import ResumeBuilder from "../pages/student/ResumeBuilder";
import AiMatch from "../pages/student/AiMatch";
import StudentBilling from "../pages/student/Billing.jsx";
import StudentSettings from "../pages/student/StudentSettings";
import About from "../pages/student/About";
import Contact from "../pages/student/Contact";
import StudentInterviews from "../pages/student/Interviews.jsx";
import StudentInterviewWorkspace from "../pages/student/InterviewWorkspace.jsx";
import CareerPulsePage from "../pages/shared/CareerPulsePage.jsx";

export default function StudentRoutes() {
  return (
    <Routes>
        <Route path="login" element={<StudentLogin />} />
        <Route path="signup" element={<StudentSignup />} />

      <Route
        element={
          <ProtectedRoute>
            <RoleGate allow={["student"]}>
              <StudentLayout />
            </RoleGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="explore" element={<CareerPulsePage />} />
        <Route path="career-pulse" element={<Navigate to="/student/explore" replace />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="my-jobs" element={<MyJobs />} />
        <Route path="interviews" element={<StudentInterviews />} />
        <Route path="interviews/:id/workspace" element={<StudentInterviewWorkspace />} />
        <Route path="saved-jobs" element={<SavedJobs />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
        <Route path="internship" element={<Internship />} />
        <Route path="internship/:id" element={<InternshipDetails />} />
        <Route path="government" element={<GovernmentJobs />} />
        <Route path="government/:id" element={<GovernmentJobDetails />} />
        <Route path="resume-builder" element={<ResumeBuilder />} />
        <Route path="billing" element={<StudentBilling />} />
        <Route path="ai-match" element={<AiMatch />} />
        <Route path="settings" element={<StudentSettings />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
      </Route>

        <Route path="*" element={<Navigate to="/student/login" replace />} />
      </Routes>
  );
}
