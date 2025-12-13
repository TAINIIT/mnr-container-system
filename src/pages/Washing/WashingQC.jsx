import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Droplets, ArrowLeft, CheckCircle, XCircle, AlertTriangle,
    Eye, ClipboardCheck, RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import './Washing.css';

const WashingQC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { getWashingOrder, qcWashingOrder } = useData();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addToast: showToast } = useToast();

    const washingOrder = getWashingOrder(id);

    // QC Checklist
    const QC_CHECKLIST = [
        { id: 'floor_clean', label: 'Floor is clean and free of debris', required: true },
        { id: 'walls_clean', label: 'Walls and ceiling are clean', required: true },
        { id: 'no_odor', label: 'No unpleasant odors', required: true },
        { id: 'no_stains', label: 'No visible stains or residue', required: true },
        { id: 'doors_clean', label: 'Door seals and gaskets clean', required: true },
        { id: 'exterior_clean', label: 'Exterior is clean', required: false },
        { id: 'dry', label: 'Interior is completely dry', required: true },
        { id: 'ready_for_cargo', label: 'Ready for cargo loading', required: true }
    ];

    // State
    const [qcResults, setQcResults] = useState({});
    const [qcNotes, setQcNotes] = useState('');
    const [reworkReasons, setReworkReasons] = useState([]);

    // Common rework reasons
    const REWORK_REASONS = [
        'Floor not clean',
        'Walls/ceiling not clean',
        'Odor present',
        'Stains remaining',
        'Not dry enough',
        'Chemical residue detected',
        'Incomplete cleaning'
    ];

    // Toggle QC item
    const toggleQCItem = (itemId) => {
        setQcResults(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                passed: !prev[itemId]?.passed
            }
        }));
    };

    // Calculate if all required items passed
    const allRequiredPassed = useMemo(() => {
        return QC_CHECKLIST.filter(item => item.required).every(item => qcResults[item.id]?.passed);
    }, [qcResults]);

    // Toggle rework reason
    const toggleReworkReason = (reason) => {
        setReworkReasons(prev =>
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    // Handle Pass
    const handlePass = () => {
        if (!allRequiredPassed) {
            showToast(t('washing.allRequiredMustPass') || 'All required items must pass', 'error');
            return;
        }

        qcWashingOrder(id, {
            result: 'PASS',
            notes: qcNotes,
            checklistResults: qcResults
        }, user.username);

        showToast(t('washing.qcPassed') || 'QC Passed! Certificate generated.', 'success');
        navigate(`/washing/certificate/${id}`);
    };

    // Handle Fail
    const handleFail = () => {
        if (reworkReasons.length === 0) {
            showToast(t('washing.selectReworkReasons') || 'Please select at least one rework reason', 'error');
            return;
        }

        qcWashingOrder(id, {
            result: 'FAIL',
            notes: qcNotes,
            checklistResults: qcResults,
            reworkReasons
        }, user.username);

        showToast(t('washing.qcFailed') || 'QC Failed. Order sent for rework.', 'warning');
        navigate('/washing');
    };

    if (!washingOrder) {
        return (
            <div className="washing-qc-page">
                <div className="empty-state">
                    <Droplets size={48} />
                    <p>{t('washing.orderNotFound') || 'Washing order not found'}</p>
                </div>
            </div>
        );
    }

    // Check worker's checklist results
    const workerChecklist = washingOrder.checklistResults || {};
    const workerNotes = washingOrder.workerNotes || '';

    return (
        <div className="washing-qc-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        <ArrowLeft size={20} /> {t('common.back') || 'Back'}
                    </button>
                    <h1><Eye size={24} /> {t('washing.qcInspection') || 'QC Inspection'}</h1>
                </div>
            </div>

            <div className="washing-form">
                {/* Container Info */}
                <div className="form-section">
                    <div className="form-row three-col">
                        <div className="form-group">
                            <label>{t('columns.containerNumber') || 'Container'}</label>
                            <input type="text" value={washingOrder.containerNumber} readOnly className="readonly" />
                        </div>
                        <div className="form-group">
                            <label>{t('washing.cleaningProgram') || 'Program'}</label>
                            <input type="text" value={washingOrder.cleaningProgram} readOnly className="readonly" />
                        </div>
                        <div className="form-group">
                            <label>{t('washing.elapsedTime') || 'Time'}</label>
                            <input type="text" value={`${washingOrder.elapsedMinutes || 0} min`} readOnly className="readonly" />
                        </div>
                    </div>

                    {/* Rework count warning */}
                    {washingOrder.reworkCount > 0 && (
                        <div className="safety-alert">
                            <RefreshCw size={20} />
                            <div className="safety-alert-content">
                                <h4>{t('washing.reworkAttempt') || 'Rework Attempt'} #{washingOrder.reworkCount + 1}</h4>
                                <p>{t('washing.previousReworkReasons') || 'Previous issues'}: {washingOrder.reworkReasons?.join(', ')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Worker Notes (if any) */}
                {workerNotes && (
                    <div className="form-section">
                        <h3>{t('washing.workerNotes') || 'Worker Notes'}</h3>
                        <div className="worker-notes-display">
                            <p>{workerNotes}</p>
                        </div>
                    </div>
                )}

                {/* QC Checklist */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <ClipboardCheck size={18} /> {t('washing.qcChecklist') || 'QC Checklist'}
                    </h3>

                    <div className="qc-checklist">
                        {QC_CHECKLIST.map(item => {
                            const result = qcResults[item.id] || {};
                            return (
                                <div
                                    key={item.id}
                                    className={`qc-item ${result.passed ? 'passed' : result.passed === false ? 'failed' : ''}`}
                                >
                                    <span className="qc-item-label">
                                        {item.label}
                                        {item.required && <span className="required-star">*</span>}
                                    </span>
                                    <div className="qc-item-actions">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${result.passed ? 'btn-success' : 'btn-ghost'}`}
                                            onClick={() => toggleQCItem(item.id)}
                                        >
                                            <CheckCircle size={16} /> {t('washing.pass') || 'Pass'}
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${result.passed === false ? 'btn-danger' : 'btn-ghost'}`}
                                            onClick={() => setQcResults(prev => ({
                                                ...prev,
                                                [item.id]: { passed: false }
                                            }))}
                                        >
                                            <XCircle size={16} /> {t('washing.fail') || 'Fail'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rework Reasons (if any items failed) */}
                {!allRequiredPassed && (
                    <div className="form-section">
                        <h3 className="form-section-title">
                            <AlertTriangle size={18} /> {t('washing.reworkReasons') || 'Rework Reasons'}
                        </h3>
                        <div className="checkbox-group">
                            {REWORK_REASONS.map(reason => (
                                <label
                                    key={reason}
                                    className={`checkbox-item ${reworkReasons.includes(reason) ? 'checked' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={reworkReasons.includes(reason)}
                                        onChange={() => toggleReworkReason(reason)}
                                    />
                                    {reason}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* QC Notes */}
                <div className="form-section">
                    <h3>{t('washing.qcNotes') || 'QC Notes'}</h3>
                    <textarea
                        value={qcNotes}
                        onChange={(e) => setQcNotes(e.target.value)}
                        rows={6}
                        style={{ minHeight: '150px', width: '100%', resize: 'vertical' }}
                        placeholder={t('washing.qcNotesPlaceholder') || 'Inspection observations...'}
                    />
                </div>

                {/* Actions */}
                <div className="form-actions">
                    <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={handleFail}
                        disabled={allRequiredPassed}
                    >
                        <XCircle size={16} /> {t('washing.failAndRework') || 'Fail & Rework'}
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handlePass}
                        disabled={!allRequiredPassed}
                    >
                        <CheckCircle size={16} /> {t('washing.passAndCertify') || 'Pass & Generate Certificate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WashingQC;
