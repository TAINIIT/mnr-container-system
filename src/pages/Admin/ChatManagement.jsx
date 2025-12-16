import { useState, useRef, useEffect } from 'react';
import {
    MessageCircle, Send, X, CheckCircle, Trash2,
    User, Clock, Mail, Building, RefreshCw, Filter
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import '../pages.css';
import '../../components/LiveChat/LiveChat.css';

export default function ChatManagement() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const {
        getActiveChats,
        getChat,
        sendMessage,
        closeChat,
        deleteChat,
        markAsRead,
        getTotalUnreadAdmin,
        refreshChats,
        chats
    } = useChat();

    const [selectedChatId, setSelectedChatId] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'closed'
    const [isRefreshing, setIsRefreshing] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-refresh chats from localStorage every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshChats();
        }, 2000);
        return () => clearInterval(interval);
    }, [refreshChats]);

    // Manual refresh handler
    const handleRefresh = () => {
        setIsRefreshing(true);
        refreshChats();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Get filtered chats based on status
    const getFilteredChats = () => {
        // Ensure chats is an array (may be undefined while loading from Firebase)
        if (!chats || !Array.isArray(chats)) {
            return [];
        }

        let filtered = [...chats];

        if (filterStatus === 'active') {
            filtered = filtered.filter(c => c.status === 'active');
        } else if (filterStatus === 'closed') {
            filtered = filtered.filter(c => c.status === 'closed');
        }

        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    };

    const filteredChats = getFilteredChats();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedChatId, chats]);

    // Find selectedChat directly from chats array to ensure it updates when new messages arrive
    const selectedChat = selectedChatId
        ? (Array.isArray(chats) ? chats.find(c => c.id === selectedChatId) : null)
        : null;

    const handleSelectChat = (chatId) => {
        setSelectedChatId(chatId);
        markAsRead(chatId);
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !selectedChatId) return;

        sendMessage(selectedChatId, replyMessage.trim(), 'agent');
        setReplyMessage('');
    };

    const handleCloseChat = (chatId) => {
        if (window.confirm('Are you sure you want to close this chat?')) {
            closeChat(chatId);
            if (selectedChatId === chatId) {
                setSelectedChatId(null);
            }
        }
    };

    const handleDeleteChat = (chatId, e) => {
        e.stopPropagation(); // Prevent selecting the chat
        if (window.confirm('Are you sure you want to permanently delete this chat? This cannot be undone.')) {
            deleteChat(chatId);
            if (selectedChatId === chatId) {
                setSelectedChatId(null);
            }
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const formatMessageTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getLastMessage = (chat) => {
        if (!chat || !chat.messages) return 'No messages yet';
        // Handle both array and object formats
        let messages = chat.messages;
        if (!Array.isArray(messages)) {
            messages = Object.values(messages);
        }
        if (!messages.length) return 'No messages yet';
        const last = messages[messages.length - 1];
        const prefix = last.sender === 'agent' ? 'You: ' : '';
        return prefix + (last.text.length > 40 ? last.text.substring(0, 40) + '...' : last.text);
    };

    const getUnreadCount = (chat) => {
        if (!chat || !chat.messages) return 0;
        // Handle both array and object formats
        let messages = chat.messages;
        if (!Array.isArray(messages)) {
            messages = Object.values(messages);
        }
        return messages.filter(m =>
            (m.sender === 'user' || m.sender === 'guest') && !m.read
        ).length;
    };

    const getChatName = (chat) => {
        return chat.userName || chat.guestName || chat.guestEmail || 'Unknown Guest';
    };

    const totalUnread = getTotalUnreadAdmin();
    const activeCount = chats && Array.isArray(chats) ? chats.filter(c => c.status === 'active').length : 0;
    const closedCount = chats && Array.isArray(chats) ? chats.filter(c => c.status === 'closed').length : 0;

    return (
        <div className="page-list-layout">
            <div className="page-list-header">
                <div className="section-header">
                    <div className="section-title">
                        <MessageCircle size={24} />
                        <h1>{t('chat.management') || 'Chat Management'}</h1>
                        {totalUnread > 0 && (
                            <span className="badge badge-primary">{totalUnread} unread</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="page-list-content">
                <div className="chat-management">
                    {/* Chat List Panel */}
                    <div className="chat-list-panel">
                        <div className="chat-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Chats</span>
                                <span className="badge">{filteredChats.length}</span>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="btn-icon"
                                title="Refresh chats"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} style={{
                                    animation: isRefreshing ? 'spin 0.5s linear infinite' : 'none'
                                }} />
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="chat-filter-tabs" style={{
                            display: 'flex',
                            gap: '4px',
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'var(--surface-light)'
                        }}>
                            <button
                                className={`chat-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('all')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    background: filterStatus === 'all' ? 'var(--primary)' : 'transparent',
                                    color: filterStatus === 'all' ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                All ({chats && Array.isArray(chats) ? chats.length : 0})
                            </button>
                            <button
                                className={`chat-filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('active')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    background: filterStatus === 'active' ? 'var(--success)' : 'transparent',
                                    color: filterStatus === 'active' ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                Active ({activeCount})
                            </button>
                            <button
                                className={`chat-filter-btn ${filterStatus === 'closed' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('closed')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    background: filterStatus === 'closed' ? 'var(--text-muted)' : 'transparent',
                                    color: filterStatus === 'closed' ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                Closed ({closedCount})
                            </button>
                        </div>

                        <div className="chat-list">
                            {filteredChats.length === 0 ? (
                                <div className="chat-empty-state" style={{ padding: '40px 20px' }}>
                                    <MessageCircle size={40} />
                                    <p>No {filterStatus !== 'all' ? filterStatus : ''} chats</p>
                                </div>
                            ) : (
                                filteredChats.map(chat => {
                                    const unread = getUnreadCount(chat);
                                    const isClosed = chat.status === 'closed';
                                    return (
                                        <div
                                            key={chat.id}
                                            className={`chat-list-item ${selectedChatId === chat.id ? 'active' : ''} ${isClosed ? 'closed' : ''}`}
                                            onClick={() => handleSelectChat(chat.id)}
                                            style={{
                                                opacity: isClosed ? 0.7 : 1,
                                                position: 'relative'
                                            }}
                                        >
                                            <div className="chat-list-item-header">
                                                <span className="chat-list-item-name">
                                                    {getChatName(chat)}
                                                    {isClosed && (
                                                        <span style={{
                                                            marginLeft: '8px',
                                                            fontSize: '10px',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: 'var(--text-muted)',
                                                            color: 'white'
                                                        }}>
                                                            Closed
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="chat-list-item-time">
                                                    {formatTime(chat.updatedAt)}
                                                </span>
                                            </div>
                                            <div className="chat-list-item-unread">
                                                <span className="chat-list-item-preview">
                                                    {getLastMessage(chat)}
                                                </span>
                                                {unread > 0 && <span className="dot"></span>}
                                                {isClosed && (
                                                    <button
                                                        className="btn-icon-delete"
                                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                                        title="Delete chat"
                                                        style={{
                                                            marginLeft: '8px',
                                                            padding: '4px',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: 'var(--danger)',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Conversation Panel */}
                    <div className="chat-conversation-panel">
                        {selectedChat ? (
                            <>
                                <div className="chat-conversation-header">
                                    <div className="chat-conversation-info">
                                        <h3>
                                            {getChatName(selectedChat)}
                                            {selectedChat.status === 'closed' && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '12px',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'var(--text-muted)',
                                                    color: 'white'
                                                }}>
                                                    Closed
                                                </span>
                                            )}
                                        </h3>
                                        <p>
                                            {selectedChat.guestEmail && (
                                                <><Mail size={12} /> {selectedChat.guestEmail}</>
                                            )}
                                            {selectedChat.companyName && (
                                                <><Building size={12} /> {selectedChat.companyName}</>
                                            )}
                                            {!selectedChat.guestEmail && !selectedChat.companyName && (
                                                <><Clock size={12} /> Started {formatTime(selectedChat.createdAt)}</>
                                            )}
                                        </p>
                                    </div>
                                    <div className="chat-conversation-actions">
                                        {selectedChat.status === 'active' ? (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleCloseChat(selectedChat.id)}
                                            >
                                                <CheckCircle size={14} />
                                                Close Chat
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={(e) => handleDeleteChat(selectedChat.id, e)}
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="chat-conversation-messages">
                                    {(() => {
                                        // Handle both array and object formats (Firebase sometimes returns objects)
                                        let messages = selectedChat.messages;
                                        if (!messages) return null;
                                        if (!Array.isArray(messages)) {
                                            // Convert object to array
                                            messages = Object.values(messages);
                                        }
                                        return messages.map(msg => (
                                            <div
                                                key={msg.id || msg.timestamp}
                                                className={`chat-message ${msg.sender}`}
                                            >
                                                {msg.text}
                                                <span className="chat-message-time">
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                    <div ref={messagesEndRef} />
                                </div>

                                {selectedChat.status === 'active' ? (
                                    <form className="chat-conversation-input" onSubmit={handleSendReply}>
                                        <input
                                            type="text"
                                            placeholder="Type your reply..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={!replyMessage.trim()}
                                        >
                                            <Send size={16} />
                                            Send
                                        </button>
                                    </form>
                                ) : (
                                    <div className="chat-conversation-input" style={{
                                        justifyContent: 'center',
                                        background: 'var(--surface-light)',
                                        color: 'var(--text-muted)'
                                    }}>
                                        This chat has been closed
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="chat-empty-state">
                                <MessageCircle size={60} />
                                <h3>Select a chat</h3>
                                <p>Choose a conversation from the list to start replying</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
