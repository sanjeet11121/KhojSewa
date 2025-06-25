const HowItWorks = () => {
  const steps = [
    "Create an account or continue as guest",
    "Post your lost/found item with details",
    "Let the system and community do the rest",
  ];

  return (
    <section className="py-16 px-6 text-center">
      <h2 className="text-3xl font-bold text-sky-700 mb-8">How It Works</h2>
      <div className="flex flex-col md:flex-row justify-center gap-6 max-w-5xl mx-auto">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-sky-100 rounded p-6 flex-1">
            <h3 className="text-xl font-bold text-sky-800 mb-2">Step {idx + 1}</h3>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
