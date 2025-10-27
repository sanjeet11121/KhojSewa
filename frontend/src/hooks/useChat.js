// hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

export const useChat = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    
    const { socket } = useSocket();
    const messagesEndRef = useRef(null);

    // Fetch user's chats
    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setChats(data.data.chats);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    // Fetch messages for active chat
    const fetchMessages = async (chatId, pageNum = 1) => {
        if (!chatId) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/chats/${chatId}/messages?page=${pageNum}&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                if (pageNum === 1) {
                    setMessages(data.data.messages);
                } else {
                    setMessages(prev => [...data.data.messages, ...prev]);
                }
                setHasMore(data.data.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const sendMessage = async (content, chatId, messageType = 'text', file = null) => {
        if (!socket || (!content && !file)) return;

        let fileUrl = null;
        let fileName = null;
        let fileSize = null;

        if (file) {
            // Upload file logic here
            // This would be your file upload implementation
        }

        const messageData = {
            chatId: chatId || activeChat?._id,
            content,
            messageType,
            fileUrl,
            fileName,
            fileSize
        };

        socket.emit('send_message', messageData);
    };

    // Join chat room
    const joinChat = (chatId) => {
        if (socket && chatId) {
            socket.emit('join_chat', chatId);
        }
    };

    // Leave chat room
    const leaveChat = (chatId) => {
        if (socket && chatId) {
            socket.emit('leave_chat', chatId);
        }
    };

    // Typing indicators
    const startTyping = (chatId) => {
        if (socket && chatId) {
            socket.emit('typing_start', { chatId });
        }
    };

    const stopTyping = (chatId) => {
        if (socket && chatId) {
            socket.emit('typing_stop', { chatId });
        }
    };

    // Mark message as read
    const markAsRead = (messageId, chatId) => {
        if (socket && messageId && chatId) {
            socket.emit('mark_as_read', { messageId, chatId });
        }
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            if (message.chatId === activeChat?._id) {
                setMessages(prev => [...prev, message]);
                markAsRead(message._id, message.chatId);
            }
            // Update chats list to show latest message
            setChats(prev => prev.map(chat => 
                chat._id === message.chatId 
                    ? { ...chat, lastMessage: message }
                    : chat
            ));
        };

        const handleUserTyping = (data) => {
            // Handle typing indicator
            console.log(`${data.userName} is typing...`);
        };

        const handleUserStopTyping = (data) => {
            // Handle stop typing
            console.log(`${data.userId} stopped typing`);
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
        };
    }, [socket, activeChat]);

    return {
        chats,
        activeChat,
        messages,
        loading,
        hasMore,
        fetchChats,
        fetchMessages,
        sendMessage,
        joinChat,
        leaveChat,
        startTyping,
        stopTyping,
        markAsRead,
        setActiveChat,
        messagesEndRef,
        scrollToBottom
    };
};