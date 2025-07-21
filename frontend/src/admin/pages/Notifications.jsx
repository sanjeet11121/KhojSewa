import { useState } from "react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New item reported lost.", time: "2 mins ago" },
    { id: 2, message: "User JohnDoe posted a found item.", time: "10 mins ago" },
    { id: 3, message: "3 posts pending review.", time: "1 hour ago" },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const handlePostNotification = () => {
    if (!newMessage.trim()) return;

    const newNotification = {
      id: Date.now(),
      message: newMessage,
      time: "Just now",
    };

    setNotifications([newNotification, ...notifications]);
    setNewMessage("");
  };

  return (
    <div className="pt-16 p-6">
      <h1 className="text-3xl font-bold mb-4">Notifications</h1>

      {/* Admin Input Section */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-3 text-sm md:text-base"
          rows="3"
          placeholder="Write a new notification..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={handlePostNotification}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
        >
          Post Notification
        </button>
      </div>

      {/* Notifications List */}
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
