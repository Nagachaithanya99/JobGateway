import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/auth/AdminLogin.jsx";
import ProtectedRoute from "../components/layout/ProtectedRoute.jsx";
import AdminLayout from "../components/admin/layout/AdminLayout.jsx";

import Dashboard from "../pages/admin/Dashboard.jsx";
import Companies from "../pages/admin/Companies.jsx";
import CompanyDetails from "../pages/admin/CompanyDetails.jsx";
import Jobs from "../pages/admin/Jobs.jsx";
import JobDetails from "../pages/admin/JobDetails.jsx";
import MyJobs from "../pages/admin/MyJobs.jsx";
import Applicants from "../pages/admin/Applicants.jsx";
import MyApplications from "../pages/admin/MyApplications.jsx";
import ApplicantProfile from "../pages/admin/ApplicantProfile.jsx";
import Students from "../pages/admin/Students.jsx";
import StudentDetails from "../pages/admin/StudentDetails.jsx";
import PricingPlans from "../pages/admin/PricingPlans.jsx";
import ContentManagement from "../pages/admin/ContentManagement.jsx";
import GovernmentUpdates from "../pages/admin/GovernmentUpdates.jsx";
import Settings from "../pages/admin/Settings.jsx";
import Profile from "../pages/admin/Profile.jsx";
import RolesPermissions from "../pages/admin/RolesPermissions.jsx";
import Notifications from "../pages/admin/Notifications.jsx";
import AdsUsers from "../pages/admin/AdsUsers.jsx";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="login/*" element={<AdminLogin />} />
      <Route path="signup/*" element={<Navigate to="/admin/login" replace />} />
      <Route path="register/*" element={<Navigate to="/admin/login" replace />} />

      <Route
        path=""
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetails />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetails />} />
        <Route path="my-jobs" element={<MyJobs />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="my-applications" element={<MyApplications />} />
        <Route path="applicants/:id" element={<ApplicantProfile />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetails />} />
        <Route path="pricing" element={<PricingPlans />} />
        <Route path="content" element={<ContentManagement />} />
        <Route path="gov" element={<GovernmentUpdates />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="ads" element={<AdsUsers />} />
        <Route path="interviews/*" element={<Navigate to="/admin" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
