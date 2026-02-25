import { Outlet } from "react-router-dom";
import StudentNavbar from "../student/layout/StudentNavbar.jsx";
import StudentFooter from "../student/layout/StudentFooter.jsx";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <StudentNavbar />
      <main className="flex-1">
        <div className="container-app py-6">
          <Outlet />
        </div>
      </main>
      <StudentFooter />
    </div>
  );
}
