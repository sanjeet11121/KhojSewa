import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-gray-100">
        <Topbar />
        <main className="p-6 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
