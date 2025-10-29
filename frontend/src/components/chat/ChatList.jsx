// components/Chat/ChatList.js
import React from 'react';

const ChatList = ({ chats, activeChat, onSelectChat, loading, currentUser }) => {
    if (loading) {
        return <div className="p-4">Loading chats...</div>;
    }

    return (
        <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Messages</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
                {chats.map(chat => (
                    <div
                        key={chat._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            activeChat?._id === chat._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                        onClick={() => onSelectChat(chat)}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-10 w-10 rounded-full"
                                    src={chat.participants.find(p => p._id !== currentUser?._id)?.avatar || '/default-avatar.png'}
                                    alt="Avatar"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-base font-bold text-gray-900 truncate">
                                        {chat.participants.find(p => p._id !== currentUser?._id)?.fullName || 'Unknown User'}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full ml-2">
                                            {chat.unreadCount > 4 ? '4+' : chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {(() => {
                                        if (chat.lastMessage?.createdAt) {
                                            const date = new Date(chat.lastMessage.createdAt);
                                            if (!isNaN(date.getTime())) {
                                                const now = new Date();
                                                const diffMs = now - date;
                                                const diffMins = Math.floor(diffMs / 60000);
                                                const diffHours = Math.floor(diffMs / 3600000);
                                                const diffDays = Math.floor(diffMs / 86400000);
                                                
                                                if (diffMins < 1) return 'Just now';
                                                if (diffMins < 60) return `${diffMins}m ago`;
                                                if (diffHours < 24) return `${diffHours}h ago`;
                                                if (diffDays < 7) return `${diffDays}d ago`;
                                                return date.toLocaleDateString();
                                            }
                                        }
                                        if (chat.updatedAt) {
                                            const date = new Date(chat.updatedAt);
                                            if (!isNaN(date.getTime())) {
                                                return date.toLocaleDateString();
                                            }
                                        }
                                        return '';
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {chats.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        No conversations yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;