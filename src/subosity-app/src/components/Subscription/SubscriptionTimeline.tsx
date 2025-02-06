// src/components/SubscriptionTimeline.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faClock, 
    faCheckCircle, 
    faBan, 
    faTimesCircle, 
    faPause 
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

interface TimelineEvent {
    state: string;
    start_date: string;
    end_date: string | null;
}

interface Props {
    subscriptionId: string;
}

const SubscriptionTimeline: React.FC<Props> = ({ subscriptionId }) => {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const getStateInfo = (state: string) => {
        switch (state) {
            case 'trial':
                return { icon: faClock, color: 'var(--bs-info)', label: 'Trial' };
            case 'active':
                return { icon: faCheckCircle, color: 'var(--bs-success)', label: 'Active' };
            case 'canceled':
                return { icon: faBan, color: 'var(--bs-danger)', label: 'Canceled' };
            case 'expired':
                return { icon: faTimesCircle, color: 'var(--bs-secondary)', label: 'Expired' };
            case 'paused':
                return { icon: faPause, color: 'var(--bs-warning)', label: 'Paused' };
            default:
                return { icon: faClock, color: 'var(--bs-secondary)', label: state };
        }
    };

    const getDuration = (startDate: string, endDate: string | null) => {
        const start = moment(startDate);
        const end = endDate ? moment(endDate) : moment();
        return moment.duration(end.diff(start)).humanize();
    };

    // Add formatDate helper function
    const formatDateWithTime = (date: string) => {
        return moment(date).format('MMMM D, YYYY, h:mm:ss A z');
    };

    // Add helper for time since state change
    const getTimeSinceStateChange = (date: string) => {
        return moment(date).fromNow();
    };

    useEffect(() => {
        const fetchTimeline = async () => {
            const { data, error } = await supabase
                .from('subscription_history')
                .select('*')
                .eq('subscription_id', subscriptionId)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching timeline:', error);
                return;
            }

            setEvents(data);
            setLoading(false);
        };

        fetchTimeline();
    }, [subscriptionId]);

    if (loading) return <div>Loading timeline...</div>;

    return (
        <div className="subscription-timeline p-3 rounded bg-body-tertiary border">
            <h6 className="mb-3">Subscription Timeline</h6>
            <div className="position-relative" style={{ minHeight: '120px' }}>
                {/* History Section (Scrollable) */}
                <div className="timeline-scroll position-relative" 
                    style={{ 
                        marginRight: '120px', // Reduced from 180px
                        overflowX: 'auto',
                        overflowY: 'hidden'
                    }}>
                    <div className="timeline-container position-relative d-flex align-items-center">
                        {/* Dotted Line - Extended */}
                                                <div className="timeline-line position-absolute" 
                            style={{
                                height: '3px',
                                backgroundColor: 'transparent',
                                borderTop: '3px dotted var(--bs-border-color)',
                                width: window.innerWidth < 768 
                                    ? 'calc(100% + 120px)' // Mobile: extend to current state
                                    : '100%',              // Desktop: normal width
                                zIndex: 1
                            }}
                        />
                        
                        {/* Historical States */}
                        <div className="d-flex" 
                            style={{ 
                                minWidth: (events.length - 1) * 150 + 'px',
                                paddingTop: '1rem',
                                paddingBottom: '1rem'
                            }}>
                            {events.slice(0, -1).map((event, index) => {
                                const stateInfo = getStateInfo(event.state);
                                const nextEvent = events[index + 1];
                                const duration = nextEvent ? getDuration(event.start_date, nextEvent.start_date) : 
                                    getDuration(event.start_date, null);

                                return (
                                    <div key={`${event.state}-${event.start_date}`} 
                                        className="position-relative" 
                                        style={{ flex: 1 }}>
                                        <div className="timeline-point d-flex flex-column align-items-center">
                                            {duration && index < events.length - 1 && (
                                                <div 
                                                    className="d-none d-md-block position-absolute text-body-secondary px-2 rounded"
                                                    style={{
                                                        fontSize: '0.75em',
                                                        left: '100%',
                                                        top: '50%', // Move to vertical center
                                                        transform: 'translate(-50%, -50%)', // Center both horizontally and vertically
                                                        backgroundColor: 'var(--bs-body-bg)',
                                                        border: '1px solid var(--bs-border-color)',
                                                        zIndex: 3,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {duration}
                                                </div>
                                            )}
                                            <div className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    backgroundColor: stateInfo.color,
                                                    color: 'white',
                                                    transition: 'all 0.2s ease-in-out'
                                                }}>
                                                <FontAwesomeIcon icon={stateInfo.icon} />
                                            </div>
                                            <div className="text-center">
                                                <div className="fw-bold" style={{ fontSize: '0.8em' }}>
                                                    {stateInfo.label}
                                                </div>
                                                <div 
                                                    className="text-body-secondary" 
                                                    style={{ fontSize: '0.75em' }}
                                                    title={formatDateWithTime(event.start_date)}
                                                >
                                                    {new Date(event.start_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Current State (Fixed) */}
                {events.length > 0 && (
                    <div className="position-absolute" 
                        style={{ 
                            right: '10px',  // Reduced from 20px
                            top: '0',
                            bottom: '0',
                            width: '110px',  // Reduced from 160px
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bs-body-bg)',
                            zIndex: 4
                        }}>
                        <div className="timeline-point d-flex flex-column align-items-center">
                            <div className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: getStateInfo(events[events.length - 1].state).color,
                                    color: 'white',
                                    transform: 'scale(1.25)',
                                    transition: 'all 0.2s ease-in-out'
                                }}>
                                <FontAwesomeIcon icon={getStateInfo(events[events.length - 1].state).icon} />
                            </div>
                            <div className="text-center" style={{ transform: 'scale(1.25)' }}>
                                <div className="fw-bold" style={{ fontSize: '0.8em' }}>
                                    {getStateInfo(events[events.length - 1].state).label}
                                </div>
                                <div 
                                    className="text-body-secondary" 
                                    style={{ fontSize: '0.6em' }}
                                    title={formatDateWithTime(events[events.length - 1].start_date)}
                                >
                                    {new Date(events[events.length - 1].start_date).toLocaleDateString()}
                                </div>
                                <div className="text-body-secondary" style={{ fontSize: '0.65em', fontStyle: 'italic' }}>
                                    {getTimeSinceStateChange(events[events.length - 1].start_date)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gradient Fade Effect */}
                <div className="position-absolute" 
                    style={{
                        right: '120px',  // Match new margin
                        top: 0,
                        bottom: 0,
                        width: '20px',  // Reduced from 40px
                        background: 'linear-gradient(to right, transparent, var(--bs-body-bg))',
                        zIndex: 3
                    }}
                />
            </div>
        </div>
    );
};

export default SubscriptionTimeline;