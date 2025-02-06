import React, { useEffect, useState } from 'react';
import Select, { components } from 'react-select';
import { supabase } from '../../supabaseClient';

interface Provider {
    id: string;
    name: string;
    category: string;
    icon?: string;
}

interface Props {
    value: Provider | null;
    onChange: (providerId: string) => void;
    error?: string;
    touched?: boolean;
}

const CustomOption = ({ children, ...props }: any) => (
    <components.Option {...props}>
        <div className="d-flex align-items-center">
            {props.data.icon && (
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--bs-gray-200)',
                        flexShrink: 0,
                        overflow: 'hidden'
                    }}>
                    <img
                        src={props.data.icon}
                        alt=""
                        style={{
                            width: '150%',
                            height: '150%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            )}
            <div className="ms-2">
                <div>{props.data.name}</div>
                <div style={{ 
                    fontSize: '0.75em',
                    opacity: 0.6,
                    color: 'var(--bs-secondary-text)'
                }}>
                    {props.data.category}
                </div>
            </div>
        </div>
    </components.Option>
);

// Add CustomSingleValue component
const CustomSingleValue = ({ children, ...props }: any) => (
    <components.SingleValue {...props}>
        <div className="d-flex align-items-center">
            {props.data.icon && (
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'var(--bs-gray-200)',
                        flexShrink: 0,
                        overflow: 'hidden'
                    }}>
                    <img
                        src={props.data.icon}
                        alt=""
                        style={{
                            width: '150%',
                            height: '150%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
            )}
            <div className="ms-2">
                <div>{props.data.name}</div>
                <div style={{ 
                    fontSize: '0.75em',
                    opacity: 0.6,
                    color: 'var(--bs-secondary-text)'
                }}>
                    {props.data.category}
                </div>
            </div>
        </div>
    </components.SingleValue>
);

const customStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        background: 'var(--bs-body-bg)',
        borderColor: 'var(--bs-border-color)',
        '&:hover': {
            borderColor: 'var(--bs-primary)'
        }
    }),
    menu: (provided: any) => ({
        ...provided,
        background: 'var(--bs-body-bg)',
        border: '1px solid var(--bs-border-color)'
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isFocused 
            ? 'var(--bs-primary)' 
            : 'var(--bs-body-bg)',
        color: state.isFocused 
            ? 'var(--bs-light)' 
            : 'var(--bs-body-color)',
        '&:hover': {
            backgroundColor: 'var(--bs-primary)',
            color: 'var(--bs-light)'
        }
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: 'var(--bs-body-color)'
    }),
    input: (provided: any) => ({
        ...provided,
        color: 'var(--bs-body-color)'
    })
};

const SubscriptionProviderDropdown: React.FC<Props> = ({
    value,
    onChange,
    error,
    touched
}) => {
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        const fetchProviders = async () => {
            const { data } = await supabase
                .from('subscription_provider')
                .select('*')
                .order('category')
                .order('name');
            if (data) setProviders(data);
        };
        fetchProviders();
    }, []);

    return (
        <Select
            value={value}
            onChange={(option: any) => onChange(option?.id || '')}
            options={providers}
            components={{ 
                Option: CustomOption,
                SingleValue: CustomSingleValue 
            }}
            styles={customStyles}
            theme={(theme) => ({
                ...theme,
                colors: {
                    ...theme.colors,
                    primary: 'var(--bs-primary)',
                    primary75: 'var(--bs-primary-rgb)',
                    primary50: 'var(--bs-primary-rgb)',
                    primary25: 'var(--bs-primary-rgb)'
                }
            })}
            filterOption={(option, inputValue) => {
                const { name, description } = option.data;
                const searchValue = inputValue.toLowerCase();
                return name.toLowerCase().includes(searchValue) || 
                       (description || '').toLowerCase().includes(searchValue);
            }}
        />
    );
};

export default SubscriptionProviderDropdown;