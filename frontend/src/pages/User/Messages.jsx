import React, { useState, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';

const Messages = ({ user }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [error, setError] = useState(null);
  
  console.log('Messages component rendered with user:', user);
  
  const {
    chats,
    messages,
    loading,
    fetchChats,
    fetchMessages,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    markAsRead,
    messagesEndRef,
    scrollToBottom
  } = useChat();

  useEffect(() => {
    if (user) {
      try {
        fetchChats();
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats. Please try again.');
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      joinChat(activeChat._id);
      fetchMessages(activeChat._id, 1);
    }

    return () => {
      if (activeChat) {
        leaveChat(activeChat._id);
      }
    };
  }, [activeChat]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
  };

  if (!user) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-indigo-700">Messages</h2>
          <p className="text-gray-600">Please log in to view your messages</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-red-700">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchChats();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = chats?.filter(chat => chat.unreadCount > 0).length || 0;
  const recentChats = chats?.slice(0, 3) || [];

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-indigo-700">Messages</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-red-500 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <a 
          href="/user/messages" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
        >
          View All Messages
        </a>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      ) : recentChats.length > 0 ? (
        <div className="space-y-3">
          {recentChats.map(chat => {
            const otherUser = chat.participants?.find(p => p._id !== user?._id);
            return (
              <a
                key={chat._id}
                href="/user/messages"
                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {otherUser?.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {otherUser?.fullName || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Conversations Yet</h3>
          <p className="text-gray-500 mb-4">Start a conversation by claiming an item or responding to a claim.</p>
        </div>
      )}
    </div>
  );
};

export default Messages;