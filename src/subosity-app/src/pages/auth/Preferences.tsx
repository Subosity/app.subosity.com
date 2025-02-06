import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faEdit, faSort, faSortUp, faSortDown, faCode } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import EditPreferenceModal from '../../components/Auth/EditPreferenceModal';
import { useTheme } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import EditNotificationPreferences from '../../components/Auth/EditNotificationPreferences';

interface Preference {
    preference_key: string;
    preference_description: string;
    effective_value: string;
    effective_jsonb: any; // Change to any to handle JSON objects
    data_type: 'text' | 'json' | 'number' | 'choice';
    available_values: string[] | null;
}

const formatPreferenceValue = (pref: Preference) => {
    if (pref.data_type === 'json') {
        try {
            const jsonValue = pref.effective_jsonb;
            return JSON.stringify(jsonValue, null, 2);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return '{}';
        }
    }
    return pref.effective_value;
};

type SortField = 'preference_key' | 'effective_value';
type SortDirection = 'asc' | 'desc';

const Preferences: React.FC = () => {
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [selectedPreference, setSelectedPreference] = useState<Preference | null>(null);
    const [sortField, setSortField] = useState<SortField>('preference_key');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const { addToast } = useToast();
    const { theme, applyTheme } = useTheme();
    const { user } = useAuth();

    useEffect(() => {
        fetchPreferences();
    }, [theme]);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const { data: defaults, error: defaultsError } = await supabase
                .from('preference_system_defaults')
                .select(`
                    preference_key,
                    preference_description,
                    preference_data_type,
                    preference_value,
                    preference_jsonb,
                    available_values,
                    preferences (
                        preference_value,
                        preference_jsonb
                    )
                `)
                .eq('preferences.owner', user.id);

            if (defaultsError) throw defaultsError;

            // Format the data to match our interface
            const formattedData = defaults.map(def => ({
                preference_key: def.preference_key,
                preference_description: def.preference_description,
                effective_value: def.preferences?.[0]?.preference_value ?? def.preference_value,
                effective_jsonb: def.preferences?.[0]?.preference_jsonb ?? def.preference_jsonb,
                data_type: def.preference_data_type,
                available_values: def.available_values,
            }));

            setPreferences(formattedData);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            addToast('Failed to fetch preferences', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (preference: Preference) => {
        setSelectedPreference(preference);
        setShowEdit(true);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return faSort;
        return sortDirection === 'asc' ? faSortUp : faSortDown;
    };

    const sortedPreferences = [...preferences].sort((a, b) => {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        const aVal = a[sortField].toLowerCase();
        const bVal = b[sortField].toLowerCase();
        return aVal > bVal ? multiplier : -multiplier;
    });

    const handlePreferenceUpdate = async () => {
        await fetchPreferences();
        
        // After any preference change (save OR reset), check if it was the Theme
        const { data: themeData } = await supabase
            .from('preference_system_defaults')
            .select(`
                preference_value,
                preferences (
                    preference_value
                )
            `)
            .eq('preference_key', 'Theme')
            .eq('preferences.owner', user.id)
            .single();

        if (themeData) {
            const effectiveTheme = themeData.preferences?.[0]?.preference_value ?? themeData.preference_value;
            applyTheme(effectiveTheme as 'Auto' | 'Light' | 'Dark');
        }
        
        setShowEdit(false);
    };

    return (
        <div className="container py-4">
            <h3 className="mb-0">
                <FontAwesomeIcon icon={faGear} className="me-2" />
                Preferences
            </h3>
            <p style={{
                color: 'var(--bs-body-color)',
                opacity: 0.75,
                borderBottom: 'var(--bs-border-color) solid 1px'
            }} className="mb-4">
                Customize your application settings
            </p>

            <Container>
                {loading ? (
                    <div className="text-center mt-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : (
                    <div className="container-fluid p-0">
                        {sortedPreferences.map(pref => (
                            <div 
                                key={pref.preference_key}
                                className="row align-items-center p-3 mb-2 rounded border shadow-sm"
                                style={{
                                    backgroundColor: 'var(--bs-body-bg)',
                                    borderColor: 'var(--bs-border-color)',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                            >
                                {/* Title - Full width on mobile, 4 cols on desktop */}
                                <div className="col-12 col-md-4 mb-2 mb-md-0">
                                    <h6 className="mb-1">{pref.preference_key}</h6>
                                    <small className="text-muted">
                                        {pref.preference_description}
                                    </small>
                                </div>

                                {/* Value - Full width on mobile, 6 cols on desktop */}
                                <div className="col-12 col-md-6 mb-2 mb-md-0">
                                    <div className="d-flex align-items-center">
                                        {pref.data_type === 'json' ? (
                                            <>
                                                <Badge bg="success" className="py-1 px-2">
                                                    <FontAwesomeIcon icon={faCode} className="me-1" />
                                                    JSON
                                                </Badge>
                                            </>
                                        ) : (
                                            <span>{pref.effective_value}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions - Full width on mobile, 2 cols on desktop */}
                                <div className="col-12 col-md-2 text-start text-md-end">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleEdit(pref)}
                                        className="w-100 w-md-auto"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Container>

            {selectedPreference?.preference_key === "Notifications" ? (
                <EditNotificationPreferences
                    show={showEdit}
                    onHide={() => setShowEdit(false)}
                    preference={selectedPreference}
                    onSubmit={handlePreferenceUpdate}
                />
            ) : (
                <EditPreferenceModal
                    show={showEdit}
                    onHide={() => setShowEdit(false)}
                    preference={selectedPreference}
                    onSubmit={handlePreferenceUpdate}
                />
            )}
        </div>
    );
};

export default Preferences;