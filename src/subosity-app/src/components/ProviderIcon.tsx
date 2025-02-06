import React from "react";

interface ProviderIconProps {
    icon: string;
    name: string;
    size?: number;
    zoomPercentage?: string | null;
    borderRadius?: string;
    containerClassName?: string;
    tooltip?: string | null;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({
    icon,
    name,
    size = 48,
    zoomPercentage = "150%",
    borderRadius = "12px",
    containerClassName = "me-2",
    tooltip = null
}) => {
    const imageStyle: React.CSSProperties = {
        objectFit: 'contain'
    };

    if (zoomPercentage !== null) {
        imageStyle.width = zoomPercentage;
        imageStyle.height = zoomPercentage;
    }

    return (
        <div
            className={`bg-light d-flex align-items-center justify-content-center p-2 border ${containerClassName}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                minWidth: `${size}px`,
                flexShrink: 0,
                overflow: 'hidden',
                backgroundColor: 'var(--bs-white)',
                borderRadius: borderRadius
            }}
            data-bs-toggle="tooltip" 
            title={tooltip ? tooltip : undefined}
        >
            <img
                src={icon}
                alt={name}
                style={imageStyle}
            />
        </div>
    );
};