import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Droplets, ArrowLeft, Printer, Download, Mail, CheckCircle,
    Award, Calendar, User, MapPin
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useConfig } from '../../context/ConfigContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/common/Toast';
import './Washing.css';

const WashingCertificate = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const { getWashingOrder } = useData();
    const { getCodeList } = useConfig();
    const { t } = useLanguage();
    const { addToast: showToast } = useToast();

    const washingOrder = getWashingOrder(id);

    // Get program details
    const CLEANING_PROGRAMS = getCodeList('CLEANING_PROGRAMS') || [];
    const program = useMemo(() => {
        if (!washingOrder?.cleaningProgram) return null;
        return CLEANING_PROGRAMS.find(p => p.code === washingOrder.cleaningProgram);
    }, [washingOrder, CLEANING_PROGRAMS]);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle download (placeholder)
    const handleDownload = () => {
        showToast(t('common.featureComingSoon') || 'PDF download coming soon', 'info');
    };

    // Handle email (placeholder)
    const handleEmail = () => {
        showToast(t('common.featureComingSoon') || 'Email feature coming soon', 'info');
    };

    if (!washingOrder) {
        return (
            <div className="certificate-page">
                <div className="empty-state">
                    <Droplets size={48} />
                    <p>{t('washing.orderNotFound') || 'Washing order not found'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/washing')}>
                        {t('common.back') || 'Back'}
                    </button>
                </div>
            </div>
        );
    }

    if (washingOrder.status !== 'COMPLETED' || !washingOrder.certificateNumber) {
        return (
            <div className="certificate-page">
                <div className="empty-state">
                    <Award size={48} />
                    <p>{t('washing.noCertificate') || 'No certificate available. QC must pass first.'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/washing')}>
                        {t('common.back') || 'Back'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="certificate-page">
            {/* Header - not printed */}
            <div className="page-header no-print">
                <div className="header-content">
                    <button className="btn btn-ghost" onClick={() => navigate('/washing')}>
                        <ArrowLeft size={20} /> {t('common.back') || 'Back'}
                    </button>
                    <h1><Award size={24} /> {t('washing.certificateOfCleanliness') || 'Certificate of Cleanliness'}</h1>
                </div>
            </div>

            {/* Certificate */}
            <div className="certificate-container">
                {/* Certificate Header */}
                <div className="certificate-header">
                    <div className="certificate-logo">
                        <Droplets size={40} />
                    </div>
                    <h1>{t('washing.certificateOfCleanliness') || 'CERTIFICATE OF CLEANLINESS'}</h1>
                    <h2>Johor Port Container Depot</h2>
                </div>

                {/* Certificate Body */}
                <div className="certificate-body">
                    <div className="certificate-row">
                        <span className="certificate-label">{t('washing.certificateNo') || 'Certificate No'}:</span>
                        <span className="certificate-value"><strong>{washingOrder.certificateNumber}</strong></span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('columns.containerNumber') || 'Container Number'}:</span>
                        <span className="certificate-value">{washingOrder.containerNumber}</span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('columns.type') || 'Container Type'}:</span>
                        <span className="certificate-value">{washingOrder.containerType}</span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('columns.liner') || 'Liner/Owner'}:</span>
                        <span className="certificate-value">{washingOrder.liner}</span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('washing.cleaningProgram') || 'Cleaning Program'}:</span>
                        <span className="certificate-value">{program?.name || washingOrder.cleaningProgram}</span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('washing.cleanedDate') || 'Cleaning Date'}:</span>
                        <span className="certificate-value">{formatDateTime(washingOrder.completedAt)}</span>
                    </div>
                    <div className="certificate-row">
                        <span className="certificate-label">{t('washing.issueDate') || 'Issue Date'}:</span>
                        <span className="certificate-value">{formatDate(washingOrder.certificateIssuedAt)}</span>
                    </div>
                </div>

                {/* Statement */}
                <div className="certificate-statement">
                    <CheckCircle size={24} style={{ color: 'var(--success-500)', marginBottom: '8px' }} />
                    <p>
                        {t('washing.certificateStatement') ||
                            'This is to certify that the above-mentioned container has been cleaned and inspected in accordance with international standards and industry best practices. The container is free from contamination, debris, and odors, and is suitable for cargo loading.'}
                    </p>
                </div>

                {/* Footer with signatures */}
                <div className="certificate-footer">
                    <div className="certificate-signature">
                        <div className="signature-line"></div>
                        <span className="signature-name">{washingOrder.qcInspectedBy}</span>
                        <span className="signature-title">{t('washing.qcInspector') || 'QC Inspector'}</span>
                    </div>

                    <div className="certificate-qr">
                        <span>QR</span>
                    </div>

                    <div className="certificate-signature">
                        <div className="signature-line"></div>
                        <span className="signature-name">Depot Supervisor</span>
                        <span className="signature-title">{t('washing.authorizedSignatory') || 'Authorized Signatory'}</span>
                    </div>
                </div>

                {/* Certificate Number Watermark */}
                <div className="certificate-watermark">
                    {washingOrder.certificateNumber}
                </div>
            </div>

            {/* Actions - not printed */}
            <div className="certificate-actions no-print">
                <button className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={16} /> {t('washing.printCertificate') || 'Print'}
                </button>
                <button className="btn btn-ghost" onClick={handleDownload}>
                    <Download size={16} /> {t('washing.downloadPDF') || 'Download PDF'}
                </button>
                <button className="btn btn-ghost" onClick={handleEmail}>
                    <Mail size={16} /> {t('washing.emailToLiner') || 'Email to Liner'}
                </button>
            </div>
        </div>
    );
};

export default WashingCertificate;
