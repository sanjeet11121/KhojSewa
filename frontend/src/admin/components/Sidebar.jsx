import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <>
      {/* Sidebar */}
     <aside
  className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg z-50
  ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
>

        {/* Close button (only for mobile) */}
        <div className="flex justify-between items-center md:hidden">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button onClick={toggleSidebar} className="p-2">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Links */}
        <nav className="space-y-4 pt-16 mt-6">
          <a href="/admin" className="block p-2 rounded hover:bg-purple-500">Dashboard</a>
          <a href="/admin/users" className="block p-2 rounded hover:bg-purple-500">User Management</a>
          <a href="/admin/posts" className="block p-2 rounded hover:bg-purple-500">Post Management</a>
          <a href="/admin/notifications" className="block p-2 rounded hover:bg-purple-500">Notifications</a>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-30"
        />
      )}
    </>
  );
}
