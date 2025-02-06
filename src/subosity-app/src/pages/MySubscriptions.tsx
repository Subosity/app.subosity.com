import React, { useState, useEffect } from 'react';
import { Button, Alert, Card, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHandHoldingDollar, faSquarePlus, faCalendarDay, faCalendarWeek, faCalendarDays, faCalendar, faThLarge, faList, faMoneyBill, faDollar } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Subscription } from '../types';
import DeleteSubscriptionModal from '../components/Subscription/DeleteSubscriptionModal';
import EditSubscriptionModal from '../components/Subscription/EditSubscriptionModal';
import AddSubscriptionModal from '../components/Subscription/AddSubscriptionModal';
import SubscriptionBrowser from '../components/Subscription/SubscriptionBrowser';
import { calculatePaymentSummary } from '../utils/subscriptionUtils';

const MySubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    const [filteredSummary, setFilteredSummary] = useState(summary);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[] | null>(null);
    const [showCosts, setShowCosts] = useState(false);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
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
                        icon
                    ),
                    funding_source:funding_source_id(
                        id,
                        name,
                        payment_provider:payment_provider_id(
                            id,
                            name,
                            icon
                        )
                    )
                `);

            if (error) throw error;

            const mappedSubscriptions = (data?.map(sub => ({
                id: sub.id,
                providerId: sub.subscription_provider_id,
                providerName: sub.subscription_provider.name,
                providerDescription: sub.subscription_provider.description,
                providerCategory: sub.subscription_provider.category,
                providerIcon: sub.subscription_provider.icon,
                nickname: sub.nickname,
                startDate: sub.start_date,
                recurrenceRule: sub.recurrence_rule,
                recurrenceRuleUiFriendly: sub.recurrence_rule_ui_friendly,
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
            })) || []);

            setSubscriptions(mappedSubscriptions);

            // Calculate initial summary
            const initialSummary = calculatePaymentSummary(mappedSubscriptions);
            setSummary(initialSummary);
            setFilteredSummary(initialSummary);
        } catch (error) {
            addToast('Error loading subscriptions', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add handler for filtered subscriptions
    const handleFilteredSubscriptions = (filtered: Subscription[] | null) => {
        setFilteredSubscriptions(filtered);
        if (filtered) {
            const newSummary = calculatePaymentSummary(filtered);
            setFilteredSummary(newSummary);
        } else {
            setFilteredSummary(summary);
        }
    };

    // Empty state component for when there are no subscriptions
    const NoSubscriptionsContent = () => (
        <Alert className="text-center p-5 bg-body-tertiary border">
            <div className="mb-3">
                <FontAwesomeIcon icon={faHandHoldingDollar} className="text-secondary fa-3x" />
            </div>
            <h4 className="text-body">No Subscriptions Yet</h4>
            <p className="text-body-secondary mb-4">
                You haven't added any subscriptions yet. Start tracking your subscriptions to manage your recurring payments better.
            </p>
            <Button variant="primary" onClick={() => setShowAdd(true)}>
                <FontAwesomeIcon icon={faSquarePlus} className="me-2" />
                Add Your First Subscription
            </Button>
        </Alert>
    );

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 className="mb-1" style={{ color: 'var(--bs-body-color)' }}>
                        <FontAwesomeIcon icon={faHandHoldingDollar} className="me-2" />
                        My Subscriptions
                    </h3>
                    <p className="mb-0" style={{ color: 'var(--bs-body-color)', opacity: 0.75 }}>
                        Manage and track all your subscription services
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" onClick={() => setShowAdd(true)} className="d-flex align-items-center nowrap">
                        <FontAwesomeIcon icon={faPlus} className="me-1" />
                        <span className="d-none d-md-inline">Add Subscription</span>
                        <span className="d-none d-sm-inline d-md-none">Add</span>
                    </Button>
                    <Button
                        variant={showCosts ? 'primary' : 'outline-primary'}
                        onClick={() => setShowCosts(!showCosts)}
                        className="d-flex align-items-center"
                    >
                        <FontAwesomeIcon icon={faMoneyBill} />
                    </Button>
                </div>
            </div>

            <Collapse in={showCosts}>
                <div>

                    <Card className="mb-4 shadow" style={{
                        backgroundColor: 'var(--bs-body-bg)',
                        borderColor: 'var(--bs-border-color)'
                    }}>
                        <Card.Body>
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faMoneyBill} className="me-2"></FontAwesomeIcon>Funding Summary
                            </h5>
                            <div className="mb-1" style={{ 'fontSize': '.85rem' }}>This area shows the cost of the selected subscriptions.</div>
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <Card className="h-100 shadow-sm" style={{
                                        backgroundColor: 'var(--bs-body-bg)',
                                        borderColor: 'var(--bs-border-color)'
                                    }}>
                                        <Card.Body className="text-center">
                                            {filteredSubscriptions ? (
                                                <>
                                                    <h4 className="mb-0">${filteredSummary.daily.toFixed(2)}</h4>
                                                    <h6 className="mb-0 text-muted">
                                                        of ${summary.daily.toFixed(2)} total
                                                        <small style={{ "fontSize": "0.7rem" }}>
                                                            {summary.daily > 0 && ` (${Math.round((filteredSummary.daily / summary.daily) * 100)}%)`}
                                                        </small>
                                                    </h6>
                                                </>
                                            ) : (
                                                <h4 className="mb-0">${summary.daily.toFixed(2)}</h4>
                                            )}
                                        </Card.Body>
                                        <Card.Footer className="text-center">
                                            <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
                                            Per Day
                                        </Card.Footer>
                                    </Card>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Card className="h-100 shadow-sm" style={{
                                        backgroundColor: 'var(--bs-body-bg)',
                                        borderColor: 'var(--bs-border-color)'
                                    }}>
                                        <Card.Body className="text-center">
                                            {filteredSubscriptions ? (
                                                <>
                                                    <h4 className="mb-0">${filteredSummary.weekly.toFixed(2)}</h4>
                                                    <h6 className="mb-0 text-muted">
                                                        of ${summary.weekly.toFixed(2)} total
                                                        <small style={{ "fontSize": "0.7rem" }}>
                                                            {summary.weekly > 0 && ` (${Math.round((filteredSummary.weekly / summary.weekly) * 100)}%)`}
                                                        </small>
                                                    </h6>
                                                </>
                                            ) : (
                                                <h4 className="mb-0">${summary.weekly.toFixed(2)}</h4>
                                            )}
                                        </Card.Body>
                                        <Card.Footer className="text-center">
                                            <FontAwesomeIcon icon={faCalendarWeek} className="me-2" />
                                            Per Week
                                        </Card.Footer>
                                    </Card>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Card className="h-100 shadow-sm" style={{
                                        backgroundColor: 'var(--bs-body-bg)',
                                        borderColor: 'var(--bs-border-color)'
                                    }}>
                                        <Card.Body className="text-center">
                                            {filteredSubscriptions ? (
                                                <>
                                                    <h4 className="mb-0">${filteredSummary.monthly.toFixed(2)}</h4>
                                                    <h6 className="mb-0 text-muted">
                                                        of ${summary.monthly.toFixed(2)} total
                                                        <small style={{ "fontSize": "0.7rem" }}>
                                                            {summary.monthly > 0 && ` (${Math.round((filteredSummary.monthly / summary.monthly) * 100)}%)`}
                                                        </small>
                                                    </h6>
                                                </>
                                            ) : (
                                                <h4 className="mb-0">${summary.monthly.toFixed(2)}</h4>
                                            )}
                                        </Card.Body>
                                        <Card.Footer className="text-center">
                                            <FontAwesomeIcon icon={faCalendarDays} className="me-2" />
                                            Per Month
                                        </Card.Footer>
                                    </Card>
                                </div>
                                <div className="col-6 col-md-3">
                                    <Card className="h-100 shadow-sm" style={{
                                        backgroundColor: 'var(--bs-body-bg)',
                                        borderColor: 'var(--bs-border-color)'
                                    }}>
                                        <Card.Body className="text-center">
                                            {filteredSubscriptions ? (
                                                <>
                                                    <h4 className="mb-0">${filteredSummary.yearly.toFixed(2)}</h4>
                                                    <h6 className="mb-0 text-muted">
                                                        of ${summary.yearly.toFixed(2)} total
                                                        <small style={{ "fontSize": "0.7rem" }}>
                                                            {summary.yearly > 0 && ` (${Math.round((filteredSummary.yearly / summary.yearly) * 100)}%)`}
                                                        </small>
                                                    </h6>
                                                </>
                                            ) : (
                                                <h4 className="mb-0">${summary.yearly.toFixed(2)}</h4>
                                            )}
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
                </div>
            </Collapse>


            {loading ? (
                <div className="text-center mt-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
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
                    onFilterChange={handleFilteredSubscriptions}
                    emptyStateComponent={<NoSubscriptionsContent />}
                />
            )}

            {/* Modals */}
            <DeleteSubscriptionModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                subscription={selectedSubscription}
                onDelete={async () => {
                    await fetchSubscriptions();
                    setShowDelete(false);
                }}
            />

            <EditSubscriptionModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                subscription={selectedSubscription}
                onSubmit={async () => {
                    await fetchSubscriptions();
                    setShowEdit(false);
                }}
            />

            <AddSubscriptionModal
                show={showAdd}
                onHide={() => setShowAdd(false)}
                onSubmit={async () => {
                    await fetchSubscriptions();
                    setShowAdd(false);
                }}
            />
        </div>
    );
};

export default MySubscriptions;