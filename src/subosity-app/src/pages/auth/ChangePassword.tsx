import React, { useState, FormEvent, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, InputGroup } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faKey, faSave } from '@fortawesome/free-solid-svg-icons';

const ChangePassword: React.FC = () => {
    const { user } = useAuth();
    const [isDemo, setIsDemo] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.email?.endsWith('@example.com')) {
            setIsDemo(true);
        }
    }, [user]);

    const validatePassword = (pass: string, confirm: string): boolean => {
        if (pass.length < 8) return false;
        if (!/[A-Z]/.test(pass)) return false;
        if (!/[a-z]/.test(pass)) return false;
        if (!/[0-9]/.test(pass)) return false;
        if (!/[^A-Za-z0-9]/.test(pass)) return false;
        if (pass !== confirm) return false;
        return true;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setIsValid(validatePassword(newPassword, confirmPassword));
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);
        setIsValid(validatePassword(password, newConfirmPassword));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isDemo) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
                addToast('Failed to change password', 'error');
            } else {
                addToast('Password changed successfully', 'success');
                // Add context for password manager
                const successUrl = `/profile?email=${encodeURIComponent(user?.email || '')}&passwordChanged=true`;
                navigate(successUrl);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            addToast('Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <div className="mb-4">
                <h3 className="mb-2">
                    <FontAwesomeIcon icon={faKey} className="me-2" />
                    Change Password
                </h3>
                <p className="mb-0 text-muted">
                    Use this form to change your password.
                </p>
                <hr className="mt-2" />
            </div>

            <Container className="mt-5 d-flex justify-content-center">
                <div style={{ width: '100%', maxWidth: '500px' }}>
                    {isDemo && (
                        <Alert variant="info" className="mb-3">
                            <i className="fas fa-info-circle me-2"></i>
                            Password changes are disabled for demo accounts.
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit} autoComplete="on" id="change-password-form">
                        <Form.Control
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            autoComplete="username email"
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />

                        <Card className="shadow">
                            <Card.Body>
                                <div className="row">
                                    {/* Left Column - Password Input */}
                                    <div className="col-md-6">
                                        <Form.Group className="mb-3" controlId="password">
                                            <Form.Label>New Password</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>
                                                    <FontAwesomeIcon icon={faKey} />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={password}
                                                    onChange={handlePasswordChange}
                                                    isValid={password.length > 0 && isValid}
                                                    isInvalid={password.length > 0 && !isValid}
                                                    required
                                                    disabled={isDemo}
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                        <Form.Group className="mb-3" controlId="confirmPassword">
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text>
                                                    <FontAwesomeIcon icon={faKey} />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={confirmPassword}
                                                    onChange={handleConfirmPasswordChange}
                                                    isValid={confirmPassword.length > 0 && isValid}
                                                    isInvalid={confirmPassword.length > 0 && !isValid}
                                                    required
                                                    disabled={isDemo}
                                                />
                                            </InputGroup>
                                            {confirmPassword.length > 0 && !isValid && (
                                                <Form.Control.Feedback type="invalid">
                                                    Passwords must match and meet complexity requirements
                                                </Form.Control.Feedback>
                                            )}
                                        </Form.Group>
                                    </div>

                                    {/* Vertical Divider */}
                                    <div className="col-md-1 d-none d-md-block">
                                        <div className="vr h-100"></div>
                                    </div>

                                    {/* Right Column - Helper Text */}
                                    <div className="col-md-5">
                                        <Form.Text className="text-muted">
                                            <i className="fas fa-shield-alt me-2"></i>
                                            <strong>Strong Password Tips:</strong>
                                            <ul className="mt-2 mb-0">
                                                <li>Use at least 8 characters</li>
                                                <li>Include uppercase and lowercase letters</li>
                                                <li>Add numbers and special characters</li>
                                                <li>Avoid using personal information</li>
                                            </ul>
                                            <small className="d-block mt-2">
                                                <i className="fas fa-info-circle me-1"></i>
                                                A strong password helps protect your account from unauthorized access.
                                            </small>
                                        </Form.Text>
                                    </div>
                                </div>

                            </Card.Body>
                        </Card>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <div className="d-flex justify-content-center">

                            <div className="mt-3">
                                <Link to="/profile" className="text-decoration-none btn btn-secondary me-2">
                                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                    Back to Profile
                                </Link>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={!isValid || loading || isDemo}
                                    form="change-password-form"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Changing Password...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} className="me-2" />
                                            Change Password
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Form>

                </div>
            </Container>
        </Container>
    );
};

export default ChangePassword;