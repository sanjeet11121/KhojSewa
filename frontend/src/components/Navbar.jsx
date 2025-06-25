import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import logo from "../assets/khojsewa_logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <nav className="bg-sky-500 text-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo or Brand Name */}
          <div className="text-xl font-bold flex">
            
            <a href="/" className="hover:text-sky-100">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          KhojSewa
            </a>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6 font-medium">
            <li><a href="/" className="hover:text-sky-100">Home</a></li>
            <li><a href="/find" className="hover:text-sky-100">Find Item</a></li>
            <li><a href="/post" className="hover:text-sky-100">Post Item</a></li>
            <li><a href="/#about" className="hover:text-sky-100">About Us</a></li>
          </ul>

          {/* Mobile Menu Icon */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="focus:outline-none">
              {open ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {open && (
        <div className="md:hidden bg-sky-400 px-4 py-2 space-y-2">
          <a href="/" className="block hover:text-sky-100">Home</a>
          <a href="/find" className="block hover:text-sky-100">Find Item</a>
          <a href="/post" className="block hover:text-sky-100">Post Item</a>
          <a href="/#about" className="block hover:text-sky-100">About Us</a>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
