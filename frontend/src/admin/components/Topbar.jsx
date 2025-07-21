import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState } from "react";
import logo from "../../assets/khojsewa_logo.png";

function Topbar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const handleSidebar = () => {
    setOpen(!open);
    if (toggleSidebar) toggleSidebar();
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section: Hamburger + Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile: Hamburger Button */}
            <div className="md:hidden">
              <button
                onClick={handleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-500/30 focus:outline-none transition duration-200"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            {/* Logo + Brand Text */}
            <a
              href="/"
              className="flex items-center text-xl font-bold text-white hover:text-gray-100 transition-colors duration-200"
            >
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <span className="ml-2 text-white text-base sm:text-lg whitespace-nowrap">
                KhojSewa
              </span>
            </a>
          </div>

          {/* Right: Logout Button */}
          <div className="hidden md:flex items-center">
            <button className="bg-white text-purple-700 px-3 sm:px-4 py-1 sm:py-2 rounded text-sm sm:text-base hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap">
              Logout
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

export default Topbar;
