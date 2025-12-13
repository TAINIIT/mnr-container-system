import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Droplets, AlertTriangle, Info, ArrowLeft, Save, Calendar,
    MapPin, User, Clock, Shield, CheckCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import './Washing.css';

const WashingForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // For editing existing order
    const [searchParams] = useSearchParams();
    const containerId = searchParams.get('containerId');

    const { containers, getContainer, createWashingOrder, scheduleWashingOrder, getWashingOrder } = useData();
    const { getCodeList } = useConfig();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addToast: showToast } = useToast();

    // Master data
    const CLEANING_PROGRAMS = getCodeList('CLEANING_PROGRAMS') || [];
    const CONTAMINATION_LEVELS = getCodeList('CONTAMINATION_LEVELS') || [];
    const WASH_BAYS = getCodeList('WASH_BAYS') || [];
    const WASHING_TEAMS = getCodeList('WASHING_TEAMS') || [];

    // Get container if containerId is provided
    const container = useMemo(() => {
        if (containerId) {
            return getContainer(containerId);
        }
        return null;
    }, [containerId, getContainer]);

    // Form state
    const [step, setStep] = useState(1); // 1 = Inspection, 2 = Schedule
    const [formData, setFormData] = useState({
        // Container info
        containerId: containerId || '',
        containerNumber: container?.containerNumber || '',
        containerType: container?.type || '',
        liner: container?.liner || '',

        // Initial inspection
        contaminationLevel: '',
        interiorCondition: [],
        exteriorCondition: [],
        odorPresent: false,
        pestPresent: false,
        hazardousResidues: false,
        inspectionNotes: '',

        // Program selection
        cleaningProgram: '',

        // Scheduling (step 2)
        assignedBay: '',
        assignedTeam: '',
        scheduledAt: '',
        safetyNotes: '',
        safetyRequirements: []
    });

    // Interior condition options
    const INTERIOR_CONDITIONS = [
        { id: 'dirt', label: 'Dirt/Debris' },
        { id: 'oil', label: 'Oil/Grease' },
        { id: 'chemical', label: 'Chemical Residue' },
        { id: 'odor', label: 'Odor Present' },
        { id: 'pest', label: 'Pest Signs' },
        { id: 'moisture', label: 'Moisture' }
    ];

    const EXTERIOR_CONDITIONS = [
        { id: 'dirty', label: 'Dirty' },
        { id: 'stained', label: 'Stained' },
        { id: 'graffiti', label: 'Graffiti' }
    ];

    const SAFETY_REQUIREMENTS = [
        { id: 'mask', label: t('washing.requiresMask') || 'Requires Mask' },
        { id: 'gloves', label: t('washing.requiresGloves') || 'Requires Gloves' },
        { id: 'chemical', label: t('washing.chemicalHandling') || 'Chemical Handling' },
        { id: 'ventilation', label: t('washing.ventilationRequired') || 'Ventilation Required' },
        { id: 'twoPerson', label: t('washing.twoPersonJob') || '2-Person Job' }
    ];

    // Update container info when container changes
    useEffect(() => {
        if (container) {
            setFormData(prev => ({
                ...prev,
                containerId: container.id,
                containerNumber: container.containerNumber,
                containerType: container.type,
                liner: container.liner
            }));
        }
    }, [container]);

    // Auto-suggest program based on contamination level
    const suggestedProgram = useMemo(() => {
        if (!formData.contaminationLevel) return null;
        const level = CONTAMINATION_LEVELS.find(l => l.code === formData.contaminationLevel);
        if (level?.suggestedProgram) {
            return CLEANING_PROGRAMS.find(p => p.code === level.suggestedProgram);
        }
        // For reefer containers, suggest reefer deep clean
        if (formData.containerType === 'REEFER') {
            return CLEANING_PROGRAMS.find(p => p.code === 'REEFER_DEEP');
        }
        return null;
    }, [formData.contaminationLevel, formData.containerType, CONTAMINATION_LEVELS, CLEANING_PROGRAMS]);

    // Check if current contamination level has safety alert
    const hasSafetyAlert = useMemo(() => {
        if (!formData.contaminationLevel) return false;
        const level = CONTAMINATION_LEVELS.find(l => l.code === formData.contaminationLevel);
        return level?.safetyAlert || formData.hazardousResidues;
    }, [formData.contaminationLevel, formData.hazardousResidues, CONTAMINATION_LEVELS]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Toggle array value
    const toggleArrayValue = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value]
        }));
    };

    // Apply suggested program
    const applySuggestedProgram = () => {
        if (suggestedProgram) {
            setFormData(prev => ({ ...prev, cleaningProgram: suggestedProgram.code }));
        }
    };

    // Proceed to step 2
    const proceedToSchedule = () => {
        // Validation
        if (!formData.contaminationLevel) {
            showToast('Please select contamination level', 'error');
            return;
        }
        if (!formData.cleaningProgram) {
            showToast('Please select a cleaning program', 'error');
            return;
        }
        setStep(2);
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();

        if (step === 1) {
            proceedToSchedule();
            return;
        }

        // Step 2 validation
        if (!formData.assignedBay) {
            showToast('Please select a wash bay', 'error');
            return;
        }
        if (!formData.assignedTeam) {
            showToast('Please select a team', 'error');
            return;
        }

        // Get program cost
        const program = CLEANING_PROGRAMS.find(p => p.code === formData.cleaningProgram);

        // Create washing order
        const wo = createWashingOrder({
            ...formData,
            cost: program?.defaultCost || 0
        }, user.username);

        // Schedule it immediately  
        scheduleWashingOrder(wo.id, {
            assignedBay: formData.assignedBay,
            assignedTeam: formData.assignedTeam,
            scheduledAt: formData.scheduledAt || new Date().toISOString(),
            safetyNotes: formData.safetyNotes,
            safetyRequirements: formData.safetyRequirements
        }, user.username);

        showToast(t('washing.orderCreated') || 'Washing order created', 'success');
        navigate('/washing');
    };

    // Get available bays based on container type
    const availableBays = useMemo(() => {
        return WASH_BAYS.filter(bay => {
            if (!bay.active) return false;
            // Chemical program needs chemical bay
            if (formData.cleaningProgram === 'CHEMICAL_CLEAN') {
                return bay.specialType === 'CHEMICAL' || !bay.specialType;
            }
            // Reefer needs reefer bay
            if (formData.containerType === 'REEFER' || formData.cleaningProgram === 'REEFER_DEEP') {
                return bay.specialType === 'REEFER' || !bay.specialType;
            }
            return true;
        });
    }, [WASH_BAYS, formData.cleaningProgram, formData.containerType]);

    return (
        <div className="washing-form-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        <ArrowLeft size={20} /> {t('common.back') || 'Back'}
                    </button>
                    <h1><Droplets size={24} /> {t('washing.newWashingOrder') || 'New Washing Order'}</h1>
                </div>
                <div className="step-indicator">
                    <span className={`step ${step >= 1 ? 'active' : ''}`}>1. {t('washing.initialInspection') || 'Initial Inspection'}</span>
                    <span className={`step ${step >= 2 ? 'active' : ''}`}>2. {t('washing.schedule') || 'Schedule'}</span>
                </div>
            </div>

            <form className="washing-form" onSubmit={handleSubmit}>
                {/* Container Info (readonly) */}
                <div className="form-section">
                    <h3 className="form-section-title">
                        <Info size={18} /> {t('container.title') || 'Container Info'}
                    </h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('columns.containerNumber') || 'Container Number'}</label>
                            <input type="text" value={formData.containerNumber} readOnly className="readonly" />
                        </div>
                        <div className="form-group">
                            <label>{t('columns.type') || 'Type'}</label>
                            <input type="text" value={formData.containerType} readOnly className="readonly" />
                        </div>
                        <div className="form-group">
                            <label>{t('columns.liner') || 'Liner'}</label>
                            <input type="text" value={formData.liner} readOnly className="readonly" />
                        </div>
                    </div>
                </div>

                {step === 1 && (
                    <>
                        {/* Initial Inspection */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <CheckCircle size={18} /> {t('washing.initialInspection') || 'Initial Inspection'}
                            </h3>

                            {/* Contamination Level */}
                            <div className="form-group">
                                <label>{t('washing.contaminationLevel') || 'Contamination Level'} *</label>
                                <select
                                    name="contaminationLevel"
                                    value={formData.contaminationLevel}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{t('common.pleaseSelect') || 'Please Select'}</option>
                                    {CONTAMINATION_LEVELS.filter(l => l.active !== false).map(level => (
                                        <option key={level.code} value={level.code}>
                                            {level.name} - {level.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Safety Alert */}
                            {hasSafetyAlert && (
                                <div className="safety-alert">
                                    <AlertTriangle size={24} />
                                    <div className="safety-alert-content">
                                        <h4>{t('washing.safetyWarning') || 'Safety Warning'}</h4>
                                        <p>{t('washing.hazardousWarning') || 'This container requires special safety measures. Ensure proper PPE and ventilation before cleaning.'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Interior Condition */}
                            <div className="form-group">
                                <label>{t('washing.interiorCondition') || 'Interior Condition'}</label>
                                <div className="checkbox-group">
                                    {INTERIOR_CONDITIONS.map(cond => (
                                        <label
                                            key={cond.id}
                                            className={`checkbox-item ${formData.interiorCondition.includes(cond.id) ? 'checked' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.interiorCondition.includes(cond.id)}
                                                onChange={() => toggleArrayValue('interiorCondition', cond.id)}
                                            />
                                            {cond.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Exterior Condition */}
                            <div className="form-group">
                                <label>{t('washing.exteriorCondition') || 'Exterior Condition'}</label>
                                <div className="checkbox-group">
                                    {EXTERIOR_CONDITIONS.map(cond => (
                                        <label
                                            key={cond.id}
                                            className={`checkbox-item ${formData.exteriorCondition.includes(cond.id) ? 'checked' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.exteriorCondition.includes(cond.id)}
                                                onChange={() => toggleArrayValue('exteriorCondition', cond.id)}
                                            />
                                            {cond.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Special conditions */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            name="odorPresent"
                                            checked={formData.odorPresent}
                                            onChange={handleChange}
                                        />
                                        {t('washing.odorPresent') || 'Odor Present'}
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            name="pestPresent"
                                            checked={formData.pestPresent}
                                            onChange={handleChange}
                                        />
                                        {t('washing.pestPresent') || 'Pest Signs Present'}
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            name="hazardousResidues"
                                            checked={formData.hazardousResidues}
                                            onChange={handleChange}
                                        />
                                        {t('washing.hazardousResidues') || 'Hazardous Residues'}
                                    </label>
                                </div>
                            </div>

                            {/* Inspection Notes */}
                            <div className="form-group">
                                <label>{t('washing.inspectionNotes') || 'Inspection Notes'}</label>
                                <textarea
                                    name="inspectionNotes"
                                    value={formData.inspectionNotes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder={t('washing.notesPlaceholder') || 'Describe container condition...'}
                                />
                            </div>
                        </div>

                        {/* Cleaning Program Selection */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Droplets size={18} /> {t('washing.cleaningProgram') || 'Cleaning Program'}
                            </h3>

                            {/* Suggested Program */}
                            {suggestedProgram && formData.cleaningProgram !== suggestedProgram.code && (
                                <div className="suggested-program">
                                    <Info size={18} />
                                    <span>
                                        {t('washing.suggestedProgram') || 'Suggested'}: <strong>{suggestedProgram.name}</strong>
                                    </span>
                                    <button type="button" className="btn btn-sm btn-primary" onClick={applySuggestedProgram}>
                                        {t('common.apply') || 'Apply'}
                                    </button>
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('washing.selectProgram') || 'Select Program'} *</label>
                                <select
                                    name="cleaningProgram"
                                    value={formData.cleaningProgram}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">{t('common.pleaseSelect') || 'Please Select'}</option>
                                    {CLEANING_PROGRAMS.filter(p => p.active !== false).map(prog => (
                                        <option key={prog.code} value={prog.code}>
                                            {prog.name} - {prog.description} (~{prog.estimatedMinutes} min, RM{prog.defaultCost})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        {/* Scheduling */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Calendar size={18} /> {t('washing.schedule') || 'Schedule'}
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label><MapPin size={14} /> {t('washing.assignBay') || 'Assign Bay'} *</label>
                                    <select
                                        name="assignedBay"
                                        value={formData.assignedBay}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{t('common.pleaseSelect') || 'Please Select'}</option>
                                        {availableBays.map(bay => (
                                            <option key={bay.code} value={bay.code}>
                                                {bay.name} {bay.specialType ? `(${bay.specialType})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><User size={14} /> {t('washing.assignTeam') || 'Assign Team'} *</label>
                                    <select
                                        name="assignedTeam"
                                        value={formData.assignedTeam}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{t('common.pleaseSelect') || 'Please Select'}</option>
                                        {WASHING_TEAMS.filter(t => t.active !== false).map(team => (
                                            <option key={team.code} value={team.code}>
                                                {team.name} ({team.members} members)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label><Clock size={14} /> {t('washing.scheduledAt') || 'Scheduled Time'}</label>
                                <input
                                    type="datetime-local"
                                    name="scheduledAt"
                                    value={formData.scheduledAt}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Safety Requirements */}
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <Shield size={18} /> {t('washing.safetyRequirements') || 'Safety Requirements'}
                            </h3>

                            <div className="checkbox-group">
                                {SAFETY_REQUIREMENTS.map(req => (
                                    <label
                                        key={req.id}
                                        className={`checkbox-item ${formData.safetyRequirements.includes(req.id) ? 'checked' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.safetyRequirements.includes(req.id)}
                                            onChange={() => toggleArrayValue('safetyRequirements', req.id)}
                                        />
                                        {req.label}
                                    </label>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>{t('washing.safetyNotes') || 'Safety Notes'}</label>
                                <textarea
                                    name="safetyNotes"
                                    value={formData.safetyNotes}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder={t('washing.safetyNotesPlaceholder') || 'Additional safety instructions for worker...'}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    {step === 2 && (
                        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                            <ArrowLeft size={16} /> {t('common.back') || 'Back'}
                        </button>
                    )}
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                    <button type="submit" className="btn btn-primary">
                        {step === 1 ? (
                            <>{t('common.next') || 'Next'} <Calendar size={16} /></>
                        ) : (
                            <><Save size={16} /> {t('washing.createOrder') || 'Create Order'}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WashingForm;
