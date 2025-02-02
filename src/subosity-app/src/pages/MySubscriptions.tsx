import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Offcanvas, Form, InputGroup, Alert, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faThLarge, faList, faSearch, faSort, faHandHoldingDollar, faSquarePlus, faClock, faCheckCircle, faBan, faTimesCircle, faPause, faQuestion, faXmark, faFilter, faCheck } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionListItem from '../components/SubscriptionListItem';
import DeleteSubscriptionModal from '../components/DeleteSubscriptionModal';
import EditSubscriptionModal from '../components/EditSubscriptionModal';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import { Subscription } from '../types';
import Select, { components } from 'react-select';

const MySubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [viewMode, setViewMode] = useState(() =>
        localStorage.getItem('subscriptionViewMode') || 'card'
    );
    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'frequency'>('name');
    const [selectedStates, setSelectedStates] = useState<string[]>(['trial', 'active', 'canceled', 'expired', 'paused']);
    const [excludedStates, setExcludedStates] = useState<string[]>([]);
    const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const stateFilterOptions = [
        { value: 'trial', label: 'Trial', icon: faClock },
        { value: 'active', label: 'Active', icon: faCheckCircle },
        { value: 'canceled', label: 'Canceled', icon: faBan },
        { value: 'expired', label: 'Expired', icon: faTimesCircle },
        { value: 'paused', label: 'Paused', icon: faPause }
    ];

    useEffect(() => {
        localStorage.setItem('subscriptionViewMode', viewMode);
    }, [viewMode]);

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
                    payment_provider:payment_provider_id(
                        id,
                        name,
                        icon
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
                nickname: sub.nickname,  // Add this line
                startDate: sub.start_date,
                recurrenceRule: sub.recurrence_rule,
                recurrenceRuleUiFriendly: sub.recurrence_rule_ui_friendly,
                autoRenewal: sub.autorenew,
                amount: sub.amount,
                paymentProviderId: sub.payment_provider_id,
                paymentProviderName: sub.payment_provider.name,
                paymentProviderIcon: sub.payment_provider.icon,
                paymentDetails: sub.payment_details,
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

    const filterSubscriptions = (subs: Subscription[]): Subscription[] => {
        // Filter by both states and categories
        return subs.filter(sub =>
            !excludedStates.includes(sub.state) &&
            !excludedCategories.includes(sub.providerCategory)
        );
        // ... rest of your existing search logic
    };

    const sortSubscriptions = (subs: Subscription[]) => {
        return [...subs].sort((a, b) => {
            switch (sortOrder) {
                case 'name':
                    return a.providerName.localeCompare(b.providerName);
                case 'date':
                    return new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime();
                case 'frequency':
                    return (a.recurrenceRule || '').localeCompare(b.recurrenceRule || '');
                default:
                    return 0;
            }
        });
    };

    const filteredAndSortedSubscriptions = sortSubscriptions(filterSubscriptions(subscriptions));

    const getStateDisplay = (state: string) => {
        switch (state) {
            case 'trial':
                return {
                    icon: faClock,
                    color: 'info',
                    label: 'Trial'
                };
            case 'active':
                return {
                    icon: faCheckCircle,
                    color: 'success',
                    label: 'Active'
                };
            case 'canceled':
                return {
                    icon: faBan,
                    color: 'danger',
                    label: 'Canceled'
                };
            case 'expired':
                return {
                    icon: faTimesCircle,
                    color: 'secondary',
                    label: 'Expired'
                };
            case 'paused':
                return {
                    icon: faPause,
                    color: 'warning',
                    label: 'Paused'
                };
            default:
                return {
                    icon: faQuestion,
                    color: 'secondary',
                    label: state
                };
        }
    };

    // First, define the content components
    const NoSubscriptionsContent = ({ onAdd }: { onAdd: () => void }) => (
        <Alert className="text-center p-5 bg-body-tertiary border">
            <div className="mb-3">
                <FontAwesomeIcon icon={faHandHoldingDollar} className="text-secondary fa-3x" />
            </div>
            <h4 className="text-body">No Subscriptions Yet</h4>
            <p className="text-body-secondary mb-4">
                You haven't added any subscriptions yet. Start tracking your subscriptions to manage your recurring payments better.
            </p>
            <Button variant="primary" onClick={onAdd}>
                <FontAwesomeIcon icon={faSquarePlus} className="me-2" />
                Add Your First Subscription
            </Button>
        </Alert>
    );

    const NoMatchesContent = ({ onClear }: { onClear: () => void }) => (
        <Alert className="text-center p-5 bg-body-tertiary border">
            <div className="mb-3">
                <FontAwesomeIcon icon={faSearch} className="text-secondary fa-3x" />
            </div>
            <h4 className="text-body">No Matches Found</h4>
            <p className="text-body-secondary mb-4">
                No subscriptions match your search criteria. Try adjusting your search terms.
            </p>
            <Button variant="secondary" onClick={onClear}>
                <FontAwesomeIcon icon={faXmark} className="me-2" />
                Clear Search
            </Button>
        </Alert>
    );

    // Add custom Menu component
    const CustomMenu = ({ children, ...props }: any) => {
        const selectAll = () => {
            props.selectProps.onChange(stateFilterOptions);
        };

        const selectNone = () => {
            props.selectProps.onChange([]);
        };

        return (
            <components.Menu {...props}>
                <div className="d-flex justify-content-between px-2 py-1 border-bottom">
                    <Button size="sm" variant="link" onClick={selectAll}>Select All</Button>
                    <Button size="sm" variant="link" onClick={selectNone}>Select None</Button>
                </div>
                {children}
            </components.Menu>
        );
    };

    const getUniqueCategories = (subs: Subscription[]): string[] => {
        return [...new Set(subs
            .map(sub => sub.providerCategory)
            .filter(Boolean)
            .sort()
        )];
    };

    // First, add the select styles object
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: 'var(--bs-body-bg)',
            borderColor: 'var(--bs-border-color)',
            '&:hover': {
                borderColor: 'var(--bs-primary)'
            }
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: 'var(--bs-body-bg)',
            borderColor: 'var(--bs-border-color)'
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused
                ? 'var(--bs-primary)'
                : 'var(--bs-body-bg)',
            color: state.isFocused
                ? 'white'
                : 'var(--bs-body-color)'
        }),
        input: (base: any) => ({
            ...base,
            color: 'var(--bs-body-color)'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: 'var(--bs-body-color)'
        }),
        multiValue: (base: any) => ({
            ...base,
            backgroundColor: 'var(--bs-primary)',
            color: 'white'
        }),
        multiValueLabel: (base: any) => ({
            ...base,
            color: 'white'
        }),
        multiValueRemove: (base: any) => ({
            ...base,
            color: 'white',
            ':hover': {
                backgroundColor: 'var(--bs-primary-dark)',
                color: 'white'
            }
        })
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 className="mb-1" style={{ color: 'var(--bs-body-color)' }}>
                        <FontAwesomeIcon icon={faHandHoldingDollar} className="me-2" />
                        My Subscriptions
                    </h3>
                    {/* Replace text-muted with explicit color */}
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

            {/* Search and Sort Controls - Always visible */}
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex gap-2">
                        <InputGroup className="flex-grow-1">
                            <InputGroup.Text style={{
                                backgroundColor: 'var(--bs-body-bg)',
                                color: 'var(--bs-body-color)'
                            }}>
                                <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search subscriptions..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    color: 'var(--bs-body-color)'
                                }}
                            />
                        </InputGroup>

                        <Button
                            variant={showFilters ? 'primary' : 'primary'}
                            onClick={() => setShowFilters(!showFilters)}
                            className="d-flex align-items-center position-relative"
                        >
                            <FontAwesomeIcon icon={faFilter} className="me-2" />
                            Filters
                            {(excludedStates.length > 0 || excludedCategories.length > 0) && (
                                <span
                                    className="position-absolute translate-middle badge rounded-pill bg-danger"
                                    style={{
                                        fontSize: '0.65em',
                                        top: -2,
                                        right: -2,
                                        padding: '0.35em 0.5em'
                                    }}
                                >
                                    {excludedStates.length + excludedCategories.length}
                                    <span className="visually-hidden">active filters</span>
                                </span>
                            )}
                        </Button>

                        <div className="btn-group">
                            <Button
                                variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
                                onClick={() => setViewMode('card')}
                            >
                                <FontAwesomeIcon icon={faThLarge} />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                                onClick={() => setViewMode('list')}
                            >
                                <FontAwesomeIcon icon={faList} />
                            </Button>
                        </div>
                    </div>

                    {/* Collapsible Filters Section */}
                    <Collapse in={showFilters}>
                        <div>
                            <Card className="mt-3 shadow-sm" style={{
                                backgroundColor: 'var(--bs-body-bg)',
                                borderColor: 'var(--bs-border-color)'
                            }}>
                                <Card.Body>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <Form.Label>
                                                Exclude States<br />
                                                <small className="text-muted">Exclude certain subscription States from the current view.</small>
                                            </Form.Label>
                                            <Select
                                                isMulti
                                                value={stateFilterOptions.filter(option =>
                                                    excludedStates.includes(option.value)
                                                )}
                                                onChange={(selected) => {
                                                    setExcludedStates(selected ? selected.map(option => option.value) : []);
                                                }}
                                                options={stateFilterOptions}
                                                placeholder="Select states to exclude..."
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Form.Label>
                                                Exclude Categories<br />
                                                <small className="text-muted">Exclude certain subscription Categories from the current view.</small>
                                                </Form.Label>
                                            <Select
                                                isMulti
                                                value={getUniqueCategories(subscriptions)
                                                    .filter(cat => excludedCategories.includes(cat))
                                                    .map(cat => ({ value: cat, label: cat }))}
                                                onChange={(selected) => {
                                                    setExcludedCategories(selected ? selected.map(option => option.value) : []);
                                                }}
                                                options={getUniqueCategories(subscriptions)
                                                    .map(cat => ({ value: cat, label: cat }))}
                                                placeholder="Select categories to exclude..."
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <Form.Label>
                                                Sort By<br />
                                                <small className="text-muted">Sort your subscriptions, in the current view.</small>
                                                </Form.Label>
                                            <Form.Select
                                                value={sortOrder}
                                                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                                                style={{
                                                    backgroundColor: 'var(--bs-body-bg)',
                                                    color: 'var(--bs-body-color)',
                                                    borderColor: 'var(--bs-border-color)'
                                                }}
                                            >
                                                <option value="name">Name</option>
                                                <option value="date">Date</option>
                                                <option value="frequency">Frequency</option>
                                            </Form.Select>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end mt-3">
                                        <Button
                                            variant="primary"
                                            onClick={() => setShowFilters(false)}
                                        >
                                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                                            Apply Filters
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </Collapse>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="text-center mt-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : subscriptions.length === 0 ? (
                <NoSubscriptionsContent onAdd={() => setShowAdd(true)} />
            ) : filteredAndSortedSubscriptions.length === 0 ? (
                <NoMatchesContent onClear={() => setSearchText('')} />
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="row g-4">
                            {filteredAndSortedSubscriptions.map(subscription => (
                                <div key={subscription.id} className="col-12 col-md-6 col-lg-4">
                                    <SubscriptionCard
                                        subscription={subscription}
                                        onEdit={(sub) => {
                                            setSelectedSubscription(sub);
                                            setShowEdit(true);
                                        }}
                                        onDelete={(sub) => {
                                            setSelectedSubscription(sub);
                                            setShowDelete(true);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded">
                            {filteredAndSortedSubscriptions.map(subscription => (
                                <SubscriptionListItem
                                    key={subscription.id}
                                    subscription={subscription}
                                    onEdit={(sub) => {
                                        setSelectedSubscription(sub);
                                        setShowEdit(true);
                                    }}
                                    onDelete={(sub) => {
                                        setSelectedSubscription(sub);
                                        setShowDelete(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <DeleteSubscriptionModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                subscription={selectedSubscription}
                onDelete={async () => {
                    await fetchSubscriptions(); // Refresh the list
                    setShowDelete(false);
                }}
            />

            <EditSubscriptionModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                subscription={selectedSubscription}
                onSubmit={async (data) => {
                    await fetchSubscriptions(); // Refresh the list after update
                    setShowEdit(false);
                }}
            />

            <AddSubscriptionModal
                show={showAdd}
                onHide={() => setShowAdd(false)}
                onSubmit={async (data) => {
                    await fetchSubscriptions(); // Refresh the list after add
                    setShowAdd(false);
                }}
            />
        </div>
    );
};

export default MySubscriptions;