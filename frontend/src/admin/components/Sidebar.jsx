import { ClipboardDocumentListIcon, HomeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-sky-700 text-white min-h-screen px-4 py-6 space-y-6">
      <div className="text-2xl font-bold text-center">Admin Panel</div>
      <nav className="space-y-4">
        <Link to="/admin" className="flex items-center space-x-2 hover:text-sky-200">
          <HomeIcon className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <Link to="/admin/users" className="flex items-center space-x-2 hover:text-sky-200">
          <UsersIcon className="h-5 w-5" />
          <span>Users</span>
        </Link>
        <Link to="/admin/items" className="flex items-center space-x-2 hover:text-sky-200">
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span>Items</span>
        </Link>
        <Link to="/admin/posts" className="flex items-center space-x-2 hover:text-sky-200">
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span>Posts</span>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
