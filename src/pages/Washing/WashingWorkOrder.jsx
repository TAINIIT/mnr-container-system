import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Droplets, ArrowLeft, Save, Clock, CheckCircle, XCircle,
    AlertTriangle, Camera, Play, Pause, Square
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import './Washing.css';

const WashingWorkOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { getWashingOrder, completeWashingOrder, startWashingOrder } = useData();
    const { codes } = useConfig();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addToast: showToast } = useToast();

    const washingOrder = getWashingOrder(id);

    // Get checklist for this program - CLEANING_CHECKLISTS is an object, not array
    const CLEANING_CHECKLISTS = codes?.CLEANING_CHECKLISTS || {};
    const checklist = useMemo(() => {
        if (!washingOrder?.cleaningProgram) return [];
        return CLEANING_CHECKLISTS[washingOrder.cleaningProgram] || [];
    }, [washingOrder, CLEANING_CHECKLISTS]);

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const startTime = useMemo(() => {
        if (washingOrder?.startedAt) {
            const start = new Date(washingOrder.startedAt);
            return Math.floor((Date.now() - start.getTime()) / 1000);
        }
        return 0;
    }, [washingOrder?.startedAt]);

    // Checklist state
    const [checklistResults, setChecklistResults] = useState({});
    const [workerNotes, setWorkerNotes] = useState('');
    const [damagesFound, setDamagesFound] = useState([]);

    // Initialize timer based on order status
    useEffect(() => {
        if (washingOrder?.status === 'IN_PROGRESS') {
            setIsRunning(true);
            setElapsedSeconds(startTime);
        }
    }, [washingOrder?.status, startTime]);

    // Timer effect
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Format time display
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Group checklist by category
    const checklistByCategory = useMemo(() => {
        const grouped = {};
        checklist.forEach(item => {
            const cat = item.category || 'OTHER';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });
        return grouped;
    }, [checklist]);

    // Calculate progress
    const progress = useMemo(() => {
        const total = checklist.length;
        const completed = Object.values(checklistResults).filter(r => r.checked).length;
        return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }, [checklist, checklistResults]);

    // Toggle checklist item
    const toggleChecklistItem = (itemId) => {
        setChecklistResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                checked: !prev[itemId]?.checked,
                checkedAt: new Date().toISOString(),
                checkedBy: user.username
            }
        }));
    };

    // Add note to checklist item
    const updateItemNote = (itemId, note) => {
        setChecklistResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                note
            }
        }));
    };

    // Handle start
    const handleStart = () => {
        if (washingOrder.status === 'SCHEDULED') {
            startWashingOrder(id, user.username);
            setIsRunning(true);
            showToast(t('washing.cleaningStarted') || 'Cleaning started', 'success');
        }
    };

    // Handle pause (just UI, not persisted)
    const handlePause = () => {
        setIsRunning(prev => !prev);
    };

    // Handle complete
    const handleComplete = () => {
        // Check if all required items are completed
        const requiredItems = checklist.filter(item => item.required);
        const allRequiredDone = requiredItems.every(item => checklistResults[item.id]?.checked);

        if (!allRequiredDone) {
            showToast(t('washing.completeAllRequired') || 'Please complete all required items', 'error');
            return;
        }

        setIsRunning(false);
        const elapsedMinutes = Math.ceil(elapsedSeconds / 60);

        completeWashingOrder(id, {
            checklistResults,
            workerNotes,
            damagesFound,
            elapsedMinutes
        }, user.username);

        showToast(t('washing.cleaningCompleted') || 'Cleaning completed, pending QC', 'success');
        navigate('/washing');
    };

    if (!washingOrder) {
        return (
            <div className="washing-work-page">
                <div className="empty-state">
                    <Droplets size={48} />
                    <p>{t('washing.orderNotFound') || 'Washing order not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/washing')}>
                        {t('common.back') || 'Back'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="washing-work-page">
            {/* Header */}
            <div className="work-header">
                <div className="work-header-info">
                    <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2>{washingOrder.containerNumber}</h2>
                    <span className="program-badge">{washingOrder.cleaningProgram}</span>
                </div>

                <div className="work-timer">
                    <Clock size={20} />
                    <span>{formatTime(elapsedSeconds)}</span>
                    {washingOrder.status === 'SCHEDULED' ? (
                        <button className="btn btn-success" onClick={handleStart}>
                            <Play size={16} /> {t('washing.startCleaning') || 'Start'}
                        </button>
                    ) : (
                        <button className="btn btn-ghost" onClick={handlePause}>
                            {isRunning ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
                </div>
                <span className="progress-text">
                    {progress.completed}/{progress.total} ({progress.percentage}%)
                </span>
            </div>

            {/* Safety Notes (if any) */}
            {washingOrder.safetyNotes && (
                <div className="safety-alert">
                    <AlertTriangle size={20} />
                    <div className="safety-alert-content">
                        <h4>{t('washing.safetyNotes') || 'Safety Notes'}</h4>
                        <p>{washingOrder.safetyNotes}</p>
                    </div>
                </div>
            )}

            {/* Safety Requirements */}
            {washingOrder.safetyRequirements?.length > 0 && (
                <div className="safety-requirements">
                    {washingOrder.safetyRequirements.map(req => (
                        <span key={req} className="safety-badge">{req}</span>
                    ))}
                </div>
            )}

            {/* Checklist */}
            <div className="checklist-section">
                <h3><CheckCircle size={18} /> {t('washing.cleaningChecklist') || 'Cleaning Checklist'}</h3>

                {Object.entries(checklistByCategory).map(([category, items]) => (
                    <div key={category} className="checklist-category">
                        <h4>{category}</h4>
                        {items.map(item => {
                            const result = checklistResults[item.id] || {};
                            return (
                                <div
                                    key={item.id}
                                    className={`checklist-item ${result.checked ? 'completed' : ''}`}
                                    onClick={() => toggleChecklistItem(item.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={result.checked || false}
                                        onChange={() => { }}
                                    />
                                    <span className="checklist-item-label">
                                        {item.label}
                                        {item.required && <span className="required-star">*</span>}
                                    </span>
                                    <div className="checklist-item-notes" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            placeholder={t('common.notes') || 'Notes'}
                                            value={result.note || ''}
                                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Worker Notes */}
            <div className="form-section">
                <h3>{t('washing.workerNotes') || 'Worker Notes'}</h3>
                <textarea
                    value={workerNotes}
                    onChange={(e) => setWorkerNotes(e.target.value)}
                    rows={3}
                    placeholder={t('washing.notesPlaceholder') || 'Any observations or issues...'}
                />
            </div>

            {/* Actions */}
            <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                    {t('common.cancel') || 'Cancel'}
                </button>
                <button
                    className="btn btn-success"
                    onClick={handleComplete}
                    disabled={washingOrder.status !== 'IN_PROGRESS'}
                >
                    <CheckCircle size={16} /> {t('washing.completeCleaning') || 'Complete & Submit for QC'}
                </button>
            </div>
        </div>
    );
};

export default WashingWorkOrder;
