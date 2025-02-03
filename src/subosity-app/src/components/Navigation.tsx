import React, { useState, useEffect, useRef } from 'react'
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
    const navbarToggleRef = useRef<HTMLButtonElement>(null);

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

    const closeNavbar = () => {
        if (navbarToggleRef.current?.classList.contains('collapsed') === false) {
            navbarToggleRef.current?.click();
        }
    };

    return (
        <Navbar expand="lg" className={`navbar-${isDarkMode ? 'dark' : 'light'} bg-${isDarkMode ? 'dark' : 'light'}`}>
            <Container>
                <Navbar.Brand as={Link} to="/" className="navbar-brand d-flex align-items-center">
                    <img src="/favicon.svg" className="me-2" style={{ height: '22px' }} />
                    <span>Subosity</span>
                </Navbar.Brand>

                <Navbar.Toggle ref={navbarToggleRef} aria-controls="navbar-nav" />

                <Navbar.Collapse id="navbar-nav">
                    {user && (
                        <Nav className="me-auto navbar-nav">

                            <Nav.Link as={Link} to="/" onClick={closeNavbar}>
                                <FontAwesomeIcon icon={faDashboard} className="me-2" />
                                Dashboard
                            </Nav.Link>
                            <Nav.Link as={Link} to="/mysubscriptions" onClick={closeNavbar}>
                                <FontAwesomeIcon icon={faHandHoldingDollar} className="me-2" />
                                Subscriptions
                            </Nav.Link>
                            <Nav.Link as={Link} to="/calendar" onClick={closeNavbar}>
                                <FontAwesomeIcon icon={faCalendar} className="me-2" />
                                Calendar
                            </Nav.Link>

                        </Nav>
                    )}

                    <Nav className="navbar-nav align-items-center ms-lg-auto">
                        {user && (
                            <>
                                {/* Hide in mobile, show in desktop */}
                                <div className="d-none d-lg-flex align-items-center">
                                    <Nav.Link
                                        as={Button}
                                        variant="link"
                                        className="position-relative p-2"
                                        onClick={() => setShowAlerts(true)}
                                    >
                                        <FontAwesomeIcon
                                            icon={faBell}
                                            className={`${unreadCount > 0 ? "text-warning" : "text-body-secondary"} me-2`}
                                        />
                                        Alerts
                                        {unreadCount > 0 && (
                                            <span
                                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                                style={{ fontSize: '0.65em' }}
                                            >
                                                {unreadCount}
                                                <span className="visually-hidden">unread alerts</span>
                                            </span>
                                        )}
                                    </Nav.Link>

                                    <Dropdown align="end">
                                        <Dropdown.Toggle
                                            as={Nav.Link}
                                            id="user-dropdown-desktop"
                                            className="d-flex align-items-center p-2"
                                        >
                                            <UserAvatar email={user?.email} size={32} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="dropdown-menu-end shadow-sm">
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
                                </div>

                                {/* Show in mobile, hide in desktop */}
                                <div className="d-lg-none w-100">
                                    <Nav.Link onClick={() => { setShowAlerts(true); closeNavbar(); }} className="w-100">
                                        <FontAwesomeIcon icon={faBell} className="me-2" />
                                        Alerts {unreadCount > 0 && `(${unreadCount})`}
                                    </Nav.Link>
                                    <hr className="my-2 opacity-25" />
                                    <Nav.Link as={Link} to="/profile" className="w-100" onClick={closeNavbar}>
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        My Account
                                    </Nav.Link>
                                    <Nav.Link as={Link} to="/preferences" className="w-100" onClick={closeNavbar}>
                                        <FontAwesomeIcon icon={faGear} className="me-2" />
                                        Preferences
                                    </Nav.Link>
                                    <Nav.Link onClick={() => { cycleTheme(); closeNavbar(); }} className="w-100">
                                        <FontAwesomeIcon icon={getThemeIcon()} className="me-2" />
                                        Theme ({theme})
                                    </Nav.Link>
                                    <hr className="my-2 opacity-25" />
                                    <Nav.Link onClick={() => { logout(); closeNavbar(); }} className="w-100 text-danger">
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        Logout
                                    </Nav.Link>
                                </div>
                            </>
                        )}

                        {/* Non-authenticated menu items remain the same */}
                        {!user && (
                            <>
                                <Nav.Item>
                                    <Nav.Link onClick={() => { cycleTheme(); closeNavbar(); }}>
                                        <FontAwesomeIcon icon={getThemeIcon()} className="me-2" />
                                        Theme
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/signup" onClick={closeNavbar}>
                                        <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                                        Sign Up
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} to="/login" onClick={closeNavbar}>
                                        <FontAwesomeIcon icon={faSignIn} className="me-2" />
                                        Login
                                    </Nav.Link>
                                </Nav.Item>
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