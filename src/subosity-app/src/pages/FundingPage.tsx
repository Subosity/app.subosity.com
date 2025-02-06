import { faMoneyBill, faPlus, faThLarge, faList, faFilter, faSearch, faCheck, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { Button, InputGroup, Form, Collapse, Card } from "react-bootstrap";
import Select from 'react-select';
import { supabase } from '../supabaseClient';
import { useToast } from '../ToastContext';
import { FundingSource } from "../types/FundingSource";
import AddFundingModal from "../components/Funding/AddFundingModal";
import NoFundingSourcesContent from "../components/Funding/NoFundingSourcesContent";
import FundingCard from "../components/Funding/FundingCard";
import FundingListItem from "../components/Funding/FundingListItem";
import EditFundingModal from "../components/Funding/EditFundingModal";
import DeleteFundingModal from "../components/Funding/DeleteFundingModal";
import DeleteUnableFundingModal from "../components/Funding/DeleteUnableFundingModal";
import NoMatchesContent from "../components/Funding/NoMatchesContent";
import { selectStyles } from "../styles/selectStyles";

const FundingPage = () => {
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
    const [viewMode, setViewMode] = useState(() =>
        localStorage.getItem('fundingViewMode') || 'card'
    );
    const { addToast } = useToast();

    // Add state for edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [selectedSource, setSelectedSource] = useState<FundingSource | null>(null);

    // Add state for delete modal
    const [showDelete, setShowDelete] = useState(false);
    const [showUnable, setShowUnable] = useState(false);

    // Add state for search and filters
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [excludedTypes, setExcludedTypes] = useState<string[]>([]);

    useEffect(() => {
        localStorage.setItem('fundingViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        fetchFundingSources();
    }, []);

    const fetchFundingSources = async () => {
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
                    subscriptions:subscription(
                        id,
                        subscription_provider:subscription_provider_id(
                            id,
                            name,
                            description,
                            category,
                            icon
                        ),
                        amount,
                        start_date,
                        state
                    )
                `);

            if (error) throw error;

            setFundingSources(data?.map(source => ({
                id: source.id,
                name: source.name,
                description: source.description,
                notes: source.notes,
                paymentProvider: source.payment_provider,
                owner: source.owner,
                subscriptions: source.subscriptions || [],
                funding_type: source.funding_type
            })) || []);
        } catch (error) {
            addToast('Error loading funding sources', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add helper function to get unique funding types
    const getUniqueFundingTypes = (sources: FundingSource[]): string[] => {
        return [...new Set(sources
            .map(source => source.funding_type)
            .filter(Boolean)
            .sort()
        )];
    };

    // Add filter function
    const filterFundingSources = (sources: FundingSource[]): FundingSource[] => {
        return sources.filter(source => {
            // Check if funding type is excluded
            if (excludedTypes.includes(source.funding_type)) {
                return false;
            }

            // Search text matching
            const searchLower = searchText.toLowerCase();
            return searchText === '' || 
                source.name.toLowerCase().includes(searchLower) ||
                source.description.toLowerCase().includes(searchLower) ||
                source.funding_type.toLowerCase().includes(searchLower) ||
                source.paymentProvider.name.toLowerCase().includes(searchLower);
        });
    };

    // Update the content rendering to use filtered sources
    const filteredSources = filterFundingSources(fundingSources);

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h3 className="mb-1" style={{ color: 'var(--bs-body-color)' }}>
                        <FontAwesomeIcon icon={faMoneyBill} className="me-2" />
                        My Funding Sources
                    </h3>
                    {/* Replace text-muted with explicit color */}
                    <p className="mb-0" style={{ color: 'var(--bs-body-color)', opacity: 0.75 }}>
                        Manage and track all your funding sources.
                    </p>
                </div>
                <Button variant="primary" onClick={() => setShowAdd(true)} className="d-flex align-items-center nowrap">
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    <span className="d-none d-md-inline">Add Funding Source</span>
                    <span className="d-none d-sm-inline d-md-none">Add</span>
                </Button>
            </div>

            {/* Search, Filter, and View Controls */}
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex gap-2 align-items-center">
                        <InputGroup className="flex-grow-1">
                            <InputGroup.Text style={{
                                backgroundColor: 'var(--bs-body-bg)',
                                color: 'var(--bs-body-color)'
                            }}>
                                <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search funding sources..."
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
                            {excludedTypes.length > 0 && (
                                <span
                                    className="position-absolute translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.65em', top: -2, right: -2, padding: '0.35em 0.5em' }}
                                >
                                    {excludedTypes.length}
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
                                    <Form.Label>
                                        Exclude Funding Types<br />
                                        <small className="text-muted">Exclude funding types from the current view.</small>
                                    </Form.Label>
                                    <Select
                                        isMulti
                                        value={getUniqueFundingTypes(fundingSources)
                                            .filter(type => excludedTypes.includes(type))
                                            .map(type => ({ value: type, label: type }))}
                                        onChange={(selected) => {
                                            setExcludedTypes(selected ? selected.map(option => option.value) : []);
                                        }}
                                        options={getUniqueFundingTypes(fundingSources)
                                            .map(type => ({ value: type, label: type }))}
                                        placeholder="Select types to exclude..."
                                        styles={selectStyles}
                                    />
                                </Card.Body>
                                <Card.Footer className="d-flex justify-content-end">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setExcludedTypes([]);
                                            setSearchText('');
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
            {loading ? (
                <div className="text-center mt-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filteredSources.length === 0 ? (
                searchText || excludedTypes.length > 0 ? (
                    <NoMatchesContent onReset={() => {
                        setSearchText('');
                        setExcludedTypes([]);
                    }} />
                ) : (
                    <NoFundingSourcesContent onAdd={() => setShowAdd(true)} />
                )
            ) : (
                <>
                    {viewMode === 'card' ? (
                        <div className="row g-2">
                            {filteredSources.map(source => (
                                <div key={source.id} className="col-12 col-md-6 col-lg-4">
                                    <FundingCard
                                        fundingSource={source}
                                        onEdit={(source) => {
                                            setSelectedSource(source);
                                            setShowEdit(true);
                                        }}
                                        onDelete={(source) => {
                                            setSelectedSource(source);
                                            source.subscriptions.length > 0 ? setShowUnable(true) : setShowDelete(true);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded shadow">
                            {filteredSources.map(source => (
                                <FundingListItem
                                    key={source.id}
                                    fundingSource={source}
                                    onEdit={(source) => {
                                        setSelectedSource(source);
                                        setShowEdit(true);
                                    }}
                                    onDelete={(source) => {
                                        setSelectedSource(source);
                                        source.subscriptions.length > 0 ? setShowUnable(true) : setShowDelete(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <AddFundingModal
                show={showAdd}
                onHide={() => setShowAdd(false)}
                onSubmit={async (data) => {
                    await fetchFundingSources();
                    setShowAdd(false);
                }}
            />

            {/* Add EditFundingModal */}
            <EditFundingModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                fundingSource={selectedSource}
                onSubmit={async () => {
                    await fetchFundingSources();
                    setShowEdit(false);
                }}
            />

            {/* Add DeleteFundingModal */}
            <DeleteFundingModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                fundingSource={selectedSource}
                onDelete={async () => {
                    await fetchFundingSources();
                    setShowDelete(false);
                }}
            />

            <DeleteUnableFundingModal
                name={selectedSource?.name || null}
                subscriptionCount={selectedSource?.subscriptionCount || 0}
                show={showUnable}
                onHide={() => setShowUnable(false)}
            />
        </div>
    );
};

export default FundingPage;
