import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import './LiveChat.css';

export default function LiveChatButton() {
    const { isWidgetOpen, setIsWidgetOpen, activeChat, getUnreadCount } = useChat();
    const buttonRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(() => {
        // Load saved position from localStorage
        const saved = localStorage.getItem('askUsButtonPosition');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    });
    const dragStart = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    const unreadCount = activeChat ? getUnreadCount(activeChat) : 0;

    // Save position to localStorage when it changes
    useEffect(() => {
        if (position) {
            localStorage.setItem('askUsButtonPosition', JSON.stringify(position));
        }
    }, [position]);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left mouse button
        setIsDragging(true);
        hasMoved.current = false;
        const rect = buttonRef.current.getBoundingClientRect();
        dragStart.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        hasMoved.current = true;

        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;

        // Keep button within viewport
        const buttonWidth = buttonRef.current.offsetWidth;
        const buttonHeight = buttonRef.current.offsetHeight;
        const maxX = window.innerWidth - buttonWidth;
        const maxY = window.innerHeight - buttonHeight;

        setPosition({
            left: Math.max(0, Math.min(newX, maxX)),
            top: Math.max(0, Math.min(newY, maxY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        // Only toggle chat if we didn't drag
        if (!hasMoved.current) {
            setIsWidgetOpen(!isWidgetOpen);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const buttonStyle = position ? {
        left: `${position.left}px`,
        top: `${position.top}px`,
        right: 'auto',
        transform: 'none'
    } : {};

    return (
        <button
            ref={buttonRef}
            className={`live-chat-button ${isDragging ? 'dragging' : ''}`}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            aria-label="Open live chat"
            style={buttonStyle}
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
