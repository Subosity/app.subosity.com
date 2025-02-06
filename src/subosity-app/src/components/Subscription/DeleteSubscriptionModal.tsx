import React from 'react';
import { Offcanvas, Button, Alert } from 'react-bootstrap';
import { Subscription } from '../../types';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { faDeleteLeft, faTrash, faExclamationCircle, faExclamationTriangle, faChevronLeft, faSkullCrossbones } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Props {
    show: boolean;
    onHide: () => void;
    subscription: Subscription | null;
    onDelete: (subscription: Subscription) => void;
}

const DeleteSubscriptionModal: React.FC<Props> = ({ show, onHide, subscription, onDelete }) => {
    const { addToast } = useToast();

    const handleDelete = async () => {
        try {
            if (!subscription) return;

            const { error } = await supabase
                .from('subscription')
                .delete()
                .eq('id', subscription.id);

            if (error) throw error;

            addToast('Subscription deleted successfully', 'success');
            onDelete(subscription);
            onHide();
        } catch (error) {
            console.error('Error deleting subscription:', error);
            addToast('Failed to delete subscription', 'error');
        }
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="bg-danger text-white">
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        Delete Subscription?
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Delete an existing subscription.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mt-4">
                    <h5 className="pb-3">Danger Zone:</h5>
                    <Alert variant="danger">

                        <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                        This will permanently delete the following on this platform ONLY:
                        <ul className="mb-0 mt-2">
                            <li>The subscription information for <strong>{subscription?.providerName}</strong> on this platform.</li>
                            <li>All payment history</li>
                            <li>All renewal records</li>
                            <li>All subscription notes and details</li>
                        </ul>
                    </Alert>
                    <p className="mt-3" style={{ color: 'var(--bs-body-color)', fontSize: '.85em' }}>
                        This does <strong>NOT</strong> affect your actual subscription. This just removes your information from this (Subosity) subscription tracking service.
                        <br /><br />
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

export default DeleteSubscriptionModal;