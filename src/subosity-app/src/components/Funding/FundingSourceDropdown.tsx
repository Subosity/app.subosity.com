import React, { useEffect, useState } from 'react';
import Select, { components } from 'react-select';
import { supabase } from '../../supabaseClient';
import { selectStyles } from '../../styles/selectStyles';

// Custom Option component to show icon and details
const CustomOption = ({ children, ...props }: any) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            <div className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'var(--bs-gray-200)',
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                <img
                    src={props.data.payment_provider.icon}
                    alt=""
                    style={{
                        width: '150%',
                        height: '150%',
                        objectFit: 'contain'
                    }}
                />
            </div>
            <div className="ms-2">
                <div>{props.data.name}</div>
                <div style={{
                    fontSize: '0.75em',
                    opacity: 0.6,
                    color: 'var(--bs-secondary-text)'
                }}>
                    {props.data.payment_provider.name}
                </div>
            </div>
        </div>
    </components.Option>
);

// Custom SingleValue component for selected option
const CustomSingleValue = ({ children, ...props }: any) => (
    <components.SingleValue {...props}>
        <div className="d-flex align-items-center">
            <div className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'var(--bs-gray-200)',
                    flexShrink: 0,
                    overflow: 'hidden'
                }}>
                <img
                    src={props.data.payment_provider.icon}
                    alt=""
                    style={{
                        width: '150%',
                        height: '150%',
                        objectFit: 'contain'
                    }}
                />
            </div>
            <div className="ms-2">
                {props.data.name}
            </div>
        </div>
    </components.SingleValue>
);

interface Props {
    value: string;
    onChange: (id: string) => void;
    error?: string;
    touched?: boolean;
}

const FundingSourceDropdown: React.FC<Props> = ({ value, onChange, error, touched }) => {
    const [sources, setSources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSources = async () => {
            const { data, error } = await supabase
                .from('funding_source')
                .select(`
                    id,
                    name,
                    payment_provider:payment_provider_id(
                        id,
                        name,
                        icon
                    )
                `);

            if (!error && data) {
                setSources(data);
            }
            setIsLoading(false);
        };

        fetchSources();
    }, []);

    return (
        <Select
            value={sources.find(s => s.id === value)}
            onChange={(option) => onChange(option?.id)}
            options={sources}
            isLoading={isLoading}
            components={{
                Option: CustomOption,
                SingleValue: CustomSingleValue
            }}
            styles={selectStyles}
            isInvalid={touched && !!error}
        />
    );
};

export default FundingSourceDropdown;