import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faClock, 
    faCheckCircle, 
    faBan, 
    faTimesCircle, 
    faPause, 
    faQuestion 
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { supabase } from '../../supabaseClient'; // Assuming you have a supabase client

interface Props {
    state: string;
    subscriptionId: string; // Add this instead of startDate
}

const SubscriptionStateDisplay: React.FC<Props> = ({ state, subscriptionId }) => {
    const [stateStartDate, setStateStartDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchStateHistory = async () => {
            const { data, error } = await supabase
                .from('subscription_history')
                .select('start_date')
                .eq('subscription_id', subscriptionId)
                .eq('state', state)
                .order('start_date', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching state history:', error);
                return;
            }

            if (data) {
                setStateStartDate(data.start_date);
            }
        };

        fetchStateHistory();
    }, [subscriptionId, state]);

    const getStateDisplay = (state: string) => {
        switch (state) {
            case 'trial':
                return { icon: faClock, color: 'info', label: 'Trial' };
            case 'active':
                return { icon: faCheckCircle, color: 'success', label: 'Active' };
            case 'canceled':
                return { icon: faBan, color: 'danger', label: 'Canceled' };
            case 'expired':
                return { icon: faTimesCircle, color: 'secondary', label: 'Expired' };
            case 'paused':
                return { icon: faPause, color: 'warning', label: 'Paused' };
            default:
                return { icon: faQuestion, color: 'secondary', label: state };
        }
    };

    const getTooltipText = (date: string) => {
        const startMoment = moment(date);
        return `Changed to ${state} on ${startMoment.format('MMMM D, YYYY, h:mm:ss A z')}\n${startMoment.fromNow()}`;
    };

    const stateInfo = getStateDisplay(state);

    return (
        <Badge 
            bg={stateInfo.color} 
            style={{ fontSize: '0.75em', minWidth: '6.5em' }}
            title={stateStartDate ? getTooltipText(stateStartDate) : undefined}
        >
            <FontAwesomeIcon icon={stateInfo.icon} className="me-1" />
            {stateInfo.label}
        </Badge>
    );
};

export default SubscriptionStateDisplay;