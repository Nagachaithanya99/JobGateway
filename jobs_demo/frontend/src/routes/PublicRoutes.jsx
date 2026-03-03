import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/public/PublicLayout.jsx";

import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import PublicLogin from "../pages/auth/PublicLogin.jsx";
import PublicRegister from "../pages/auth/PublicRegister.jsx";

// Reuse student/public content pages
import Home from "../pages/student/Home.jsx";
import Jobs from "../pages/student/Jobs.jsx";
import JobDetails from "../pages/student/JobDetails.jsx";
import Internship from "../pages/student/Internship.jsx";
import InternshipDetails from "../pages/student/InternshipDetails.jsx";
import GovernmentJobs from "../pages/student/GovernmentJobs.jsx";
import GovernmentJobDetails from "../pages/student/GovernmentJobDetails.jsx";
import About from "../pages/student/About.jsx";
import Contact from "../pages/student/Contact.jsx";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/internship" element={<Internship />} />
        <Route path="/internship/:id" element={<InternshipDetails />} />
        <Route path="/government" element={<GovernmentJobs />} />
        <Route path="/government/:id" element={<GovernmentJobDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/login" element={<PublicLogin />} />
      <Route path="/register" element={<PublicRegister />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/public" element={<Navigate to="/" replace />} />
      <Route path="/public/login" element={<Navigate to="/login" replace />} />
      <Route path="/public/register" element={<Navigate to="/register" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
