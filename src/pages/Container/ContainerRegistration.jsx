import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../../components/common/Toast';
import {
    Plus, Upload, Download, Container as ContainerIcon,
    FileSpreadsheet, Check, X, AlertTriangle, Droplets, ClipboardCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './ContainerRegistration.css';

// Container number validation (4 letters + 7 digits)
const validateContainerNumber = (num) => {
    const pattern = /^[A-Z]{4}[0-9]{7}$/;
    return pattern.test(num?.toUpperCase());
};

export default function ContainerRegistration() {
    const navigate = useNavigate();
    const { registerContainer, containers } = useData();
    const { user } = useAuth();
    const { getCodeList } = useConfig();
    const toast = useToast();

    // Get dynamic codes from configuration
    const LINERS = getCodeList('LINERS');
    const CONTAINER_SIZES = getCodeList('CONTAINER_SIZES');
    const CONTAINER_TYPES = getCodeList('CONTAINER_TYPES');

    const [activeTab, setActiveTab] = useState('manual');
    const [formData, setFormData] = useState({
        containerNumber: '',
        liner: '',
        size: '40',
        type: 'DRY',
        status: 'STACKING',
        // Initial Assessment
        requiresWashing: false,
        initialConditionNotes: ''
    });
    const [errors, setErrors] = useState({});

    // Excel upload state
    const [excelData, setExcelData] = useState([]);
    const [excelErrors, setExcelErrors] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.containerNumber) {
            newErrors.containerNumber = 'Container number is required';
        } else if (!validateContainerNumber(formData.containerNumber)) {
            newErrors.containerNumber = 'Invalid format (e.g., MSCU1234567)';
        }

        // Check duplicate
        const exists = containers.find(c =>
            c.containerNumber === formData.containerNumber.toUpperCase()
        );
        if (exists) {
            newErrors.containerNumber = 'Container already exists';
        }

        if (!formData.liner) {
            newErrors.liner = 'Liner is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manual entry submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const container = registerContainer({
            containerNumber: formData.containerNumber.toUpperCase(),
            liner: formData.liner,
            size: formData.size,
            type: formData.type,
            status: formData.requiresWashing ? 'PENDING_WASH' : formData.status,
            requiresWashing: formData.requiresWashing,
            initialConditionNotes: formData.initialConditionNotes,
            gateInTime: new Date().toISOString()
        }, user.username);

        toast.success(`Container ${container.containerNumber} registered!`);

        // Reset form
        setFormData({
            containerNumber: '',
            liner: '',
            size: '40',
            type: 'DRY',
            status: 'STACKING',
            requiresWashing: false,
            initialConditionNotes: ''
        });
    };

    // Download Excel template
    const downloadTemplate = () => {
        const template = [
            {
                containerNumber: 'MSCU1234567',
                liner: 'MSC',
                size: '40',
                type: 'DRY',
                status: 'DM',
                location: 'A-01-1',
                gateInDate: '2024-12-01'
            },
            {
                containerNumber: 'MAEU7654321',
                liner: 'MAERSK',
                size: '20',
                type: 'REEFER',
                status: 'STACKING',
                location: 'B-02-2',
                gateInDate: '2024-12-02'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Containers');

        // Add column widths
        ws['!cols'] = [
            { wch: 15 },
            { wch: 12 },
            { wch: 8 },
            { wch: 10 },
            { wch: 10 }
        ];

        XLSX.writeFile(wb, 'container_template.xlsx');
        toast.info('Template downloaded');
    };

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer?.files[0] || e.target?.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Validate each row
                const validated = jsonData.map((row, index) => {
                    const errors = [];

                    if (!row.containerNumber) {
                        errors.push('Missing container number');
                    } else if (!validateContainerNumber(row.containerNumber)) {
                        errors.push('Invalid container number format');
                    }

                    // Check duplicate in system
                    const exists = containers.find(c =>
                        c.containerNumber === row.containerNumber?.toUpperCase()
                    );
                    if (exists) {
                        errors.push('Already exists in system');
                    }

                    // Check duplicate in upload
                    const duplicateInUpload = jsonData.slice(0, index).find(r =>
                        r.containerNumber?.toUpperCase() === row.containerNumber?.toUpperCase()
                    );
                    if (duplicateInUpload) {
                        errors.push('Duplicate in file');
                    }

                    if (!row.liner) {
                        errors.push('Missing liner');
                    }

                    return {
                        ...row,
                        containerNumber: row.containerNumber?.toUpperCase(),
                        size: row.size || '40',
                        type: row.type || 'DRY',
                        status: row.status || 'DM',
                        errors,
                        isValid: errors.length === 0
                    };
                });

                setExcelData(validated);
                setExcelErrors(validated.filter(r => !r.isValid));

                if (validated.length === 0) {
                    toast.error('No data found in file');
                } else {
                    toast.info(`Found ${validated.length} containers`);
                }
            } catch (error) {
                toast.error('Failed to read Excel file');
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
    }, [containers, toast]);

    // Import valid containers
    const handleImport = () => {
        const validContainers = excelData.filter(r => r.isValid);

        if (validContainers.length === 0) {
            toast.error('No valid containers to import');
            return;
        }

        let imported = 0;
        for (const row of validContainers) {
            registerContainer({
                containerNumber: row.containerNumber,
                liner: row.liner,
                size: row.size,
                type: row.type,
                status: row.status,
                gateInTime: new Date().toISOString()
            }, user.username);
            imported++;
        }

        toast.success(`Imported ${imported} containers!`);
        setExcelData([]);
        setExcelErrors([]);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>Container Registration</h2>
                    <p className="text-muted">Register new containers for survey</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="registration-tabs">
                <button
                    className={`registration-tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    <Plus size={18} /> Manual Entry
                </button>
                <button
                    className={`registration-tab ${activeTab === 'excel' ? 'active' : ''}`}
                    onClick={() => setActiveTab('excel')}
                >
                    <FileSpreadsheet size={18} /> Excel Upload
                </button>
            </div>

            {/* Manual Entry Form */}
            {activeTab === 'manual' && (
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2" style={{ gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label htmlFor="containerNumber" className="form-label required">Container Number</label>
                                <input
                                    id="containerNumber"
                                    type="text"
                                    className={`form-input ${errors.containerNumber ? 'error' : ''}`}
                                    placeholder="MSCU1234567"
                                    value={formData.containerNumber}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        containerNumber: e.target.value.toUpperCase()
                                    }))}
                                    maxLength={11}
                                />
                                {errors.containerNumber && (
                                    <span className="error-text">{errors.containerNumber}</span>
                                )}
                                <span className="form-hint">Format: 4 letters + 7 digits</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="liner" className="form-label required">Liner</label>
                                <select
                                    id="liner"
                                    className={`form-input ${errors.liner ? 'error' : ''}`}
                                    value={formData.liner}
                                    onChange={(e) => setFormData(prev => ({ ...prev, liner: e.target.value }))}
                                >
                                    <option value="">Select liner...</option>
                                    {LINERS.map(l => (
                                        <option key={l.code} value={l.code}>{l.code} - {l.name}</option>
                                    ))}
                                </select>
                                {errors.liner && (
                                    <span className="error-text">{errors.liner}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Size</label>
                                <select
                                    className="form-input"
                                    value={formData.size}
                                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                                >
                                    {CONTAINER_SIZES.map(s => (
                                        <option key={s.code} value={s.code}>{s.code}ft</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    {CONTAINER_TYPES.map(t => (
                                        <option key={t.code} value={t.code}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Initial Status</label>
                                <select
                                    className="form-input"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="STACKING">STACKING - In Storage</option>
                                    <option value="DM">DM - Damaged</option>
                                </select>
                            </div>
                        </div>

                        {/* Initial Assessment Section */}
                        <div className="form-section mt-4">
                            <h4 className="form-section-title">
                                <ClipboardCheck size={18} /> Initial Assessment
                            </h4>
                            <p className="text-muted mb-3">Quick visual inspection to determine if container needs washing before survey</p>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.requiresWashing}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            requiresWashing: e.target.checked
                                        }))}
                                    />
                                    <Droplets size={16} />
                                    <span>Requires Washing Before Survey</span>
                                </label>
                                <span className="form-hint">Check if container is dirty, has cargo residue, odor, or contamination</span>
                            </div>

                            {formData.requiresWashing && (
                                <div className="form-group mt-3 washing-notice">
                                    <AlertTriangle size={16} />
                                    <span>Container will be sent to Washing Station before Survey</span>
                                </div>
                            )}

                            <div className="form-group mt-3">
                                <label className="form-label">Initial Condition Notes</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    placeholder="Describe initial condition: visible damage, dirt level, odor, cargo residue..."
                                    value={formData.initialConditionNotes}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        initialConditionNotes: e.target.value
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="form-actions mt-4">
                            <button type="submit" className="btn btn-primary btn-lg">
                                <ContainerIcon size={18} /> Register Container
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Excel Upload */}
            {activeTab === 'excel' && (
                <div className="card">
                    <div className="excel-header">
                        <p>Upload an Excel file with container data. Download the template first.</p>
                        <button className="btn btn-secondary" onClick={downloadTemplate}>
                            <Download size={16} /> Download Template
                        </button>
                    </div>

                    {/* Drop zone */}
                    <div
                        className={`excel-dropzone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('excelInput').click()}
                    >
                        <Upload size={40} />
                        <p>Drag & drop Excel file here</p>
                        <span>or click to browse</span>
                        <input
                            id="excelInput"
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={handleDrop}
                        />
                    </div>

                    {/* Preview table */}
                    {excelData.length > 0 && (
                        <div className="excel-preview">
                            <div className="excel-preview-header">
                                <h4>Preview ({excelData.length} containers)</h4>
                                {excelErrors.length > 0 && (
                                    <span className="badge badge-dm">
                                        <AlertTriangle size={14} /> {excelErrors.length} errors
                                    </span>
                                )}
                            </div>

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Container Number</th>
                                            <th>Liner</th>
                                            <th>Size</th>
                                            <th>Type</th>
                                            <th>Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {excelData.map((row, index) => (
                                            <tr key={index} className={row.isValid ? '' : 'row-error'}>
                                                <td>
                                                    {row.isValid ? (
                                                        <Check size={18} className="text-success" />
                                                    ) : (
                                                        <X size={18} className="text-error" />
                                                    )}
                                                </td>
                                                <td><span className="container-number">{row.containerNumber}</span></td>
                                                <td>{row.liner}</td>
                                                <td>{row.size}ft</td>
                                                <td>{row.type}</td>
                                                <td>
                                                    {row.errors?.map((err, i) => (
                                                        <span key={i} className="error-tag">{err}</span>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="excel-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setExcelData([]); setExcelErrors([]); }}
                                >
                                    Clear
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleImport}
                                    disabled={excelData.filter(r => r.isValid).length === 0}
                                >
                                    <Upload size={16} /> Import {excelData.filter(r => r.isValid).length} Valid Containers
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
