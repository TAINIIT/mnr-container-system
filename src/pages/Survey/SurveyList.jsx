import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import RetrieveButton from '../../components/common/RetrieveButton';
import { ClipboardList, Search, Eye, Plus, FileText, ChevronLeft, ChevronRight, Calendar, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { SURVEY_STATUS_LABELS, SURVEY_TYPE_LABELS, CONFIG } from '../../config/constants';
import { LINERS } from '../../data/masterCodes';

export default function SurveyList() {
    const { surveys, eors } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Access control: External users cannot create EORs
    const isExternal = user?.userType === 'EXTERNAL';
    const [searchParams] = useSearchParams();
    const workflowFilter = searchParams.get('workflow_filter');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [linerFilter, setLinerFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Collapsible filters - auto-collapse on mobile
    const [filtersVisible, setFiltersVisible] = useState(() => window.innerWidth > 768);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = CONFIG.CONTAINERS_PER_PAGE || 50;

    // Filter surveys
    const filteredSurveys = surveys.filter(s => {
        // Special workflow filter from Dashboard - show only DRAFT and IN_PROGRESS
        if (workflowFilter === 'active') {
            if (s.status !== 'DRAFT' && s.status !== 'IN_PROGRESS') {
                return false;
            }
        }

        const matchesSearch = !search ||
            s.containerNumber.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || s.status === statusFilter;
        const matchesType = !typeFilter || s.surveyType === typeFilter;
        const matchesLiner = !linerFilter || s.liner === linerFilter;

        // Date filter
        let matchesDate = true;
        if (dateFrom) {
            matchesDate = matchesDate && new Date(s.createdAt) >= new Date(dateFrom);
        }
        if (dateTo) {
            matchesDate = matchesDate && new Date(s.createdAt) <= new Date(dateTo + 'T23:59:59');
        }

        return matchesSearch && matchesStatus && matchesType && matchesLiner && matchesDate;
    });

    // Pagination
    const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
    const paginatedSurveys = filteredSurveys.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    const handleFilterChange = (setter, value) => {
        setter(value);
        setCurrentPage(1);
    };

    // Get damage count from survey
    const getDamageCount = (survey) => {
        return survey.damages?.length || 0;
    };

    // Get photo count from survey
    const getPhotoCount = (survey) => {
        return survey.photos?.length || 0;
    };

    return (
        <div className="page-list-layout">
            {/* Fixed Header Area */}
            <div className="page-list-header">
                <div className="page-header">
                    <div>
                        <h2>{t('survey.surveyList')}</h2>
                        <p className="text-muted">{t('survey.title')}</p>
                    </div>
                    <div className="header-actions">
                        <div className="header-stats">
                            <div className="header-stat">
                                <span className="header-stat-value">{surveys.filter(s => s.status === 'DRAFT').length}</span>
                                <span className="header-stat-label">{t('common.inProgress') || 'In Progress'}</span>
                            </div>
                            <div className="header-stat">
                                <span className="header-stat-value">{surveys.filter(s => s.status === 'COMPLETED').length}</span>
                                <span className="header-stat-label">{t('common.completed') || 'Completed'}</span>
                            </div>
                            <RetrieveButton screenId="survey_list" />
                            <Link to="/surveys/search" className="btn btn-primary">
                                <Plus size={16} /> {t('survey.newSurvey')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    className={`mobile-filter-toggle ${!filtersVisible ? 'collapsed' : ''}`}
                    onClick={() => setFiltersVisible(!filtersVisible)}
                >
                    <Filter size={16} />
                    {filtersVisible ? t('common.hideFilters') || 'Hide Filters' : t('common.showFilters') || 'Show Filters'}
                    {filtersVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <div className={`filters-wrapper mobile-collapse-default ${!filtersVisible ? 'collapsed' : ''}`}>
                    <div className="filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('common.search') + '...'}
                                value={search}
                                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                            />
                        </div>
                        <select
                            className="form-input"
                            style={{ width: 160 }}
                            value={statusFilter}
                            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                        >
                            <option value="">{t('common.allStatuses') || 'All Statuses'}</option>
                            {Object.entries(SURVEY_STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 150 }}
                            value={typeFilter}
                            onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
                        >
                            <option value="">{t('survey.allTypes') || 'All Types'}</option>
                            {Object.entries(SURVEY_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 140 }}
                            value={linerFilter}
                            onChange={(e) => handleFilterChange(setLinerFilter, e.target.value)}
                        >
                            <option value="">{t('common.allLiners') || 'All Liners'}</option>
                            {LINERS.map((liner) => (
                                <option key={liner.code} value={liner.code}>{liner.code}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Filters */}
                    <div className="filters date-filters">
                        <div className="date-filter-group">
                            <Calendar size={16} />
                            <label>{t('common.from') || 'From'}:</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateFrom}
                                onChange={(e) => handleFilterChange(setDateFrom, e.target.value)}
                            />
                            <label>{t('common.to') || 'To'}:</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dateTo}
                                onChange={(e) => handleFilterChange(setDateTo, e.target.value)}
                            />
                            {(dateFrom || dateTo) && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                                >
                                    {t('common.clearDates') || 'Clear'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="page-list-content">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('columns.transactionId')}</th>
                                <th>{t('columns.containerNumber')}</th>
                                <th>{t('columns.liner')}</th>
                                <th>{t('columns.surveyType')}</th>
                                <th>{t('columns.damageCount') || 'Damages'}</th>
                                <th>{t('columns.initialCondition')}</th>
                                <th>{t('columns.surveyStatus')}</th>
                                <th>{t('columns.createdAt')}</th>
                                <th>{t('columns.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSurveys.map((survey) => (
                                <tr key={survey.id} onDoubleClick={() => navigate(`/surveys/${survey.id}`)} style={{ cursor: 'pointer' }}>
                                    <td><span style={{ fontWeight: 500 }}>{survey.id}</span></td>
                                    <td><span className="container-number">{survey.containerNumber}</span></td>
                                    <td>{survey.liner}</td>
                                    <td>{SURVEY_TYPE_LABELS[survey.surveyType]}</td>
                                    <td>
                                        <span className="inline-summary">
                                            <span className={`count-badge ${getDamageCount(survey) > 0 ? 'has-items' : ''}`}>
                                                {getDamageCount(survey)} {t('survey.damage') || 'damage'}
                                            </span>
                                            {getPhotoCount(survey) > 0 && (
                                                <span className="photo-count">
                                                    📷 {getPhotoCount(survey)}
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${survey.initialCondition === 'DAMAGED' ? 'badge-dm' : 'badge-av'}`}>
                                            {survey.initialCondition === 'DAMAGED' ? t('survey.damaged') || 'Damaged' : t('survey.noDamage') || 'No Damage'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${survey.status.toLowerCase()}`}>
                                            {SURVEY_STATUS_LABELS[survey.status]}
                                        </span>
                                    </td>
                                    <td>{new Date(survey.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/surveys/${survey.id}`} className="btn btn-ghost btn-sm">
                                                <Eye size={16} /> {t('common.view') || 'View'}
                                            </Link>
                                            {/* Only internal users can create EORs, and only if no EOR exists yet */}
                                            {!isExternal && survey.status === 'COMPLETED' && survey.initialCondition === 'DAMAGED' && (
                                                (() => {
                                                    const existingEOR = eors.find(e => e.surveyId === survey.id || e.containerId === survey.containerId);
                                                    if (existingEOR) {
                                                        return (
                                                            <span className="badge badge-completed" style={{ fontSize: '11px' }}>
                                                                EOR: {existingEOR.status}
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <Link
                                                            to={`/eor/new/${survey.id}`}
                                                            className="btn btn-primary btn-sm"
                                                            title={t('survey.createEOR') || 'Create EOR'}
                                                        >
                                                            <FileText size={14} /> {t('survey.createEOR') || 'Create EOR'}
                                                        </Link>
                                                    );
                                                })()
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredSurveys.length === 0 && (
                    <div className="empty-state">
                        <ClipboardList size={48} />
                        <h3>{t('survey.noSurveysFound') || 'No surveys found'}</h3>
                        <p>{t('survey.createNewSurvey') || 'Create a new survey to get started'}</p>
                        <Link to="/surveys/search" className="btn btn-primary mt-4">
                            <Plus size={16} /> {t('survey.newSurvey') || 'New Survey'}
                        </Link>
                    </div>
                )}
            </div>

            {/* Fixed Footer - Pagination */}
            {totalPages > 1 && (
                <div className="page-list-footer">
                    <div className="pagination">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} /> {t('common.previous') || 'Previous'}
                        </button>
                        <span className="pagination-info">
                            {t('common.page') || 'Page'} {currentPage} {t('common.of') || 'of'} {totalPages}
                            <span className="pagination-total">
                                ({filteredSurveys.length} {t('common.total') || 'total'})
                            </span>
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t('common.next') || 'Next'} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
