import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../assets/khojsewa_logo.png";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      {/* Logo */}
      <img
        src={logo}
        alt="Logo"
        className="w-32 mb-8"
      />

      {/* 404 Text */}
      <h1 className="text-9xl font-extrabold text-red-600 tracking-widest">404</h1>

      {/* Message */}
      <p className="text-2xl text-gray-700 mt-4">
        Oops! The page you are looking for does not exist.
      </p>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded shadow transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
