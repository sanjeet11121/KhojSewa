export default function Topbar() {
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Lost & Found Dashboard</h1>
      <button className="bg-purple-600 text-white px-4 py-2 rounded">Logout</button>
    </header>
  );
}
