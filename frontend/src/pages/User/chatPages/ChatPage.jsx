import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../../../hooks/useChat';
import ChatList from '../../../components/chat/ChatList';
import ChatWindow from '../../../components/chat/ChatWindow';
import logo from '../../../assets/khojsewa_logo.png';

const ChatPage = ({ user }) => {
    const {
        chats,
        activeChat,
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
        scrollToBottom,
        setActiveChat
    } = useChat();

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (activeChat) {
            console.log('Joining chat and fetching messages for:', activeChat._id);
            joinChat(activeChat._id);
            fetchMessages(activeChat._id, 1);
        }

        return () => {
            if (activeChat) {
                console.log('Leaving chat:', activeChat._id);
                leaveChat(activeChat._id);
            }
        };
    }, [activeChat?._id]); // Only run when activeChat._id changes

    const handleSelectChat = (chat) => {
        console.log('Chat selected:', chat._id);
        setActiveChat(chat);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header with Logo */}
            <div className="bg-indigo-600 shadow-md">
                <div className="px-6 py-3">
                    <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-white hover:text-indigo-200 transition-colors duration-200">
                        <img src={logo} alt="KhojSewa Logo" className="h-12 w-auto" />
                        <span>KhojSewa</span>
                    </Link>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex overflow-hidden">
                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    onSelectChat={handleSelectChat}
                    loading={loading}
                    currentUser={user}
                />
                
                <ChatWindow
                    chat={activeChat}
                    currentUser={user}
                    messages={messages}
                    onSendMessage={sendMessage}
                    onStartTyping={startTyping}
                    onStopTyping={stopTyping}
                    onMarkAsRead={markAsRead}
                    messagesEndRef={messagesEndRef}
                    scrollToBottom={scrollToBottom}
                />
            </div>
        </div>
    );
};

export default ChatPage;