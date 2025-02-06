import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faClock,
    faCircleInfo,
    faTriangleExclamation,
    faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { SubscriptionAlert } from '../../types';

interface Props {
    alerts: SubscriptionAlert[];
    onDismiss: (alertId: string) => void;
    onSnooze: (alertId: string) => void;
    showProvider?: boolean;
}

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'danger':
            return faCircleExclamation;
        case 'warning':
            return faTriangleExclamation;
        case 'info':
        default:
            return faCircleInfo;
    }
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'danger':
            return 'var(--bs-danger)';
        case 'warning':
            return 'var(--bs-warning)';
        case 'info':
        default:
            return 'var(--bs-info)';
    }
};

const getSeverityBackground = (severity: string) => {
    switch (severity) {
        case 'danger':
            return 'rgba(var(--bs-danger-rgb), 0.1)';
        case 'warning':
            return 'rgba(var(--bs-warning-rgb), 0.1)';
        case 'info':
        default:
            return 'rgba(var(--bs-info-rgb), 0.1)';
    }
};

const SubscriptionAlertList: React.FC<Props> = ({ alerts, onDismiss, onSnooze, showProvider = false }) => {
    return (
        <ListGroup>
            {alerts.map(alert => (
                <ListGroup.Item
                    key={alert.id}
                    className="mb-1"
                    style={{
                        backgroundColor: !alert.read_at ? getSeverityBackground(alert.severity) : 'var(--bs-body-bg)',
                        color: 'var(--bs-body-color)',
                        borderColor: 'var(--bs-border-color)',
                        border: '1px solid var(--bs-border-color)',
                        borderRadius: '0.375rem'
                    }}
                >
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex">
                            {showProvider && (
                                <div className="me-3">
                                    <div className="rounded bg-light d-flex align-items-center justify-content-center p-1"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: 'var(--bs-body-bg)',
                                            border: '1px solid var(--bs-border-color)'
                                        }}>
                                        <img
                                            src={alert.subscription.subscription_provider.icon}
                                            alt={alert.subscription.subscription_provider.name}
                                            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="d-flex align-items-center mb-1">
                                    <FontAwesomeIcon
                                        icon={getSeverityIcon(alert.severity)}
                                        style={{ color: getSeverityColor(alert.severity) }}
                                        className="me-2"
                                    />
                                    <strong>{alert.title}</strong>
                                </div>
                                <p className="mb-1 small">{alert.description}</p>
                                <small className="text-muted">
                                    {new Date(alert.created_at).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                        <div>
                            <Button
                                variant="link"
                                className="p-0 me-2"
                                onClick={() => onSnooze(alert.id)}
                            >
                                <FontAwesomeIcon icon={faClock} />
                            </Button>
                            <Button
                                variant="link"
                                className="p-0"
                                onClick={() => onDismiss(alert.id)}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </Button>
                        </div>
                    </div>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
};

export default SubscriptionAlertList;