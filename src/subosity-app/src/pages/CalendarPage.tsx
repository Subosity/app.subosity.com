import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from '../supabaseClient';
import { getOccurrencesInRange } from '../utils/recurrenceUtils';
import { useTheme } from '../ThemeContext';
import { Container, Modal } from 'react-bootstrap';
import '../styles/calendar.css';
import SubscriptionListItem from '../components/SubscriptionListItem';
import { Subscription } from '../types/Subscription';
import SubscriptionCard from '../components/SubscriptionCard';
import DeleteSubscriptionModal from '../components/DeleteSubscriptionModal';
import EditSubscriptionModal from '../components/EditSubscriptionModal';
import { useToast } from '../ToastContext';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: {
        amount: number;
        providerLogo: string;
        paymentIcon: string;
        category: string;
    },
    subscription: Subscription;
}

const CalendarPage: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { theme } = useTheme();
    const isDarkMode = theme === 'Dark' || (theme === 'Auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const { addToast } = useToast();
        const [currentView, setCurrentView] = useState<View>('month');

    const fetchSubscriptionEvents = async (start: Date) => {
        const { data: subscriptions, error } = await supabase
            .from('subscription')
            .select(`
                *,
                subscription_provider:subscription_provider_id(
                    id,
                    name,
                    description,
                    category,
                    icon
                ),
                funding_source:funding_source_id(
                    id,
                    name,
                    payment_provider:payment_provider_id(
                        id,
                        name,
                        icon
                    )
                ),
                subscription_history!inner (
                    state,
                    start_date
                )
            `)
            .is('subscription_history.end_date', null)
            .in('subscription_history.state', ['active', 'trial']);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            addToast('An error occurred while fetching subscriptions', 'error');
            return;
        }

        const monthStart = moment(start).startOf('month').toDate();
        const monthEnd = moment(start).endOf('month').toDate();

        const monthEvents = subscriptions.flatMap(sub => {
            const renewalDates = getOccurrencesInRange(
                sub.recurrence_rule,
                monthStart,
                monthEnd,
                sub.start_date || sub.subscription_history?.[sub.subscription_history.length - 1]?.start_date
            );

            return renewalDates.map(date => ({
                id: `${sub.id}-${date.getTime()}`,
                title: `${sub.subscription_provider.name} ($${sub.amount})`,
                start: date,
                end: date,
                allDay: true,
                resource: {
                    amount: sub.amount,
                    providerLogo: sub.subscription_provider.icon,
                    paymentIcon: sub.funding_source?.payment_provider?.icon,
                    category: sub.subscription_provider.category
                },
                subscription: {
                    id: sub.id,
                    providerId: sub.subscription_provider_id,
                    providerName: sub.subscription_provider.name,
                    providerDescription: sub.subscription_provider.description,
                    providerCategory: sub.subscription_provider.category,
                    providerIcon: sub.subscription_provider.icon,
                    nickname: sub.nickname,
                    startDate: sub.start_date,
                    recurrenceRule: sub.recurrence_rule,
                    recurrenceRuleUiFriendly: sub.recurrence_rule_ui_friendly,
                    autoRenewal: sub.autorenew,
                    amount: sub.amount,
                    fundingSourceId: sub.funding_source_id,
                    fundingSource: sub.funding_source ? {
                        id: sub.funding_source.id,
                        name: sub.funding_source.name,
                        paymentProviderName: sub.funding_source.payment_provider.name,
                        paymentProviderIcon: sub.funding_source.payment_provider.icon
                    } : undefined,
                    notes: sub.notes,
                    state: sub.state
                }
            }));
        });

        setEvents(monthEvents);
    };

    useEffect(() => {
        fetchSubscriptionEvents(currentDate);
    }, [currentDate]);

    const handleSelectEvent = (event: CalendarEvent) => {
        const dayEvents = events.filter(e => moment(e.start).isSame(event.start, 'day'));
        if (dayEvents.length > 0) {
            setSelectedDate(event.start);
            setShowModal(true);
        }
    };

    const handleShowMore = (events: CalendarEvent[], date: Date) => {
        setSelectedDate(date);
        setShowModal(true);
    };

    const handleSelectSlot = (slotInfo: { start: Date, end: Date, action: string }) => {
        setSelectedDate(slotInfo.start);
        setShowModal(true);
    };

    const eventRenderer = ({ event }: { event: CalendarEvent }) => (
        <div className="d-flex align-items-center">
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-2"
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    aspectRatio: '1 / 1',
                    backgroundColor: 'var(--bs-white)',
                    overflow: 'hidden'
                }}>
                <img
                    src={event.resource.providerLogo}
                    alt={event.subscription.providerName}
                    style={{
                        width: '150%',
                        height: '150%',
                        objectFit: 'contain',
                        padding: '2px'
                    }}
                />
            </div>
            <span className="d-none d-md-block" style={{ fontSize: '0.75em', marginRight: 'auto' }}>
                ${event.resource.amount.toFixed(2)}
            </span>
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    aspectRatio: '1 / 1',
                    backgroundColor: 'var(--bs-white)',
                    overflow: 'hidden'
                }}>
                <img
                    src={event.resource.paymentIcon}
                    alt={event.subscription.paymentProviderName}
                    style={{
                        width: '150%',
                        height: '150%',
                        objectFit: 'contain',
                        padding: '2px'
                    }}
                />
            </div>
        </div>
    );

    return (
        <Container className="mt-4">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                className={`calendar-container ${isDarkMode ? 'theme-dark' : 'theme-light'} ${currentView === 'week' ? 'week-view' : ''}`}
                style={{
                    backgroundColor: 'var(--bs-body-bg)',
                    color: 'var(--bs-body-color)'
                }}
                views={['week', 'month']}
                defaultView="month"
                onNavigate={(date) => {
                    setCurrentDate(date);
                    fetchSubscriptionEvents(date);
                }}
                onView={(view) => setCurrentView(view)}
                onSelectEvent={handleSelectEvent}
                onShowMore={handleShowMore}
                onSelectSlot={handleSelectSlot}
                selectable={false}
                components={{
                    event: eventRenderer
                }}
            />

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                className={isDarkMode ? 'theme-dark' : 'theme-light'}
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedDate ? moment(selectedDate).format('MMMM D, YYYY') : ''}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedDate && (
                        <>
                            {events.filter(event => moment(event.start).isSame(selectedDate, 'day')).length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    No subscription renewals scheduled for this day
                                </div>
                            ) : (
                                events
                                    .filter(event => moment(event.start).isSame(selectedDate, 'day'))
                                    .map(event => (
                                        <div key={event.id} className="mb-2">
                                            <SubscriptionCard
                                                key={event.subscription.id}
                                                subscription={event.subscription}
                                                onEdit={(sub) => {
                                                    setSelectedSubscription(sub);
                                                    setShowEdit(true);
                                                    setShowModal(false);
                                                }}
                                                onDelete={(sub) => {
                                                    setSelectedSubscription(sub);
                                                    setShowDelete(true);
                                                    setShowModal(false);
                                                }}
                                            />
                                        </div>
                                    ))
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
            <DeleteSubscriptionModal
                show={showDelete}
                onHide={() => setShowDelete(false)}
                subscription={selectedSubscription}
                onDelete={async () => {
                    await fetchSubscriptionEvents(currentDate); // Refresh the list
                    setShowDelete(false);
                }}
            />

            <EditSubscriptionModal
                show={showEdit}
                onHide={() => setShowEdit(false)}
                subscription={selectedSubscription}
                onSubmit={async (data) => {
                    await fetchSubscriptionEvents(currentDate); // Refresh the list after update
                    setShowEdit(false);
                }}
            />
        </Container>
    );
};

export default CalendarPage;