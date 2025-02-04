import React, { useRef, useState } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import { FundingSource } from '../../types/FundingSource';
import FundingForm, { FundingFormRef } from './FundingForm';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSave, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (data: Partial<FundingSource>) => void;
}

const AddFundingModal: React.FC<Props> = ({ show, onHide, onSubmit }) => {
    const { addToast } = useToast();
    const [isFormValid, setIsFormValid] = useState(false);
    const formRef = useRef<FundingFormRef>(null);

       const handleSubmit = async (data: Partial<FundingSource>) => {
        console.log('AddFundingModal handleSubmit called with:', data);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');
    
            const fundingData = {
                owner: user.id,
                name: data.name,
                description: data.description,
                notes: data.notes,
                payment_provider_id: data.paymentProvider?.id, // Fix: access id through paymentProvider object
                funding_type: data.funding_type
            };
    
            console.log('Inserting funding data:', fundingData);
            const { error } = await supabase
                .from('funding_source')
                .insert([fundingData]);
    
            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }
    
            addToast('Funding source added successfully', 'success');
            onSubmit(data);
            onHide();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            addToast('Failed to add funding source', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Add Funding Source
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Add a new funding source to start tracking.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <FundingForm
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

export default AddFundingModal;