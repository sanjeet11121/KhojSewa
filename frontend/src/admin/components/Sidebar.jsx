import { XMarkIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom"; // ✅ Import NavLink
import { useState } from "react";

export default function Sidebar({ isOpen, toggleSidebar }) {
  // Tailwind classes for active vs inactive nav links
  const navLinkClasses = ({ isActive }) =>
    `block p-2 rounded hover:bg-purple-500 transition ${
      isActive ? "bg-purple-700 text-white font-semibold" : "text-white"
    }`;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg z-50 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        {/* Close button (only for mobile) */}
        <div className="flex justify-between items-center p-4 md:hidden">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <button onClick={toggleSidebar} className="p-2 text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2 pt-16 px-4">
          <NavLink to="/admin" end className={navLinkClasses}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClasses}>
            User Management
          </NavLink>
          <NavLink to="/admin/posts" className={navLinkClasses}>
            Post Management
          </NavLink>
          <NavLink to="/admin/notifications" className={navLinkClasses}>
            Notifications
          </NavLink>
          <NavLink to="/admin/inappropriatePost" className={navLinkClasses}>
            Inappropriate Posts
          </NavLink>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-30"
        />
      )}
    </>
  );
}
