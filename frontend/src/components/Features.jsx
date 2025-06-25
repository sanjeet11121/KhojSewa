const Features = () => {
  const features = [
    { title: "Post Lost Items", desc: "Easily post what you lost with image, time and location." },
    { title: "Browse Found Items", desc: "See what others have found around your area." },
    { title: "Fast Match", desc: "Our smart system helps match lost & found items efficiently." },
  ];

  return (
    <section className="py-16 px-6 bg-gray-50 text-center">
      <h2 className="text-3xl font-bold mb-10 text-sky-700">What You Can Do</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f, i) => (
          <div key={i} className="bg-white p-6 rounded shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-2 text-sky-600">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
