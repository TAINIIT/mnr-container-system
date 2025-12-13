import { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import {
    Home, Plus, Edit2, Trash2, Save, X, Search,
    Megaphone, Link as LinkIcon, ExternalLink, ToggleLeft, ToggleRight,
    ChevronUp, ChevronDown
} from 'lucide-react';
import './Admin.css';

export default function HomePageManagement() {
    const {
        getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        getLinks, addLink, updateLink, deleteLink
    } = useConfig();
    const { user } = useAuth();
    const { t } = useLanguage();
    const toast = useToast();

    const announcements = getAnnouncements();
    const links = getLinks();

    // Announcement state
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

    // Link state
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [linkForm, setLinkForm] = useState({ title: '', url: '', description: '' });

    // Announcement handlers
    const handleOpenAnnouncementModal = (announcement = null) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setAnnouncementForm({ title: announcement.title, content: announcement.content });
        } else {
            setEditingAnnouncement(null);
            setAnnouncementForm({ title: '', content: '' });
        }
        setAnnouncementModalOpen(true);
    };

    const handleSaveAnnouncement = () => {
        if (!announcementForm.title || !announcementForm.content) {
            toast.error(t('admin.requiredFields') || 'Title and Content are required');
            return;
        }
        if (editingAnnouncement) {
            updateAnnouncement(editingAnnouncement.id, {
                title: announcementForm.title,
                content: announcementForm.content
            });
            toast.success(t('admin.announcementUpdated') || 'Announcement updated');
        } else {
            addAnnouncement({
                title: announcementForm.title,
                content: announcementForm.content,
                createdBy: user?.username || 'SYSTEM'
            });
            toast.success(t('admin.announcementCreated') || 'Announcement created');
        }
        setAnnouncementModalOpen(false);
        setAnnouncementForm({ title: '', content: '' });
        setEditingAnnouncement(null);
    };

    const handleDeleteAnnouncement = (id) => {
        if (confirm(t('admin.confirmDelete') || 'Are you sure you want to delete this?')) {
            deleteAnnouncement(id);
            toast.success(t('admin.announcementDeleted') || 'Announcement deleted');
        }
    };

    // Move announcement up/down
    const handleMoveAnnouncement = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= announcements.length) return;

        // Swap by updating createdAt timestamps
        const current = announcements[index];
        const target = announcements[newIndex];

        // Swap positions by updating order field
        updateAnnouncement(current.id, { order: target.order || newIndex });
        updateAnnouncement(target.id, { order: current.order || index });
        toast.info(t('admin.itemMoved') || 'Item moved');
    };

    // Link handlers
    const handleOpenLinkModal = (link = null) => {
        if (link) {
            setEditingLink(link);
            setLinkForm({ title: link.title, url: link.url, description: link.description || '' });
        } else {
            setEditingLink(null);
            setLinkForm({ title: '', url: '', description: '' });
        }
        setLinkModalOpen(true);
    };

    const handleSaveLink = () => {
        if (!linkForm.title || !linkForm.url) {
            toast.error(t('admin.requiredFields') || 'Title and URL are required');
            return;
        }
        if (editingLink) {
            updateLink(editingLink.id, {
                title: linkForm.title,
                url: linkForm.url,
                description: linkForm.description
            });
            toast.success(t('admin.linkUpdated') || 'Link updated');
        } else {
            addLink({
                title: linkForm.title,
                url: linkForm.url,
                description: linkForm.description,
                createdBy: user?.username || 'SYSTEM'
            });
            toast.success(t('admin.linkCreated') || 'Link created');
        }
        setLinkModalOpen(false);
        setLinkForm({ title: '', url: '', description: '' });
        setEditingLink(null);
    };

    const handleDeleteLink = (id) => {
        if (confirm(t('admin.confirmDelete') || 'Are you sure you want to delete this?')) {
            deleteLink(id);
            toast.success(t('admin.linkDeleted') || 'Link deleted');
        }
    };

    // Move link up/down
    const handleMoveLink = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= links.length) return;

        const current = links[index];
        const target = links[newIndex];

        updateLink(current.id, { order: target.order || newIndex });
        updateLink(target.id, { order: current.order || index });
        toast.info(t('admin.itemMoved') || 'Item moved');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2><Home size={24} /> {t('admin.homePageManagement') || 'Home Page Management'}</h2>
                    <p className="text-muted">{t('admin.homePageDesc') || 'Manage announcements and links displayed on the portal'}</p>
                </div>
            </div>

            <div className="homepage-admin-grid">
                {/* Announcements Section */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <Megaphone size={18} />
                            {t('homepage.announcements') || 'Announcements'}
                        </h3>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenAnnouncementModal()}>
                            <Plus size={14} /> {t('common.add') || 'Add'}
                        </button>
                    </div>
                    <div className="homepage-item-list">
                        {announcements.length === 0 ? (
                            <div className="empty-state">
                                <Megaphone size={32} />
                                <p>{t('homepage.noAnnouncements') || 'No announcements yet'}</p>
                            </div>
                        ) : (
                            announcements.map((ann, index) => (
                                <div key={ann.id} className="homepage-item">
                                    <div className="homepage-item-order">
                                        <button
                                            className="btn-icon btn-sm"
                                            onClick={() => handleMoveAnnouncement(index, 'up')}
                                            disabled={index === 0}
                                            title={t('admin.moveUp') || 'Move Up'}
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            className="btn-icon btn-sm"
                                            onClick={() => handleMoveAnnouncement(index, 'down')}
                                            disabled={index === announcements.length - 1}
                                            title={t('admin.moveDown') || 'Move Down'}
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                    <div className="homepage-item-content">
                                        <h4>{ann.title}</h4>
                                        <p>{ann.content}</p>
                                        <span className="homepage-item-meta">
                                            {new Date(ann.createdAt).toLocaleDateString()} - {ann.createdBy}
                                        </span>
                                    </div>
                                    <div className="homepage-item-actions">
                                        <button className="btn-icon" onClick={() => handleOpenAnnouncementModal(ann)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon text-error" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Links Section */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <LinkIcon size={18} />
                            {t('homepage.links') || 'Links'}
                        </h3>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenLinkModal()}>
                            <Plus size={14} /> {t('common.add') || 'Add'}
                        </button>
                    </div>
                    <div className="homepage-item-list">
                        {links.length === 0 ? (
                            <div className="empty-state">
                                <LinkIcon size={32} />
                                <p>{t('homepage.noLinks') || 'No links yet'}</p>
                            </div>
                        ) : (
                            links.map((link, index) => (
                                <div key={link.id} className="homepage-item">
                                    <div className="homepage-item-order">
                                        <button
                                            className="btn-icon btn-sm"
                                            onClick={() => handleMoveLink(index, 'up')}
                                            disabled={index === 0}
                                            title={t('admin.moveUp') || 'Move Up'}
                                        >
                                            <ChevronUp size={14} />
                                        </button>
                                        <button
                                            className="btn-icon btn-sm"
                                            onClick={() => handleMoveLink(index, 'down')}
                                            disabled={index === links.length - 1}
                                            title={t('admin.moveDown') || 'Move Down'}
                                        >
                                            <ChevronDown size={14} />
                                        </button>
                                    </div>
                                    <div className="homepage-item-content">
                                        <h4>
                                            {link.title}
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-external">
                                                <ExternalLink size={14} />
                                            </a>
                                        </h4>
                                        <p>{link.description || link.url}</p>
                                        <span className="homepage-item-meta">
                                            {new Date(link.createdAt).toLocaleDateString()} - {link.createdBy}
                                        </span>
                                    </div>
                                    <div className="homepage-item-actions">
                                        <button className="btn-icon" onClick={() => handleOpenLinkModal(link)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-icon text-error" onClick={() => handleDeleteLink(link.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Announcement Modal */}
            {announcementModalOpen && (
                <div className="modal-overlay" onClick={() => setAnnouncementModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {editingAnnouncement
                                    ? (t('admin.editAnnouncement') || 'Edit Announcement')
                                    : (t('admin.addAnnouncement') || 'Add Announcement')
                                }
                            </h3>
                            <button className="btn-icon" onClick={() => setAnnouncementModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('common.title') || 'Title'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Announcement title..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('common.content') || 'Content'}</label>
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    value={announcementForm.content}
                                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Announcement content..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setAnnouncementModalOpen(false)}>
                                <X size={16} /> {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveAnnouncement}>
                                <Save size={16} /> {t('common.save') || 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Modal */}
            {linkModalOpen && (
                <div className="modal-overlay" onClick={() => setLinkModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {editingLink
                                    ? (t('admin.editLink') || 'Edit Link')
                                    : (t('admin.addLink') || 'Add Link')
                                }
                            </h3>
                            <button className="btn-icon" onClick={() => setLinkModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">{t('common.title') || 'Title'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={linkForm.title}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Link title..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label required">{t('common.url') || 'URL'}</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={linkForm.url}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('common.description') || 'Description'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={linkForm.description}
                                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setLinkModalOpen(false)}>
                                <X size={16} /> {t('common.cancel') || 'Cancel'}
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveLink}>
                                <Save size={16} /> {t('common.save') || 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
