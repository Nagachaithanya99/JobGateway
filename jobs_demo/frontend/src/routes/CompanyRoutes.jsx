import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import RoleGate from "../components/layout/RoleGate.jsx";

import CompanyLayout from "../components/company/layout/CompanyLayout.jsx";
import CompanyLogin from "../pages/auth/CompanyLogin.jsx";
import CompanySignup from "../pages/auth/CompanySignup.jsx";

import Dashboard from "../pages/company/Dashboard.jsx";
import PricingPlans from "../pages/company/PricingPlans.jsx";
import PostJob from "../pages/company/PostJob.jsx";
import MyJobs from "../pages/company/MyJobs.jsx";
import AppliedCandidates from "../pages/company/AppliedCandidates.jsx";
import Shortlisted from "../pages/company/Shortlisted.jsx";
import Interviews from "../pages/company/Interviews.jsx";
import InterviewWorkspace from "../pages/company/InterviewWorkspace.jsx";
import Messages from "../pages/company/Messages.jsx";
import CompanyNotifications from "../pages/company/Notifications.jsx";
import BoostJob from "../pages/company/BoostJob.jsx";
import AICandidateScoring from "../pages/company/AICandidateScoring.jsx";
import Profile from "../pages/company/Profile.jsx";
import Settings from "../pages/company/Settings.jsx";

export default function CompanyRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<CompanyLogin />} />
      <Route path="/signup" element={<CompanySignup />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleGate allow={["company"]}>
              <CompanyLayout />
            </RoleGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pricing" element={<PricingPlans />} />
        <Route path="post-job" element={<PostJob />} />
        <Route path="my-jobs" element={<MyJobs />} />
        <Route path="candidates" element={<AppliedCandidates />} />
        <Route path="shortlisted" element={<Shortlisted />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/:id/workspace" element={<InterviewWorkspace />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<CompanyNotifications />} />
        <Route path="ai-scoring" element={<AICandidateScoring />} />
        <Route path="boost-job" element={<BoostJob />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
