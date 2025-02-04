export interface PaymentProvider {
    id: string;
    name: string;
    icon: string;
    is_public: boolean;
    is_default: boolean;
}