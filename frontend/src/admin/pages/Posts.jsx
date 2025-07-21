const postsData = [
  { id: 1, title: "Lost Phone", status: "Pending" },
  { id: 2, title: "Found Wallet", status: "Resolved" },
];

export default function Posts() {
  return (
    <div className="pt-16 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Post Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded shadow text-sm md:text-base">
          <thead className="bg-gray-200">
            <tr>
              <th className="w-1/3 p-2 md:p-3 text-left">Post Title</th>
              <th className="w-1/3 p-2 md:p-3 text-left">Status</th>
              <th className="w-1/3 p-2 md:p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {postsData.map((post) => (
              <tr
                key={post.id}
                className="border-t hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="p-2 md:p-3">{post.title}</td>
                <td className="p-2 md:p-3">{post.status}</td>
                <td className="p-2 md:p-3 text-center">
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 w-full sm:w-auto">
                    Terminate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
