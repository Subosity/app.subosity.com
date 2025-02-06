import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faLayerGroup, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FundingSource } from '../../types/FundingSource';
import { useNavigate } from 'react-router-dom';
import { ProviderIcon } from '../ProviderIcon';

interface Props {
    fundingSource: FundingSource;
    onEdit: (fundingSource: FundingSource) => void;
    onDelete: (fundingSource: FundingSource) => void;
}

const FundingListItem: React.FC<Props> = ({ fundingSource, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        navigate(`/funding/${fundingSource.id}`);
    };

    return (
        <div className="d-flex align-items-center p-3 border-bottom" style={{
            backgroundColor: 'var(--bs-body-bg)',
            color: 'var(--bs-body-color)',
            borderColor: 'var(--bs-border-color) !important',
            minHeight: '80px',
            cursor: 'pointer'
        }}
            onClick={handleCardClick}
        >
            {/* Icon container */}
            <ProviderIcon
                icon={fundingSource.paymentProvider.icon}
                name={fundingSource.paymentProvider.name}
                size={40}
            />

            {/* Content container */}
            <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                    <div>
                        <div className="fw-bold">{fundingSource.name}</div>
                        <div className="text-body-secondary small">
                            {fundingSource.paymentProvider.name}
                        </div>
                        <div className="text-body-secondary small mt-1">
                            {fundingSource.description}
                        </div>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                        <div className="text-body-secondary small mb-2">
                            {fundingSource.subscriptions.length}
                            {' '}subscription{fundingSource.subscriptions.length !== 1 ? 's' : ''}
                        </div>
                        <Badge bg="success" className="py-1 px-2">
                            <FontAwesomeIcon icon={faLayerGroup} className="me-2" />
                            {fundingSource.funding_type}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Actions container */}
            <div className="ms-3 d-flex align-items-center">
                <Button
                    variant="link"
                    className="text-body-secondary p-0 me-3"
                    onClick={() => onEdit(fundingSource)}
                >
                    <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => onDelete(fundingSource)}
                >
                    <FontAwesomeIcon icon={faTrash} />
                </Button>
            </div>
        </div>
    );
};

export default FundingListItem;