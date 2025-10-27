// components/Chat/ChatList.js
import React from 'react';

const ChatList = ({ chats, activeChat, onSelectChat, loading }) => {
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
                                    src={chat.participants.find(p => p._id !== user._id)?.avatar || '/default-avatar.png'}
                                    alt="Avatar"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {chat.chatName || chat.participants.find(p => p._id !== user._id)?.fullName}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.lastMessage?.content || 'No messages yet'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {chat.lastMessage ? 
                                        new Date(chat.lastMessage.createdAt).toLocaleTimeString() : 
                                        new Date(chat.updatedAt).toLocaleDateString()
                                    }
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