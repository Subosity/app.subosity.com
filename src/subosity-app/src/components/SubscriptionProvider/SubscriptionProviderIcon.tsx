import React from 'react';

interface SubscriptionProviderIconProps {
    icon: string;
    name: string;
    size?: number;
}

export const SubscriptionProviderIcon: React.FC<SubscriptionProviderIconProps> = ({ 
    icon, 
    name, 
    size = 48 
}) => {
    return (
        <div 
            className="rounded-circle bg-light d-flex align-items-center justify-content-center p-2 me-3"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: `${size}px`,
                flexShrink: 0,
                backgroundColor: 'var(--bs-white)'
            }}
        >
            <img
                src={icon}
                alt={name}
                style={{
                    width: '150%',
                    height: '150%',
                    objectFit: 'contain',
                    flexShrink: 0
                }}
            />
        </div>
    );
};