import { FaEnvelope, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import logo from "../assets/khojsewa_logo.png";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & Description */}
        <div>
          <a href="/" className="flex items-center space-x-2">
            <img src={logo} alt="KhojSewa" className="h-10 w-auto" />
            <span className="text-xl font-bold">KhojSewa</span>
          </a>
          <p className="mt-4 text-sm">
            तपाईंको भरपर्दो platform, हराएको सामान फेला पार्न र पोस्ट गर्न।
            हाम्रो community मा सामेल हुनुहोस् र हराएको सामान फिर्ता गर्न मद्दत गर्नुहोस्।
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-indigo-200">Home</a></li>
            <li><a href="/Search" className="hover:text-indigo-200">Find Item</a></li>
            <li><a href="/ItemFound" className="hover:text-indigo-200">Post Item</a></li>
            <li><a href="/bout" className="hover:text-indigo-200">About Us</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/#faq" className="hover:text-indigo-200">FAQ</a></li>
            <li><a href="/#contact" className="hover:text-indigo-200">Contact Us</a></li>
            <li><a href="/privacy" className="hover:text-indigo-200">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-indigo-200">Terms of Service</a></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4 text-xl">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-indigo-200"><FaFacebook /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-indigo-200"><FaTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-indigo-200"><FaInstagram /></a>
            <a href="mailto:support@khojsewa.com" className="hover:text-indigo-200"><FaEnvelope /></a>
          </div>
        </div>
      </div>

      <div className="bg-indigo-800 text-center py-4 text-sm">
        © {new Date().getFullYear()} KhojSewa. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
