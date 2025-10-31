// FILE: src/pages/admin/UserDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CardComponent from "../components/cardComponent";
import { useAdminStore } from "../../store/store";
import axios from "axios";

export default function UserDetailPage() {
  const { id } = useParams();

  // ✅ Stable selectors from zustand
  const userDetail = useAdminStore((s) => s.userDetail);
  const userDetailLoading = useAdminStore((s) => s.userDetailLoading);
  const fetchUserById = useAdminStore((s) => s.fetchUserById);

  // ✅ Fetch user details only when id changes
  useEffect(() => {
    if (id) fetchUserById(id);
  }, [id]);

  // Local state for API-fetched counts (must be before early returns)
  const [apiCounts, setApiCounts] = useState({ found: null, lost: null });

  // Fetch authoritative counts from posts API when user changes
  useEffect(() => {
    let cancelled = false;
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("admin");

    const client = axios.create({
      baseURL: "http://localhost:8000/api/v1/posts",
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const fetchCounts = async () => {
      const uid = userDetail?._id;
      if (!uid) return;
      try {
        const [lostRes, foundRes] = await Promise.all([
          client.get(`/lost`, { params: { userId: uid } }),
          client.get(`/found`, { params: { userId: uid } }),
        ]);
        const rawLost = lostRes?.data?.data || lostRes?.data || [];
        const rawFound = foundRes?.data?.data || foundRes?.data || [];

        const isMine = (p) => {
          const ownerId = p?.userId || p?.user || p?.owner || p?.postedBy || p?.createdBy || p?.author;
          if (typeof ownerId === "string") return ownerId === uid;
          if (ownerId && typeof ownerId === "object") return (ownerId._id || ownerId.id) === uid;
          return false;
        };

        const lostList = Array.isArray(rawLost) ? rawLost.filter(isMine) : [];
        const foundList = Array.isArray(rawFound) ? rawFound.filter(isMine) : [];

        if (!cancelled) setApiCounts({ lost: lostList.length, found: foundList.length });
      } catch (e) {
        if (!cancelled) setApiCounts({ lost: null, found: null });
      }
    };

    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [userDetail?._id]);

  if (userDetailLoading) return <p className="p-16 text-gray-500">Loading...</p>;
  if (!userDetail) return <p className="p-16 text-gray-500">User not found.</p>;

  const user = userDetail;

  // Resolve avatar/profile picture across common backend field names
  const avatarUrl =
    user.profilePicture ||
    user.avatar ||
    user.profilePic ||
    user.photo ||
    user.image ||
    user.imageUrl ||
    user.picture ||
    "/placeholder.png";

  // Resolve phone across common backend field names
  const phoneVal =
    user.phone ||
    user.phoneNumber ||
    user.mobile ||
    user.contact ||
    user.contactNumber ||
    user.contactNo ||
    user.number ||
    null;

  // Derive post counts safely
  const postsArr = Array.isArray(user.posts) ? user.posts : [];

  // Prefer explicit backend-provided totals if available on the user object
  const explicitFound = user.totalFoundPosts ?? user.foundPosts ?? user.foundCount ?? null;
  const explicitLost = user.totalLostPosts ?? user.lostPosts ?? user.lostCount ?? null;

  // Heuristic to infer a single post's type robustly across different schemas
  const inferPostType = (p) => {
    // Common textual fields that may contain the type
    const raw = (p?.type || p?.postType || p?.category || p?.kind || p?.statusType || "").toString().toLowerCase().trim();

    if (raw.includes("found")) return "found";
    if (raw.includes("lost") || raw.includes("missing")) return "lost";

    // Flag-based inference seen in this codebase
    if (typeof p?.isReturned === "boolean") return "found"; // found posts often have isReturned
    if (typeof p?.isFound === "boolean") return "lost"; // lost posts often have isFound

    // Path-based hints
    const source = (p?.source || p?._source || "").toString().toLowerCase();
    if (source.includes("/found")) return "found";
    if (source.includes("/lost")) return "lost";

    return "unknown";
  };

  const inferredFound = postsArr.filter((p) => inferPostType(p) === "found").length;
  const inferredLost = postsArr.filter((p) => inferPostType(p) === "lost").length;

  const totalPosts = user.postCount ?? postsArr.length;

  const foundPosts = (apiCounts.found ?? explicitFound ?? inferredFound) || 0;
  const lostPosts = (apiCounts.lost ?? explicitLost ?? inferredLost) || 0;

  // Prefer live online flag if present; otherwise fallback to offline
  const status = user.isOnline ? "Online" : "Offline";

  return (
    <div className="p-16 max-w-xl mx-auto">
      <CardComponent
        profilePicture={avatarUrl}
        avatar={user.avatar}
        name={user.fullName}
        username={user.username}
        email={user.email}
        phone={phoneVal}
        totalPosts={totalPosts}
        foundPosts={foundPosts}
        lostPosts={lostPosts}
        status={status}
      />
    </div>
  );
}
