import { FaEnvelope, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import logo from "../assets/khojsewa_logo.png";

// const Footer = () => {
//   return (
//     <footer className="bg-sky-600 text-white mt-16">
//       <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
//         {/* Logo & Description */}
//         <div>
//           <a href="/" className="flex items-center space-x-2">
//             <img src={logo} alt="KhojSewa" className="h-10 w-auto" />
//             <span className="text-xl font-bold">KhojSewa</span>
//           </a>
//           <p className="mt-4 text-sm">
//             {/* Your trusted platform to find and post lost items. Join the community and help return what’s lost. */}
//             तपाईंको भरपर्दो platform, हराएको सामान फेला पार्न र पोस्ट गर्न।
// हाम्रो community मा सामेल हुनुहोस् र हराएको सामान फिर्ता गर्न मद्दत गर्नुहोस्।
//           </p>
//         </div>

//         {/* Quick Links */}
//         <div>
//           <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
//           <ul className="space-y-2 text-sm">
//             <li><a href="/" className="hover:text-sky-100">Home</a></li>
//             <li><a href="/find" className="hover:text-sky-100">Find Item</a></li>
//             <li><a href="/post" className="hover:text-sky-100">Post Item</a></li>
//             <li><a href="/#about" className="hover:text-sky-100">About Us</a></li>
//           </ul>
//         </div>

//         {/* Support */}
//         <div>
//           <h3 className="text-lg font-semibold mb-3">Support</h3>
//           <ul className="space-y-2 text-sm">
//             <li><a href="/#faq" className="hover:text-sky-100">FAQ</a></li>
//             <li><a href="/#contact" className="hover:text-sky-100">Contact Us</a></li>
//             <li><a href="/privacy" className="hover:text-sky-100">Privacy Policy</a></li>
//             <li><a href="/terms" className="hover:text-sky-100">Terms of Service</a></li>
//           </ul>
//         </div>

//         {/* Social Media */}
//         <div>
//           <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
//           <div className="flex space-x-4 text-xl">
//             <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-100">
//               <FaFacebook />
//             </a>
//             <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-100">
//               <FaTwitter />
//             </a>
//             <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-100">
//               <FaInstagram />
//             </a>
//             <a href="mailto:support.khojsewa@gmail.com" className="hover:text-sky-100">
//               <FaEnvelope />
//             </a>
//           </div>
//         </div>
//       </div>

//       {/* Bottom Bar */}
//       <div className="bg-sky-700 text-center py-4 text-sm">
//         © {new Date().getFullYear()} KhojSewa. All rights reserved.
//       </div>
//     </footer>
//   );
// };

// export default Footer;


const Footer = () => {
  return (
    <footer className="w-full bg-sky-600 text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <a href="/" className="flex items-center space-x-2">
            <img src={logo} alt="KhojSewa" className="h-10 w-auto" />
            <span className="text-xl font-bold">KhojSewa</span>
          </a>
          <p className="mt-4 text-sm">
            Your trusted platform to find and post lost items. Join the community and help return what’s lost.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-sky-100">Home</a></li>
            <li><a href="/find" className="hover:text-sky-100">Find Item</a></li>
            <li><a href="/post" className="hover:text-sky-100">Post Item</a></li>
            <li><a href="/#about" className="hover:text-sky-100">About Us</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/#faq" className="hover:text-sky-100">FAQ</a></li>
            <li><a href="/#contact" className="hover:text-sky-100">Contact Us</a></li>
            <li><a href="/privacy" className="hover:text-sky-100">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-sky-100">Terms of Service</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4 text-xl">
            <a href="#" className="hover:text-sky-100"><FaFacebook /></a>
            <a href="#" className="hover:text-sky-100"><FaTwitter /></a>
            <a href="#" className="hover:text-sky-100"><FaInstagram /></a>
            <a href="mailto:support@khojsewa.com" className="hover:text-sky-100"><FaEnvelope /></a>
          </div>
        </div>
      </div>

      <div className="bg-sky-700 text-center py-4 text-sm">
        © {new Date().getFullYear()} KhojSewa. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

