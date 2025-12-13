import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { Wrench, Play, CheckCircle, Clock, User, Plus, ArrowLeft } from 'lucide-react';
import { RO_STATUS_LABELS, RO_STATUS } from '../../config/constants';

export default function RepairOrderDetail() {
    const { id } = useParams();
    const { getRepairOrder, getEOR, updateRepairOrder, updateContainer, getContainer } = useData();
    const { user } = useAuth();
    const toast = useToast();

    const ro = getRepairOrder(id);
    const eor = ro ? getEOR(ro.eorId) : null;
    const container = ro ? getContainer(ro.containerId) : null;

    const [workLog, setWorkLog] = useState('');
    const [assignedTech, setAssignedTech] = useState(ro?.assignedTeam || '');

    if (!ro) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Repair Order not found</h3>
                    <Link to="/repair-orders" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to List
                    </Link>
                </div>
            </div>
        );
    }

    const startRepair = () => {
        if (!assignedTech) {
            toast.error('Please assign a technician/team first');
            return;
        }
        updateRepairOrder(id, {
            status: 'IN_PROGRESS',
            assignedTeam: assignedTech,
            startTime: new Date().toISOString()
        }, user.username);

        // Update container status
        if (container) {
            updateContainer(container.id, {
                status: 'REPAIR',
                repairStartTime: new Date().toISOString()
            }, user.username);
        }

        toast.success('Repair work started!');
    };

    const completeRepair = () => {
        // Validate all work items complete
        const allComplete = ro.workItems?.every(w => w.status === 'COMPLETED') ?? true;

        updateRepairOrder(id, {
            status: 'COMPLETED',
            endTime: new Date().toISOString(),
            workLog: workLog || ro.workLog
        }, user.username);

        // Update container status
        if (container) {
            updateContainer(container.id, {
                status: 'COMPLETED',
                repairEndTime: new Date().toISOString()
            }, user.username);
        }

        toast.success('Repair completed! Ready for pre-inspection.');
    };

    const addWorkLog = () => {
        if (!workLog.trim()) return;

        const logs = ro.workLogs || [];
        logs.push({
            id: Date.now(),
            text: workLog,
            user: user.username,
            timestamp: new Date().toISOString()
        });

        updateRepairOrder(id, { workLogs: logs }, user.username);
        setWorkLog('');
        toast.success('Work log added');
    };

    const canStart = ro.status === 'NEW' || ro.status === 'PLANNED';
    const canComplete = ro.status === 'IN_PROGRESS';
    const isActive = ro.status === 'IN_PROGRESS';

    return (
        <div className="page">
            <div className="page-header">
                <Link to="/repair-orders" className="btn btn-ghost">
                    <ArrowLeft size={16} /> Back
                </Link>
                <div className="flex gap-3">
                    {canStart && (
                        <button className="btn btn-primary" onClick={startRepair}>
                            <Play size={16} /> Start Repair
                        </button>
                    )}
                    {canComplete && (
                        <button className="btn btn-success" onClick={completeRepair}>
                            <CheckCircle size={16} /> Complete Repair
                        </button>
                    )}
                </div>
            </div>

            {/* Header */}
            <div className="card">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 style={{ marginBottom: 'var(--space-2)' }}>{ro.id}</h2>
                        <span className={`badge badge-${ro.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '0.9rem' }}>
                            {RO_STATUS_LABELS[ro.status]}
                        </span>
                    </div>
                    {isActive && (
                        <div className="repair-timer">
                            <Clock size={20} />
                            <span>In Progress since {new Date(ro.startTime).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-4 mt-4">
                    <div>
                        <label className="form-label">Container</label>
                        <p className="container-number" style={{ margin: 0 }}>{ro.containerNumber}</p>
                    </div>
                    <div>
                        <label className="form-label">Liner</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{ro.liner}</p>
                    </div>
                    <div>
                        <label className="form-label">EOR Reference</label>
                        <Link to={`/eor/${ro.eorId}`} style={{ fontWeight: 500 }}>{ro.eorId}</Link>
                    </div>
                    <div>
                        <label className="form-label">Assigned Team</label>
                        {canStart ? (
                            <select
                                className="form-input"
                                value={assignedTech}
                                onChange={(e) => setAssignedTech(e.target.value)}
                            >
                                <option value="">Select team...</option>
                                <option value="Team A">Team A - General Repairs</option>
                                <option value="Team B">Team B - Welding</option>
                                <option value="Team C">Team C - Reefer</option>
                            </select>
                        ) : (
                            <p style={{ margin: 0, fontWeight: 500 }}>{ro.assignedTeam || '-'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Work Items from EOR */}
            <div className="card mt-4">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                    <Wrench size={18} /> Repair Tasks
                </h3>

                {eor?.repairItems?.length > 0 ? (
                    <div className="repair-tasks">
                        {eor.repairItems.map((item, index) => (
                            <div key={item.id} className="repair-task">
                                <div className="repair-task-header">
                                    <span className="repair-task-num">#{index + 1}</span>
                                    <span className="repair-task-loc">{item.location}</span>
                                    <span className="repair-task-type">{item.repairCode}</span>
                                </div>
                                <div className="repair-task-desc">
                                    {item.damageType} - {item.component} (Qty: {item.quantity})
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted">No repair tasks defined</p>
                )}
            </div>

            {/* Work Log */}
            {(isActive || ro.status === 'COMPLETED') && (
                <div className="card mt-4">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Work Log</h3>

                    {isActive && (
                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Add work log entry..."
                                value={workLog}
                                onChange={(e) => setWorkLog(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addWorkLog()}
                            />
                            <button className="btn btn-secondary" onClick={addWorkLog}>
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    )}

                    <div className="work-logs">
                        {(ro.workLogs || []).length === 0 ? (
                            <p className="text-muted">No work logs recorded yet</p>
                        ) : (
                            ro.workLogs.map(log => (
                                <div key={log.id} className="work-log-item">
                                    <div className="work-log-header">
                                        <User size={14} />
                                        <span>{log.user}</span>
                                        <span className="work-log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p>{log.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
