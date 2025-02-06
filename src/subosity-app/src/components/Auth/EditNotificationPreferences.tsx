import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, Form, Table, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronLeft,
    faSave,
    faBell,
    faRotateLeft,
    faClock,
    faEnvelope,
    faMobile,
    faComment,
    faTag
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';
import { useAuth } from '../../AuthContext';
import ConfirmResetPreferenceModal from './ConfirmResetPreferenceModal';

interface NotificationSchedule {
    offset_days: number;
    type: string;
    channels: string[];
}

interface NotificationPreference {
    quiet_hours: { start: string; end: string };
    enabled: boolean;
    schedule: NotificationSchedule[];
    trial: {
        enabled: boolean;
        schedule: NotificationSchedule[];
    };
    digest_only: boolean;
    digest: {
        enabled: boolean;
        rrule: string;
        channels: string[];
    };
}

const DIGEST_SCHEDULES = [
    { label: 'Daily', value: 'FREQ=DAILY;INTERVAL=1' },
    { label: 'Weekly', value: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO' },
    { label: 'Twice per Month', value: 'FREQ=MONTHLY;INTERVAL=1;BYDAY=1FR,3FR' },
    { label: 'Monthly', value: 'FREQ=MONTHLY;INTERVAL=1;BYDAY=1FR' }
];

interface Props {
    show: boolean;
    onHide: () => void;
    preference: any;
    onSubmit?: () => Promise<void>;
}

const EditNotificationPreferences: React.FC<Props> = ({
    show,
    onHide,
    preference,
    onSubmit
}) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [systemDefault, setSystemDefault] = useState<string>('');
    const [settings, setSettings] = useState<NotificationPreference>(
        preference?.effective_jsonb || {}
    );

    useEffect(() => {
        if (preference) {
            setSettings(preference.effective_jsonb);
            fetchSystemDefault();
        }
    }, [preference]);

    const fetchSystemDefault = async () => {
        if (!preference) return;

        const { data, error } = await supabase
            .from('preference_system_defaults')
            .select('preference_jsonb')
            .eq('preference_key', preference.preference_key)
            .single();

        if (error) {
            console.error('Error fetching system default:', error);
            return;
        }

        setSystemDefault(JSON.stringify(data.preference_jsonb, null, 2));
    };

    const handleReset = () => {
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

            addToast('Notification preferences reset to system default', 'success');
            setShowResetConfirm(false);
            onSubmit?.();
            onHide();
        } catch (error) {
            console.error('Reset error:', error);
            addToast('Failed to reset notification preferences', 'error');
        }
    };

    const handleSave = async () => {
        if (!preference || !user) return;

        try {
            const { error } = await supabase
                .from('preferences')
                .upsert({
                    owner: user.id,
                    preference_key: preference.preference_key,
                    preference_jsonb: settings,
                    preference_value: null
                }, {
                    onConflict: 'owner,preference_key'
                });

            if (error) throw error;

            addToast('Notification preferences saved successfully', 'success');
            onSubmit?.();
            onHide();
        } catch (error) {
            console.error('Save error:', error);
            addToast('Failed to save notification preferences', 'error');
        }
    };

    const renderChannelCheckbox = (schedule: NotificationSchedule, channel: string, isTrialSchedule: boolean) => (
        <Form.Check
            type="checkbox"
            checked={schedule.channels.includes(channel)}
            onChange={(e) => {
                const newChannels = e.target.checked
                    ? [...schedule.channels, channel]
                    : schedule.channels.filter(c => c !== channel);

                if (isTrialSchedule) {
                    // Update trial schedule
                    setSettings(prev => ({
                        ...prev,
                        trial: {
                            ...prev.trial,
                            schedule: prev.trial.schedule.map(item =>
                                item.offset_days === schedule.offset_days
                                    ? { ...item, channels: newChannels }
                                    : item
                            )
                        }
                    }));
                } else {
                    // Update regular schedule
                    setSettings(prev => ({
                        ...prev,
                        schedule: prev.schedule.map(item =>
                            item.offset_days === schedule.offset_days
                                ? { ...item, channels: newChannels }
                                : item
                        )
                    }));
                }
            }}
        />
    );

    return (
        <>
            <Offcanvas show={show} onHide={onHide} placement="end">
                <Offcanvas.Header closeButton style={{ backgroundColor: 'var(--bs-navbar-bg)', color: 'var(--bs-body-color)' }}>
                    <div>
                        <Offcanvas.Title>
                            <FontAwesomeIcon icon={faBell} className="me-2" />
                            Notification Preferences
                        </Offcanvas.Title>
                        <div style={{ fontSize: '0.85em', opacity: 0.6 }}>
                            Customize how you receive notifications
                        </div>
                    </div>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <Form>
                        {/* Master Enable Switch */}
                        <Form.Group className="mb-4">
                            <Form.Check
                                type="switch"
                                id="notification-enabled"
                                label="Enable Notifications"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                        </Form.Group>

                        {/* Quiet Hours */}
                        <Form.Group className="mb-4">
                            <Form.Label>
                                <FontAwesomeIcon icon={faClock} className="me-2" />
                                Quiet Hours
                            </Form.Label>
                            <div className="d-flex gap-3">
                                <Form.Control
                                    type="time"
                                    value={settings.quiet_hours.start}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        quiet_hours: { ...settings.quiet_hours, start: e.target.value }
                                    })}
                                />
                                <span className="align-self-center">to</span>
                                <Form.Control
                                    type="time"
                                    value={settings.quiet_hours.end}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        quiet_hours: { ...settings.quiet_hours, end: e.target.value }
                                    })}
                                />
                            </div>
                        </Form.Group>

                        {/* Regular Schedule */}
                        <Form.Group className="mb-4">
                            <Form.Label>
                                <FontAwesomeIcon icon={faBell} className="me-2" />
                                Notification Schedule</Form.Label>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Email</th>
                                        <th>Push</th>
                                        <th>SMS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.schedule.map((item, index) => (
                                        <tr key={index}>
                                            <td>{Math.abs(item.offset_days)} days before</td>
                                            <td>{renderChannelCheckbox(item, 'email', false)}</td>
                                            <td>{renderChannelCheckbox(item, 'push', false)}</td>
                                            <td>{renderChannelCheckbox(item, 'sms', false)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Form.Group>

                        {/* Trial Notifications */}
                        <Form.Group className="mb-4">
                            <Form.Label>
                                <FontAwesomeIcon icon={faTag} className="me-2" />
                                Trial Expiration Notifications</Form.Label>
                            <Table responsive>
                                <thead>
                                    <tr>
                                        <th>When</th>
                                        <th>Email</th>
                                        <th>Push</th>
                                        <th>SMS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.trial.schedule.map((item, index) => (
                                        <tr key={index}>
                                            <td>{Math.abs(item.offset_days)} days before</td>
                                            <td>{renderChannelCheckbox(item, 'email', true)}</td>
                                            <td>{renderChannelCheckbox(item, 'push', true)}</td>
                                            <td>{renderChannelCheckbox(item, 'sms', true)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Form.Group>

                        {/* Digest Settings */}
                        <Form.Group className="mb-4">
                            <Form.Label>
                                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                Digest Settings
                            </Form.Label>
                            <Form.Check
                                type="switch"
                                id="digest-only"
                                label="Receive notifications as digest only"
                                checked={settings.digest_only}
                                onChange={(e) => setSettings({ ...settings, digest_only: e.target.checked })}
                                className="mb-2"
                            />
                            <Form.Select
                                value={settings.digest.rrule}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    digest: { ...settings.digest, rrule: e.target.value }
                                })}
                            >
                                {DIGEST_SCHEDULES.map(schedule => (
                                    <option key={schedule.value} value={schedule.value}>
                                        {schedule.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Offcanvas.Body>

                <div className="p-3 border-top" style={{ backgroundColor: 'var(--bs-navbar-bg)' }}>
                    <div className="d-flex justify-content-between align-items-center">
                        {JSON.stringify(settings) !== systemDefault && (
                            <Button
                                variant="outline-secondary"
                                onClick={handleReset}
                                title="Reset to system default"
                            >
                                <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
                                Reset
                            </Button>
                        )}
                        <div className="d-flex gap-2 ms-auto">
                            <Button variant="secondary" onClick={onHide}>
                                <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                                Back
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
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
                dataType="json"
            />
        </>
    );
};

export default EditNotificationPreferences;