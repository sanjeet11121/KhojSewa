const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 text-white h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute top-10 sm:top-20 -left-10 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 sm:bottom-20 -right-10 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/4 sm:left-1/3 w-48 sm:w-64 h-48 sm:h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
      
      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-white/40 rounded-full animate-bounce-slow"></div>
      <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-white/30 rounded-full animate-bounce-delayed"></div>
      <div className="absolute top-1/3 left-1/2 w-2 h-2 bg-white/50 rounded-full animate-ping-slow"></div>
      
      {/* Decorative SVG Blob 1 - Slow Rotation */}
      <svg
        className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 opacity-20 animate-spin-very-slow"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#ffffff"
          d="M43.6,-76.3C55.3,-68.9,63.3,-55.2,70.7,-41.7C78.1,-28.3,84.9,-14.1,83.5,-0.4C82.2,13.3,72.7,26.7,64.4,41.2C56.1,55.8,49,71.5,36.6,78.3C24.2,85.2,6.6,83.3,-7.4,74.3C-21.3,65.2,-31.6,49.1,-45.2,37.6C-58.8,26.1,-75.7,19.2,-81.1,7.2C-86.6,-4.8,-80.7,-20.8,-72.8,-34.5C-64.9,-48.2,-55,-59.6,-42.8,-67.2C-30.7,-74.8,-15.3,-78.5,0.2,-78.8C15.7,-79.2,31.3,-76.2,43.6,-76.3Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Decorative SVG Blob 2 - Floating Animation */}
      <svg
        className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 opacity-10 animate-float"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#ffffff"
          d="M36.8,-65.9C46.3,-59.3,52.2,-46.3,60.7,-34.1C69.2,-21.9,80.3,-10.4,79.2,0.3C78.1,11,64.9,22,55.3,35.6C45.7,49.1,39.7,65.2,28.6,71.7C17.5,78.2,1.2,75.1,-11.6,67.7C-24.5,60.4,-34,48.9,-46.6,38.7C-59.2,28.5,-74.9,19.6,-80.4,6.3C-85.9,-7.1,-81.1,-23.7,-73.7,-37.2C-66.3,-50.8,-56.3,-61.4,-44.2,-68.4C-32,-75.5,-16,-78.9,-0.2,-78.6C15.6,-78.4,31.3,-74.1,36.8,-65.9Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Glass Effect Background Card with Scale Animation */}
      <div className="relative z-10 backdrop-blur-md bg-white/10 p-6 sm:p-8 md:p-10 rounded-2xl border border-white/20 shadow-2xl text-center max-w-2xl w-full mx-4 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 animate-slide-down leading-tight">
          Lost Something? Found Something?
        </h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 animate-slide-up">
          We're here to help you reconnect with your lost belongings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
          <a
            href="/Search"
            className="bg-white text-indigo-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:scale-105 shadow-lg transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto text-center"
          >
            Post Lost Item
          </a>
          <a
            href="/ItemFound"
            className="border-2 border-white px-6 sm:px-8 py-3 rounded-lg hover:bg-white hover:text-indigo-600 font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 w-full sm:w-auto text-center"
          >
            Post Found Item
          </a>
        </div>
      </div>
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
        <svg className="w-6 h-6 text-white/70" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
