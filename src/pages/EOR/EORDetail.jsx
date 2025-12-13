import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../../components/common/Toast';
import { ArrowLeft, Edit, Send, CheckCircle, Download, Wrench, Truck } from 'lucide-react';
import { EOR_STATUS_LABELS } from '../../config/constants';
import { getCodeLabel, LOCATION_CODES, DAMAGE_CODES, REPAIR_CODES, COMPONENT_CODES } from '../../data/masterCodes';

export default function EORDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getEOR, sendEOR, approveEOR, createRepairOrder, getContainer, shunting } = useData();
    const { user, hasScreenPermission, canPerform } = useAuth();
    const { getSetting } = useConfig();
    const toast = useToast();

    const autoApprovalThreshold = getSetting('autoApprovalThreshold');

    // State for shunting status - MUST be before any early returns
    const [hasShuntingRequest, setHasShuntingRequest] = useState(false);

    const eor = getEOR(id);

    // Check shunting status - use data from context if available, else localStorage
    const checkShuntingStatus = () => {
        const shuntingData = Array.isArray(shunting) && shunting.length > 0
            ? shunting
            : JSON.parse(localStorage.getItem('mnr_shunting') || '[]');
        const hasRequest = shuntingData.some(s =>
            (s.containerId === eor?.containerId || s.containerNumber === eor?.containerNumber)
        );
        setHasShuntingRequest(hasRequest);
    };

    // useEffect MUST be before any early returns
    useEffect(() => {
        if (eor) {
            checkShuntingStatus();
        }

        // Refresh shunting status when window regains focus
        const handleFocus = () => {
            if (eor) checkShuntingStatus();
        };
        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);
    }, [eor?.containerId, eor?.containerNumber, shunting]);

    // NOW we can do early return - after all hooks are called
    if (!eor) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>EOR not found</h3>
                    <Link to="/eor" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to List
                    </Link>
                </div>
            </div>
        );
    }

    const container = getContainer(eor.containerId);

    // Permission & Rule Checks
    const isExternal = user?.userType === 'EXTERNAL';

    // Rule: External users can only act on their own liner's EORs
    const isLinerOwner = isExternal
        ? (user?.shippingLineCode && eor?.liner === user.shippingLineCode)
        : true; // Internal users are always considered "owners"

    // Check granular permissions (new system) or fall back to function-based (old system)
    // IMPORTANT: External liner owners get automatic approve/reject permission for their own EORs
    const hasApprovePerm = isExternal
        ? isLinerOwner  // External users can approve if they own the liner
        : (hasScreenPermission('eor_detail', 'approve') || canPerform('approve'));
    const hasRejectPerm = isExternal
        ? isLinerOwner  // External users can reject if they own the liner
        : (hasScreenPermission('eor_detail', 'reject') || canPerform('approve'));

    const canEdit = eor.status === 'DRAFT' && !isExternal; // External users can't edit
    const canSend = eor.status === 'DRAFT' && eor.needApproval && !isExternal; // External users can't send

    // Can Approve if: Status is PENDING/SENT AND Has Permission
    const canApprove = (eor.status === 'PENDING' || eor.status === 'SENT') && hasApprovePerm;

    // Can Reject if: Status is PENDING/SENT AND Has Permission
    const canReject = (eor.status === 'PENDING' || eor.status === 'SENT') && hasRejectPerm;

    // Can only create RO if EOR is approved AND has shunting request (any status)
    const canCreateRO = eor.status.includes('APPROVED') && hasShuntingRequest;
    const needsShunting = eor.status.includes('APPROVED') && !hasShuntingRequest;

    const handleSend = () => {
        const liner = eor.liner;
        const result = sendEOR(id, `mnr@${liner.toLowerCase()}.com`, 'EMAIL', user.username);
        if (result.success) {
            toast.success('EOR sent successfully!');
        } else {
            toast.error(result.error);
        }
    };

    const handleApprove = (status) => {
        const result = approveEOR(id, { status }, user.username);
        if (result.success) {
            toast.success(`EOR ${status.toLowerCase()}!`);
        }
    };

    const handleCreateRO = () => {
        const result = createRepairOrder({
            eorId: eor.id,
            surveyId: eor.surveyId, // Use Survey's Transaction ID for workflow consistency
            containerId: eor.containerId,
            containerNumber: eor.containerNumber,
            liner: eor.liner,
            workItems: eor.repairItems.map(item => ({
                repairItemId: item.id,
                status: 'NEW'
            }))
        }, user.username);

        if (result.success) {
            toast.success(`Repair Order ${result.ro.id} created!`);
        } else {
            toast.error(result.error);
        }
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const repairItemsHtml = eor.repairItems.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${getCodeLabel(LOCATION_CODES, item.location)}</td>
                    <td>${getCodeLabel(DAMAGE_CODES, item.damageType)}</td>
                    <td>${getCodeLabel(REPAIR_CODES, item.repairCode)}</td>
                    <td>${getCodeLabel(COMPONENT_CODES, item.component)}</td>
                    <td>${item.quantity}</td>
                    <td>RM ${item.unitPrice}</td>
                    <td>${item.laborHours}h</td>
                    <td style="font-weight: 600;">RM ${item.lineTotal}</td>
                </tr>
            `).join('');

            printWindow.document.write(`
                <html>
                <head>
                    <title>EOR - ${eor.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0 0 10px 0; color: #1a56db; }
                        .header .subtitle { color: #666; font-size: 14px; }
                        .section { margin-bottom: 30px; }
                        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px; }
                        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                        .info-item label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
                        .info-item p { margin: 0; font-weight: 500; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #f5f5f5; font-weight: 600; }
                        .total-row td { font-weight: bold; background: #f0f8ff; }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
                        .total-cost { font-size: 24px; font-weight: bold; color: #1a56db; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
                        @media print { body { padding: 20px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Estimate of Repair (EOR)</h1>
                        <div class="subtitle">M&R Container Management System</div>
                    </div>
                    
                    <div class="section">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0 0 8px 0;">${eor.id}</h2>
                                <span class="status-badge">${EOR_STATUS_LABELS[eor.status]}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; color: #666;">Total Cost</div>
                                <div class="total-cost">RM ${eor.totalCost}</div>
                                ${eor.autoApproved ? '<div style="font-size: 11px; color: #2e7d32;">Auto-Approved</div>' : ''}
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Container Information</div>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Container Number</label>
                                <p>${eor.containerNumber}</p>
                            </div>
                            <div class="info-item">
                                <label>Liner</label>
                                <p>${eor.liner}</p>
                            </div>
                            <div class="info-item">
                                <label>Survey ID</label>
                                <p>${eor.surveyId || 'N/A'}</p>
                            </div>
                            <div class="info-item">
                                <label>Version</label>
                                <p>v${eor.version}</p>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Repair Items (${eor.repairItems.length})</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Location</th>
                                    <th>Damage</th>
                                    <th>Repair</th>
                                    <th>Component</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Labor</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${repairItemsHtml}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="8" style="text-align: right;">Total:</td>
                                    <td>RM ${eor.totalCost}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">Document History</div>
                        <p><strong>Created:</strong> ${new Date(eor.createdAt).toLocaleString()} by ${eor.createdBy}</p>
                        ${eor.sentAt ? `<p><strong>Sent to Liner:</strong> ${new Date(eor.sentAt).toLocaleString()} by ${eor.sentBy}</p>` : ''}
                        ${eor.approvedAt ? `<p><strong>${eor.status.includes('APPROVED') ? 'Approved' : 'Rejected'}:</strong> ${new Date(eor.approvedAt).toLocaleString()} by ${eor.approvedBy}</p>` : ''}
                    </div>

                    <div class="footer">
                        <p>Generated on ${new Date().toLocaleString()}</p>
                        <p>M&R Container Management System</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            toast.success('PDF export opened. Use "Save as PDF" in print dialog.');
        } else {
            toast.error('Could not open print window. Please check popup blocker.');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <Link to="/eor" className="btn btn-ghost">
                    <ArrowLeft size={16} /> Back
                </Link>
                <div className="flex gap-3">
                    {canEdit && (
                        <Link to={`/eor/${id}/edit`} className="btn btn-secondary">
                            <Edit size={16} /> Edit
                        </Link>
                    )}
                    {canSend && (
                        <button className="btn btn-primary" onClick={handleSend}>
                            <Send size={16} /> Send to Liner
                        </button>
                    )}
                    {canApprove && (
                        <button className="btn btn-success" onClick={() => handleApprove('APPROVED')}>
                            <CheckCircle size={16} /> Approve
                        </button>
                    )}
                    {canReject && (
                        <button className="btn btn-danger" onClick={() => handleApprove('REJECTED')}>
                            Reject
                        </button>
                    )}
                    {canCreateRO && (
                        <button className="btn btn-primary" onClick={handleCreateRO}>
                            <Wrench size={16} /> Create Repair Order
                        </button>
                    )}
                    {needsShunting && (
                        <button className="btn btn-warning" onClick={() => navigate('/shunting')}>
                            <Truck size={16} /> Request Shunting
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={handleExportPDF}>
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* EOR Summary */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 style={{ marginBottom: 'var(--space-2)' }}>{eor.id}</h2>
                        <span className={`badge badge-${eor.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.9rem' }}>
                            {EOR_STATUS_LABELS[eor.status]}
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-muted text-sm">Total Cost</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-500)' }}>
                            RM {eor.totalCost}
                        </div>
                        {eor.autoApproved && (
                            <span className="badge badge-av">Auto-Approved</span>
                        )}
                        {eor.needApproval && !eor.autoApproved && (
                            <span className="badge badge-ar">Approval Required (&gt; {autoApprovalThreshold} RM)</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4">
                    <div>
                        <label className="form-label">Container</label>
                        <p className="container-number" style={{ margin: 0 }}>{eor.containerNumber}</p>
                    </div>
                    <div>
                        <label className="form-label">Liner</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{eor.liner}</p>
                    </div>
                    <div>
                        <label className="form-label">Survey ID</label>
                        <Link to={`/surveys/${eor.surveyId}`} style={{ fontWeight: 500 }}>{eor.surveyId}</Link>
                    </div>
                    <div>
                        <label className="form-label">Version</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>v{eor.version}</p>
                    </div>
                </div>
            </div>

            {/* Repair Items */}
            <div className="card mt-4">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                    Repair Items ({eor.repairItems.length})
                </h3>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Location</th>
                                <th>Damage</th>
                                <th>Repair</th>
                                <th>Component</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Labor</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eor.repairItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>
                                    <td>{getCodeLabel(LOCATION_CODES, item.location)}</td>
                                    <td>{getCodeLabel(DAMAGE_CODES, item.damageType)}</td>
                                    <td>{getCodeLabel(REPAIR_CODES, item.repairCode)}</td>
                                    <td>{getCodeLabel(COMPONENT_CODES, item.component)}</td>
                                    <td>{item.quantity}</td>
                                    <td>RM {item.unitPrice}</td>
                                    <td>{item.laborHours}h</td>
                                    <td style={{ fontWeight: 600 }}>RM {item.lineTotal}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
                                <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>RM {eor.totalCost}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Timeline */}
            <div className="card mt-4">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Timeline</h3>
                <div className="timeline">
                    <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <strong>Created</strong>
                            <p>{new Date(eor.createdAt).toLocaleString()} by {eor.createdBy}</p>
                        </div>
                    </div>
                    {eor.sentAt && (
                        <div className="timeline-item">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>Sent to Liner</strong>
                                <p>{new Date(eor.sentAt).toLocaleString()} by {eor.sentBy}</p>
                            </div>
                        </div>
                    )}
                    {eor.approvedAt && (
                        <div className="timeline-item">
                            <div className="timeline-dot" style={{ background: 'var(--success-500)' }}></div>
                            <div className="timeline-content">
                                <strong>{eor.status.includes('APPROVED') ? 'Approved' : 'Rejected'}</strong>
                                <p>{new Date(eor.approvedAt).toLocaleString()} by {eor.approvedBy}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
