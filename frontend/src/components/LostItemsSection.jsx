const mockPosts = [
  {
    id: 1,
    title: "Black Leather Wallet",
    image: "https://media.istockphoto.com/id/477979778/photo/black-natural-leather-wallet-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=mmQlzOsmEu_QEB1K1ey6zbTYP40wUKp8p4a_qnnHnuw=",
    location: "Patan Toilet",
    date: "July 15, 2025",
    postedBy: "Sanjit Mijar",
  },
  {
    id: 2,
    title: "Samsung Galaxy Phone",
    image: "https://hips.hearstapps.com/vader-prod.s3.amazonaws.com/1738252275-galaxy-s24-fe-001-679b9fd18c58a.jpg?crop=0.959xw:0.959xh;0.0342xw,0.0261xh&resize=980:*",
    location: "Patan Main Gate",
    date: "July 14, 2025",
    postedBy: "Ronit Ghimire",
  },
  // Add more mock posts as needed
];

export default function LostItemsSection() {
  return (
    <section className="w-full bg-gradient-to-b from-purple-100 via-white to-white py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-purple-700 mb-4">
          Recently Reported Lost Items
        </h2>
        <p className="text-gray-600 text-base sm:text-lg">
          Browse through the latest lost item posts in your area.
        </p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {mockPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-xl rounded-2xl overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-5 text-left">
              <h3 className="text-xl font-semibold text-purple-800 mb-1">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Location:</span> {post.location}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Date:</span> {post.date}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Posted by:</span> {post.postedBy}
              </p>
              <div className="flex gap-3">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm rounded-lg shadow-sm">
                  Contact
                </button>
                <button className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2 text-sm rounded-lg shadow-sm">
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
