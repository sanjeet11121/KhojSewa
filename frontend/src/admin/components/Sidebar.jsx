import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-purple-700 to-purple-300 text-white p-4">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <nav className="space-y-4">
        <NavLink to="/admin" className="block p-2 rounded hover:bg-purple-500">Dashboard</NavLink>
        <NavLink to="/admin/users" className="block p-2 rounded hover:bg-purple-500">User Management</NavLink>
        <NavLink to="/admin/posts" className="block p-2 rounded hover:bg-purple-500">Post Management</NavLink>
        <NavLink to="/admin/notifications" className="block p-2 rounded hover:bg-purple-500">Notifications</NavLink>
      </nav>
    </aside>
  );
}
