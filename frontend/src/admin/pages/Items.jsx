export default function Items() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Manage Items</h1>
      <table className="w-full bg-white border rounded shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Item Name</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-2">Black Wallet</td>
            <td className="p-2">Pending</td>
            <td className="p-2">
              <button className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
              <button className="bg-red-500 text-white px-3 py-1 rounded ml-2">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
