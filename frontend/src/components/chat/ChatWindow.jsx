// components/Chat/ChatWindow.js
import React, { useState, useRef, useEffect } from 'react';

const ChatWindow = ({ 
    chat, 
    currentUser, 
    messages = [], 
    onSendMessage, 
    onStartTyping, 
    onStopTyping, 
    onMarkAsRead, 
    messagesEndRef, 
    scrollToBottom 
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState('');
    const messageContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        onSendMessage(newMessage, chat._id);
        setNewMessage('');
        onStopTyping(chat._id);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        // Typing indicators
        onStartTyping(chat._id);
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            onStopTyping(chat._id);
        }, 1000);
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!chat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                    <p className="text-gray-500">Choose a chat from the list to start messaging</p>
                </div>
            </div>
        );
    }

    const otherUser = chat.participants.find(p => p._id !== currentUser._id);

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <img
                        className="h-10 w-10 rounded-full"
                        src={otherUser?.avatar || '/default-avatar.png'}
                        alt={otherUser?.fullName}
                    />
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {otherUser?.fullName}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isTyping ? `${typingUser} is typing...` : 'Online'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div 
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`flex ${
                            message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender._id === currentUser._id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                        >
                            {message.messageType === 'image' ? (
                                <img
                                    src={message.fileUrl}
                                    alt="Shared image"
                                    className="max-w-full rounded"
                                />
                            ) : (
                                <p className="text-sm">{message.content}</p>
                            )}
                            <p className={`text-xs mt-1 ${
                                message.sender._id === currentUser._id 
                                    ? 'text-blue-100' 
                                    : 'text-gray-500'
                            }`}>
                                {formatTime(message.createdAt)}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;