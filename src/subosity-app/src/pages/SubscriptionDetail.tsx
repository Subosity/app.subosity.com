import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faTrash,
    faRotate,
    faHand,
    faArrowLeft,
    faLink,
    faBell,
    faClock,
    faCheck,
    faCircleInfo,
    faTriangleExclamation,
    faCircleExclamation,
    faEnvelopesBulk,
    faEnvelope,
    faEnvelopeOpen,
    faCheckCircle,
    faBan
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Subscription, SubscriptionAlert } from '../types';
import EditSubscriptionModal from '../components/EditSubscriptionModal';
import DeleteSubscriptionModal from '../components/DeleteSubscriptionModal';
import SubscriptionAlertList from '../components/SubscriptionAlertList';
import { useAlerts } from '../AlertsContext';
import NoAlertsHero from '../components/NoAlertsHero';
import SubscriptionStateDisplay from '../components/SubscriptionStateDisplay';
import SubscriptionTimeline from '../components/SubscriptionTimeline';
import RecurrenceComponent from '../components/RecurrenceComponent';

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
        default:
            return 'var(--bs-info)';
    }
};

interface Props {
    onUpdate?: () => void;
}

const SubscriptionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { handleDismiss, handleSnooze, fetchAlerts } = useAlerts();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('unread');
    const [alerts, setAlerts] = useState<SubscriptionAlert[]>([]);
    const [counts, setCounts] = useState({ all: 0, unread: 0, read: 0 });

    const handleFilterChange = async (newFilter: 'all' | 'unread' | 'read') => {
        if (!id || newFilter === filterType) return;

        setFilterType(newFilter);
        const result = await fetchAlerts({ subscriptionId: id, filterType: newFilter });
        setAlerts(result.alerts);
        setCounts(result.counts);
    };

    useEffect(() => {
        if (id) {
            const loadData = async () => {
                setLoading(true);
                try {
                    // Load subscription details first
                    await fetchSubscription();
                    // Then load alerts with initial filter
                    const result = await fetchAlerts({ subscriptionId: id, filterType: 'unread' });
                    setAlerts(result.alerts);
                    setCounts(result.counts);
                    setFilterType('unread');
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [id]);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscription')
                .select(`
                    *,
                    subscription_provider:subscription_provider_id(
                        id,
                        name,
                        description,
                        category,
                        icon,
                        website,
                        unsubscribe_url
                    ),
                    payment_provider:payment_provider_id(
                        id,
                        name,
                        icon
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            setSubscription({
                id: data.id,
                providerId: data.subscription_provider_id,
                providerName: data.subscription_provider.name,
                providerDescription: data.subscription_provider.description,
                providerCategory: data.subscription_provider.category,
                providerIcon: data.subscription_provider.icon,
                providerWebsiteUrl: data.subscription_provider.website_url,
                providerUnsubscribeUrl: data.subscription_provider.unsubscribe_url,
                nickname: data.nickname,
                startDate: data.start_date,
                recurrenceRule: data.recurrence_rule,
                recurrenceRuleUiFriendly: data.recurrence_rule_ui_friendly,
                autoRenewal: data.autorenew,
                amount: data.amount,
                paymentProviderId: data.payment_provider_id,
                paymentProviderName: data.payment_provider.name,
                paymentProviderIcon: data.payment_provider.icon,
                paymentDetails: data.payment_details,
                notes: data.notes,
                state: data.state
            });
        } catch (error) {
            console.error('Error fetching subscription:', error);
            addToast('Error loading subscription details', 'error');
            navigate('/mysubscriptions');
        } finally {
            setLoading(false);
        }
    };

    const onAlertDismiss = async (alertId: string) => {
        const success = await handleDismiss(alertId);
        if (success) {
            setAlerts(currentAlerts =>
                currentAlerts.map(alert =>
                    alert.id === alertId
                        ? { ...alert, read_at: new Date().toISOString() }
                        : alert
                )
            );
        }
    };

    const onAlertSnooze = async (alertId: string) => {
        const success = await handleSnooze(alertId);
        if (success) {
            setAlerts(currentAlerts =>
                currentAlerts.map(alert =>
                    alert.id === alertId
                        ? { ...alert, read_at: new Date().toISOString() }
                        : alert
                )
            );
        }
    };

    return (
        <Container className="py-4">
            <div className="mb-4">
                <Button variant="link" className="px-0" onClick={() => navigate('/mysubscriptions')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Subscriptions
                </Button>
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : subscription && (
                <Card style={{
                    backgroundColor: 'var(--bs-body-bg)',
                    color: 'var(--bs-body-color)',
                    borderColor: 'var(--bs-border-color)'
                }} className="shadow">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div className="d-flex">
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center p-2 me-3"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        minWidth: '48px', // Add this to prevent shrinking
                                        flexShrink: 0,    // Add this to prevent shrinking
                                        backgroundColor: 'var(--bs-white)'
                                    }}>
                                    <img
                                        src={subscription.providerIcon}
                                        alt={subscription.providerName}
                                        style={{
                                            width: '150%',     // Reduce slightly from 48px
                                            height: '150%',    // Make sure width/height are equal
                                            objectFit: 'contain',
                                            flexShrink: 0      // Prevent image from shrinking
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="mb-1">{subscription.providerName}</h3>
                                    {subscription.nickname && (
                                        <div className="text-muted mb-2">({subscription.nickname})</div>
                                    )}
                                    <div className='text-muted' style={{ fontSize: '0.85em' }}>
                                        {subscription.providerDescription}
                                    </div>
                                    <Badge bg={subscription.autoRenewal ? 'success' : 'secondary'}>
                                        <FontAwesomeIcon
                                            icon={subscription.autoRenewal ? faRotate : faHand}
                                            className="me-2"
                                        />
                                        {subscription.autoRenewal ? 'Auto-Renewal' : 'Manual Renewal'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center" onClick={() => setShowEdit(true)}>
                                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                                    Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" className="d-inline-flex align-items-center" onClick={() => setShowDelete(true)}>
                                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>

                        <Card className="mb-4 shadow p-3">
                            <dl className="row">
                                <dt className="col-sm-3">Category</dt>
                                <dd className="col-sm-9">{subscription.providerCategory || 'Unknown Category'}</dd>

                                <dt className="col-sm-3">Amount</dt>
                                <dd className="col-sm-9">
                                    <span className="me-2">
                                        ${subscription.amount.toFixed(2)}
                                    </span>
                                    <span className="me-2">
                                        <RecurrenceComponent
                                            subscription={subscription}
                                            mode="text"
                                        />
                                    </span>
                                    <RecurrenceComponent
                                        subscription={subscription}
                                        mode="badge"
                                        thresholds={{ warning: 20, urgent: 10 }}
                                    />
                                </dd>

                                <dt className="col-sm-3">Start Date</dt>
                                <dd className="col-sm-9">
                                    {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'Not specified'}
                                </dd>

                                <dt className="col-sm-3">Payment Method</dt>
                                <dd className="col-sm-9">
                                    <div className="d-flex align-items-center">
                                        <div className="rounded bg-light d-flex align-items-center justify-content-center p-1 me-2">
                                            <img
                                                src={subscription.paymentProviderIcon}
                                                alt={subscription.paymentProviderName}
                                                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                            />
                                        </div>
                                        {subscription.paymentDetails}
                                    </div>
                                </dd>

                                {subscription.notes && (
                                    <>
                                        <dt className="col-sm-3">Notes</dt>
                                        <dd className="col-sm-9">{subscription.notes}</dd>
                                    </>
                                )}

                                <dt className="col-sm-3">Unsubscribe</dt>
                                <dd className="col-sm-9">
                                    <Button
                                        variant="link"
                                        href={subscription.providerUnsubscribeUrl}
                                        target="_blank"
                                        className="p-0"
                                    >
                                        <FontAwesomeIcon icon={faLink} className="me-2" />
                                        View unsubscribe instructions
                                    </Button>
                                </dd>
                            </dl>
                        </Card>
                        <div className="d-flex justify-content-end">
                            <SubscriptionStateDisplay
                                state={subscription.state}
                                subscriptionId={subscription.id}
                            />
                        </div>
                        {subscription && (
                            <div className="mt-4">
                                <SubscriptionTimeline subscriptionId={subscription.id} />
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {alerts && (
                <Card className="mt-4 shadow" style={{
                    backgroundColor: 'var(--bs-body-bg)',
                    color: 'var(--bs-body-color)',
                    borderColor: 'var(--bs-border-color)'
                }}>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faBell} className="me-2" />
                                Subscription Alerts
                            </h5>
                            <div className="btn-group btn-group-sm">
                                <Button
                                    type="button"
                                    variant={filterType === 'all' ? 'primary' : 'outline-primary'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleFilterChange('all');
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEnvelopesBulk} className="me-2" />
                                    <span className="d-none d-sm-inline">All ({alerts.length})</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={filterType === 'unread' ? 'primary' : 'outline-primary'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleFilterChange('unread');
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                    <span className="d-none d-sm-inline">Unread ({alerts.filter(a => !a.read).length})</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={filterType === 'read' ? 'primary' : 'outline-primary'}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleFilterChange('read');
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEnvelopeOpen} className="me-2" />
                                    <span className="d-none d-sm-inline">Read ({alerts.filter(a => a.read).length})</span>
                                </Button>
                            </div>
                        </div>
                        {alerts.length > 0 ? (
                            <SubscriptionAlertList
                                alerts={alerts}
                                onDismiss={onAlertDismiss}
                                onSnooze={onAlertSnooze}
                                showProvider={true}
                            />
                        ) : (
                            <NoAlertsHero filterType={filterType} />
                        )}
                    </Card.Body>
                </Card>
            )}

            <EditSubscriptionModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                subscription={subscription}
                onSubmit={async () => {
                    await fetchSubscription();
                    setShowEdit(false);
                }}
            />

            <DeleteSubscriptionModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                subscription={subscription}
                onDelete={() => {
                    navigate('/mysubscriptions');
                }}
            />
        </Container>
    );
};

export default SubscriptionDetail;