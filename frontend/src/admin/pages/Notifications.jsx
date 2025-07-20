export default function Notifications() {
  const notifications = [
    { id: 1, message: "New item reported lost.", time: "2 mins ago" },
    { id: 2, message: "User JohnDoe posted a found item.", time: "10 mins ago" },
    { id: 3, message: "3 posts pending review.", time: "1 hour ago" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Notifications</h1>
      <ul className="bg-white shadow rounded p-4">
        {notifications.map((note) => (
          <li key={note.id} className="border-b last:border-b-0 py-2">
            <p className="font-medium">{note.message}</p>
            <span className="text-sm text-gray-500">{note.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
