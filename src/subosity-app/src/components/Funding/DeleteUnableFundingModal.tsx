import React from 'react';
import { Offcanvas, Button, Alert } from 'react-bootstrap';
import { FundingSource } from '../../types/FundingSource';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface Props {
    show: boolean;
    onHide: () => void;
    name: string | null;
    subscriptionCount: number;
}

const DeleteUnableFundingModal: React.FC<Props> = ({ 
    show, 
    onHide, 
    name,
    subscriptionCount
}) => {
    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="bg-warning text-dark">
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        Cannot Delete Funding Source
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.75 }}>
                        This funding source is in use
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Alert variant="warning" className="mt-4">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    <strong>"{name}"</strong> is currently being used by {subscriptionCount} subscription{subscriptionCount !== 1 ? 's' : ''}.
                </Alert>
                <p className="mt-3" style={{ color: 'var(--bs-body-color)' }}>
                    You cannot delete a funding source that is tied to active subscriptions. 
                    If you want to remove this funding source, please remove all subscriptions 
                    from it first.
                </p>
            </Offcanvas.Body>
            <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" onClick={onHide}>
                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                        Back
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};

export default DeleteUnableFundingModal;