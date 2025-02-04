import { PaymentProvider } from './PaymentProvider';
import { Subscription } from './Subscription';

export interface FundingSource {
    id: string;
    name: string;
    description: string;
    notes?: string;
    paymentProvider: PaymentProvider;
    owner: string;
    subscriptions: Subscription[];
    funding_type: string;
}