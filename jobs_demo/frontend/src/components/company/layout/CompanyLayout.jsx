import { useState } from "react";
import { Outlet } from "react-router-dom";
import CompanySidebar from "./CompanySidebar.jsx";
import CompanyNavbar from "./CompanyNavbar.jsx";
import AppChatbot from "../../chat/AppChatbot.jsx";

export default function CompanyLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        <CompanySidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 min-w-0">
          <CompanyNavbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="p-5 lg:p-7 space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
      <AppChatbot />
    </div>
  );
}
