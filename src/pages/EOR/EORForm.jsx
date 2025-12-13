import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft, Plus, Trash2, Save, Edit3 } from 'lucide-react';
import { CONFIG } from '../../config/constants';

export default function EORForm() {
    const { id, surveyId: surveyIdParam } = useParams();
    const [searchParams] = useSearchParams();
    const containerId = searchParams.get('containerId');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getSurvey, getEOR, getContainer, createEOR, updateEOR, surveys } = useData();
    const { getCodeList, getSetting } = useConfig();
    const toast = useToast();

    // ACCESS CONTROL: External users cannot create or edit EORs
    const isExternal = user?.userType === 'EXTERNAL';
    if (isExternal) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Access Denied</h3>
                    <p className="text-muted">
                        External users cannot create or edit EORs. You can view and approve/reject EORs from the EOR List.
                    </p>
                    <Link to="/eor" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to EOR List
                    </Link>
                </div>
            </div>
        );
    }

    // Get dynamic codes from configuration
    const LOCATION_CODES = getCodeList('DAMAGE_LOCATIONS');
    const DAMAGE_CODES = getCodeList('DAMAGE_TYPES');
    const COMPONENT_CODES = getCodeList('COMPONENTS');
    const REPAIR_CODES = getCodeList('REPAIR_METHODS');

    const isEdit = !!id && id !== 'new';
    const existingEOR = isEdit ? getEOR(id) : null;

    // Use useMemo to find survey - re-evaluates when surveys array changes
    const survey = useMemo(() => {
        // First try by surveyId param
        if (surveyIdParam) {
            return getSurvey(surveyIdParam);
        }
        // Then try from existing EOR
        if (existingEOR) {
            return getSurvey(existingEOR.surveyId);
        }
        // Finally try by containerId from query params - read from localStorage directly for freshest data
        if (containerId) {
            try {
                const storedSurveys = JSON.parse(localStorage.getItem('mnr_surveys') || '[]');
                return storedSurveys.find(s => s.containerId === containerId && s.status === 'COMPLETED');
            } catch {
                return null;
            }
        }
        return null;
    }, [surveyIdParam, existingEOR, containerId, getSurvey]);

    const container = survey ? getContainer(survey.containerId) : null;

    const [repairItems, setRepairItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState(0); // Optional discount/markup

    useEffect(() => {
        if (existingEOR) {
            setRepairItems(existingEOR.repairItems || []);
            setNotes(existingEOR.notes || '');
            setDiscount(existingEOR.discount || 0);
        } else if (survey && survey.damageItems) {
            // Pre-populate from survey damage items - USE SURVEY's estimatedCost!
            const items = survey.damageItems.map((d, i) => ({
                id: `r${Date.now()}-${i}`,
                location: d.location,
                damageType: d.damageType,
                repairCode: d.repairMethod,
                component: d.component,
                // Use survey's estimated cost as the base cost!
                baseCost: d.estimatedCost || 0,
                quantity: d.quantity || 1,
                severity: d.severity || 'M',
                size: d.size || '',
                // Line total starts with survey's estimated cost
                lineTotal: d.estimatedCost || 0,
                isManuallyAdjusted: false
            }));
            setRepairItems(items);
        }
    }, [existingEOR, survey]);

    if (!survey || !container) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Survey not found</h3>
                    <p className="text-muted">
                        {containerId
                            ? "No completed survey found for this container. Please complete a survey first."
                            : "Please select a completed survey to create an EOR."
                        }
                    </p>
                    <Link to="/surveys" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to Surveys
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate totals
    const subtotal = repairItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const totalCost = Math.max(0, subtotal - discount);
    const autoApprovalThreshold = getSetting('autoApprovalThreshold');
    const needsApproval = totalCost > autoApprovalThreshold;

    // Calculate survey's original total for comparison
    const surveyTotal = survey.damageItems?.reduce((sum, item) => sum + (item.estimatedCost || 0), 0) || 0;

    const addRepairItem = () => {
        setRepairItems(prev => [...prev, {
            id: `r${Date.now()}`,
            location: '',
            damageType: '',
            repairCode: '',
            component: '',
            baseCost: 0,
            quantity: 1,
            lineTotal: 0,
            isManuallyAdjusted: false
        }]);
    };

    const updateRepairItem = (index, field, value) => {
        setRepairItems(prev => {
            const items = [...prev];
            items[index] = { ...items[index], [field]: value };

            // If directly editing lineTotal, mark as manually adjusted
            if (field === 'lineTotal') {
                items[index].isManuallyAdjusted = true;
            }

            // Auto-calculate lineTotal if not manually adjusted
            if (!items[index].isManuallyAdjusted && ['baseCost', 'quantity'].includes(field)) {
                items[index].lineTotal = Math.round((items[index].baseCost || 0) * (items[index].quantity || 1));
            }

            // If component changes but not manually adjusted, update base cost from master data
            if (field === 'component' && !items[index].isManuallyAdjusted) {
                const comp = COMPONENT_CODES.find(c => c.code === value);
                if (comp) {
                    items[index].baseCost = comp.unitPrice || 0;
                    items[index].lineTotal = Math.round((comp.unitPrice || 0) * (items[index].quantity || 1));
                }
            }

            return items;
        });
    };

    const resetToAutoCalc = (index) => {
        setRepairItems(prev => {
            const items = [...prev];
            items[index].isManuallyAdjusted = false;
            items[index].lineTotal = Math.round((items[index].baseCost || 0) * (items[index].quantity || 1));
            return items;
        });
    };

    const removeRepairItem = (index) => {
        setRepairItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (repairItems.length === 0) {
            toast.error('At least one repair item is required');
            return;
        }

        if (isEdit) {
            updateEOR(id, { repairItems, notes, discount }, user.username);
            toast.success('EOR updated successfully!');
        } else {
            const eor = createEOR({
                surveyId: survey.id,
                containerId: container.id,
                containerNumber: container.containerNumber,
                sequence: container.sequence,
                liner: container.liner,
                repairItems,
                notes,
                discount,
                surveyTotal // Store original survey total for reference
            }, user.username);

            if (eor.autoApproved) {
                toast.success(`EOR created and auto-approved! (Total RM ${eor.totalCost} ≤ ${autoApprovalThreshold})`);
            } else {
                toast.success('EOR created! Approval required.');
            }
        }

        navigate('/eor');
    };

    return (
        <div className="page">
            <div className="page-header">
                <Link to="/eor" className="btn btn-ghost">
                    <ArrowLeft size={16} /> Back
                </Link>
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={16} /> {isEdit ? 'Update EOR' : 'Create EOR'}
                </button>
            </div>

            {/* Container & Survey Info */}
            <div className="card">
                <div className="grid grid-cols-4">
                    <div>
                        <label className="form-label">Container</label>
                        <p className="container-number" style={{ margin: 0, fontSize: '1.1rem' }}>{container.containerNumber}</p>
                    </div>
                    <div>
                        <label className="form-label">Liner</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.liner}</p>
                    </div>
                    <div>
                        <label className="form-label">Survey Estimate</label>
                        <p style={{ margin: 0, fontWeight: 500, color: 'var(--info-500)' }}>RM {surveyTotal}</p>
                    </div>
                    <div>
                        <label className="form-label">Approval Status</label>
                        <p style={{ margin: 0 }}>
                            {needsApproval ? (
                                <span className="badge badge-ar">Required (&gt; {autoApprovalThreshold} RM)</span>
                            ) : (
                                <span className="badge badge-av">Auto-Approved</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Repair Items */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">Repair Items ({repairItems.length})</h3>
                    <button className="btn btn-secondary" onClick={addRepairItem}>
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {repairItems.map((item, index) => (
                    <div key={item.id} className="repair-item">
                        <div className="repair-item-header">
                            <span>
                                Item #{index + 1}
                                {item.isManuallyAdjusted && (
                                    <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '10px' }}>Adjusted</span>
                                )}
                            </span>
                            <div className="flex gap-2">
                                {item.isManuallyAdjusted && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => resetToAutoCalc(index)}
                                        title="Reset to auto-calculation"
                                    >
                                        Reset
                                    </button>
                                )}
                                <button className="btn btn-ghost btn-sm" onClick={() => removeRepairItem(index)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4" style={{ gap: 'var(--space-3)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Location</label>
                                <select className="form-input" value={item.location} onChange={(e) => updateRepairItem(index, 'location', e.target.value)}>
                                    <option value="">Select...</option>
                                    {LOCATION_CODES.map(l => <option key={l.code} value={l.code}>{l.code} - {l.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Damage</label>
                                <select className="form-input" value={item.damageType} onChange={(e) => updateRepairItem(index, 'damageType', e.target.value)}>
                                    <option value="">Select...</option>
                                    {DAMAGE_CODES.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Repair Code</label>
                                <select className="form-input" value={item.repairCode} onChange={(e) => updateRepairItem(index, 'repairCode', e.target.value)}>
                                    <option value="">Select...</option>
                                    {REPAIR_CODES.map(r => <option key={r.code} value={r.code}>{r.code} - {r.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Component</label>
                                <select className="form-input" value={item.component} onChange={(e) => updateRepairItem(index, 'component', e.target.value)}>
                                    <option value="">Select...</option>
                                    {COMPONENT_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Base Cost (RM)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={item.baseCost}
                                    onChange={(e) => updateRepairItem(index, 'baseCost', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Quantity</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateRepairItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Size</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={item.size || ''}
                                    onChange={(e) => updateRepairItem(index, 'size', e.target.value)}
                                    placeholder="e.g. 10x20cm"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">
                                    Line Total (RM)
                                    <Edit3 size={12} style={{ marginLeft: '4px', opacity: 0.6 }} title="Editable - adjust price as needed" />
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={item.lineTotal}
                                    onChange={(e) => updateRepairItem(index, 'lineTotal', parseFloat(e.target.value) || 0)}
                                    style={{ fontWeight: 600, borderColor: item.isManuallyAdjusted ? 'var(--warning-500)' : undefined }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* EOR Totals */}
                <div className="eor-summary" style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <span>Subtotal:</span>
                        <span style={{ fontWeight: 500 }}>RM {subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <label className="form-label" style={{ margin: 0 }}>Discount/Adjustment (RM):</label>
                        <input
                            type="number"
                            className="form-input"
                            style={{ width: '120px', textAlign: 'right' }}
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>
                    <div className="eor-total" style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '2px solid var(--border-color)' }}>
                        <span>Total Cost:</span>
                        <span className="eor-total-value">RM {totalCost}</span>
                    </div>
                    {surveyTotal !== subtotal && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                            Original Survey Estimate: RM {surveyTotal}
                            {subtotal > surveyTotal ? ` (+${subtotal - surveyTotal})` : ` (${subtotal - surveyTotal})`}
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div className="card mt-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes (for liner negotiation, price adjustments, etc.)</label>
                    <textarea
                        className="form-input"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about price adjustments, negotiation with liner, etc..."
                    />
                </div>
            </div>
        </div>
    );
}
