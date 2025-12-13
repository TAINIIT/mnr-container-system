import { MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './LiveChat.css';

export default function LiveChatButton() {
    const { isWidgetOpen, setIsWidgetOpen, activeChat, getUnreadCount } = useChat();

    const unreadCount = activeChat ? getUnreadCount(activeChat) : 0;

    const handleClick = () => {
        setIsWidgetOpen(!isWidgetOpen);
    };

    return (
        <button
            className="live-chat-button"
            onClick={handleClick}
            aria-label="Open live chat"
        >
            <span className="chat-icon">
                <MessageCircle size={20} />
            </span>
            <span className="chat-text">Ask Us</span>
            {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
            )}
        </button>
    );
}
