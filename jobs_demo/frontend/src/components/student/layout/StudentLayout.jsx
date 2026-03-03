import { Outlet } from "react-router-dom";
import StudentNavbar from "./StudentNavbar.jsx";
import StudentFooter from "./StudentFooter.jsx";
import AppChatbot from "../../chat/AppChatbot.jsx";

export default function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StudentNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <StudentFooter />
      <AppChatbot />
    </div>
  );
}
