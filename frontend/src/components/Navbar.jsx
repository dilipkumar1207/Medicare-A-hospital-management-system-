import React, { useState, useEffect, useRef } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import { Key, Menu, User, X } from "lucide-react";
import logo from "../assets/logo.png";
const STORAGE_KEY = "doctorToken_v1"

function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
        try {
            return Boolean(localStorage.getItem(STORAGE_KEY));
        } catch {
            return false;
        }
    });
    const location = useLocation();
    const navRef = useRef(null);
    const clerk = useClerk();
    const navigate = useNavigate();
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === STORAGE_KEY) {
                setIsDoctorLoggedIn(Boolean(e.newValue));
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);
    const navItems = [
        { label: "Home", href: "/" },
        { label: "Doctors", href: "/doctors" },
        { label: "Services", href: "/services" },
        { label: "Appointments", href: "/appointments" },
        { label: "Contact", href: "/contact" },
    ];

    return (
        <>
            <div className={navbarStyles.navbarBorder}></div>

            <nav
                className={`${navbarStyles.navbarContainer} ${showNavbar
                    ? navbarStyles.navbarVisible
                    : navbarStyles.navbarHidden
                    }`}
            >
                <div className={navbarStyles.contentWrapper}>
                    <div className={navbarStyles.flexContainer}>
                        {/* Logo */}
                        <Link to="/" className={navbarStyles.logoLink}>
                            <div className={navbarStyles.logoContainer}>
                                <div className={navbarStyles.logoImageWrapper}>
                                    <img
                                        src={logo}
                                        alt="logo"
                                        className={navbarStyles.logoImage}
                                    />
                                </div>
                            </div>

                            <div className={navbarStyles.logoTextContainer}>
                                <h1 className={navbarStyles.logoTitle}>MediCare</h1>
                                <p className={navbarStyles.logoSubtitle}>
                                    HealthCare Solution
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className={navbarStyles.desktopNav}>
                            <div className={navbarStyles.navItemsContainer}>
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={`${navbarStyles.navItem} ${isActive
                                                ? navbarStyles.navItemActive
                                                : navbarStyles.navItemInactive
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className={navbarStyles.rightContainer}>
                            <SignedOut>
                                <a
                                    href="http://localhost:5174"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={navbarStyles.doctorAdminButton}
                                >
                                    <User className={navbarStyles.doctorAdminIcon} />
                                    <span className={navbarStyles.doctorAdminText}>
                                        Doctor Admin
                                    </span>
                                </a>

                                <button
                                    onClick={() => clerk.openSignIn()}
                                    className={navbarStyles.loginButton}
                                >
                                    <Key className={navbarStyles.loginIcon} />
                                    Login
                                </button>
                            </SignedOut>

                            <SignedIn>
                                <UserButton afterSignOutUrl="/" />
                            </SignedIn>

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={navbarStyles.mobileToggle}
                            >
                                {isOpen ? (
                                    <X className={navbarStyles.toggleIcon} />
                                ) : (
                                    <Menu className={navbarStyles.toggleIcon} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isOpen && (
                        <div className={navbarStyles.mobileMenu}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`${navbarStyles.mobileMenuItem} ${isActive
                                            ? navbarStyles.mobileMenuItemActive
                                            : navbarStyles.mobileMenuItemInactive
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}

                            <SignedOut>
                                <a
                                    href="http://localhost:5174"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={navbarStyles.mobileDoctorAdminButton}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User className={navbarStyles.doctorAdminIcon} />
                                    <span>Doctor Admin</span>
                                </a>

                                <div className={navbarStyles.mobileLoginContainer}>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            clerk.openSignIn();
                                        }}
                                        className={navbarStyles.mobileLoginButton}
                                    >
                                        <Key className={navbarStyles.loginIcon} />
                                        Login
                                    </button>
                                </div>
                            </SignedOut>
                            <SignedIn>
                                <div className={navbarStyles.mobileUserContainer}>
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                        </div>
                    )}
                </div>

                <style>{navbarStyles.animationStyles}</style>
            </nav>
        </>
    );
}

export default Navbar;