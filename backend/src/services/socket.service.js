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
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"]
            }
        });

        this.io.use(this.authenticateSocket.bind(this));
        this.setupSocketEvents();
    }

    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select('-password');
            
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
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
                    const message = await this.handleSendMessage(socket.userId, data);
                    
                    // Emit to all participants in the chat
                    this.io.to(data.chatId).emit('new_message', message);
                    
                    // Notify other participants who are not in the chat
                    this.notifyParticipants(socket.userId, data.chatId, message);
                } catch (error) {
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

        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        if (!chat.participants.includes(userId)) {
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
        chat.lastMessage = chat.messages[chat.messages.length - 1]._id;
        await chat.save();

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