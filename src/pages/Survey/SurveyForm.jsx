import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, FileText, Camera, Image, X } from 'lucide-react';
import { SURVEY_TYPES, SURVEY_TYPE_LABELS } from '../../config/constants';
import ContainerVisualSelector from '../../components/ContainerVisualSelector';

export default function SurveyForm() {
    const { id, containerId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getContainer, getSurvey, getSurveysByContainer, createSurvey, updateSurvey, completeSurvey, eors } = useData();
    const { getCodeList } = useConfig();
    const toast = useToast();

    // Access control: External users cannot create EORs
    const isExternal = user?.userType === 'EXTERNAL';

    // Get dynamic codes from configuration
    const LOCATION_CODES = getCodeList('DAMAGE_LOCATIONS');
    const DAMAGE_CODES = getCodeList('DAMAGE_TYPES');
    const COMPONENT_CODES = getCodeList('COMPONENTS');
    const SEVERITY_LEVELS = getCodeList('SEVERITY_LEVELS');
    const REPAIR_CODES = getCodeList('REPAIR_METHODS');
    const INITIAL_CONDITIONS = getCodeList('INITIAL_CONDITIONS');

    const isEdit = !!id && id !== 'new';
    const existingSurvey = isEdit ? getSurvey(id) : null;
    const container = containerId ? getContainer(containerId) :
        (existingSurvey ? getContainer(existingSurvey.containerId) : null);

    const [formData, setFormData] = useState({
        surveyType: '',
        initialCondition: '',
        notes: '',
        damageItems: [],
        images: [] // Array of {id, dataUrl, name, capturedAt}
    });
    const [isLoading, setIsLoading] = useState(false);

    // Camera modal state
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);

    // File input refs
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (existingSurvey) {
            setFormData({
                surveyType: existingSurvey.surveyType || '',
                initialCondition: existingSurvey.initialCondition || '',
                notes: existingSurvey.notes || '',
                damageItems: existingSurvey.damageItems || [],
                images: existingSurvey.images || []
            });
        }
    }, [existingSurvey]);

    if (!container) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Container not found</h3>
                    <Link to="/surveys/search" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Search Containers
                    </Link>
                </div>
            </div>
        );
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Auto-add first damage item when condition is DAMAGED and no items exist
            if (field === 'initialCondition' && value === 'DAMAGED' && prev.damageItems.length === 0) {
                newData.damageItems = [{
                    id: `d${Date.now()}`,
                    location: '',
                    damageType: '',
                    component: '',
                    severity: 'M',
                    size: '',
                    quantity: 1,
                    repairMethod: '',
                    estimatedCost: 0
                }];
            }

            return newData;
        });
    };

    const addDamageItem = () => {
        const newItem = {
            id: `d${Date.now()}`,
            location: '',
            damageType: '',
            component: '',
            severity: 'M',
            size: '',
            quantity: 1,
            repairMethod: '',
            estimatedCost: 0
        };
        setFormData(prev => ({
            ...prev,
            damageItems: [...prev.damageItems, newItem]
        }));
    };

    const updateDamageItem = (index, field, value) => {
        setFormData(prev => {
            const items = [...prev.damageItems];
            items[index] = { ...items[index], [field]: value };

            // Track manual cost override
            if (field === 'estimatedCost') {
                items[index].isManualCost = true;
            }

            // Auto-calculate estimated cost (only if not manually set)
            if (['component', 'quantity', 'severity'].includes(field) && !items[index].isManualCost) {
                const comp = COMPONENT_CODES.find(c => c.code === items[index].component);
                const sev = SEVERITY_LEVELS.find(s => s.code === items[index].severity);
                if (comp && sev) {
                    const cost = Math.round((comp.unitPrice || 0) * (items[index].quantity || 1) * (sev.multiplier || 1));
                    items[index].estimatedCost = isNaN(cost) ? 0 : cost;
                }
            }

            return { ...prev, damageItems: items };
        });
    };

    const removeDamageItem = (index) => {
        setFormData(prev => ({
            ...prev,
            damageItems: prev.damageItems.filter((_, i) => i !== index)
        }));
    };

    // Image handling functions
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select only image files');
                return;
            }

            // Max 5MB per image
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const newImage = {
                    id: `img${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    dataUrl: e.target.result,
                    name: file.name,
                    capturedAt: new Date().toISOString(),
                    type: 'upload'
                };
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, newImage]
                }));
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        event.target.value = '';
    };

    // Open camera using Web Camera API
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setCameraStream(stream);
            setShowCameraModal(true);

            // Wait for modal to render, then attach stream to video
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (error) {
            console.error('Camera error:', error);
            if (error.name === 'NotAllowedError') {
                toast.error('Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.');
            } else if (error.name === 'NotFoundError') {
                toast.error('Không tìm thấy camera. Vui lòng kiểm tra camera của bạn.');
            } else {
                toast.error('Không thể mở camera: ' + error.message);
            }
        }
    };

    // Capture photo from video stream
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        const newImage = {
            id: `img${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: dataUrl,
            name: `Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`,
            capturedAt: new Date().toISOString(),
            type: 'camera'
        };

        setFormData(prev => ({
            ...prev,
            images: [...prev.images, newImage]
        }));

        toast.success('Đã chụp ảnh!');
    };

    // Close camera and cleanup
    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCameraModal(false);
    };

    const removeImage = (imageId) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img.id !== imageId)
        }));
        toast.info('Image removed');
    };

    const handleSave = async (complete = false) => {
        setIsLoading(true);

        try {
            // Validation
            if (!formData.surveyType) {
                toast.error('Survey type is required');
                setIsLoading(false);
                return;
            }
            if (!formData.initialCondition) {
                toast.error('Initial condition is required');
                setIsLoading(false);
                return;
            }
            if (formData.initialCondition === 'DAMAGED' && formData.damageItems.length === 0) {
                toast.error('At least one damage item is required when condition is "Damaged"');
                setIsLoading(false);
                return;
            }

            if (isEdit) {
                // Editing existing survey
                updateSurvey(id, formData, user.username);

                if (complete) {
                    const result = completeSurvey(id, user.username);
                    if (!result.success) {
                        toast.error(result.error);
                        setIsLoading(false);
                        return;
                    }
                    toast.success('Survey completed successfully!');
                } else {
                    toast.success('Survey updated!');
                }
            } else {
                // Creating new survey
                if (complete) {
                    // Create survey with COMPLETED status directly to avoid async state issues
                    const surveyData = {
                        ...formData,
                        containerId: container.id,
                        containerNumber: container.containerNumber,
                        sequence: container.sequence,
                        liner: container.liner,
                        status: 'COMPLETED',
                        completedBy: user.username,
                        completedAt: new Date().toISOString()
                    };
                    createSurvey(surveyData, user.username);
                    // Update container's lastSurveyId will be handled when we get the ID
                    toast.success('Survey completed successfully!');
                } else {
                    // Create as draft
                    createSurvey({
                        ...formData,
                        containerId: container.id,
                        containerNumber: container.containerNumber,
                        sequence: container.sequence,
                        liner: container.liner
                    }, user.username);
                    toast.success('Survey saved as draft!');
                }
            }

            navigate('/surveys');
        } catch (error) {
            toast.error('Failed to save survey');
        } finally {
            setIsLoading(false);
        }
    };

    const isCompleted = existingSurvey?.status === 'COMPLETED';
    const canEdit = !isCompleted || existingSurvey?.status === 'DRAFT';

    return (
        <div className="page">
            <div className="page-header">
                <Link to="/surveys" className="btn btn-ghost">
                    <ArrowLeft size={16} /> Back
                </Link>
                <div className="flex gap-3">
                    {canEdit && (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleSave(false)}
                                disabled={isLoading}
                            >
                                <Save size={16} /> Save Draft
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSave(true)}
                                disabled={isLoading}
                            >
                                <CheckCircle size={16} /> Complete Survey
                            </button>
                        </>
                    )}
                    {/* Only internal users can create EORs, and only if no EOR exists yet */}
                    {!isExternal && isCompleted && existingSurvey && (
                        (() => {
                            const existingEOR = eors.find(e => e.surveyId === existingSurvey.id || e.containerId === existingSurvey.containerId);
                            if (existingEOR) {
                                return (
                                    <span className="badge badge-completed" style={{ padding: '8px 16px', fontSize: '13px' }}>
                                        EOR: {existingEOR.status}
                                    </span>
                                );
                            }
                            return (
                                <Link to={`/eor/new/${existingSurvey.id}`} className="btn btn-primary">
                                    <FileText size={16} /> Create EOR
                                </Link>
                            );
                        })()
                    )}
                </div>
            </div>

            {/* Container Info */}
            <div className="card">
                <div className="grid grid-cols-4">
                    <div>
                        <label className="form-label">Container</label>
                        <p className="container-number" style={{ margin: 0, fontSize: '1.2rem' }}>
                            {container.containerNumber}
                        </p>
                    </div>
                    <div>
                        <label className="form-label">Size/Type</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.size}</p>
                    </div>
                    <div>
                        <label className="form-label">Liner</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.liner}</p>
                    </div>
                    <div>
                        <label className="form-label">Sequence</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.sequence}</p>
                    </div>
                </div>
            </div>

            {/* Survey Details */}
            <div className="card mt-4">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Survey Details</h3>

                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="form-label required">Survey Type</label>
                        <select
                            className="form-input"
                            value={formData.surveyType}
                            onChange={(e) => handleInputChange('surveyType', e.target.value)}
                            disabled={!canEdit}
                        >
                            <option value="">Select type...</option>
                            {Object.entries(SURVEY_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label required">Initial Condition</label>
                        <select
                            className="form-input"
                            value={formData.initialCondition}
                            onChange={(e) => handleInputChange('initialCondition', e.target.value)}
                            disabled={!canEdit}
                        >
                            <option value="">Select condition...</option>
                            {INITIAL_CONDITIONS.map(cond => (
                                <option key={cond.code} value={cond.code}>{cond.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Enter survey notes..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        disabled={!canEdit}
                    />
                </div>
            </div>

            {/* Photo Documentation Section */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <Camera size={20} /> Photo Documentation ({formData.images.length})
                    </h3>
                    {canEdit && (
                        <div className="flex gap-2">
                            {/* Camera button - Opens camera modal */}
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={openCamera}
                            >
                                <Camera size={16} /> Chụp Ảnh
                            </button>
                            {/* Upload button */}
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Image size={16} /> Upload
                            </button>
                        </div>
                    )}
                </div>

                {/* Hidden file input for upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                />

                {/* Hidden canvas for capturing photo */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Image Gallery */}
                {formData.images.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                        <Camera size={40} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: 'var(--space-2)' }}>
                            No photos yet. Take photos or upload images to document the container condition.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-4)'
                    }}>
                        {formData.images.map(img => (
                            <div
                                key={img.id}
                                style={{
                                    position: 'relative',
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-tertiary)'
                                }}
                            >
                                <img
                                    src={img.dataUrl}
                                    alt={img.name}
                                    style={{
                                        width: '100%',
                                        height: '120px',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                                <div style={{
                                    padding: 'var(--space-2)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <div style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {img.name}
                                    </div>
                                    <div style={{ marginTop: '2px' }}>
                                        {new Date(img.capturedAt).toLocaleString()}
                                    </div>
                                </div>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(0,0,0,0.6)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: 'white'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Damage Items */}
            {formData.initialCondition === 'DAMAGED' && (
                <div className="card mt-4">
                    <div className="card-header">
                        <h3 className="card-title">Damage Items ({formData.damageItems.length})</h3>
                        {canEdit && (
                            <button className="btn btn-secondary" onClick={addDamageItem}>
                                <Plus size={16} /> Add Item
                            </button>
                        )}
                    </div>

                    {formData.damageItems.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                            <p>No damage items added yet. Click "Add Item" to record damage.</p>
                        </div>
                    ) : (
                        <div className="damage-items">
                            {formData.damageItems.map((item, index) => (
                                <div key={item.id} className="damage-item">
                                    <div className="damage-item-header">
                                        <span className="damage-item-number">Item #{index + 1}</span>
                                        {canEdit && (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => removeDamageItem(index)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4" style={{ gap: 'var(--space-3)' }}>
                                        <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                                            <label className="form-label">Location</label>
                                            <ContainerVisualSelector
                                                value={item.location}
                                                onChange={(value) => updateDamageItem(index, 'location', value)}
                                                locationCodes={LOCATION_CODES}
                                                disabled={!canEdit}
                                                damageHistory={(() => {
                                                    // Calculate damage history from previous surveys
                                                    if (!container) return {};
                                                    const previousSurveys = getSurveysByContainer(container.id)
                                                        .filter(s => s.id !== id && s.status === 'COMPLETED');
                                                    const history = {};
                                                    previousSurveys.forEach(survey => {
                                                        (survey.damageItems || []).forEach(damage => {
                                                            if (damage.location) {
                                                                history[damage.location] = (history[damage.location] || 0) + 1;
                                                            }
                                                        });
                                                    });
                                                    return history;
                                                })()}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Damage Type</label>
                                            <select
                                                className="form-input"
                                                value={item.damageType}
                                                onChange={(e) => updateDamageItem(index, 'damageType', e.target.value)}
                                                disabled={!canEdit}
                                            >
                                                <option value="">Select...</option>
                                                {DAMAGE_CODES.map(d => (
                                                    <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Component</label>
                                            <select
                                                className="form-input"
                                                value={item.component}
                                                onChange={(e) => updateDamageItem(index, 'component', e.target.value)}
                                                disabled={!canEdit}
                                            >
                                                <option value="">Select...</option>
                                                {COMPONENT_CODES.map(c => (
                                                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Severity</label>
                                            <select
                                                className="form-input"
                                                value={item.severity}
                                                onChange={(e) => updateDamageItem(index, 'severity', e.target.value)}
                                                disabled={!canEdit}
                                            >
                                                {SEVERITY_LEVELS.map(s => (
                                                    <option key={s.code} value={s.code}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Size (cm)</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={item.size}
                                                onChange={(e) => updateDamageItem(index, 'size', e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Quantity</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateDamageItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Repair Method</label>
                                            <select
                                                className="form-input"
                                                value={item.repairMethod}
                                                onChange={(e) => updateDamageItem(index, 'repairMethod', e.target.value)}
                                                disabled={!canEdit}
                                            >
                                                <option value="">Select...</option>
                                                {REPAIR_CODES.map(r => (
                                                    <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">
                                                Est. Cost (RM)
                                                {item.isManualCost && <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '10px' }}>Manual</span>}
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={item.estimatedCost}
                                                onChange={(e) => updateDamageItem(index, 'estimatedCost', parseFloat(e.target.value) || 0)}
                                                disabled={!canEdit}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {formData.damageItems.length > 0 && (
                        <div className="damage-total">
                            <span>Total Estimated Cost:</span>
                            <span className="damage-total-value">
                                RM {formData.damageItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div style={{
                        background: '#000',
                        borderRadius: 'var(--radius-xl)',
                        overflow: 'hidden',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Camera Header */}
                        <div style={{
                            padding: 'var(--space-3) var(--space-4)',
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'white'
                        }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                                📷 Chụp Ảnh Container
                            </h3>
                            <button
                                type="button"
                                onClick={closeCamera}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Video Preview */}
                        <div style={{
                            position: 'relative',
                            background: '#000',
                            minHeight: '300px'
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    maxHeight: '60vh',
                                    objectFit: 'contain'
                                }}
                            />

                            {/* Viewfinder overlay */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '80%',
                                height: '80%',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: 'var(--radius-lg)',
                                pointerEvents: 'none'
                            }} />
                        </div>

                        {/* Camera Controls */}
                        <div style={{
                            padding: 'var(--space-4)',
                            background: 'rgba(0,0,0,0.8)',
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 'var(--space-4)'
                        }}>
                            <button
                                type="button"
                                onClick={capturePhoto}
                                style={{
                                    background: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '70px',
                                    height: '70px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 0 4px rgba(255,255,255,0.3)',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Camera size={32} color="#000" />
                            </button>
                        </div>

                        {/* Photo count indicator */}
                        <div style={{
                            padding: 'var(--space-2)',
                            background: 'rgba(0,0,0,0.6)',
                            textAlign: 'center',
                            color: 'white',
                            fontSize: 'var(--font-size-sm)'
                        }}>
                            Đã chụp: {formData.images.filter(img => img.type === 'camera').length} ảnh
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
