import React from "react";

const CardComponent = ({
  profilePicture,
  username,
  email,
  phone,
  posts,
  status,
  onMessageClick,
  style, 
}) => {
  return (
    <div
      className="bg-white rounded-lg shadow-md flex items-center justify-between px-6 py-4 hover:shadow-lg transition-all"
      style={{ width: "100%", height: "100px", fontFamily: "sans-serif", ...style }}
    >
      {/* Profile Section */}
      <div className="flex items-center gap-4 w-1/4">
        <img
          src={profilePicture}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className="text-base font-medium text-gray-800">{username}</span>
      </div>

      {/* Email & Phone */}
      <div className="flex flex-col text-sm text-gray-700 w-1/4">
        <span className="truncate">Email: {email}</span>
        <span className="truncate">Phone: {phone}</span>
      </div>

      {/* Posts */}
      <div className="text-sm text-gray-700 w-1/6 text-center">
        Posts: <span className="font-semibold">{posts}</span>
      </div>

      {/* Message Button */}
      <div className="w-1/6 text-center">
        <button
          onClick={onMessageClick}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Message
        </button>
      </div>

      {/* Status */}
      <div
        className={`text-sm font-semibold w-1/6 text-right ${
          status === "Online" ? "text-green-600" : "text-red-500"
        }`}
      >
        {status}
      </div>
    </div>
  );
};

export default CardComponent;
