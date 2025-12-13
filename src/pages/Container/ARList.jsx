import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Clock, Search, FileText } from 'lucide-react';
import { LINERS } from '../../data/masterCodes';

export default function ARList() {
    const { containers, eors } = useData();
    const [search, setSearch] = useState('');
    const [linerFilter, setLinerFilter] = useState('');
    const navigate = useNavigate();

    const arContainers = containers
        .filter(c => c.status === 'AR')
        .filter(c => {
            const matchesSearch = !search ||
                c.containerNumber.toLowerCase().includes(search.toLowerCase());
            const matchesLiner = !linerFilter || c.liner === linerFilter;
            return matchesSearch && matchesLiner;
        })
        .map(c => {
            const containerEORs = eors.filter(e => e.containerId === c.id);
            const latestEOR = containerEORs[0];
            const arAging = c.arStartTime ?
                Math.floor((Date.now() - new Date(c.arStartTime).getTime()) / (1000 * 60 * 60 * 24)) : 0;
            return { ...c, latestEOR, arAging };
        })
        .sort((a, b) => b.arAging - a.arAging);

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>AR Containers</h2>
                        <p className="text-muted">Containers awaiting repair - sorted by AR aging</p>
                    </div>
                    <div className="badge badge-ar" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                        {arContainers.length} containers
                    </div>
                </div>

                <div className="filters">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search container..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input"
                        style={{ width: 180 }}
                        value={linerFilter}
                        onChange={(e) => setLinerFilter(e.target.value)}
                    >
                        <option value="">All Liners</option>
                        {LINERS.map(l => (
                            <option key={l.code} value={l.code}>{l.code}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Container</th>
                                <th>Liner</th>
                                <th>Location</th>
                                <th>AR Start</th>
                                <th>AR Aging</th>
                                <th>EOR Status</th>
                                <th>EOR Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {arContainers.map((container) => (
                                <tr key={container.id} onDoubleClick={() => navigate(`/containers/${container.id}`)} style={{ cursor: 'pointer' }}>
                                    <td><span className="container-number">{container.containerNumber}</span></td>
                                    <td>{container.liner}</td>
                                    <td>
                                        {container.yardLocation ?
                                            `${container.yardLocation.block}-${container.yardLocation.row}-${container.yardLocation.tier}` :
                                            '-'}
                                    </td>
                                    <td>{container.arStartTime ? new Date(container.arStartTime).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <span className={`badge ${container.arAging > 5 ? 'badge-dm' : 'badge-ar'}`}>
                                            {container.arAging} days
                                        </span>
                                    </td>
                                    <td>
                                        {container.latestEOR ? (
                                            <span className={`badge badge-${container.latestEOR.status.toLowerCase().replace('_', '-')}`}>
                                                {container.latestEOR.status.replace('_', ' ')}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {container.latestEOR ? `RM ${container.latestEOR.totalCost}` : '-'}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Link to={`/containers/${container.id}`} className="btn btn-ghost btn-sm">
                                                View
                                            </Link>
                                            {container.latestEOR && (
                                                <Link to={`/eor/${container.latestEOR.id}`} className="btn btn-secondary btn-sm">
                                                    <FileText size={14} /> EOR
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {arContainers.length === 0 && (
                    <div className="empty-state">
                        <Clock size={48} />
                        <h3>No AR containers</h3>
                        <p>All containers are either available or being processed</p>
                    </div>
                )}
            </div>
        </div>
    );
}
