import React, { useEffect, useState } from "react";
import { getNotificationsApi, postNotificationApi } from "../services/adminApi";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotificationsApi();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();
  }, []);

  const handlePostNotification = async () => {
    if (!newMessage.trim()) return;

    try {
      const newNote = await postNotificationApi(newMessage);
      setNotifications([newNote, ...notifications]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to post notification", error);
    }
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
          <li key={note._id} className="border-b last:border-b-0 py-2">
            <p className="font-medium">{note.message}</p>
            <span className="text-sm text-gray-500">
              {new Date(note.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
