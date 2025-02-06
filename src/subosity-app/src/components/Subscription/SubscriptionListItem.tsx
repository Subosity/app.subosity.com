import React, { useState, useEffect, useRef } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faRotate, faHand, faBell, faCheckCircle, faClock, faBan } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../../types/Subscription';
import { useAlerts } from '../../AlertsContext';
import { useNavigate } from 'react-router-dom';
import SubscriptionStateDisplay from './SubscriptionStateDisplay';
import RecurrenceComponent from '../RecurrenceComponent';
import '../../styles/subscriptionListItem.css';
import { ProviderIcon } from '../ProviderIcon';

interface Props {
    subscription: Subscription;
    onEdit: (subscription: Subscription) => void;
    onDelete: (subscription: Subscription) => void;
}

const SubscriptionListItem: React.FC<Props> = ({ subscription, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [alertCount, setAlertCount] = useState(0);
    const { getUnreadCountForSubscription } = useAlerts();

    const handleItemClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        navigate(`/subscription/${subscription.id}`);
    };

    useEffect(() => {
        const fetchAlertCount = async () => {
            const count = await getUnreadCountForSubscription(subscription.id);
            setAlertCount(count);
        };
        fetchAlertCount();
    }, [subscription.id]);

    return (
        <div
            className="d-flex p-2 border-bottom shadow position-relative"
            style={{
                backgroundColor: 'var(--bs-body-bg)',
                color: 'var(--bs-body-color)',
                borderColor: 'var(--bs-border-color) !important',
                cursor: 'pointer',
                minHeight: '80px'
            }}
            onClick={handleItemClick}
        >
            <div style={{ width: '40px', flexShrink: 0 }} className="me-3">
                <ProviderIcon
                    icon={subscription.providerIcon}
                    name={subscription.providerName}
                    size={40}
                />
                <ProviderIcon
                    icon={subscription.fundingSource?.paymentProviderIcon}
                    name={subscription.fundingSource?.paymentProviderName}
                    size={40}
                />
            </div>

            {/* Main Content Column */}
            <div className="d-flex flex-column flex-grow-1 min-width-0 me-2">
                <div className="d-flex flex-column overflow-hidden min-width-0">
                    <div className="">
                        <span className="fw-medium text-truncate mb-1">
                            {subscription.providerName}
                        </span>
                    </div>

                    <div className="provider-description-container">
                        <span className="text-body-secondary text-truncate mb-1 d-none d-sm-inline provider-description">
                            {subscription.providerDescription}
                        </span>
                    </div>

                    {subscription.nickname && (
                        <span className="text-body-secondary text-truncate mb-1"
                            style={{ fontSize: '0.85em', fontStyle: 'italic' }}>
                            ({subscription.nickname})
                        </span>
                    )}
                </div>

                <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.85em' }}>
                    <Badge bg={subscription.autoRenewal ? 'success' : 'secondary'}>
                        <FontAwesomeIcon
                            icon={subscription.autoRenewal ? faRotate : faHand}
                            className="d-inline me-md-2"
                        />
                        <span className="d-none d-md-inline">
                            {subscription.autoRenewal ? 'Auto-Renewal' : 'Manual Renewal'}
                        </span>
                    </Badge>
                    <span>${subscription.amount.toFixed(2)}</span>
                </div>

                <div className="mt-1">
                    <RecurrenceComponent
                        subscription={subscription}
                        mode="badge"
                        thresholds={{ warning: 20, urgent: 10 }}
                    />
                    <span className="d-none d-md-inline ms-2"
                        style={{ fontSize: '0.75em', fontStyle: 'italic' }}>
                        <RecurrenceComponent
                            subscription={subscription}
                            mode="text"
                            thresholds={{ warning: 20, urgent: 10 }}
                        />
                    </span>
                </div>
            </div>


            {/* Actions and Status Column */}
            <div className="d-flex flex-column justify-content-between align-items-end"
                style={{ minWidth: '90px' }}>
                <div className="d-flex gap-2">
                    <div className="position-relative">
                        <FontAwesomeIcon
                            icon={faBell}
                            className={alertCount > 0 ? "text-warning" : "text-secondary"}
                        />
                        {alertCount > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                style={{ fontSize: '0.65em', transform: 'scale(0.8)' }}>
                                {alertCount}
                            </span>
                        )}
                    </div>
                    <Button variant="link" className="p-0" onClick={() => onEdit(subscription)}>
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="link" className="p-0 text-danger" onClick={() => onDelete(subscription)}>
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>

                <SubscriptionStateDisplay
                    state={subscription.state}
                    subscriptionId={subscription.id}
                />
            </div>
        </div>
    );
};

export default SubscriptionListItem;