import React, { useState, useEffect } from 'react';
import { useChat } from '../../../hooks/useChat';
import ChatList from '../../../components/chat/ChatList';
import ChatWindow from '../../../components/chat/ChatWindow';

const ChatPage = ({ user }) => {
    const [activeChat, setActiveChat] = useState(null);
    
    const {
        chats,
        messages,
        loading,
        fetchChats,
        fetchMessages,
        joinChat,
        leaveChat
    } = useChat();

    useEffect(() => {
        fetchChats();
    }, []);

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

    return (
        <div className="h-screen flex bg-gray-100">
            <div className="flex-1 flex overflow-hidden">
                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    onSelectChat={handleSelectChat}
                    loading={loading}
                />
                
                <ChatWindow
                    chat={activeChat}
                    currentUser={user}
                />
            </div>
        </div>
    );
};

export default ChatPage;