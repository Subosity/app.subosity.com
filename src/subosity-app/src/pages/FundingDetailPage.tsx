import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faTrash,
    faArrowLeft,
    faMoneyBill,
    faCreditCard,
    faCalendarDay,
    faCalendarWeek,
    faCalendarDays,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { FundingSource } from '../types/FundingSource';
import EditFundingModal from '../components/Funding/EditFundingModal';
import DeleteFundingModal from '../components/Funding/DeleteFundingModal';
import DeleteUnableFundingModal from '../components/Funding/DeleteUnableFundingModal';
import SubscriptionBrowser from '../components/Subscription/SubscriptionBrowser';
import { Subscription } from '../types/Subscription';
import { getOccurrencesInRange } from '../utils/recurrenceUtils';
import EditSubscriptionModal from '../components/EditSubscriptionModal';
import DeleteSubscriptionModal from '../components/DeleteSubscriptionModal';



const calculatePaymentSummary = (subscriptions: Subscription[]) => {
    const activeSubscriptions = subscriptions.filter(sub => sub.state === 'active');
    const yearStart = new Date(new Date().getFullYear(), 0, 1); // January 1st
    const yearEnd = new Date(new Date().getFullYear(), 11, 31); // December 31st

    let yearlyTotal = 0;

    activeSubscriptions.forEach(sub => {
        if (!sub.recurrence_rule) return;

        // Get all occurrences for the full year
        const occurrences = getOccurrencesInRange(
            sub.recurrence_rule,
            yearStart,
            yearEnd,
            yearStart // Use January 1st as the start date
        );

        const amount = sub.amount || 0;
        yearlyTotal += amount * occurrences.length;
    });

    // Calculate monthly, weekly, and daily averages based on the actual yearly total
    const monthlyTotal = yearlyTotal / 12;
    const weeklyTotal = yearlyTotal / 52.18; // Standard weeks per year (365.25/7)
    const dailyTotal = yearlyTotal / 365.25;

    return {
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        yearly: yearlyTotal
    };
};


const FundingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [fundingSource, setFundingSource] = useState<FundingSource | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showUnable, setShowUnable] = useState(false);
    const [subscriptionCount, setSubscriptionCount] = useState(0);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

    useEffect(() => {
        if (id) fetchFundingSource();
    }, [id]);

    const fetchFundingSource = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('funding_source')
                .select(`
                    *,
                    payment_provider:payment_provider_id(
                        id,
                        name,
                        icon
                    ),
                    subscriptions:subscription!funding_source_id(count)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            setFundingSource({
                id: data.id,
                name: data.name,
                description: data.description,
                notes: data.notes,
                paymentProviderId: data.payment_provider_id,
                paymentProviderName: data.payment_provider.name,
                paymentProviderIcon: data.payment_provider.icon,
                owner: data.owner
            });
            setSubscriptionCount(data.subscriptions?.count || 0);
        } catch (error) {
            console.error('Error fetching funding source:', error);
            addToast('Error loading funding source details', 'error');
            navigate('/funding');
        } finally {
            setLoading(false);
        }

        try {
            const { data, error } = await supabase
                .from('subscription')
                .select(`
                    *,
                    subscription_provider:subscription_provider_id(
                        id, name, description, category, icon
                    ),
                    funding_source:funding_source_id(
                        id, name,
                        payment_provider:payment_provider_id(
                            id, name, icon
                        )
                    )
                `)
                .eq('funding_source_id', id);

            if (error) throw error;

            setSubscriptions(data.map(sub => ({
                id: sub.id,
                providerId: sub.subscription_provider_id,
                providerName: sub.subscription_provider.name,
                providerDescription: sub.subscription_provider.description,
                providerCategory: sub.subscription_provider.category,
                providerIcon: sub.subscription_provider.icon,
                nickname: sub.nickname,
                startDate: sub.start_date,
                recurrence_rule: sub.recurrence_rule,
                recurrence_rule_ui_friendly: sub.recurrence_rule_ui_friendly,
                autoRenewal: sub.autorenew,
                amount: sub.amount,
                fundingSourceId: sub.funding_source_id,
                fundingSource: sub.funding_source ? {
                    id: sub.funding_source.id,
                    name: sub.funding_source.name,
                    paymentProviderName: sub.funding_source.payment_provider.name,
                    paymentProviderIcon: sub.funding_source.payment_provider.icon
                } : undefined,
                notes: sub.notes,
                state: sub.state
            } satisfies Subscription)));
            setSummary(calculatePaymentSummary(data));
            setSubscriptionCount(data.length || 0);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            addToast('Error loading subscriptions', 'error');
        }
    };

    return (
        <Container className="py-4">
            <div className="mb-4">
                <Button variant="link" className="px-0" onClick={() => navigate('/funding')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Funding Sources
                </Button>
            </div>

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : fundingSource && (
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
                                        minWidth: '48px',
                                        flexShrink: 0,
                                        backgroundColor: 'var(--bs-white)'
                                    }}>
                                    <img
                                        src={fundingSource.paymentProviderIcon}
                                        alt={fundingSource.paymentProviderName}
                                        style={{
                                            width: '150%',
                                            height: '150%',
                                            objectFit: 'contain',
                                            flexShrink: 0
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="mb-1">{fundingSource.name}</h3>
                                    <div className='text-muted' style={{ fontSize: '0.85em' }}>
                                        {fundingSource.description}
                                    </div>
                                    <Badge bg="info">
                                        <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                                        {subscriptionCount} Subscription{subscriptionCount !== 1 ? 's' : ''}
                                    </Badge>
                                    {fundingSource.notes && (
                                        <>
                                            <dt className="col-sm-3">Notes</dt>
                                            <dd className="col-sm-9">{fundingSource.notes}</dd>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center" onClick={() => setShowEdit(true)}>
                                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                                    Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" className="d-inline-flex align-items-center"
                                    onClick={() => subscriptionCount > 0 ? setShowUnable(true) : setShowDelete(true)}>
                                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-12 col-md-3">
                                <Card className="h-100 shadow-sm" style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)'
                                }}>
                                    
                                    <Card.Body className="text-center">
                                        <h4 className="mb-0">${summary.daily.toFixed(2)}</h4>
                                    </Card.Body>
                                    <Card.Footer className="text-center">
                                        <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
                                        Per Day
                                    </Card.Footer>
                                </Card>
                            </div>
                            <div className="col-12 col-md-3">
                                <Card className="h-100 shadow-sm" style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)'
                                }}>
                                    
                                    <Card.Body className="text-center">
                                        <h4 className="mb-0">${summary.weekly.toFixed(2)}</h4>
                                    </Card.Body>
                                    <Card.Footer className="text-center">
                                        <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                                        Per Week
                                    </Card.Footer>
                                </Card>
                            </div>
                            <div className="col-12 col-md-3">
                                <Card className="h-100 shadow-sm" style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)'
                                }}>

                                    <Card.Body className="text-center">
                                        <h4 className="mb-0">${summary.monthly.toFixed(2)}</h4>
                                    </Card.Body>
                                    <Card.Footer className="text-center">
                                        <FontAwesomeIcon icon={faCalendarDays} className="me-2" />
                                        Per Month
                                    </Card.Footer>
                                </Card>
                            </div>
                            <div className="col-12 col-md-3">
                                <Card className="h-100 shadow-sm" style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)'
                                }}>
                                    
                                    <Card.Body className="text-center">
                                        <h4 className="mb-0">${summary.yearly.toFixed(2)}</h4>
                                    </Card.Body>
                                    <Card.Footer className="text-center">
                                        <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                        Per Year
                                    </Card.Footer>
                                </Card>
                            </div>
                        </div>

                    </Card.Body>
                </Card>
            )}

            <Card className="mt-4 shadow">
                <Card.Body>
                    <h5 className="mb-4">Linked Subscriptions</h5>
                    <SubscriptionBrowser
                        subscriptions={subscriptions}
                        onEdit={(sub) => {
                            setSelectedSubscription(sub);
                            setShowEdit(true);
                        }}
                        onDelete={(sub) => {
                            setSelectedSubscription(sub);
                            setShowDelete(true);
                        }}
                        emptyStateComponent={
                            <Alert variant="info">
                                No subscriptions are currently using this funding source.
                            </Alert>
                        }
                    />
                </Card.Body>
            </Card>

            <EditFundingModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                fundingSource={fundingSource}
                onSubmit={async () => {
                    await fetchFundingSource();
                    setShowEdit(false);
                }}
            />

            <DeleteFundingModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                fundingSource={fundingSource}
                onDelete={() => {
                    navigate('/funding');
                }}
            />

            <DeleteUnableFundingModal
                show={showUnable}
                onHide={() => setShowUnable(false)}
                name={fundingSource?.name || null}
                subscriptionCount={subscriptionCount}
            />

            <EditSubscriptionModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                subscription={selectedSubscription}
                onSubmit={async () => {
                    await fetchFundingSource(); // Refresh the data
                    setShowEdit(false);
                }}
            />

            <DeleteSubscriptionModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                subscription={selectedSubscription}
                onDelete={async () => {
                    await fetchFundingSource(); // Refresh the data
                    setShowDelete(false);
                }}
            />
        </Container>
    );
};

export default FundingDetailPage;