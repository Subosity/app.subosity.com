import React, { useState, useContext } from 'react';
import { Form, InputGroup, Button, Spinner, Alert, Carousel } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { ThemeProvider } from '../../ThemeContext';

interface Props {
    onMetadataFetched: (metadata: {
        name: string;
        description: string;
        icons: string[];
        website?: string
    }) => void;
    onIconSelected?: (icon: string) => void;
    name?: string; // Change to optional
    description?: string; // Change to optional
    website?: string; // Change to optional
    category?: string; // Change to optional
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onWebsiteChange: (website: string) => void;
    onError?: (error: string) => void;
    existingProviders?: Array<{ name: string, website: string }>;
}

const SubscriptionProviderFinder: React.FC<Props> = ({
    onMetadataFetched,
    onIconSelected = () => { },
    name = '',
    description = '',
    website = '',
    onNameChange,
    onDescriptionChange,
    onWebsiteChange,
    onError,
    existingProviders = []
}) => {
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<{ name: string; description: string; icons: string[]; website?: string } | null>(null);
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const theme = useContext(ThemeProvider);

    const uniqueIcons = metadata?.icons ? [...new Set(metadata.icons)] : [];

    const chunk = (arr: any[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    const fetchMetadata = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-metadata?domain=${domain}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const metadata = await response.json();

            const existingProvider = existingProviders.find(p =>
                p.website === metadata.website ||
                p.name.toLowerCase() === metadata.name.toLowerCase()
            );

            if (existingProvider) {
                setError('A subscription provider with this name or website already exists in the system.');
                return;
            }

            setMetadata(metadata);
            onMetadataFetched(metadata);

            if (metadata.name) onNameChange(metadata.name);
            if (metadata.description) onDescriptionChange(metadata.description);
            if (metadata.website) {
                setDomain(metadata.website);
                onWebsiteChange(metadata.website);
            }
        } catch (err) {
            setError(`Failed to fetch metadata: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleIconClick = (icon: string) => {
        setSelectedIcon(icon);
        onIconSelected(icon);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!metadata || !selectedIcon) {
            setError('Please select an icon.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insert-subscription-provider`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    name: metadata.name,
                    description: metadata.description,
                    icon: selectedIcon,
                    website: metadata.website,
                    domain
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Subscription Provider saved successfully!');
        } catch (err) {
            setError(`Failed to save Subscription Provider: ${err.message}`);
        }
    };

    // Add these validation functions
    const validateName = (name: string) => {
        const existingProvider = existingProviders.find(p =>
            p.name.toLowerCase() === name.toLowerCase()
        );
        if (existingProvider) {
            setError('A subscription provider with this name already exists in the system.');
            return false;
        }
        setError(null);
        return true;
    };

    const validateWebsite = (website: string) => {
        const existingProvider = existingProviders.find(p =>
            p.website === website
        );
        if (existingProvider) {
            setError('A subscription provider with this website already exists in the system.');
            return false;
        }
        setError(null);
        return true;
    };

    // Update the onChange handlers
    const handleNameChange = (newName: string) => {
        if (validateName(newName)) {
            onNameChange(newName);
        }
    };

    const handleWebsiteChange = (newWebsite: string) => {
        if (validateWebsite(newWebsite)) {
            onWebsiteChange(newWebsite);
            setDomain(newWebsite);
        }
    };

    return (
        <div className="bg-body rounded p-3 border shadow" style={{ marginTop: '1rem' }}>
            <Form onSubmit={handleSubmit}>
                <InputGroup className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <div className="text-muted mb-2" style={{ fontSize: '0.75em' }}>
                        Enter the domain of the subscription provider's website (e.g., example.com)
                    </div>
                    <Form.Control
                        type="text"
                        placeholder="Enter domain (e.g., example.com)"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        required
                    />
                    <Button
                        variant="primary"
                        onClick={fetchMetadata}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faSearch} />}
                    </Button>
                </InputGroup>

                {error && (
                    <Alert variant="danger" className="mt-3">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                        {error}
                    </Alert>
                )}

                {metadata && (
                    <div>
                        <h5>Found Metadata</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Name <span className="text-danger">*</span><br />
                                <small className="text-muted" style={{ fontSize: '0.75em' }}>Shorten this name to the simple brand name. (e.g. "Costco", "Walmart+", etc)</small>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                isInvalid={!!error}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                Please enter a name
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Description <span className="text-danger">*</span><br />
                                <small className="text-muted" style={{ fontSize: '0.75em' }}>Keep or re-word the description of what this subscription really is.</small></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                isInvalid={!description.trim()}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                Please enter a description
                            </Form.Control.Feedback>
                        </Form.Group>

                        {uniqueIcons.length > 0 ? (
                            <>
                                <Form.Control type="hidden" value={selectedIcon || ''} />
                                <h6 style={{ "marginBottom": "0.5rem" }}>Select an Icon</h6>
                                <small className="text-muted mb-3 d-block" style={{ fontSize: '0.75em' }}>Shorten this name to the simple brand name. (e.g. "Costco", "Walmart+", etc)</small>
                                <Carousel
                                    indicators={false}
                                    controls={true}
                                    interval={null}
                                    className="bg-body-tertiary rounded p-3 border"
                                    style={{ height: '140px', display: 'flex', alignItems: 'center' }}
                                >
                                    {chunk(uniqueIcons, 4).map((iconGroup, groupIndex) => (
                                        <Carousel.Item key={groupIndex}>
                                            <div className="d-flex justify-content-center gap-3 align-items-center">
                                                {iconGroup.map((icon, index) => (
                                                    <div
                                                        key={index}
                                                        className="position-relative"
                                                        onClick={() => handleIconClick(icon)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            width: '96px',
                                                            height: '96px',
                                                            margin: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: 'var(--bs-body-bg)',
                                                            border: selectedIcon === icon ? '2px solid var(--bs-primary)' : '1px solid var(--bs-border-color)',
                                                            borderRadius: '8px',
                                                            padding: '12px' // Add padding to prevent icons from touching borders
                                                        }}
                                                    >
                                                        <img
                                                            src={icon}
                                                            alt={`Icon ${index + 1}`}
                                                            style={{
                                                                minWidth: '48px',
                                                                minHeight: '48px',
                                                                maxWidth: '64px',
                                                                maxHeight: '64px',
                                                                width: '80%',
                                                                height: '80%',
                                                                objectFit: 'contain'
                                                            }}
                                                        />
                                                        {selectedIcon === icon && (
                                                            <div
                                                                className="position-absolute bg-primary rounded-circle"
                                                                style={{
                                                                    top: '-12px',
                                                                    left: '-12px',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    zIndex: 1
                                                                }}
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={faCheckCircle}
                                                                    className="text-white"
                                                                    style={{ fontSize: '14px' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            </>
                        ) : (
                            <Alert variant="warning">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                No icons found for this website. A valid icon is required to add this subscription provider.
                            </Alert>
                        )}
                    </div>
                )}
            </Form>
        </div>
    );
};

export default SubscriptionProviderFinder;