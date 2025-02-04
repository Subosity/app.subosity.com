import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faHandHoldingDollar, faSquarePlus } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { Subscription } from '../types';
import DeleteSubscriptionModal from '../components/DeleteSubscriptionModal';
import EditSubscriptionModal from '../components/EditSubscriptionModal';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import SubscriptionBrowser from '../components/Subscription/SubscriptionBrowser';

const MySubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

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

            setSubscriptions(data?.map(sub => ({
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
        } catch (error) {
            addToast('Error loading subscriptions', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
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
                <Button variant="primary" onClick={() => setShowAdd(true)} className="d-flex align-items-center nowrap">
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    <span className="d-none d-sm-inline">Add Subscription</span>
                    <span className="d-inline d-sm-none">Add</span>
                </Button>
            </div>

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