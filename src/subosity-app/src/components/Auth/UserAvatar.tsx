import React, { useState } from 'react'
import md5 from 'md5'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../../ThemeContext'

interface UserAvatarProps {
    email?: string | null;
    size?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ email, size = 32 }) => {
    const [gravatarError, setGravatarError] = useState(true)
    const { theme } = useTheme()
    const isDarkMode = theme === 'Dark' || (theme === 'Auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const bgClass = isDarkMode ? 'bg-light' : 'bg-secondary'
    const textClass = isDarkMode ? 'text-dark' : 'text-light'

    const getInitials = (email: string) => {
        if (!email) return '??'
        const parts = email.split('@')
        return parts[0].substring(0, 2).toUpperCase()
    }

    if (!email) {
        return (
            <div className={`rounded-circle ${bgClass} d-flex align-items-center justify-content-center`}
                style={{ width: `${size}px`, height: `${size}px` }}>
                <FontAwesomeIcon icon={faUser} className={textClass} style={{ fontSize: `${size / 2}px` }} />
            </div>
        )
    }

    const hash = md5(email.toLowerCase().trim())
    const gravatarUrl = `https://secure.gravatar.com/avatar/${hash}?s=${size}&d=404`

    return (
        <div className={`rounded-circle ${bgClass} d-flex align-items-center justify-content-center`}
            style={{ width: `${size}px`, height: `${size}px` }}>
            {!gravatarError ? (
                <img
                    src={gravatarUrl}
                    onError={() => setGravatarError(true)}
                    alt="User avatar"
                    className="rounded-circle"
                    style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover' }}
                />
            ) : (
                <span style={{
                    fontSize: `${size / 2}px`,
                    fontWeight: 'bold'
                }} className={textClass}>
                    {getInitials(email)}
                </span>
            )}
        </div>
    )
}

export default UserAvatar