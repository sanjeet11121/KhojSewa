import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Chat } from '../models/chat.model.js';

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }

    initialize(server) {
        const configuredOrigins = process.env.FRONTEND_URL
            ? process.env.FRONTEND_URL.split(',').map(origin => origin.trim()).filter(Boolean)
            : [];

        const defaultOrigins = [
            "http://localhost:3000",
            "http://localhost:5173"
        ];

        this.io = new Server(server, {
            cors: {
                origin: configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins,
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.io.use(this.authenticateSocket.bind(this));
        this.setupSocketEvents();
    }

    async authenticateSocket(socket, next) {
        try {
            console.log('🔐 Socket authentication attempt...');
            console.log('Handshake auth:', socket.handshake.auth);
            
            let token = socket.handshake.auth.token;
            if (!token) {
                console.log('❌ No token provided in socket auth');
                return next(new Error('Authentication error'));
            }

            // Remove 'Bearer ' prefix if present
            if (token.startsWith('Bearer ')) {
                token = token.substring(7);
                console.log('Removed Bearer prefix from token');
            }

            console.log('Token received:', token.substring(0, 20) + '...');
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            console.log('✅ Token decoded:', decoded);
            
            const user = await User.findById(decoded._id).select('-password');
            
            if (!user) {
                console.log('❌ User not found:', decoded._id);
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            console.log('✅ Socket authenticated for user:', user.fullName);
            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            next(new Error('Authentication error'));
        }
    }

    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.userId}`);
            
            // Add user to connected users map
            this.connectedUsers.set(socket.userId, socket.id);

            // Join user to their personal room
            socket.join(socket.userId);

            // Chat events
            socket.on('join_chat', (chatId) => {
                socket.join(chatId);
                console.log(`User ${socket.userId} joined chat ${chatId}`);
            });

            socket.on('leave_chat', (chatId) => {
                socket.leave(chatId);
                console.log(`User ${socket.userId} left chat ${chatId}`);
            });

            socket.on('send_message', async (data) => {
                try {
                    console.log('📨 Received send_message event:', data);
                    const message = await this.handleSendMessage(socket.userId, data);
                    console.log('✅ Message saved:', message);
                    
                    // Emit to all participants in the chat
                    this.io.to(data.chatId).emit('new_message', message);
                    console.log('✅ Emitted new_message to chat:', data.chatId);
                    
                    // Notify other participants who are not in the chat
                    this.notifyParticipants(socket.userId, data.chatId, message);
                } catch (error) {
                    console.error('❌ Error handling send_message:', error);
                    socket.emit('message_error', { error: error.message });
                }
            });

            socket.on('typing_start', (data) => {
                socket.to(data.chatId).emit('user_typing', {
                    userId: socket.userId,
                    userName: socket.user.fullName,
                    chatId: data.chatId
                });
            });

            socket.on('typing_stop', (data) => {
                socket.to(data.chatId).emit('user_stop_typing', {
                    userId: socket.userId,
                    chatId: data.chatId
                });
            });

            socket.on('mark_as_read', async (data) => {
                await this.handleMarkAsRead(socket.userId, data.chatId, data.messageId);
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.userId}`);
                this.connectedUsers.delete(socket.userId);
            });
        });
    }

    async handleSendMessage(userId, data) {
        const { chatId, content, messageType = 'text', fileUrl, fileName, fileSize } = data;

        console.log('🔍 Looking for chat:', chatId);
        const chat = await Chat.findById(chatId);
        if (!chat) {
            console.error('❌ Chat not found:', chatId);
            throw new Error('Chat not found');
        }
        console.log('✅ Chat found:', chat._id);

        if (!chat.participants.includes(userId)) {
            console.error('❌ User not authorized:', userId);
            throw new Error('Not authorized to send message in this chat');
        }

        const newMessage = {
            sender: userId,
            content,
            messageType,
            fileUrl,
            fileName,
            fileSize,
            readBy: [{
                user: userId,
                readAt: new Date()
            }]
        };

        chat.messages.push(newMessage);
        // Set lastMessage to the full message object, not just the ID
        chat.lastMessage = newMessage;
        await chat.save();
        console.log('✅ Message saved to database');

        // Populate the message for response
        await chat.populate('messages.sender', 'fullName avatar');
        const message = chat.messages[chat.messages.length - 1];

        return {
            _id: message._id,
            chatId: chat._id,
            sender: message.sender,
            content: message.content,
            messageType: message.messageType,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            isRead: message.isRead,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
        };
    }

    async handleMarkAsRead(userId, chatId, messageId) {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const message = chat.messages.id(messageId);
        if (message && !message.readBy.some(read => read.user.toString() === userId)) {
            message.readBy.push({
                user: userId,
                readAt: new Date()
            });
            await chat.save();

            // Notify other participants that message was read
            this.io.to(chatId).emit('message_read', {
                messageId,
                readBy: userId,
                readAt: new Date()
            });
        }
    }

    notifyParticipants(senderId, chatId, message) {
        // Implementation for push notifications would go here
        console.log(`Notifying participants of chat ${chatId} about new message`);
    }

    // Utility method to get socket instance
    getIO() {
        return this.io;
    }
}

export default new SocketService();