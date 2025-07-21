const CTASection = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white py-14 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to help or get help?</h2>
      <p className="mb-6">Join thousands of users helping each other daily.</p>
      <a
        href="/post"
        className="bg-white text-purple-700 px-6 py-3 rounded hover:bg-purple-100 font-semibold transition-colors duration-200"
      >
        Post Now
      </a>
    </section>
  );
};

export default CTASection;
