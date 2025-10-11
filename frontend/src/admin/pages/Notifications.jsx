// FILE: src/pages/admin/Notifications.jsx
import React, { useEffect } from "react";
import { useAdminStore } from "../../store/store";

/*
  Notifications page
  - Uses the admin store (fetchNotifications, postNotification)
  - No external API helpers required.
*/

export default function Notifications() {
  const {
    notifications,
    notificationsLoading,
    fetchNotifications,
    postNotification,
  } = useAdminStore((s) => ({
    notifications: s.notifications,
    notificationsLoading: s.notificationsLoading,
    fetchNotifications: s.fetchNotifications,
    postNotification: s.postNotification,
  }));

  const [newMessage, setNewMessage] = React.useState("");

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePostNotification = async () => {
    if (!newMessage.trim()) return;
    const created = await postNotification(newMessage.trim());
    if (created) setNewMessage("");
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
        <div className="flex gap-2">
          <button
            onClick={handlePostNotification}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            disabled={notificationsLoading}
          >
            {notificationsLoading ? "Posting..." : "Post Notification"}
          </button>
          <button
            onClick={() => fetchNotifications()}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            disabled={notificationsLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <ul className="bg-white shadow rounded p-4">
        {notifications?.length === 0 ? (
          <li className="text-gray-500">No notifications yet.</li>
        ) : (
          notifications.map((note) => (
            <li key={note._id || note.id} className="border-b last:border-b-0 py-2">
              <p className="font-medium">{note.message}</p>
              <span className="text-sm text-gray-500">
                {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
