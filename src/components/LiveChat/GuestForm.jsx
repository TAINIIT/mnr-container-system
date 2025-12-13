import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import './LiveChat.css';

export default function GuestForm({ onSubmit }) {
    const { getGreeting } = useChat();
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) return;

        setIsSubmitting(true);
        await onSubmit(formData);
        setIsSubmitting(false);
    };

    const isValid = formData.name.trim() && formData.email.trim();

    return (
        <div className="guest-form">
            <h3>{getGreeting()}! 👋</h3>
            <p>Please provide your details to start chatting with us.</p>

            <form onSubmit={handleSubmit}>
                <div className="guest-form-field">
                    <label htmlFor="guest-name">Your Name</label>
                    <input
                        type="text"
                        id="guest-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                        autoFocus
                    />
                </div>

                <div className="guest-form-field">
                    <label htmlFor="guest-email">Email Address</label>
                    <input
                        type="email"
                        id="guest-email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="guest-form-submit"
                    disabled={!isValid || isSubmitting}
                >
                    {isSubmitting ? 'Starting...' : 'Start Chat'}
                </button>
            </form>
        </div>
    );
}
