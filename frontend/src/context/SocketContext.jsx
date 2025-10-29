import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const resolveSocketUrl = () => {
  const {
    VITE_SOCKET_URL,
    VITE_API_BASE_URL,
    VITE_BACKEND_URL,
  } = import.meta.env;

  return (
    VITE_SOCKET_URL ||
    VITE_API_BASE_URL ||
    VITE_BACKEND_URL ||
    'http://localhost:8000'
  );
};

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [currentUser, setCurrentUser] = useState(user ?? null);

  const socketRef = useRef(null);
  const tokenRef = useRef(localStorage.getItem('accessToken'));
  const urlRef = useRef(resolveSocketUrl());

  const cleanupSocket = useCallback(() => {
    const instance = socketRef.current;
    if (!instance) return;

    instance.off('connect');
    instance.off('disconnect');
    instance.off('connect_error');
    instance.disconnect();

    socketRef.current = null;
    setSocket(null);
    setIsConnected(false);
  }, []);

  const initialiseSocket = useCallback(() => {
    let token = localStorage.getItem('accessToken');
    
    // Clean up: Remove 'Bearer ' prefix if token was stored with it
    if (token && token.startsWith('Bearer ')) {
      token = token.substring(7);
      localStorage.setItem('accessToken', token); // Update storage
      console.log('Cleaned up token in localStorage (removed Bearer prefix)');
    }
    
    tokenRef.current = token ?? null;

    console.log('🔧 Initializing socket...');
    console.log('Token available:', !!token);
    console.log('Current user:', currentUser);

    if (!token || !currentUser) {
      console.log('❌ Missing token or user, not initializing socket');
      cleanupSocket();
      return;
    }

    console.log('✅ Creating socket instance with URL:', urlRef.current);
    const instance = io(urlRef.current, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
    });

    socketRef.current = instance;
    setSocket(instance);
    setConnectionError(null);

    instance.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
    });

    instance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    instance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionError(error);
    });

    instance.connect();
  }, [cleanupSocket, currentUser]);

  const connectSocket = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    tokenRef.current = token ?? null;

    if (!socketRef.current || !token || !currentUser) return;

    socketRef.current.auth = { token };
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [currentUser]);

  const disconnectSocket = useCallback(() => {
    cleanupSocket();
  }, [cleanupSocket]);

  const refreshAuthToken = useCallback((nextToken) => {
    tokenRef.current = nextToken ?? null;
    if (!socketRef.current) return;

    socketRef.current.auth = { token: nextToken };

    if (socketRef.current.connected) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  useEffect(() => {
    setCurrentUser(user ?? null);
  }, [user]);

  useEffect(() => {
    initialiseSocket();

    return () => {
      cleanupSocket();
    };
  }, [initialiseSocket, cleanupSocket]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'accessToken') {
        const updatedToken = event.newValue;
        if (!updatedToken) {
          disconnectSocket();
        } else {
          refreshAuthToken(updatedToken);
        }
      }
      if (event.key === 'user') {
        const updatedUser = event.newValue;
        try {
          const parsedUser = updatedUser ? JSON.parse(updatedUser) : null;
          setCurrentUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [disconnectSocket, refreshAuthToken]);

  const value = useMemo(() => ({
    socket,
    isConnected,
    connectionError,
    currentUser,
    setCurrentUser,
    connectSocket,
    disconnectSocket,
    refreshAuthToken,
  }), [
    socket,
    isConnected,
    connectionError,
    currentUser,
    setCurrentUser,
    connectSocket,
    disconnectSocket,
    refreshAuthToken,
  ]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};


