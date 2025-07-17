import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import logo from "../assets/khojsewa_logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen(!open);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand wrapped together */}
          <a
            href="/"
            className="flex items-center space-x-2 text-xl font-bold text-white hover:text-indigo-200 transition-colors duration-200"
          >
            <img src={logo} alt="Logo" className="h-12 w-auto" />
            <span className="hidden sm:inline">KhojSewa</span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="/"
              className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Home
            </a>
            <a
              href="/signup"
              className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Sign Up
            </a>
            <a
              href="/signin"
              className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Sign In
            </a>
            <a
              href="/#about"
              className="text-white hover:text-indigo-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              About Us
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-indigo-200 focus:outline-none transition-colors duration-200"
            >
              {open ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-indigo-700 px-2 pt-2 pb-3 space-y-1">
          <a
            href="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200"
          >
            Home
          </a>
          <a
            href="/signup"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200"
          >
            Sign Up
          </a>
          <a
            href="/signin"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200"
          >
            Sign In
          </a>
          <a
            href="/#about"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600 transition-colors duration-200"
          >
            About Us
          </a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
