import React from "react";
import Navbar from "../components/Navbar"; // Adjust the path if necessary

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-white to-white text-gray-800">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16 px-4 sm:px-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            About KhojSewa
          </h1>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            KhojSewa is a smart and community-driven platform built to help people in Nepal report and recover lost and found items with ease. Whether you've lost your wallet, phone, or any important belongings — KhojSewa is here to connect you with the right people, instantly and securely.
          </p>
        </div>
      </section>

      {/* Description Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-10 py-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-purple-700 mb-6">
          Why KhojSewa?
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
          Losing valuable items can be stressful. KhojSewa provides a simple, trusted way to report lost belongings, discover found ones, and reunite owners with their items.
          Our goal is to foster a helpful, honest online space that brings people together through collective responsibility and smart technology.
        </p>
      </section>

      {/* How To Use Section */}
      <section className="bg-gradient-to-br from-purple-50 to-purple-100 py-16 px-4 sm:px-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-purple-700 text-center mb-10">
            How to Use KhojSewa
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">1. Report a Lost Item</h3>
              <p className="text-gray-700">
                Head over to the "Report Lost Item" page and fill out a form with the item details,
                including name, location, image, and description. Add optional images to help others recognize it.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">2. Browse Found Posts</h3>
              <p className="text-gray-700">
                Visit the homepage or search section to browse through recently found items. Use filters like item name or location to narrow your search.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">3. Contact the Poster</h3>
              <p className="text-gray-700">
                If you see your item posted by someone else, use the "Contact" button on the post card to reach out and verify ownership.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">4. Share & Spread the Word</h3>
              <p className="text-gray-700">
                Help reunite items faster by sharing posts through your social media or with friends. Every bit of visibility helps!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="py-10" />
    </div>
  );
}
