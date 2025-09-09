import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CardComponent from "../components/cardComponent";
import { getUserById } from "../services/adminApi";

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!user) return <p className="p-6 text-gray-500">User not found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <CardComponent
        profilePicture={user.profilePicture}
        username={user.fullName || user.username}
        email={user.email}
        phone={user.phone}
        posts={user.posts}
        status={user.isActive ? "Online" : "Offline"}
      />
    </div>
  );
}
