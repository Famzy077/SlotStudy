import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface SocketNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: Set<string>;
  typingUserIds: Set<string>;
  notifications: SocketNotification[];
  unreadNotificationCount: number;
  latestMessage: SocketMessage | null;
  sendMessage: (
    toUserId: string,
    text: string,
  ) => Promise<{ success: boolean; data?: SocketMessage; error?: string }>;
  markConversationRead: (conversationId: string) => void;
  startTyping: (toUserId: string) => void;
  stopTyping: (toUserId: string) => void;
  isUserOnline: (userId: string) => boolean;
  isUserTyping: (userId: string) => boolean;
  clearNotificationBadge: () => void;
  addNotificationListener: (listener: (n: SocketNotification) => void) => () => void;
  addMessageListener: (listener: (m: SocketMessage) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

function getSocketUrl(): string {
  const apiUrl =
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://slotstudy.onrender.com';

  // Strip trailing /api/v1 or /api
  return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState<SocketMessage | null>(null);

  const notificationListenersRef = useRef<Set<(n: SocketNotification) => void>>(new Set());
  const messageListenersRef = useRef<Set<(m: SocketMessage) => void>>(new Set());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Connect on authentication, reconnect on token update, disconnect on logout
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const host = getSocketUrl();
    const newSocket = io(host, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    // ── Real-time Presence ──
    newSocket.on('presence:update', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.status === 'online') {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    // ── Real-time Typing ──
    newSocket.on('typing', (data: { userId: string; isTyping: boolean }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userId);
          // Auto-clear typing after 4 seconds of inactivity
          const existing = typingTimeoutsRef.current.get(data.userId);
          if (existing) clearTimeout(existing);
          const timer = setTimeout(() => {
            setTypingUserIds((current) => {
              const cleaned = new Set(current);
              cleaned.delete(data.userId);
              return cleaned;
            });
          }, 4000);
          typingTimeoutsRef.current.set(data.userId, timer);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    // ── Real-time Messages ──
    newSocket.on('message:new', (msg: SocketMessage) => {
      setLatestMessage(msg);
      messageListenersRef.current.forEach((fn) => fn(msg));
    });

    // ── Real-time Notifications ──
    newSocket.on('notification:new', (notif: SocketNotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
      notificationListenersRef.current.forEach((fn) => fn(notif));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [isAuthenticated, token]);

  const sendMessage = useCallback(
    (toUserId: string, text: string) => {
      return new Promise<{ success: boolean; data?: SocketMessage; error?: string }>((resolve) => {
        if (!socket || !socket.connected) {
          resolve({ success: false, error: 'Connection offline. Retrying...' });
          return;
        }

        const timeout = setTimeout(() => {
          resolve({
            success: false,
            error: 'Message send timed out. Check your connection and retry.',
          });
        }, 12_000);

        socket.emit(
          'message:send',
          { toUserId, text },
          (response: { success: boolean; data?: SocketMessage; error?: string }) => {
            clearTimeout(timeout);
            if (response && response.success) {
              resolve({ success: true, data: response.data });
            } else {
              resolve({ success: false, error: response?.error || 'Failed to send message' });
            }
          },
        );
      });
    },
    [socket],
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      if (socket?.connected) {
        socket.emit('message:read', { conversationId });
      }
    },
    [socket],
  );

  const startTyping = useCallback(
    (toUserId: string) => {
      if (socket?.connected) {
        socket.emit('typing:start', { toUserId });
      }
    },
    [socket],
  );

  const stopTyping = useCallback(
    (toUserId: string) => {
      if (socket?.connected) {
        socket.emit('typing:stop', { toUserId });
      }
    },
    [socket],
  );

  const isUserOnline = useCallback(
    (userId: string) => onlineUserIds.has(userId),
    [onlineUserIds],
  );

  const isUserTyping = useCallback(
    (userId: string) => typingUserIds.has(userId),
    [typingUserIds],
  );

  const clearNotificationBadge = useCallback(() => {
    setUnreadNotificationCount(0);
  }, []);

  const addNotificationListener = useCallback((listener: (n: SocketNotification) => void) => {
    notificationListenersRef.current.add(listener);
    return () => {
      notificationListenersRef.current.delete(listener);
    };
  }, []);

  const addMessageListener = useCallback((listener: (m: SocketMessage) => void) => {
    messageListenersRef.current.add(listener);
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    onlineUserIds,
    typingUserIds,
    notifications,
    unreadNotificationCount,
    latestMessage,
    sendMessage,
    markConversationRead,
    startTyping,
    stopTyping,
    isUserOnline,
    isUserTyping,
    clearNotificationBadge,
    addNotificationListener,
    addMessageListener,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
