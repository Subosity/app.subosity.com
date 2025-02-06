// src/subosity-app/src/components/AddSubscriptionProviderModal.tsx
import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSave, faPlus, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import SubscriptionProviderFinder from './SubscriptionProviderFinder';
import { useToast } from '../../ToastContext';
import { supabase } from '../../supabaseClient';
import Select from 'react-select/creatable';

interface Props {
    show: boolean;
    onHide: () => void;
    onSave: (data: any) => void;
    existingProviders: Array<{ name: string, website: string }>;
}

const AddSubscriptionProviderModal: React.FC<Props> = ({ 
    show, 
    onHide, 
    onSave,
    existingProviders 
}) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        website: '',
        unsubscribe_url: '',
        icon: ''
    });
    const [isFormValid, setIsFormValid] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
    const [submitted, setSubmitted] = useState(false);
    const [providers, setProviders] = useState<any[]>([]);

    // Update validation effect
    useEffect(() => {
        const isValid = Boolean(
            formData.name?.trim() &&
            formData.description?.trim() &&
            formData.icon?.trim() &&
            formData.category?.trim()  // Add category validation
        );
        setIsFormValid(isValid);
    }, [formData]);

    // Add this effect to fetch unique categories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('subscription_provider')
                .select('category')
                .not('category', 'is', null);
            
            if (data && !error) {
                // Get unique categories and sort them
                const uniqueCategories = [...new Set(data.map(item => item.category))]
                    .filter(Boolean)
                    .sort();
                setCategories(uniqueCategories);
            }
        };

        fetchCategories();
    }, []);

    // Add effect to fetch providers
    useEffect(() => {
        const fetchProviders = async () => {
            const { data } = await supabase
                .from('subscription_provider')
                .select('name, website');
            if (data) setProviders(data);
        };
        fetchProviders();
    }, []);

    const validateProvider = (metadata: { name: string, website?: string }) => {
        const existingProvider = providers.find(p => 
            p.website === metadata.website || 
            p.name.toLowerCase() === metadata.name.toLowerCase()
        );
        
        if (existingProvider) {
            addToast('A subscription provider with this name or website already exists in the system.', 'error');
            return false;
        }
        return true;
    };

    const handleMetadataFetched = (metadata: { name: string; description: string; website?: string }) => {
        if (!validateProvider(metadata)) return;
        
        setFormData(prev => ({
            ...prev,
            name: metadata.name,
            description: metadata.description,
            website: metadata.website || ''
        }));
    };

    // Add icon selection handler
    const handleIconSelected = (iconUrl: string) => {
        setFormData(prev => ({
            ...prev,
            icon: iconUrl
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        if (!isFormValid) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            const subscriptionProviderData = {
                owner: user.id,
                name: formData.name,
                description: formData.description,
                icon: formData.icon,
                category: formData.category,
                website: formData.website,
                unsubscribe_url: formData.unsubscribe_url,
                is_default: false,
                is_public: false,
                is_pending: true,
                is_enabled: true
            };

            const { error } = await supabase
                .from('subscription_provider')
                .insert([subscriptionProviderData]);

            if (error) throw error;

            addToast('Subscription provider added successfully', 'success');
            onSave(subscriptionProviderData);
            onHide();
        } catch (error) {
            console.error('Error adding subscription provider:', error);
            addToast('Failed to add subscription provider', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Add Subscription Provider
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Add a new subscription provider to the system.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <SubscriptionProviderFinder 
                            onMetadataFetched={handleMetadataFetched}
                            onIconSelected={handleIconSelected}
                            name={formData.name}
                            description={formData.description}
                            category={formData.category}
                            onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
                            onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
                            onWebsiteChange={(website) => setFormData(prev => ({ ...prev, website }))}
                            existingProviders={existingProviders}
                        />
                    </Form.Group>

                    {/* Update Category Form.Group */}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Category <span className="text-danger">*</span>
                        </Form.Label>
                        <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                            Category of subscription (e.g. "Entertainment", "Fitness & Health")
                        </div>
                        <Select
                            isClearable
                            isCreateable
                            options={categories.map(category => ({ value: category, label: category }))}
                            value={formData.category ? { value: formData.category, label: formData.category } : null}
                            onChange={(newValue) => {
                                setTouched(prev => ({ ...prev, category: true }));
                                setFormData(prev => ({ 
                                    ...prev, 
                                    category: newValue?.value || '' 
                                }));
                            }}
                            onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                            placeholder="Select or type a category..."
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: (touched.category || submitted) && !formData.category?.trim() 
                                        ? 'var(--bs-danger)' 
                                        : 'var(--bs-border-color)'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)'
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused 
                                        ? 'var(--bs-primary)' 
                                        : 'var(--bs-body-bg)',
                                    color: state.isFocused 
                                        ? 'white' 
                                        : 'var(--bs-body-color)',
                                    cursor: 'pointer'
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'var(--bs-body-color)'
                                }),
                                input: (base) => ({
                                    ...base,
                                    color: 'var(--bs-body-color)'
                                })
                            }}
                        />
                        {(touched.category || submitted) && !formData.category?.trim() && (
                            <div className="text-danger small mt-1">
                                Please select or enter a category
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Unsubscribe URL (optional)</Form.Label>
                        <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                            URL where users can unsubscribe from this service
                        </div>
                        <Form.Control
                            type="text"
                            value={formData.unsubscribe_url}
                            onChange={(e) => setFormData({ ...formData, unsubscribe_url: e.target.value })}
                        />
                    </Form.Group>

                    {/* Add feedback about icon selection */}
                    {!formData.icon && (
                        <Alert variant="warning">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                            Please select an icon from the options above
                        </Alert>
                    )}
                </Form>
            </Offcanvas.Body>
            <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={onHide}>
                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                        Back
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!isFormValid}
                    >
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};

export default AddSubscriptionProviderModal;