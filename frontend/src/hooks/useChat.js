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
    
    const { socket, currentUser } = useSocket();
    const messagesEndRef = useRef(null);

    // Fetch user's chats
    const fetchChats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/chat', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setChats(data.data.chats || []);
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
            console.log('Fetching messages for chat:', chatId, 'Page:', pageNum);
            const response = await fetch(`http://localhost:8000/api/v1/chat/${chatId}/messages?page=${pageNum}&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Messages response:', data);
            
            if (data.success) {
                const messages = data.data?.messages || [];
                console.log(`Fetched ${messages.length} messages for chat ${chatId}`);
                
                if (pageNum === 1) {
                    setMessages(messages);
                } else {
                    setMessages(prev => [...messages, ...prev]);
                }
                
                setHasMore(data.data?.hasMore || false);
                setPage(pageNum);
                
                // Mark messages as read
                messages.forEach(message => {
                    if (message.sender._id !== currentUser?._id) {
                        markAsRead(message._id, chatId);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const sendMessage = async (content, chatId, messageType = 'text', file = null) => {
        console.log('📤 sendMessage called:', { content, chatId, socket: !!socket });
        
        if (!socket) {
            console.error('❌ Socket not available');
            return;
        }

        if (!content && !file) {
            console.error('❌ No content or file provided');
            return;
        }

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

        console.log('📤 Emitting send_message event:', messageData);
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
            console.log('New message received:', message);
            
            // Add to messages if in active chat
            if (message.chatId === activeChat?._id) {
                setMessages(prev => [...prev, message]);
                
                // Mark as read if message is from other user
                if (message.sender._id !== currentUser?._id) {
                    markAsRead(message._id, message.chatId);
                }
            }
            
            // Update chats list to show latest message
            setChats(prev => prev.map(chat => 
                chat._id === message.chatId 
                    ? { 
                        ...chat, 
                        lastMessage: message,
                        unreadCount: message.sender._id !== currentUser?._id 
                            ? (chat.unreadCount || 0) + 1 
                            : 0
                    }
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

        const handleMessageError = (data) => {
            console.error('❌ Message error:', data);
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);
        socket.on('message_error', handleMessageError);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
            socket.off('message_error', handleMessageError);
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