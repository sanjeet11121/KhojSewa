const postsData = [
  { id: 1, title: "Lost Phone", status: "Pending" },
  { id: 2, title: "Found Wallet", status: "Resolved" },
];

export default function Posts() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Post Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="w-1/3 p-3 text-left">Post Title</th>
              <th className="w-1/3 p-3 text-left">Status</th>
              <th className="w-1/3 p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {postsData.map((post) => (
              <tr
                key={post.id}
                className="border-t hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="p-3 text-left">{post.title}</td>
                <td className="p-3 text-left">{post.status}</td>
                <td className="p-3 text-center">
                  <button className="bg-red-500 text-white px-3 py-1 rounded">
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
