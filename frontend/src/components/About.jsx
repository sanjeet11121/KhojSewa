function About() {
  return (
    <section id="about" className="bg-white py-16 px-6 md:px-20 lg:px-40 text-gray-800">
      <h1 className="text-3xl md:text-4xl font-bold text-sky-600 text-center mb-6">
        About Us
      </h1>
      <p className="text-lg leading-relaxed text-justify mb-10">
        Welcome to our online community dedicated to helping you find lost items
        and reconnect with cherished possessions. At{" "}
        <span className="font-semibold text-sky-600">Lost and Found</span>, we understand the
        heartache and frustration that losing something valuable can bring. Whether it's a
        beloved pet, a sentimental piece of jewelry, or a vital piece of equipment, the
        distress of losing an item can be overwhelming.
        <br /><br />
        Our mission is simple: to provide a platform where people can share
        information about lost and found items in public spaces, fostering a sense
        of community and support. We firmly believe that by coming together, we can
        increase the chances of reuniting lost items with their rightful owners.
      </p>

      <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} KhojSewa</p>
        <p>
          Designed and Built by{" "}
          <a
            href="https://arjuncvinod.me"
            className="text-sky-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            
          >
           KhojSewa:Developers
          </a>
        </p>
      </div>
    </section>
  );
}

export default About;
