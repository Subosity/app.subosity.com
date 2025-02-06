import React, { useRef, useState } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import { Subscription } from '../../types';
import SubscriptionForm, { SubscriptionFormRef } from './SubscriptionForm';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSave, faSquarePlus } from '@fortawesome/free-solid-svg-icons';

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (data: Partial<Subscription>) => void;
}

const AddSubscriptionModal: React.FC<Props> = ({ show, onHide, onSubmit }) => {
    const { addToast } = useToast();
    const [isFormValid, setIsFormValid] = useState(false);
    const formRef = useRef<SubscriptionFormRef>(null);

    // Add logging to track flow
    const handleSubmit = async (data: Partial<Subscription>) => {
        console.log('AddSubscriptionModal handleSubmit called with:', data);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Map form data to database fields
            const subscriptionData = {
                owner: user.id,
                subscription_provider_id: data.providerId,
                nickname: data.nickname,
                start_date: data.startDate,
                autorenew: data.autoRenewal,
                amount: data.amount,
                funding_source_id: data.fundingSourceId,  // Changed from payment_provider_id
                notes: data.notes,
                state: data.state || 'active',
                recurrence_rule: data.recurrenceRule,
                recurrence_rule_ui_friendly: data.recurrenceRuleUiFriendly
            };

            console.log('Inserting subscription data:', subscriptionData);
            const { error } = await supabase
                .from('subscription')
                .insert([subscriptionData]);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            addToast('Subscription added successfully', 'success');
            onSubmit(data);
            onHide();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            addToast('Failed to add subscription', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faSquarePlus} className="me-2" />
                        Add Subscription
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Add a new subscription to start tracking.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <SubscriptionForm
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onCancel={onHide}
                    onValidationChange={setIsFormValid}
                />
            </Offcanvas.Body>
            <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={onHide}>
                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                        Back
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => formRef.current?.submitForm()}
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

export default AddSubscriptionModal;