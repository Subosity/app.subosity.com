import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faPlus } from '@fortawesome/free-solid-svg-icons';

const NoFundingSourcesContent = ({ onAdd }: { onAdd: () => void }) => (
    <Alert className="text-center p-5 bg-body-tertiary border">
        <div className="mb-3">
            <FontAwesomeIcon icon={faMoneyBill} className="text-secondary fa-3x" />
        </div>
        <h4 className="text-body">No Funding Sources Yet</h4>
        <p className="text-body-secondary mb-4">
            You haven't added any funding sources yet. Start tracking your payment methods to better manage your subscriptions.
        </p>
        <Button variant="primary" onClick={onAdd}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Your First Funding Source
        </Button>
    </Alert>
);

export default NoFundingSourcesContent;