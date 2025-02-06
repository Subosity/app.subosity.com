import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faRotate, faHand, faBell, faCheckCircle, faClock, faBan } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from '../../types/Subscription';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../../AlertsContext';
import SubscriptionStateDisplay from './SubscriptionStateDisplay';
import RecurrenceComponent from '../RecurrenceComponent';
import '../../styles/subscriptionCard.css';
import { ProviderIcon } from '../ProviderIcon';

interface Props {
    subscription: Subscription;
    onEdit: (subscription: Subscription) => void;
    onDelete: (subscription: Subscription) => void;
}

const SubscriptionCard: React.FC<Props> = ({ subscription, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const [alertCount, setAlertCount] = useState(0);
    const { getUnreadCountForSubscription } = useAlerts();

    useEffect(() => {
        const fetchAlertCount = async () => {
            const count = await getUnreadCountForSubscription(subscription.id);
            setAlertCount(count);
        };
        fetchAlertCount();
    }, [subscription.id]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        navigate(`/subscription/${subscription.id}`);
    };

    return (
        <Card
            className="h-100 shadow"
            style={{
                backgroundColor: 'var(--bs-body-bg)',
                color: 'var(--bs-body-color)',
                borderColor: 'var(--bs-border-color)',
                cursor: 'pointer'
            }}
            onClick={handleCardClick}
        >
            <Card.Body className="d-flex flex-column p-2"> {/* Add flex-column */}
                {/* Top section with provider info */}
                <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="d-flex align-items-center me-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <ProviderIcon
                            icon={subscription.providerIcon}
                            name={subscription.providerName}
                            size={56}
                        />
                        <div className="ms-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <h5 className="mb-1 text-truncate provider-name">
                                {subscription.providerName}
                            </h5>
                            {subscription.nickname ? (
                                <div className="small mb-1 text-truncate"
                                    style={{
                                        color: 'var(--bs-body-color)',
                                        opacity: 0.75
                                    }}>
                                    <i>({subscription.nickname})</i>
                                </div>
                            ) : (
                                <div className="small mb-1 text-truncate"
                                    style={{
                                        color: 'var(--bs-body-color)',
                                        opacity: 0.75
                                    }}>
                                    {subscription.providerDescription}
                                </div>
                            )}
                            <div className='d-flex justify-content-between align-items-center' style={{ color: 'var(--bs-body-color)' }}>
                                ${subscription.amount}&nbsp;
                                <RecurrenceComponent
                                    subscription={subscription}
                                    mode="badge"
                                    thresholds={{ warning: 20, urgent: 10 }}
                                />
                            </div>
                            <div className="mt-2">
                                <Badge
                                    bg={subscription.autoRenewal ? 'success' : 'secondary'}
                                    className="p-1">
                                    <FontAwesomeIcon
                                        icon={subscription.autoRenewal ? faRotate : faHand}
                                        className="me-2"
                                    />
                                    {subscription.autoRenewal ? 'Auto-Renewal' : 'Manual Renewal'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>




                {/* Bottom section */}
                <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                    {/* Payment info on the left */}
                    <div className="d-flex align-items-center text-muted" style={{ color: 'var(--bs-body-color)', fontSize: '.85em' }}>
                        <ProviderIcon
                            icon={subscription.fundingSource?.paymentProviderIcon}
                            name={subscription.fundingSource?.paymentProviderName}
                            size={32}
                        />
                        {subscription.fundingSource?.name}
                    </div>

                    {/* Active/Inactive badge on the right */}
                    <SubscriptionStateDisplay
                        state={subscription.state}
                        subscriptionId={subscription.id}
                    />

                </div>

                {/* Action buttons at the top right */}
                <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                    <Button
                        variant="link"
                        className="p-1 d-flex align-items-center justify-content-center position-relative"
                        style={{ width: '32px', height: '32px' }}
                    >
                        <FontAwesomeIcon
                            icon={faBell}
                            className={alertCount > 0 ? "text-warning" : "text-secondary"}
                        />
                        {alertCount > 0 && (
                            <span
                                className="position-absolute badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
                                style={{
                                    fontSize: '0.75em',
                                    padding: '0.75em 0.6em 1.0em 0.5em',
                                    minWidth: '1.5em',
                                    height: '1.5em',
                                    transform: 'scale(0.8) translate(50%, -50%)',
                                }}
                            >
                                {alertCount}
                                <span className="visually-hidden">unread alerts</span>
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="link"
                        className="p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onEdit(subscription)}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                        variant="link"
                        className="p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onDelete(subscription)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SubscriptionCard;