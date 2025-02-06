import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faSave, faGear, faRotateLeft } from '@fortawesome/free-solid-svg-icons';  // Add faRotateLeft
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { useAuth } from '../../AuthContext';
import ConfirmResetPreferenceModal from './ConfirmResetPreferenceModal';

interface Preference {
    id: string;
    preference_key: string;
    preference_value: string;
    data_type: string;
    available_values: string[] | null;
    effective_value: string;
}

interface EditPreferenceModalProps {
    show: boolean;
    onHide: () => void;
    preference: Preference | null;
    onSubmit?: () => Promise<void>;
}

const EditPreferenceModal: React.FC<EditPreferenceModalProps> = ({
    show,
    onHide,
    preference,
    onSubmit
}) => {
    const { user } = useAuth(); // Get current user from AuthContext
    const [value, setValue] = useState<string>('');
    const [isValid, setIsValid] = useState(true);
    const { addToast } = useToast();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [systemDefault, setSystemDefault] = useState<string>('');

    useEffect(() => {
        if (preference) {
            if (preference.data_type === 'json') {
                setValue(JSON.stringify(preference.effective_jsonb, null, 2));
            } else {
                setValue(preference.effective_value || '');
            }
            setIsValid(true);
            fetchSystemDefault();
        }
    }, [preference]);

    const fetchSystemDefault = async () => {
        if (!preference) return;
        
        const { data, error } = await supabase
            .from('preference_system_defaults')
            .select('preference_value')
            .eq('preference_key', preference.preference_key)
            .single();

        if (error) {
            console.error('Error fetching system default:', error);
            return;
        }

        setSystemDefault(data.preference_value);
    };

    const handleSave = async () => {
        if (!preference || !isValid || !user) return;

        try {
            const saveData = {
                owner: user.id,
                preference_key: preference.preference_key,
                ...(preference.data_type === 'json'
                    ? { preference_jsonb: JSON.parse(value), preference_value: null }
                    : { preference_value: value, preference_jsonb: null }
                )
            };

            const { error } = await supabase
                .from('preferences')
                .upsert(saveData, {
                    onConflict: 'owner,preference_key'
                });

            if (error) throw error;

            addToast('Preference saved successfully', 'success');
            onSubmit?.();
            onHide();
        } catch (error) {
            console.error('Save error:', error);
            addToast('Failed to save preference', 'error');
        }
    };

    const handleReset = async () => {
        setShowResetConfirm(true);
    };

    const confirmReset = async () => {
        if (!preference || !user) return;

        try {
            const { error } = await supabase
                .from('preferences')
                .delete()
                .eq('owner', user.id)
                .eq('preference_key', preference.preference_key);

            if (error) throw error;

            addToast('Preference reset to system default', 'success');
            setShowResetConfirm(false);
            onSubmit?.();
            onHide();
        } catch (error) {
            console.error('Reset error:', error);
            addToast('Failed to reset preference', 'error');
        }
    };

    const renderInput = () => {
        if (!preference) return null;

        switch (preference.data_type) {
            case 'number':
                return (
                    <Form.Control
                        type="number"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setIsValid(!isNaN(Number(e.target.value)));
                        }}
                        isInvalid={!isValid}
                    />
                );
            case 'choice':
                return (
                    <Form.Select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    >
                        {preference.available_values?.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </Form.Select>
                );
            case 'json':
                return (
                    <Form.Control
                        as="textarea"
                        rows={5}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            try {
                                JSON.parse(e.target.value);
                                setIsValid(true);
                            } catch {
                                setIsValid(false);
                            }
                        }}
                        isInvalid={!isValid}
                    />
                );
            default:
                return (
                    <Form.Control
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                );
        }
    };

    return (
        <>
            <Offcanvas show={show} onHide={onHide} placement="end" className="h-100">
                <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                    <div>
                        <Offcanvas.Title>
                            <FontAwesomeIcon icon={faGear} className="me-2" />
                            Edit Preference
                        </Offcanvas.Title>
                        <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                            {preference?.preference_key} {/* Change from preference?.title to preference?.preference_key */}
                        </div>
                    </div>
                </Offcanvas.Header>
                
                <Offcanvas.Body className="d-flex flex-column p-0">
                    <Form className="d-flex flex-column flex-grow-1 p-3">
                        <Form.Group className="d-flex flex-column flex-grow-1">
                            <Form.Label>Value</Form.Label>
                            {preference?.data_type === 'json' ? (
                                <Form.Control
                                    as="textarea"
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        try {
                                            JSON.parse(e.target.value);
                                            setIsValid(true);
                                        } catch {
                                            setIsValid(false);
                                        }
                                    }}
                                    isInvalid={!isValid}
                                    className="flex-grow-1"
                                    style={{ 
                                        resize: 'none',
                                        minHeight: '200px',
                                        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'
                                    }}
                                />
                            ) : (
                                renderInput()
                            )}
                        </Form.Group>
                    </Form>
                </Offcanvas.Body>

                <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        {value !== systemDefault && (  // Only show Reset if value differs from system default
                            <Button 
                                variant="outline-secondary" 
                                onClick={handleReset}
                                title="Reset to system default"
                            >
                                <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                                Reset
                            </Button>
                        )}
                        <div className="d-flex gap-2 ms-auto"> {/* Add ms-auto to push to right when Reset is hidden */}
                            <Button variant="secondary" onClick={onHide}>
                                <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                                Back
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleSave}
                                disabled={!isValid}
                            >
                                <FontAwesomeIcon icon={faSave} className="me-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </Offcanvas>

            <ConfirmResetPreferenceModal 
                show={showResetConfirm}
                onHide={() => setShowResetConfirm(false)}
                onConfirm={confirmReset}
                systemDefaultValue={systemDefault}
                dataType={preference?.data_type || 'text'}
            />
        </>
    );
};

export default EditPreferenceModal;