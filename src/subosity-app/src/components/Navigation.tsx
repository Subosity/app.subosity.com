import React, { useState, useEffect } from 'react'
import md5 from 'md5'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSun,
    faMoon,
    faCircleHalfStroke,
    faUser,
    faGear,
    faPalette,
    faHandHoldingDollar,
    faHome,
    faBell,
    faDashboard,
    faTags,
    faUserPlus,
    faSignIn,
    faInfoCircle,
    faCalendar
} from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../AuthContext'
import { Button, Dropdown, Navbar, Nav, Container } from 'react-bootstrap'
import UserAvatar from './UserAvatar'
import SubscriptionAlertsModal from './SubscriptionAlertsModal'
import { supabase } from '../supabaseClient'
import { Theme } from 'react-select'
import { useAlerts } from '../AlertsContext';

const Navigation: React.FC = () => {
    const [gravatarError, setGravatarError] = useState(false);
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const { unreadCount } = useAlerts(); // Get unread count from context
    const [showAlerts, setShowAlerts] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'Dark' || (theme === 'Auto' && prefersDark);
        setIsDarkMode(isDark);
    }, [theme]);

    const getThemeIcon = () => {
        switch (theme) {
            case 'Light': return faSun
            case 'Dark': return faMoon
            default: return faCircleHalfStroke
        }
    }

    const cycleTheme = () => {
        const themes: Theme[] = ['Auto', 'Light', 'Dark'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    return (
        <Navbar expand="lg" className={`navbar-${isDarkMode ? 'dark' : 'light'} bg-${isDarkMode ? 'dark' : 'light'}`}>
            <Container>
                <Navbar.Brand as={Link} to="/" className="navbar-brand d-flex align-items-center">
                    <img src="/favicon.svg" className="me-2" style={{ height: '22px' }} />
                    <span>Subosity</span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="navbar-nav" />

                <Navbar.Collapse id="navbar-nav">
                    {user && (
                        <Nav className="me-auto navbar-nav">

                            <Nav.Link as={Link} to="/">
                                <FontAwesomeIcon icon={faDashboard} className="me-2" />
                                Dashboard
                            </Nav.Link>
                            <Nav.Link as={Link} to="/mysubscriptions">
                                <FontAwesomeIcon icon={faHandHoldingDollar} className="me-2" />
                                Subscriptions
                            </Nav.Link>
                            <Nav.Link as={Link} to="/calendar">
                                <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                Calendar
                            </Nav.Link>

                        </Nav>
                    )}

                    <Nav className="navbar-nav d-flex align-items-center ms-auto">
                        {user && (
                            <div className="position-relative me-3">
                                <Button
                                    variant="link"
                                    className="nav-link p-0"
                                    onClick={() => setShowAlerts(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={faBell}
                                        className={unreadCount > 0 ? "text-warning" : "text-body-secondary"}
                                    />
                                    {unreadCount > 0 && (
                                        <span
                                            className="position-absolute badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
                                            style={{
                                                fontSize: '0.75em',
                                                padding: '0.75em 0.6em 1.0em 0.5em',
                                                minWidth: '1.5em',
                                                height: '1.5em',
                                                transform: 'scale(0.8) translate(50%, -50%)',
                                                top: '0',
                                                right: '0'
                                            }}
                                        >
                                            {unreadCount}
                                            <span className="visually-hidden">unread alerts</span>
                                        </span>
                                    )}
                                </Button>
                            </div>
                        )}
                        {user ? (
                            <Dropdown align="end">
                                <Dropdown.Toggle variant="link" className="nav-link d-flex align-items-center gap-2">
                                    <UserAvatar email={user?.email} size={32} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item as={Link} to="/profile">
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        My Account
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/preferences">
                                        <FontAwesomeIcon icon={faGear} className="me-2" />
                                        Preferences
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={cycleTheme}>
                                        <FontAwesomeIcon icon={getThemeIcon()} className="me-2" />
                                        Theme ({theme})
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={logout}>
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        Logout
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <>
                                <Button
                                    variant="link"
                                    className="nav-link"
                                    onClick={cycleTheme}
                                >
                                    <FontAwesomeIcon icon={getThemeIcon()} className="me-2" />
                                    Theme
                                </Button>
                                <div className="ms-2 me-2">|</div>
                                <Nav.Link as={Link} to="/signup">
                                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                                    Sign Up</Nav.Link>
                                <div className="ms-2 me-2">|</div>
                                <Nav.Link as={Link} to="/login">
                                    <FontAwesomeIcon icon={faSignIn} className="me-2" />
                                    Login</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>

            <SubscriptionAlertsModal
                show={showAlerts}
                onHide={() => setShowAlerts(false)}
            />
        </Navbar>
    );
};

export default Navigation