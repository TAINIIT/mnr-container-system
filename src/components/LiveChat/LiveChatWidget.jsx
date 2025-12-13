import { useState, useRef, useEffect } from 'react';
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
        getOrCreateChat,
        sendMessage,
        getChat,
        getGreeting,
        markAsRead
    } = useChat();
    const { user, isAuthenticated } = useAuth();

    const [message, setMessage] = useState('');
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [currentChat, setCurrentChat] = useState(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentChat?.messages]);

    // Update current chat when activeChat changes
    useEffect(() => {
        if (activeChat) {
            const chat = getChat(activeChat);
            setCurrentChat(chat);
            markAsRead(activeChat);
        }
    }, [activeChat, getChat]);

    // Handle widget open - check if user is logged in
    useEffect(() => {
        if (isWidgetOpen && !activeChat) {
            if (isAuthenticated && user) {
                // Logged in user - create/get chat immediately
                const chat = getOrCreateChat(null, user);
                setCurrentChat(chat);
                setShowGuestForm(false);
            } else {
                // Guest - show form
                setShowGuestForm(true);
            }
        }
    }, [isWidgetOpen, isAuthenticated, user, activeChat]);

    // Refresh chat data periodically
    useEffect(() => {
        if (!activeChat) return;

        const interval = setInterval(() => {
            const chat = getChat(activeChat);
            setCurrentChat(chat);
        }, 2000);

        return () => clearInterval(interval);
    }, [activeChat, getChat]);

    const handleGuestSubmit = (guestInfo) => {
        const chat = getOrCreateChat(guestInfo, null);
        setCurrentChat(chat);
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

        // Refresh chat
        const updatedChat = getChat(currentChat.id);
        setCurrentChat(updatedChat);
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
                        {currentChat?.messages.length === 0 && (
                            <div className="chat-greeting">
                                <h3>{getGreeting()}, {getDisplayName()}! 👋</h3>
                                <p>How can we help you today?</p>
                            </div>
                        )}

                        {/* Messages list */}
                        {currentChat?.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.sender}`}
                            >
                                {msg.text}
                                <span className="chat-message-time">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        ))}
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
