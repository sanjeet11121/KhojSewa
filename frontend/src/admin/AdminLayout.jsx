import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (collapsible for mobile) */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-gray-100">
        <Topbar toggleSidebar={toggleSidebar} /> {/* Pass toggle function */}
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet /> {/* ✅ Nested pages render here */}
        </main>
      </div>
    </div>
  );
}
