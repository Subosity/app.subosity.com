import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { FundingSource } from '../../types/FundingSource';
import { supabase } from '../../supabaseClient';
import { selectStyles } from '../../styles/selectStyles';
import PaymentProviderDropdown from '../PaymentProvider/PaymentProviderDropdown';
import CreatableSelect from 'react-select/creatable';

export interface FundingFormRef {
    submitForm: () => void;
    isValid: boolean;
}

interface Props {
    initialData?: Partial<FundingSource>;
    onSubmit: (data: Partial<FundingSource>) => void;
    onCancel: () => void;
    onValidationChange?: (isValid: boolean) => void;
}

interface ValidationErrors {
    name?: string;
    description?: string;
    paymentProviderId?: string;
    funding_type?: string;  // Add this
}

const FundingForm = forwardRef<FundingFormRef, Props>(({ initialData, onSubmit, onCancel, onValidationChange }, ref) => {
    // Add predefined options
    const defaultFundingTypes = [
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Debit Card', label: 'Debit Card' },
        { value: 'Direct Debit/ACH', label: 'Direct Debit/ACH' },
        { value: 'Digital Wallet', label: 'Digital Wallet' },
        { value: 'Payment Service', label: 'Payment Service' },
        { value: 'Prepaid Card', label: 'Prepaid Card' },
    ];

    // Add state for funding type options
    const [fundingTypeOptions, setFundingTypeOptions] = useState(defaultFundingTypes);

    const [formData, setFormData] = useState<Partial<FundingSource>>(() => ({
        paymentProvider: {
            id: initialData?.paymentProviderId || null,
            // ... other required PaymentProvider fields
        },
        name: '',
        description: '',
        notes: '',
        funding_type: '',
        ...initialData
    }));
    const [isValid, setIsValid] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [validated, setValidated] = useState(false);
    const [showAddPaymentProvider, setShowAddPaymentProvider] = useState(false);

    const validateForm = (data: Partial<FundingSource>): ValidationErrors => {
        const newErrors: ValidationErrors = {};
        if (!data.name) {
            newErrors.name = 'Please enter a name';
        }
        if (!data.description) {
            newErrors.description = 'Please enter a description';
        }
        if (!data.paymentProvider?.id) {
            newErrors.paymentProviderId = 'Please select a payment provider';
        }
        if (!data.funding_type) {
            newErrors.funding_type = 'Please select or enter a funding type';
        }
        return newErrors;
    };

    useEffect(() => {
        const newErrors = validateForm(formData);
        const valid = Object.keys(newErrors).length === 0;
        setErrors(newErrors);
        setIsValid(valid);
        onValidationChange?.(valid);
    }, [formData, onValidationChange]);

    useEffect(() => {
        const fetchFundingTypes = async () => {
            const { data, error } = await supabase
                .from('funding_source')
                .select('funding_type')
                .not('funding_type', 'is', null);
            
            if (data && !error) {
                const existingTypes = [...new Set(data
                    .map(item => item.funding_type)
                    .filter(Boolean)
                )];

                const existingOptions = existingTypes.map(type => ({
                    value: type,
                    label: type
                }));

                // Combine default options with existing ones, removing duplicates
                const allOptions = [...defaultFundingTypes, ...existingOptions];
                const uniqueOptions = allOptions.filter((option, index, self) =>
                    index === self.findIndex(t => t.value === option.value)
                );

                setFundingTypeOptions(uniqueOptions);
            }
        };

        fetchFundingTypes();
    }, []);

    useImperativeHandle(ref, () => ({
        submitForm: () => handleSubmit(),
        isValid: Object.keys(validateForm(formData)).length === 0
    }), [formData]);

    const handleChange = (field: keyof FundingSource, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            return newData;
        });
    };

    const handleSubmit = () => {
        setValidated(true);
        const newErrors = validateForm(formData);
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onSubmit(formData);
        }
    };

    return (
        <Form noValidate validated={validated}>
            <Form.Group className="mb-3">
                <Form.Label>
                    Payment Provider <span className="text-danger">*</span><br />
                </Form.Label>
                <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                    The bank, credit card, or payment provider for this funding source.
                </div>
                <PaymentProviderDropdown
                    value={formData.paymentProvider?.id}
                    onChange={(id) => {
                        handleChange('paymentProvider', { ...formData.paymentProvider, id });
                    }}
                    onAddNew={() => setShowAddPaymentProvider(true)}
                    error={errors.paymentProviderId}
                    touched={validated}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                    The friendly name for this funding source, used in this app.
                </div>
                <Form.Control
                    type="text"
                    placeholder='e.g. "Visa ends in 0394"'
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isInvalid={validated && !!errors.name}
                    required
                />
                <Form.Control.Feedback type="invalid">
                    {errors.name}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                    A description of this funding source.
                </div>
                <Form.Control
                    as="textarea"
                    placeholder='e.g. "Jims Wells Fargo rewards Visa"'
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    isInvalid={validated && !!errors.description}
                    required
                />
                <Form.Control.Feedback type="invalid">
                    {errors.description}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>
                    Funding Type <span className="text-danger">*</span>
                </Form.Label>
                <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                    Select or enter the type of funding source.
                </div>
                <CreatableSelect
                    options={fundingTypeOptions}
                    value={formData.funding_type ? { value: formData.funding_type, label: formData.funding_type } : null}
                    onChange={(newValue) => {
                        setFormData(prev => ({
                            ...prev,
                            funding_type: newValue?.value || ''
                        }));
                    }}
                    styles={{
                        ...selectStyles,
                        control: (base, state) => ({
                            ...selectStyles.control(base, state),
                            borderColor: validated && errors.funding_type 
                                ? 'var(--bs-danger)' 
                                : 'var(--bs-border-color)'
                        })
                    }}
                    placeholder="Select or type to create..."
                    formatCreateLabel={(inputValue) => `Use custom type: "${inputValue}"`}
                    required
                />
                {validated && errors.funding_type && (
                    <div className="invalid-feedback d-block">
                        {errors.funding_type}
                    </div>
                )}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                    Optional notes about this funding source.
                </div>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </Form.Group>
        </Form>
    );
});

export default FundingForm;