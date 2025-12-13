import { useParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ArrowLeft, ClipboardList, FileText, Wrench } from 'lucide-react';
import { CONTAINER_STATUS_LABELS } from '../../config/constants';

export default function ContainerDetail() {
    const { id } = useParams();
    const { getContainer, getSurveysByContainer, getEORsByContainer, getROsByContainer } = useData();

    const container = getContainer(id);
    const surveys = getSurveysByContainer(id);
    const eors = getEORsByContainer(id);
    const repairOrders = getROsByContainer(id);

    if (!container) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h3>Container not found</h3>
                    <Link to="/containers" className="btn btn-primary mt-4">
                        <ArrowLeft size={16} /> Back to List
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <Link to="/containers" className="btn btn-ghost">
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <h2 className="container-number" style={{ fontSize: '1.5rem' }}>
                            {container.containerNumber}
                        </h2>
                        <span className={`badge badge-${container.status.toLowerCase()}`} style={{ marginTop: 8 }}>
                            {CONTAINER_STATUS_LABELS[container.status]}
                        </span>
                    </div>
                    <Link to={`/surveys/new/${id}`} className="btn btn-primary">
                        <ClipboardList size={16} /> New Survey
                    </Link>
                </div>

                <div className="grid grid-cols-3 mt-4">
                    <div>
                        <label className="form-label">Size/Type</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.size}</p>
                    </div>
                    <div>
                        <label className="form-label">Liner</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.liner}</p>
                    </div>
                    <div>
                        <label className="form-label">Gate In Date</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{new Date(container.gateInDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label className="form-label">Location</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>
                            {container.yardLocation ?
                                `Block ${container.yardLocation.block}, Row ${container.yardLocation.row}, Tier ${container.yardLocation.tier}` :
                                '-'}
                        </p>
                    </div>
                    <div>
                        <label className="form-label">Booking</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.booking || '-'}</p>
                    </div>
                    <div>
                        <label className="form-label">Sequence</label>
                        <p style={{ margin: 0, fontWeight: 500 }}>{container.sequence}</p>
                    </div>
                </div>
            </div>

            {/* Surveys */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <ClipboardList size={18} /> Surveys ({surveys.length})
                    </h3>
                </div>
                {surveys.length === 0 ? (
                    <p className="text-muted">No surveys recorded for this container.</p>
                ) : (
                    <div className="recent-list">
                        {surveys.map(survey => (
                            <Link key={survey.id} to={`/surveys/${survey.id}`} className="recent-item">
                                <div className="recent-item-main">
                                    <span>{survey.id}</span>
                                    <span className={`badge badge-${survey.status.toLowerCase()}`}>{survey.status}</span>
                                </div>
                                <div className="recent-item-sub">
                                    {survey.surveyType} • {new Date(survey.createdAt).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* EORs */}
            <div className="card mt-4">
                <div className="card-header">
                    <h3 className="card-title">
                        <FileText size={18} /> EORs ({eors.length})
                    </h3>
                </div>
                {eors.length === 0 ? (
                    <p className="text-muted">No EORs created for this container.</p>
                ) : (
                    <div className="recent-list">
                        {eors.map(eor => (
                            <Link key={eor.id} to={`/eor/${eor.id}`} className="recent-item">
                                <div className="recent-item-main">
                                    <span>{eor.id}</span>
                                    <span className={`badge badge-${eor.status.toLowerCase().replace('_', '-')}`}>
                                        {eor.autoApproved ? 'Auto-Approved' : eor.status}
                                    </span>
                                </div>
                                <div className="recent-item-sub">
                                    RM {eor.totalCost} • {new Date(eor.createdAt).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
