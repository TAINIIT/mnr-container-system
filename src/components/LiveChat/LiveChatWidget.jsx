import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import GuestForm from './GuestForm';
import './LiveChat.css';

export default function LiveChatWidget() {
    const {
        isWidgetOpen,
        setIsWidgetOpen,
        activeChat,
        setActiveChat,
        getOrCreateChat,
        sendMessage,
        getGreeting,
        markAsRead,
        chats
    } = useChat();
    const { user, isAuthenticated } = useAuth();

    const [message, setMessage] = useState('');
    const [showGuestForm, setShowGuestForm] = useState(false);
    const messagesEndRef = useRef(null);

    // Derive currentChat directly from chats context (reactive)
    const currentChat = useMemo(() => {
        if (!activeChat || !chats || !Array.isArray(chats)) return null;
        return chats.find(c => c.id === activeChat) || null;
    }, [activeChat, chats]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentChat?.messages?.length]);

    // Mark as read when chat opens or changes
    useEffect(() => {
        if (activeChat && currentChat) {
            markAsRead(activeChat);
        }
    }, [activeChat]);

    // Handle widget open - check if user is logged in
    useEffect(() => {
        if (isWidgetOpen && !activeChat) {
            if (isAuthenticated && user) {
                // Logged in user - create/get chat immediately
                const chat = getOrCreateChat(null, user);
                setActiveChat(chat.id);
                setShowGuestForm(false);
            } else {
                // Guest - show form
                setShowGuestForm(true);
            }
        }
    }, [isWidgetOpen, isAuthenticated, user, activeChat]);

    const handleGuestSubmit = (guestInfo) => {
        const chat = getOrCreateChat(guestInfo, null);
        setActiveChat(chat.id);
        setShowGuestForm(false);

        // Send welcome message
        sendMessage(chat.id, `Welcome ${guestInfo.name}! How can we help you today?`, 'agent');
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !currentChat) return;

        const sender = isAuthenticated ? 'user' : 'guest';
        sendMessage(currentChat.id, message.trim(), sender);
        setMessage('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDisplayName = () => {
        if (currentChat?.userName) return currentChat.userName;
        if (currentChat?.guestName) return currentChat.guestName;
        return 'Guest';
    };

    const getCompanyDisplay = () => {
        if (isAuthenticated && user?.shippingLineCode) {
            return user.shippingLineCode;
        }
        return 'TIIT TECH Support';
    };

    if (!isWidgetOpen) return null;

    return (
        <div className="live-chat-widget">
            {/* Header */}
            <div className="chat-widget-header">
                <div className="chat-widget-header-info">
                    <div className="chat-widget-avatar">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <div className="chat-widget-title">
                            {showGuestForm ? 'TIIT TECH Support' : getCompanyDisplay()}
                        </div>
                        <div className="chat-widget-subtitle">
                            {showGuestForm ? 'Start a conversation' : 'Online'}
                        </div>
                    </div>
                </div>
                <button
                    className="chat-widget-close"
                    onClick={() => setIsWidgetOpen(false)}
                    aria-label="Close chat"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            {showGuestForm ? (
                <GuestForm onSubmit={handleGuestSubmit} />
            ) : (
                <>
                    {/* Messages */}
                    <div className="chat-messages">
                        {/* Greeting */}
                        {(() => {
                            let messages = currentChat?.messages;
                            if (!messages) return (
                                <div className="chat-greeting">
                                    <h3>{getGreeting()}, {getDisplayName()}! 👋</h3>
                                    <p>How can we help you today?</p>
                                </div>
                            );
                            if (!Array.isArray(messages)) {
                                messages = Object.values(messages);
                            }
                            if (messages.length === 0) return (
                                <div className="chat-greeting">
                                    <h3>{getGreeting()}, {getDisplayName()}! 👋</h3>
                                    <p>How can we help you today?</p>
                                </div>
                            );
                            return messages.map((msg) => (
                                <div
                                    key={msg.id || msg.timestamp}
                                    className={`chat-message ${msg.sender}`}
                                >
                                    {msg.text}
                                    <span className="chat-message-time">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>
                            ));
                        })()}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={!message.trim()}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
