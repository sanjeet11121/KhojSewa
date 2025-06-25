const HeroSection = () => {
  return (
    <section className="bg-sky-500 text-white py-20 px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Lost Something? Found Something?</h1>
      <p className="text-lg mb-6">We’re here to help you reconnect with your lost belongings and good people.</p>
      <div className="space-x-4">
        <a href="/post" className="bg-white text-sky-600 px-6 py-2 rounded hover:bg-gray-100 font-semibold">
          Post Lost Item
        </a>
        <a href="/find" className="border border-white px-6 py-2 rounded hover:bg-white hover:text-sky-600 font-semibold">
          Search Items
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
