const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white min-h-[85vh] flex items-center justify-center px-6 overflow-hidden">
      {/* Decorative SVG Blob 1 */}
      <svg
        className="absolute top-0 left-0 w-96 h-96 opacity-20 animate-spin-slow"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#ffffff"
          d="M43.6,-76.3C55.3,-68.9,63.3,-55.2,70.7,-41.7C78.1,-28.3,84.9,-14.1,83.5,-0.4C82.2,13.3,72.7,26.7,64.4,41.2C56.1,55.8,49,71.5,36.6,78.3C24.2,85.2,6.6,83.3,-7.4,74.3C-21.3,65.2,-31.6,49.1,-45.2,37.6C-58.8,26.1,-75.7,19.2,-81.1,7.2C-86.6,-4.8,-80.7,-20.8,-72.8,-34.5C-64.9,-48.2,-55,-59.6,-42.8,-67.2C-30.7,-74.8,-15.3,-78.5,0.2,-78.8C15.7,-79.2,31.3,-76.2,43.6,-76.3Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Decorative SVG Blob 2 */}
      <svg
        className="absolute bottom-0 right-0 w-96 h-96 opacity-10 animate-pulse-slow"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#ffffff"
          d="M36.8,-65.9C46.3,-59.3,52.2,-46.3,60.7,-34.1C69.2,-21.9,80.3,-10.4,79.2,0.3C78.1,11,64.9,22,55.3,35.6C45.7,49.1,39.7,65.2,28.6,71.7C17.5,78.2,1.2,75.1,-11.6,67.7C-24.5,60.4,-34,48.9,-46.6,38.7C-59.2,28.5,-74.9,19.6,-80.4,6.3C-85.9,-7.1,-81.1,-23.7,-73.7,-37.2C-66.3,-50.8,-56.3,-61.4,-44.2,-68.4C-32,-75.5,-16,-78.9,-0.2,-78.6C15.6,-78.4,31.3,-74.1,36.8,-65.9Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Glass Effect Background Card */}
      <div className="relative z-10 backdrop-blur-md bg-white/10 p-10 rounded-2xl border border-white/20 shadow-xl text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Lost Something? Found Something?
        </h1>
        <p className="text-lg md:text-xl mb-6">
          We’re here to help you reconnect with your lost belongings.
        </p>
        <div className="space-x-4">
          <a
            href="/ItemFound"
            className="bg-white text-sky-600 px-6 py-3 rounded font-semibold hover:bg-gray-100 shadow-md transition duration-300"
          >
            Post Lost Item
          </a>
          <a
            href="/Search"
            className="border border-white px-6 py-3 rounded hover:bg-white hover:text-sky-600 font-semibold shadow-md transition duration-300"
          >
            Search Items
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
