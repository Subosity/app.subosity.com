import React from 'react';
import { Offcanvas, Button, Alert } from 'react-bootstrap';
import { FundingSource } from '../../types/FundingSource';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faExclamationTriangle, faExclamationCircle, faSkullCrossbones } from '@fortawesome/free-solid-svg-icons';

interface Props {
    show: boolean;
    onHide: () => void;
    fundingSource: FundingSource | null;
    onDelete: (fundingSource: FundingSource) => void;
}

const DeleteFundingModal: React.FC<Props> = ({ show, onHide, fundingSource, onDelete }) => {
    const { addToast } = useToast();

    const handleDelete = async () => {
        try {
            if (!fundingSource) return;

            const { error } = await supabase
                .from('funding_source')
                .delete()
                .eq('id', fundingSource.id);

            if (error) throw error;

            addToast('Funding source deleted successfully', 'success');
            onDelete(fundingSource);
            onHide();
        } catch (error) {
            console.error('Error deleting funding source:', error);
            addToast('Failed to delete funding source', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="bg-danger text-white">
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        Delete Funding Source?
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Delete an existing funding source.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mt-4">
                    <h5 className="pb-3">Danger Zone:</h5>
                    <Alert variant="danger">
                        <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                        This will permanently delete the following:
                        <ul className="mb-0 mt-2">
                            <li>The funding source <strong>{fundingSource?.name}</strong></li>
                            <li>Associated payment provider information</li>
                            <li>Any notes or details</li>
                        </ul>
                    </Alert>
                    <p className="mt-3" style={{ color: 'var(--bs-body-color)', fontSize: '.85em' }}>
                        This action cannot be undone.
                    </p>
                </div>
            </Offcanvas.Body>
            <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={onHide}>
                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                        Back
                    </Button>
                    <Button variant="outline-danger" onClick={handleDelete}>
                        <FontAwesomeIcon icon={faSkullCrossbones} className="me-2" />
                        Permanently Delete
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};

export default DeleteFundingModal;