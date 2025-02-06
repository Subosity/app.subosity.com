import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faCheck,
    faClock,
    faTimesCircle,
    faCircleInfo,
    faTriangleExclamation,
    faCircleExclamation,
    faEnvelopesBulk,
    faEnvelope,
    faEnvelopeOpen
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import SubscriptionAlertList from './SubscriptionAlertList';
import { useAlerts } from '../../AlertsContext';
import NoAlertsHero from '../NoAlertsHero';

interface SubscriptionAlert {
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'danger';
    created_at: string;
    sent_at: string | null;
    read_at: string | null;
    subscription: {
        subscription_provider: {
            name: string;
            icon: string;
        }
    }
}

interface Props {
    show: boolean;
    onHide: () => void;
}

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'danger':
            return faCircleExclamation;
        case 'warning':
            return faTriangleExclamation;
        case 'info':
        default:
            return faCircleInfo;
    }
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'danger':
            return 'var(--bs-danger)';
        case 'warning':
            return 'var(--bs-warning)';
        case 'info':
            return 'var(--bs-primary)';
        default:
            return 'var(--bs-info)';
    }
};

const SubscriptionAlertsModal: React.FC<Props> = ({ show, onHide }) => {
    const { handleDismiss, handleSnooze, fetchAlerts } = useAlerts();
    const [alerts, setAlerts] = useState<SubscriptionAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('unread');
    const [counts, setCounts] = useState({ all: 0, unread: 0, read: 0 });

    const loadAlerts = async (filter: 'all' | 'unread' | 'read') => {
        setLoading(true);
        try {
            const result = await fetchAlerts({ filterType: filter });
            setAlerts(result.alerts);
            setCounts(result.counts);
            setFilterType(filter);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load when modal shows
    useEffect(() => {
        if (show) {
            loadAlerts('unread');
        }
    }, [show]);

    const handleFilterChange = async (newFilter: 'all' | 'unread' | 'read') => {
        if (newFilter === filterType) return;
        await loadAlerts(newFilter);
    };

    const onAlertDismiss = async (alertId: string) => {
        const success = await handleDismiss(alertId);
        if (success) {
            // Refresh current view
            await loadAlerts(filterType);
        }
    };

    const onAlertSnooze = async (alertId: string) => {
        const success = await handleSnooze(alertId);
        if (success) {
            // Refresh current view
            await loadAlerts(filterType);
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faBell} className="me-2" />
                        Subscription Alerts
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Manage your subscription notifications
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mb-3">
                    <div className="btn-group btn-group-sm w-100">
                        <Button
                            type="button"
                            variant={filterType === 'all' ? 'primary' : 'outline-primary'}
                            onClick={(e) => {
                                e.preventDefault();
                                handleFilterChange('all');
                            }}
                        >
                            <FontAwesomeIcon icon={faEnvelopesBulk} className="me-2" />All ({counts.all})
                        </Button>
                        <Button
                            type="button"
                            variant={filterType === 'unread' ? 'primary' : 'outline-primary'}
                            onClick={(e) => {
                                e.preventDefault();
                                handleFilterChange('unread');
                            }}
                        >
                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />Unread ({counts.unread})
                        </Button>
                        <Button
                            type="button"
                            variant={filterType === 'read' ? 'primary' : 'outline-primary'}
                            onClick={(e) => {
                                e.preventDefault();
                                handleFilterChange('read');
                            }}
                        >
                            <FontAwesomeIcon icon={faEnvelopeOpen} className="me-2" />Read ({counts.read})
                        </Button>
                    </div>
                </div>
                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : alerts.length > 0 ? (
                    <SubscriptionAlertList
                        alerts={alerts}
                        onDismiss={onAlertDismiss}
                        onSnooze={onAlertSnooze}
                        showProvider={true}
                    />
                ) : (
                    <NoAlertsHero filterType={filterType} />
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default SubscriptionAlertsModal;