import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollar, faEdit, faLayerGroup, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FundingSource } from '../../types/FundingSource';
import { useNavigate } from 'react-router-dom';

interface Props {
    fundingSource: FundingSource;
    onEdit: (fundingSource: FundingSource) => void;
    onDelete: (fundingSource: FundingSource) => void;
}

const FundingCard: React.FC<Props> = ({ fundingSource, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on action buttons
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        navigate(`/funding/${fundingSource.id}`);
    };

    return (
        <Card 
            className="h-100 bg-body-tertiary border shadow"
            onClick={handleCardClick}
            style={{ cursor: 'pointer' }}
        >
            <Card.Body className="d-flex flex-column">
                {/* Top section with provider info */}
                <div className="d-flex justify-content-between align-items-start w-100">
                    <div className="d-flex align-items-center me-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-2"
                            style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'var(--bs-gray-200)',
                                flexShrink: 0,
                                overflow: 'hidden'
                            }}>
                            <img
                                src={fundingSource.paymentProvider.icon}
                                alt=""
                                style={{
                                    width: '150%',
                                    height: '150%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div className="ms-3" style={{ minWidth: 0, flex: '1 1 auto' }}>
                            <h5 className="mb-1 text-truncate">
                                {fundingSource.name}
                            </h5>
                            <div className="small mb-1 text-truncate text-body-secondary">
                                {fundingSource.paymentProvider.name}
                            </div>
                            <div className="small text-truncate text-body-secondary">
                                {fundingSource.description}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons at the top right */}
                <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
                    <Button
                        variant="link"
                        className="p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onEdit(fundingSource)}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button
                        variant="link"
                        className="p-1 d-flex align-items-center justify-content-center text-danger"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => onDelete(fundingSource)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>

                {/* Bottom section */}
                <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                    <div className="text-body-secondary small">
                        {fundingSource.subscriptions.length}
                        {' '}subscription{fundingSource.subscriptions.length !== 1 ? 's' : ''}
                    </div>
                    <Badge bg="success" className="py-1 px-2">
                        <FontAwesomeIcon icon={faLayerGroup} className="me-2" />
                        {fundingSource.funding_type}
                    </Badge>
                </div>
            </Card.Body>
        </Card>
    );
};

export default FundingCard;