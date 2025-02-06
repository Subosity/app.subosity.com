import React from 'react';
import { Offcanvas, Button, Alert, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faRotateLeft, faExclamationTriangle, faCode } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../ThemeContext';

interface Props {
    show: boolean;
    onHide: () => void;
    onConfirm: () => void;
    systemDefaultValue: string;
    dataType: 'text' | 'json' | 'number' | 'choice';
}

const ConfirmResetPreferenceModal: React.FC<Props> = ({
    show,
    onHide,
    onConfirm,
    systemDefaultValue,
    dataType
}) => {
    const { theme } = useTheme();

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton className="bg-warning text-white">
                <div>
                    <Offcanvas.Title>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        Reset Preference?
                    </Offcanvas.Title>
                    <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                        Reset to system default value.
                    </div>
                </div>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="mt-4">
                    <h5 className="pb-3">Warning:</h5>
                    <Alert variant="warning">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        This will reset this preference to the following system default:
                        <div className="mt-3 p-2 border rounded"
                            style={{
                                backgroundColor: 'var(--bs-body-bg)',
                                color: 'var(--bs-body-color)'
                            }}> {dataType === 'json' ? (
                                <>
                                    <Badge bg="success" className="py-1 px-2">
                                        <FontAwesomeIcon icon={faCode} className="me-1" />
                                        JSON
                                    </Badge>
                                </>
                            ) : (

                                <strong>{systemDefaultValue}</strong>

                            )}
                        </div>
                        <p className="mt-3 mb-0">
                            Your custom setting will be removed.
                        </p>
                    </Alert>
                </div>
            </Offcanvas.Body>
            <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={onHide}>
                        <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                        Back
                    </Button>
                    <Button variant="warning" onClick={onConfirm}>
                        <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                        Confirm Reset
                    </Button>
                </div>
            </div>
        </Offcanvas>
    );
};

export default ConfirmResetPreferenceModal;