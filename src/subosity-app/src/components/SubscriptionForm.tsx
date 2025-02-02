import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { Subscription } from '../types';
import { supabase } from '../supabaseClient';
import Select, { components } from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faClock, faCheckCircle, faBan, faTimesCircle, faPause, faCalendarAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import RecurrenceModal from './RecurrenceModal';
import AddSubscriptionProviderModal from './AddSubscriptionProviderModal';
import SubscriptionProviderDropdown from './SubscriptionProviderDropdown';
import PaymentProviderDropdown from './PaymentProviderDropdown';

// Near the top with other interfaces
type SubscriptionState = 'trial' | 'active' | 'canceled' | 'expired' | 'paused';

const stateOptions = [
    { value: 'trial', label: 'Free Trial', icon: faClock },
    { value: 'active', label: 'Active', icon: faCheckCircle },
    { value: 'canceled', label: 'Canceled', icon: faBan },
    { value: 'expired', label: 'Expired', icon: faTimesCircle },
    { value: 'paused', label: 'Paused', icon: faPause }
];

// Add custom SingleValue component near CustomOption
const CustomSingleValue = ({ children, ...props }: any) => (
    <components.SingleValue {...props}>
        <div className="d-flex align-items-center">
            <FontAwesomeIcon 
                icon={props.data.icon} 
                className="me-2" 
                style={{ width: '16px' }}
            />
            {children}
        </div>
    </components.SingleValue>
);

// Custom Option Component
const CustomOption = ({ children, ...props }: any) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            {props.data.icon && (
                <div 
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--bs-gray-200)',
                        flexShrink: 0,
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src={props.data.icon}
                        alt=""
                        style={{
                            width: '150%',
                            height: '150%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            )}
            <div className="ms-2">
                {props.data.category && !props.data.isAddNew && (
                    <div style={{ 
                        fontSize: '0.75em', 
                        opacity: 0.6,
                        color: 'var(--bs-secondary-text)'
                    }}>
                        {props.data.category}
                    </div>
                )}
                {props.data.isAddNew ? (
                    <div style={{ color: 'var(--bs-primary)' }}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        {children}
                    </div>
                ) : (
                    <div style={{ color: 'var(--bs-body-color)' }}>{children}</div>
                )}
            </div>
        </div>
    </components.Option>
);

const CustomFontOption = ({ children, ...props }: any) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            <FontAwesomeIcon 
                icon={props.data.icon} 
                className="me-2" 
                style={{ width: '16px' }}
            />
            {children}
        </div>
    </components.Option>
);

// Update SubscriptionFormRef interface
export interface SubscriptionFormRef {
    submitForm: () => void;
    isValid: boolean;
}

// Update the Props interface to match database schema
interface Props {
    initialData?: Partial<Subscription>;  // Change this from subscription?
    onSubmit: (data: Partial<Subscription>) => void;
    onCancel: () => void;
    onValidationChange?: (isValid: boolean) => void;  // Add this
}

const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
];

// Update ValidationErrors interface
interface ValidationErrors {
    providerId?: string;
    startDate?: string;
    amount?: string;
    renewalFrequency?: string;
    state?: string;
    paymentProviderId?: string;
    recurrenceRule?: string;
}

const commonInputStyles = {
    backgroundColor: 'var(--bs-body-bg)',
    color: 'var(--bs-body-color)',
    borderColor: 'var(--bs-border-color)'
};

const commonPlaceholderStyles = {
    opacity: 0.5,
    color: 'var(--bs-body-color)'
};

// Select styles
const selectStyles = {
    control: (base: any) => ({
        ...base,
        ...commonInputStyles
    }),
    input: (base: any) => ({
        ...base,
        color: 'var(--bs-body-color)'
    }),
    placeholder: (base: any) => ({
        ...base,
        ...commonPlaceholderStyles
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isFocused 
            ? 'var(--bs-primary)' 
            : 'var(--bs-body-bg)',
        color: state.isFocused 
            ? 'white' 
            : 'var(--bs-body-color)',
        cursor: 'pointer',
        ':active': {
            backgroundColor: 'var(--bs-primary)'
        }
    }),
    menu: (base: any) => ({
        ...base,
        backgroundColor: 'var(--bs-body-bg)',
        borderColor: 'var(--bs-border-color)'
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

interface TouchedFields {
    [key: string]: boolean;
}

const SubscriptionForm = forwardRef<SubscriptionFormRef, Props>(({ 
    initialData, 
    onSubmit, 
    onCancel,
    onValidationChange 
}, ref) => {
    // Add touched state
    const [touched, setTouched] = useState<TouchedFields>({});

    const [providers, setProviders] = useState<any[]>([]);
    const [providersLoaded, setProvidersLoaded] = useState(false);
    const [paymentProviders, setPaymentProviders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Subscription>>(() => ({
        state: 'trial',  // Default state
        ...initialData   // Spread the initial data if provided
    }));
    const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);

    const [isValid, setIsValid] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [validated, setValidated] = useState(false);

    // Add showAddProvider state
    const [showAddProvider, setShowAddProvider] = useState(false);

    // Add OTHER_PROVIDER_ID constant
    const OTHER_PROVIDER_ID = '7991366e-b1cd-5397-9c99-5926b64a6511';

    // Near the top with other constants
    const ADD_NEW_PROVIDER_OPTION = {
        id: 'add-new',
        name: 'Add a new provider...',
        isAddNew: true,
        icon: null
    };

    // Constants for special options
    const OTHER_PROVIDER = {
        id: '7991366e-b1cd-5397-9c99-5926b64a6511',
        name: 'Other',
        category: 'Other',
        icon: null
    };

    const ADD_NEW_PROVIDER = {
        id: 'add-new',
        name: 'Add a new provider...',
        isAddNew: true,
        icon: null
    };

    // Update validateForm function
    const validateForm = (data: Partial<Subscription>): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        if (!data.providerId) {
            newErrors.providerId = 'Please select a subscription provider';
        }
        if (!data.startDate) {
            newErrors.startDate = 'Please select a start date';
        }
        if (!data.amount || data.amount <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }
        if (!data.recurrenceRule) {
            newErrors.recurrenceRule = 'Please define the recurrence pattern';
        }
        if (!data.state) {
            newErrors.state = 'Please select a subscription state';
        }
        if (!data.paymentProviderId) {
            newErrors.paymentProviderId = 'Please select a payment method';
        }

        return newErrors;
    };

    // Add logging to validation
    useEffect(() => {
        const newErrors = validateForm(formData);
        setErrors(newErrors);
        setIsValid(Object.keys(newErrors).length === 0);
    }, [formData]);

    const fetchProviders = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [subscriptionResponse, paymentResponse] = await Promise.all([
                supabase.from('subscription_provider').select('*'),
                supabase.from('payment_provider').select('*')
            ]);

            if (subscriptionResponse.error) throw subscriptionResponse.error;
            if (paymentResponse.error) throw paymentResponse.error;

            setProviders(subscriptionResponse.data || []);
            setPaymentProviders(paymentResponse.data || []);
            setProvidersLoaded(true);
        } catch (err) {
            console.error('Error fetching providers:', err);
            setError('Failed to load providers');
        } finally {
            setIsLoading(false);
        }
    };

    // Use fetchProviders in useEffect
    useEffect(() => {
        fetchProviders();
    }, []);

    // Update handleSubmit to work without event
    const handleSubmit = () => {
        setValidated(true);
        const newErrors = validateForm(formData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            const submissionData = {
                ...formData,
                startDate: formData.startDate || null
            };
            onSubmit(submissionData);
        }
    };

    const handleFieldTouch = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const newErrors = validateForm(formData);
        const valid = Object.keys(newErrors).length === 0;
        setErrors(newErrors);
        setIsValid(valid);
    };

    // Add logging to form data changes
    const handleChange = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            const newErrors = validateForm(newData);
            setErrors(newErrors);
            setIsValid(Object.keys(newErrors).length === 0);
            return newData;
        });
    };

    // Update useImperativeHandle
    useImperativeHandle(ref, () => ({
        submitForm: () => handleSubmit(), // Remove event parameter
        isValid: Object.keys(validateForm(formData)).length === 0
    }), [formData, handleSubmit]);

    // Add a useEffect to log state changes
    useEffect(() => {
        const currentErrors = validateForm(formData);
        const valid = Object.keys(currentErrors).length === 0;
    }, [formData, touched, validated]);

    // Add validation effect
    useEffect(() => {
        const newErrors = validateForm(formData);
        const valid = Object.keys(newErrors).length === 0;
        setIsValid(valid);
        onValidationChange?.(valid);
    }, [formData, onValidationChange]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <Form noValidate validated={validated}>
            <Form.Group className="mb-3">
                <Form.Label className="d-flex justify-content-between align-items-center">
                    <span>
                        Subscription Provider <span className="text-danger">*</span>
                    </span>
                    <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0" 
                        onClick={() => setShowAddProvider(true)}
                    >
                        Add New...
                    </Button>
                </Form.Label>
                <SubscriptionProviderDropdown
                    value={providers.find(p => p.id === formData.providerId)}
                    onChange={(id) => {
                        handleChange('providerId', id);
                    }}
                    onAddNew={() => setShowAddProvider(true)}
                    error={errors.providerId}
                    touched={validated}
                />
            </Form.Group>

            {/* Update Start Date field */}
            <Form.Group className="mb-3">
                <Form.Label>
                    Start Date <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={(e) => {
                        const localDate = new Date(e.target.value);
                        const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
                        setFormData({ ...formData, startDate: utcDate.toISOString().split('T')[0] });
                    }}
                    isInvalid={validated && !!errors.startDate}
                    required
                />
                {validated && errors.startDate && (
                    <Form.Control.Feedback type="invalid">
                        {errors.startDate}
                    </Form.Control.Feedback>
                )}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>
                    Amount per Period <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup hasValidation>
                    <InputGroup.Text style={commonInputStyles}>
                        $
                    </InputGroup.Text>
                    <Form.Control
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        required
                        isInvalid={validated && (!formData.amount || formData.amount <= 0)}
                        style={{
                            ...commonInputStyles,
                            '::placeholder': commonPlaceholderStyles
                        }}
                    />
                    <Form.Control.Feedback type="invalid">
                        Please enter a valid amount
                    </Form.Control.Feedback>
                </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>
                    Recurrence <span className="text-danger">*</span>
                </Form.Label>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                        {formData.recurrenceRuleUiFriendly ? (
                            <div className="form-control text-truncate"
                    readOnly
                    style={{ resize: 'none', height: 'auto', whiteSpace: 'normal', fontStyle: 'italic' }}
                    rows={3}>
                                {formData.recurrenceRuleUiFriendly}
                            </div>
                        ) : (
                            <div className="form-control text-muted">
                                Define when this subscription repeats...
                            </div>
                        )}
                    </div>
                    <Button 
                        variant="outline-secondary" 
                        className="ms-2"
                        onClick={() => setShowRecurrenceModal(true)}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        Change
                    </Button>
                </div>
                {validated && errors.recurrenceRule && (
                    <div className="text-danger small mt-1">{errors.recurrenceRule}</div>
                )}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Check
                    type="checkbox"
                    label="Auto Renewal"
                    checked={formData.autoRenewal}
                    onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>
                    Subscription State <span className="text-danger">*</span>
                </Form.Label>
                <Select
                    value={stateOptions.find(option => option.value === formData.state)}
                    onChange={(option) => {
                        setFormData(prev => ({
                            ...prev,
                            state: option?.value as SubscriptionState
                        }));
                    }}
                    options={stateOptions}
                    styles={selectStyles}
                    components={{ 
                        Option: CustomFontOption,
                        SingleValue: CustomSingleValue 
                    }}
                    isInvalid={validated && !!errors.state}
                />
                <Form.Text className="text-muted">
                    Changing the state will automatically record the state change history
                </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>
                    Payment Method <span className="text-danger">*</span>
                </Form.Label>
                <PaymentProviderDropdown
                    value={paymentProviders.find(p => p.id === formData.paymentProviderId)}
                    onChange={(id) => {
                        handleChange('paymentProviderId', id);
                    }}
                    onAddNew={() => setShowAddPaymentProvider(true)}
                    error={errors.paymentProviderId}
                    touched={validated}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Payment Details</Form.Label>
                <Form.Control
                    type="text"
                    value={formData.paymentDetails || ''}
                    onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                    placeholder="Optional: Enter payment details (e.g., last 4 digits of card)"
                    style={{
                        backgroundColor: 'var(--bs-body-bg)',
                        color: 'var(--bs-body-color)',
                        borderColor: 'var(--bs-border-color)',
                        '::placeholder': {
                            color: 'var(--bs-body-color)',
                            opacity: 0.5
                        }
                    }}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional: Add any notes about this subscription..."
                    style={{
                        backgroundColor: 'var(--bs-body-bg)',
                        color: 'var(--bs-body-color)',
                        borderColor: 'var(--bs-border-color)',
                        '::placeholder': {
                            color: 'var(--bs-body-color)',
                            opacity: 0.5
                        }
                    }}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Nickname</Form.Label>
                <Form.Control
                    type="text"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Optional: Distinguish between subscriptions (e.g., 'Personal', 'Family')"
                    style={{
                        backgroundColor: 'var(--bs-body-bg)',
                        color: 'var(--bs-body-color)',
                        borderColor: 'var(--bs-border-color)',
                        '::placeholder': {
                            color: 'var(--bs-body-color)',
                            opacity: 0.5
                        }
                    }}
                />
            </Form.Group>

            <RecurrenceModal
                show={showRecurrenceModal}
                onHide={() => setShowRecurrenceModal(false)}
                initialRule={formData.recurrenceRule}
                onSave={(rule, description) => {
                    setFormData(prev => ({ 
                        ...prev, 
                        recurrenceRule: rule,
                        recurrenceRuleUiFriendly: description // Maps to recurrence_rule_ui_friendly in database
                    }));
                    setShowRecurrenceModal(false);
                }}
            />

            {/* Add the modal */}
            <AddSubscriptionProviderModal
                show={showAddProvider}
                onHide={() => setShowAddProvider(false)}
                onSave={async (newProvider) => {
                    await fetchProviders(); // Re-fetch providers
                    // Set the newly created provider as the selected one
                    handleChange('providerId', newProvider.id);
                    setShowAddProvider(false);
                }}
                existingProviders={providers}
            />

            {/* Update parent components to receive isValid state */}
            <div style={{ display: 'none' }}>
                <input
                    type="submit"
                    ref={ref}
                    disabled={!isValid}
                />
            </div>
        </Form>
    );
});

export default SubscriptionForm;