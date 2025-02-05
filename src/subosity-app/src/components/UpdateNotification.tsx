import React, { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import '../styles/updateNotification.css';

export const UpdateNotification: React.FC = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleUpdateAvailable = () => setShow(true);
        window.addEventListener('pwaUpdateAvailable', handleUpdateAvailable);
        return () => window.removeEventListener('pwaUpdateAvailable', handleUpdateAvailable);
    }, []);

    if (!show) return null;

    return (
        <div className="update-notification">
            <Alert 
                variant="info" 
                show={show}
                onClose={() => setShow(false)}
                dismissible
                className="d-flex align-items-center mb-0 pe-5"
            >
                <div className="d-flex align-items-center flex-grow-1 me-3">
                    <span>A new version is available.</span>
                </div>
                <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                >
                    Update Now
                </Button>
            </Alert>
        </div>
    );
};