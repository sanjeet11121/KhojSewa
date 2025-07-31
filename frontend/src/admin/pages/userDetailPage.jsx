import React from "react";
import { useParams } from "react-router-dom";
import CardComponent from "../components/cardComponent";
import { users } from "../userData";  // <-- same shared data

export default function UserDetailPage() {
  const { id } = useParams();
  const userId = Number(id);
  const user = users.find(u => u.id === userId);

  if (!user)
    return <p className="p-6 text-gray-500">User not found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <CardComponent
        profilePicture={user.profilePicture}
        username={user.name}
        email={user.email}
        phone={user.phone}
        posts={user.posts}
        status={user.status === "Blocked" ? "Offline" : "Online"}
      />
    </div>
  );
}
