export interface Subscription {
    id: string;
    providerId: string;
    providerName: string;
    providerDescription: string;
    providerCategory: string;
    providerIcon: string;
    startDate: string | null;
    autoRenewal: boolean;
    amount: number;
    fundingSourceId: string;  // New field
    fundingSource?: {        // New nested object
        id: string;
        name: string;
        paymentProviderName: string;
        paymentProviderIcon: string;
    };
    notes?: string;
    state: 'trial' | 'active' | 'canceled' | 'expired' | 'paused';
    nickname?: string;
    recurrence_rule?: string;
    recurrence_rule_ui_friendly?: string;
}