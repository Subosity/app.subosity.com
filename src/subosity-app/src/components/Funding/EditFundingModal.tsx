import React, { useRef, useState } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import { FundingSource } from '../../types/FundingSource';
import FundingForm, { FundingFormRef } from './FundingForm';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faEdit, faSave } from '@fortawesome/free-solid-svg-icons';

interface Props {
    show: boolean;
    onHide: () => void;
    fundingSource: FundingSource | null;
    onSubmit: (data: Partial<FundingSource>) => void;
}

const EditFundingModal: React.FC<Props> = ({ show, onHide, onSubmit, fundingSource }) => {
    const { addToast } = useToast();
    const formRef = useRef<FundingFormRef>(null);
    const [isFormValid, setIsFormValid] = useState(false);

    const handleSubmit = async (data: Partial<FundingSource>) => {
        try {
            if (!fundingSource?.id) throw new Error('No funding source ID');

            const { error } = await supabase
                .from('funding_source')
                .update({
                    name: data.name,
                    description: data.description,
                    notes: data.notes,
                    payment_provider_id: data.paymentProvider.id,
                    funding_type: data.funding_type
                })
                .eq('id', fundingSource.id);

            if (error) throw error;

            addToast('Funding source updated successfully', 'success');
            onSubmit(data);
            onHide();
        } catch (error) {
            console.error('Error updating funding source:', error);
            addToast('Failed to update funding source', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Edit Funding Source
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Edit an existing funding source.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <FundingForm
                    ref={formRef}
                    initialData={fundingSource}
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

export default EditFundingModal;