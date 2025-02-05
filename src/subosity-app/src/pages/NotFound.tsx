import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faExclamationTriangle, faDashboard } from '@fortawesome/free-solid-svg-icons';

const NotFound: React.FC = () => {
    const location = useLocation();

    const getContent = () => (
        <>
            <FontAwesomeIcon
                icon={faExclamationTriangle}
                size="3x"
                className="text-warning mb-4"
            />
            <h1 className="display-4 mb-4">Page Not Found (404)</h1>
            <p className="lead mb-4">
                We couldn't find what you were looking for at:<br />
                <code className="text-muted">{location.pathname}{location.search}</code>
            </p>
            <Button
                as={Link}
                to="/"
                variant="primary"
                size="lg"
                className="px-4"
            >
                <FontAwesomeIcon icon={faDashboard} className="me-2" />
                Return to Dashboard
            </Button>
        </>
    );

    return (
        <Container className="text-center mt-3 mt-sm-5">
            <div className="d-block d-sm-none">
                {getContent()}
            </div>

            <div className="d-none d-sm-block shadow py-3 py-sm-5">
                {getContent()}
            </div>
        </Container>
    );
};

export default NotFound;