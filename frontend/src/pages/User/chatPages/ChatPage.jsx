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