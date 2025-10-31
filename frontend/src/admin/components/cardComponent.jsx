import React from "react";

const CardComponent = ({
  profilePicture,
  avatar,
  name,
  username,
  email,
  phone,
  totalPosts,
  foundPosts,
  lostPosts,
  status,
  style,
}) => {
  const avatarSrc = profilePicture || avatar;
  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg p-8 sm:p-10 md:p-12 hover:shadow-xl transition-all duration-300"
      style={{
        width: "95%",
        maxWidth: "1200px",
        minHeight: "560px",
        fontFamily: "sans-serif",
        margin: "0 auto",
        ...style,
      }}
    >
      {/* Status badge at top-right */}
      <div
        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold border ${
          status === "Online"
            ? "bg-green-100 text-green-700 border-green-300"
            : "bg-red-100 text-red-700 border-red-300"
        }`}
      >
        {status}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12 h-full">
        {/* Left: avatar, username, contact */}
        <div className="flex flex-col items-start">
          <img
            src={avatarSrc}
            alt="Profile"
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full object-cover shadow"
          />

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800">
              {name || username}
            </div>
            {username && (
              <div className="text-sm sm:text-base text-gray-600 mt-1">@{username}</div>
            )}
          </div>

          {/* Contact info under username on the left */}
          <div className="mt-6 flex flex-col gap-2 text-base sm:text-lg md:text-xl text-gray-700">
            <div>
              Phone: <span className="font-medium">{phone || "Not Provided"}</span>
            </div>
            <div>
              Email: <span className="font-medium break-words">{email}</span>
            </div>
          </div>
        </div>

        {/* Right column reserved; stats anchored bottom-right via absolute container below */}
        <div className="relative min-h-[320px]"></div>
      </div>

      {/* Stats at bottom-right of the card */}
      <div className="absolute bottom-6 right-6 text-right text-base sm:text-lg md:text-xl text-gray-700">
        <div className="flex flex-col gap-1 items-end">
          <div>
            Total Posts: <span className="font-semibold">{totalPosts}</span>
          </div>
          <div>
            Total Lost Posts: <span className="font-semibold">{lostPosts}</span>
          </div>
          <div>
            Total Found Posts: <span className="font-semibold">{foundPosts}</span>
          </div>
        </div>
      </div>

      {/* Email button at bottom-left */}
      {email && (
        <div className="absolute bottom-6 left-6">
          <a
            href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Message from KhojSewa Admin')}&cc=${encodeURIComponent('khojsewa.np@gmail.com')}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M2.94 6.34A2 2 0 0 1 4.5 5.5h11a2 2 0 0 1 1.56.84l-6.78 4.52a1.5 1.5 0 0 1-1.56 0L2.94 6.34z" />
              <path d="M18 8.16v5.34A2 2 0 0 1 16 15.5H4a2 2 0 0 1-2-2V8.16l6.22 4.14a3 3 0 0 0 3.16 0L18 8.16z" />
            </svg>
            Email User
          </a>
        </div>
      )}
    </div>
  );
};

export default CardComponent;
