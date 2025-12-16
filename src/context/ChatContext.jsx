import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_MODE, database, ref, onValue, set, push, get } from '../config/firebase';

const ChatContext = createContext();

const STORAGE_KEY = 'mnr_chats';
const FIREBASE_CHATS_PATH = 'chats';

export function ChatProvider({ children }) {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);
    const unsubscribeRef = useRef(null);

    // Load chats from localStorage (for DEMO_MODE)
    const loadChatsFromStorage = useCallback(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading chats:', e);
            }
        }
        return [];
    }, []);

    // Save chats to appropriate storage
    const saveChats = useCallback((newChats) => {
        if (DEMO_MODE) {
            // Demo mode: use localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newChats));
        } else {
            // Production: save to Firebase
            const chatsRef = ref(database, FIREBASE_CHATS_PATH);
            const chatsObject = {};
            newChats.forEach(chat => {
                chatsObject[chat.id] = chat;
            });
            set(chatsRef, chatsObject).catch(err => {
                console.error('Error saving to Firebase:', err);
            });
        }
    }, []);

    // Initial load and Firebase subscription
    useEffect(() => {
        if (DEMO_MODE) {
            // Demo mode: load from localStorage
            setChats(loadChatsFromStorage());

            // Listen for storage changes (cross-tab sync)
            const handleStorageChange = (e) => {
                if (e.key === STORAGE_KEY && e.newValue) {
                    try {
                        setChats(JSON.parse(e.newValue));
                    } catch (err) {
                        console.error('Error parsing storage event:', err);
                    }
                }
            };
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        } else {
            // Production: subscribe to Firebase
            console.log('🔥 Connecting to Firebase Realtime Database...');
            const chatsRef = ref(database, FIREBASE_CHATS_PATH);

            unsubscribeRef.current = onValue(chatsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const chatsArray = Object.values(data);
                    console.log('🔥 Firebase: Received', chatsArray.length, 'chats');
                    setChats(chatsArray);
                } else {
                    setChats([]);
                }
            }, (error) => {
                console.error('Firebase Error:', error);
            });

            return () => {
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                }
            };
        }
    }, [loadChatsFromStorage]);

    // Create new chat session
    const createChat = useCallback((guestInfo, user = null) => {
        const newChat = {
            id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            guestEmail: guestInfo?.email || null,
            guestName: guestInfo?.name || null,
            userId: user?.id || null,
            userName: user?.fullName || user?.username || null,
            companyName: user?.shippingLineCode || null,
            status: 'active',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignedAgent: null,
            unreadAdmin: 0
        };

        setChats(prev => {
            const newChats = [...prev, newChat];
            saveChats(newChats);
            return newChats;
        });

        setActiveChat(newChat.id);
        return newChat;
    }, [saveChats]);

    // Get or create chat for current user/guest
    const getOrCreateChat = useCallback((guestInfo = null, user = null) => {
        const safeChats = Array.isArray(chats) ? chats : [];

        // If there's an active chat, return it
        if (activeChat) {
            const existing = safeChats.find(c => c.id === activeChat && c.status === 'active');
            if (existing) return existing;
        }

        // Try to find existing active chat for this user/guest
        let existingChat = null;
        if (user?.id) {
            existingChat = safeChats.find(c => c.userId === user.id && c.status === 'active');
        } else if (guestInfo?.email) {
            existingChat = safeChats.find(c => c.guestEmail === guestInfo.email && c.status === 'active');
        }

        if (existingChat) {
            setActiveChat(existingChat.id);
            return existingChat;
        }

        // Create new chat
        return createChat(guestInfo, user);
    }, [activeChat, chats, createChat]);

    // Send message
    const sendMessage = useCallback((chatId, text, sender = 'guest') => {
        const message = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text,
            sender,
            timestamp: new Date().toISOString(),
            read: sender === 'agent'
        };

        setChats(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newChats = safePrev.map(chat => {
                if (chat.id === chatId) {
                    const safeMessages = Array.isArray(chat.messages) ? chat.messages : [];
                    const updatedChat = {
                        ...chat,
                        messages: [...safeMessages, message],
                        updatedAt: new Date().toISOString(),
                        unreadAdmin: sender !== 'agent' ? (chat.unreadAdmin || 0) + 1 : chat.unreadAdmin
                    };

                    // Save ONLY this specific chat to Firebase (prevents race condition)
                    if (!DEMO_MODE) {
                        const chatRef = ref(database, `${FIREBASE_CHATS_PATH}/${chatId}`);
                        set(chatRef, updatedChat).catch(err => {
                            console.error('Error saving chat to Firebase:', err);
                        });
                    }

                    return updatedChat;
                }
                return chat;
            });

            // For demo mode, save all chats to localStorage
            if (DEMO_MODE) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newChats));
            }

            return newChats;
        });

        return message;
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((chatId) => {
        setChats(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newChats = safePrev.map(chat => {
                if (chat.id === chatId) {
                    const safeMessages = Array.isArray(chat.messages) ? chat.messages : [];
                    return {
                        ...chat,
                        messages: safeMessages.map(m => ({ ...m, read: true })),
                        unreadAdmin: 0
                    };
                }
                return chat;
            });
            saveChats(newChats);
            return newChats;
        });
    }, [saveChats]);

    // Close chat
    const closeChat = useCallback((chatId) => {
        setChats(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newChats = safePrev.map(chat => {
                if (chat.id === chatId) {
                    return { ...chat, status: 'closed' };
                }
                return chat;
            });
            saveChats(newChats);
            return newChats;
        });
        if (activeChat === chatId) {
            setActiveChat(null);
        }
    }, [activeChat, saveChats]);

    // Delete chat permanently
    const deleteChat = useCallback((chatId) => {
        setChats(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newChats = safePrev.filter(chat => chat.id !== chatId);
            saveChats(newChats);
            return newChats;
        });
        if (activeChat === chatId) {
            setActiveChat(null);
        }
    }, [activeChat, saveChats]);

    // Assign chat to agent
    const assignChat = useCallback((chatId, agentId, agentName) => {
        setChats(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newChats = safePrev.map(chat => {
                if (chat.id === chatId) {
                    return { ...chat, assignedAgent: { id: agentId, name: agentName } };
                }
                return chat;
            });
            saveChats(newChats);
            return newChats;
        });
    }, [saveChats]);

    // Get unread count for a chat
    const getUnreadCount = useCallback((chatId) => {
        const safeChats = Array.isArray(chats) ? chats : [];
        const chat = safeChats.find(c => c.id === chatId);
        if (!chat || !Array.isArray(chat.messages)) return 0;
        return chat.messages.filter(m => !m.read && m.sender !== 'agent').length;
    }, [chats]);

    // Get total unread for admin
    const getTotalUnreadAdmin = useCallback(() => {
        const safeChats = Array.isArray(chats) ? chats : [];
        return safeChats
            .filter(c => c.status === 'active')
            .reduce((total, chat) => {
                const messages = Array.isArray(chat.messages) ? chat.messages : [];
                const unread = messages.filter(m =>
                    (m.sender === 'user' || m.sender === 'guest') && !m.read
                ).length;
                return total + unread;
            }, 0);
    }, [chats]);

    // Get active chats for admin
    const getActiveChats = useCallback(() => {
        const safeChats = Array.isArray(chats) ? chats : [];
        return safeChats.filter(c => c.status === 'active')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }, [chats]);

    // Get chat by ID
    const getChat = useCallback((chatId) => {
        const safeChats = Array.isArray(chats) ? chats : [];
        return safeChats.find(c => c.id === chatId);
    }, [chats]);

    // Refresh chats from storage (for manual refresh)
    const refreshChats = useCallback(() => {
        if (DEMO_MODE) {
            setChats(loadChatsFromStorage());
        }
        // Firebase auto-syncs, no manual refresh needed
    }, [loadChatsFromStorage]);

    // Greeting based on time
    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const value = {
        chats,
        activeChat,
        setActiveChat,
        isWidgetOpen,
        setIsWidgetOpen,
        isDemoMode: DEMO_MODE,
        createChat,
        getOrCreateChat,
        sendMessage,
        markAsRead,
        closeChat,
        deleteChat,
        assignChat,
        getUnreadCount,
        getTotalUnreadAdmin,
        getActiveChats,
        getChat,
        refreshChats,
        getGreeting
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
