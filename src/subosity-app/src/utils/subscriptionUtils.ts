import { getOccurrencesInRange } from "./recurrenceUtils";

export function calculatePaymentSummary (subscriptions: Subscription[]) {

    if (!subscriptions || subscriptions.length === 0) {
        return {
            daily: 0,
            weekly: 0,
            monthly: 0,
            yearly: 0
        };
    }

    const yearStart = new Date(new Date().getFullYear(), 0, 1); // January 1st
    const yearEnd = new Date(new Date().getFullYear(), 11, 31); // December 31st

    let yearlyTotal = 0;

    subscriptions.forEach(sub => {
        const occurrences = getOccurrencesInRange(
            sub.recurrenceRule,
            yearStart,
            yearEnd
        );
        //console.log('Occurrences found:', occurrences);

        const amount = sub.amount || 0;
        const subTotal = amount * occurrences.length;
        yearlyTotal += subTotal;

        //console.log('Subtotal:', subTotal, 'Running total:', yearlyTotal);
    });

    // Calculate monthly, weekly, and daily averages based on the actual yearly total
    const monthlyTotal = yearlyTotal / 12;
    const weeklyTotal = yearlyTotal / 52.18; // Standard weeks per year (365.25/7)
    const dailyTotal = yearlyTotal / 365.25;

    return {
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        yearly: yearlyTotal
    };
};