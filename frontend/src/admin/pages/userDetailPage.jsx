// FILE: src/pages/admin/UserDetailPage.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import CardComponent from "../components/cardComponent";
import { useAdminStore } from "../../store/store";

/*
  UserDetailPage: Uses store.fetchUserById and reads userDetail from store.
*/

export default function UserDetailPage() {
  const { id } = useParams();

  const { userDetail, userDetailLoading, fetchUserById } = useAdminStore((s) => ({
    userDetail: s.userDetail,
    userDetailLoading: s.userDetailLoading,
    fetchUserById: s.fetchUserById,
  }));

  useEffect(() => {
    if (id) fetchUserById(id);
  }, [id, fetchUserById]);

  if (userDetailLoading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!userDetail) return <p className="p-6 text-gray-500">User not found.</p>;

  const user = userDetail;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <CardComponent
        profilePicture={user.profilePicture || user.avatar || ""}
        username={user.fullName || user.username}
        email={user.email}
        phone={user.phone}
        posts={user.posts}
        status={user.isActive ? "Online" : "Offline"}
      />
    </div>
  );
}
