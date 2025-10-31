// FILE: src/pages/admin/Notifications.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "../../store/store";

export default function Notifications() {
  // ✅ Stable selectors from zustand
  const notifications = useAdminStore((s) => s.notifications);
  const notificationsLoading = useAdminStore((s) => s.notificationsLoading);
  const fetchNotifications = useAdminStore((s) => s.fetchNotifications);
  const postNotification = useAdminStore((s) => s.postNotification);
  const deleteNotification = useAdminStore((s) => s.deleteNotification);

  const [newMessage, setNewMessage] = useState("");

  // ✅ Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    // fetchNotifications is stable from zustand
  }, []);

  const handlePostNotification = async () => {
    if (!newMessage.trim()) return;
    const created = await postNotification(newMessage.trim());
    if (created) setNewMessage("");
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;
    await deleteNotification(notificationId);
  };

  // ✅ Memoize notifications list to avoid unnecessary recalculation
  const displayedNotifications = useMemo(() => notifications || [], [notifications]);

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
        {displayedNotifications.length === 0 ? (
          <li className="text-gray-500">No notifications yet.</li>
        ) : (
          displayedNotifications.map((note) => (
            <li key={note._id || note.id} className="border-b last:border-b-0 py-3 flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{note.message}</p>
                <span className="text-sm text-gray-500">
                  {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <button
                onClick={() => handleDeleteNotification(note.id || note._id)}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                disabled={notificationsLoading}
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
