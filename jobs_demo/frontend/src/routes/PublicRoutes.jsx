import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "../components/public/PublicLayout.jsx";

import ForgotPassword from "../pages/auth/ForgotPassword.jsx";

// reuse the same pages you already built (student ones)
import About from "../pages/student/About.jsx";
import Contact from "../pages/student/Contact.jsx"; // if not created, make a simple Contact page

export default function PublicRoutes() {
  return (
    <Routes>
      {/* pages with navbar/footer */}
      <Route element={<PublicLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* keep forgot (your choice: inside layout or outside) */}
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/public" element={<Navigate to="/about" replace />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/about" replace />} />
    </Routes>
  );
}
