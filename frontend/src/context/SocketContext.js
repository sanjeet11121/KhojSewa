// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (user) {
            const newSocket = io(process.env.REACT_APP_BACKEND_URL, {
                auth: {
                    token: localStorage.getItem('accessToken')
                }
            });

            setSocket(newSocket);

            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Connected to server');
            });

            newSocket.on('disconnect', () => {
                console.log('Disconnected from server');
            });

            newSocket.on('online_users', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('new_message', (message) => {
                // Handle new message notification
                setNotifications(prev => [...prev, {
                    type: 'message',
                    data: message,
                    timestamp: new Date()
                }]);
            });

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    const value = {
        socket,
        onlineUsers,
        notifications,
        clearNotifications: () => setNotifications([])
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};