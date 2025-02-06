// src/components/SubscriptionBrowser.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, Form, InputGroup, Alert, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faList, faSearch, faFilter, faCheck, faRotateLeft, faClock, faCheckCircle, faBan, faTimesCircle, faPause, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../../types/Subscription';
import SubscriptionCard from './SubscriptionCard';
import SubscriptionListItem from './SubscriptionListItem';
import Select, { components } from 'react-select';
import { selectStyles } from '../../styles/selectStyles';

interface Props {
    subscriptions: Subscription[];
    onEdit: (subscription: Subscription) => void;
    onDelete: (subscription: Subscription) => void;
    emptyStateComponent?: React.ReactNode;
    // Add new optional prop
    onFilterChange?: (filteredSubscriptions: Subscription[]) => void;
}

const SubscriptionBrowser: React.FC<Props> = ({
    subscriptions,  // Source of truth - never mutated 
    onEdit,
    onDelete,
    emptyStateComponent,
    onFilterChange
}) => {
    const [viewMode, setViewMode] = useState(() =>
        localStorage.getItem('subscriptionViewMode') || 'card'
    );
    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'frequency'>('name');
    const [excludedStates, setExcludedStates] = useState<string[]>([]);
    const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Add state filter options
    const stateFilterOptions = [
        { value: 'trial', label: 'Trial', icon: faClock },
        { value: 'active', label: 'Active', icon: faCheckCircle },
        { value: 'canceled', label: 'Canceled', icon: faBan },
        { value: 'expired', label: 'Expired', icon: faTimesCircle },
        { value: 'paused', label: 'Paused', icon: faPause }
    ];

    // Save view mode preference
    useEffect(() => {
        localStorage.setItem('subscriptionViewMode', viewMode);
    }, [viewMode]);

    // Get unique categories helper
    const getUniqueCategories = (subs: Subscription[]): string[] => {
        return [...new Set(subs
            .map(sub => sub.providerCategory)
            .filter(Boolean)
            .sort()
        )];
    };

    // Keep all the filtering and sorting logic
    const filterSubscriptions = (subs: Subscription[]): Subscription[] => {
        return subs.filter(sub =>
            !excludedStates.includes(sub.state) &&
            !excludedCategories.includes(sub.providerCategory) &&
            (searchText === '' ||
                sub.providerName.toLowerCase().includes(searchText.toLowerCase()) ||
                sub.providerDescription.toLowerCase().includes(searchText.toLowerCase()))
        );
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

    // Calculate filtered results once
    const filteredAndSortedSubscriptions = useMemo(() => {
        const filtered = filterSubscriptions(subscriptions);
        const sorted = sortSubscriptions(filtered);
        return sorted;
    }, [subscriptions, searchText, excludedStates, excludedCategories, sortOrder]);

    // Emit changes ONLY when filters/sort change, not when results change
    useEffect(() => {
        if (onFilterChange) {
            // If no filters active, pass null
            const hasActiveFilters = searchText !== '' ||
                excludedStates.length > 0 ||
                excludedCategories.length > 0;

            if (!hasActiveFilters) {
                onFilterChange(null);
            } else {
                onFilterChange(filteredAndSortedSubscriptions);
            }
        }
    }, [searchText, excludedStates, excludedCategories, sortOrder]); // Remove filtered results dependency

    // Move the NoMatchesContent here as it's specific to browsing
    const NoMatchesContent = () => (
        <Alert className="text-center p-5 bg-body-tertiary border">
            <div className="mb-3">
                <FontAwesomeIcon icon={faSearch} className="text-secondary fa-3x" />
            </div>
            <h4 className="text-body">No Matches Found</h4>
            <p className="text-body-secondary mb-4">
                No subscriptions match your search criteria. Try adjusting your search terms.
            </p>
            <Button
                variant="secondary"
                onClick={() => {
                    setSearchText('');
                    setExcludedStates([]);
                    setExcludedCategories([]);
                    setSortOrder('name');
                }}
            >
                <FontAwesomeIcon icon={faXmark} className="me-2" />
                Clear All Filters
            </Button>
        </Alert>
    );

    return (
        <>
            {/* Search and Filter Controls */}
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
                            <FontAwesomeIcon icon={faFilter} />
                            <span className="d-none d-sm-inline ms-2">Filters</span>
                            {(excludedStates.length > 0 || excludedCategories.length > 0) && (
                                <span
                                    className="position-absolute translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.65em', top: -2, right: -2, padding: '0.35em 0.5em' }}
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

                    {/* Filters Collapse Section */}
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
                                                <small className="text-muted">Exclude subscription States from the current view.</small>
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
                                                <small className="text-muted">Exclude Categories from the current view.</small>
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
                                </Card.Body>
                                <Card.Footer className="d-flex justify-content-end">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setExcludedStates([]);
                                            setExcludedCategories([]);
                                            setSearchText('');
                                            setSortOrder('name');
                                            setShowFilters(false);
                                        }}
                                        className="me-2"
                                    >
                                        <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                                        Reset All
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                                        Apply Filters
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </div>
                    </Collapse>
                </div>
            </div>

            {/* Content Area */}
            {filteredAndSortedSubscriptions.length === 0 ? (
                searchText || excludedStates.length > 0 || excludedCategories.length > 0 ? (
                    <NoMatchesContent />
                ) : (
                    emptyStateComponent
                )
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="row g-4">
                            {filteredAndSortedSubscriptions.map(subscription => (
                                <div key={subscription.id} className="col-12 col-md-6 col-lg-4">
                                    <SubscriptionCard
                                        subscription={subscription}
                                        onEdit={() => onEdit(subscription)}
                                        onDelete={() => onDelete(subscription)}
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
                                    onEdit={() => onEdit(subscription)}
                                    onDelete={() => onDelete(subscription)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default SubscriptionBrowser;