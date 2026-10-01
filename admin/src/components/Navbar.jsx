import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navbarStyles as ns } from '../assets/dummyStyles'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  UserPlusIcon,
  UsersIcon,
  CalendarIcon,
  GridIcon,
  PlusSquareIcon,
  ListIcon,
  CalendarCheckIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  StethoscopeIcon,
} from './Icons'

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/add-doctor", label: "Add Doctor", icon: UserPlusIcon },
  { to: "/doctors", label: "List Doctors", icon: UsersIcon },
  { to: "/appointments", label: "Appointments", icon: CalendarIcon },
  { to: "/service-dashboard", label: "Service Dashboard", icon: GridIcon },
  { to: "/add-service", label: "Add Service", icon: PlusSquareIcon },
  { to: "/services", label: "List Services", icon: ListIcon },
  { to: "/service-appointments", label: "Service Appointments", icon: CalendarCheckIcon },
]

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  const { isAdmin, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Main frontend URL
  const frontendUrl =
    import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

  return (
    <div className="sticky top-0 z-30 bg-blue-50/70 backdrop-blur-sm">
      <header className={ns.header}>
        <nav className={ns.navContainer}>

          <div className={ns.flexContainer}>

            {/* ================= LOGO ================= */}
            {/* This goes to MAIN FRONTEND */}
            <a
              href={frontendUrl}
              className={ns.logoContainer}
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
                <StethoscopeIcon className="w-7 h-7" />
              </div>

              <div>
                <div className={ns.logoLink}>
                  MediCare
                </div>

                <div className={ns.logoSubtext}>
                  Healthcare Solutions
                </div>
              </div>
            </a>

            {/* ================= CENTER NAV ================= */}
            {isAdmin && (
              <div className={ns.centerNavContainer}>
                <div className={ns.glowEffect}>
                  <div className={ns.centerNavInner}>
                    <div className={ns.centerNavScrollContainer}>

                      {navItems.map(
                        ({ to, label, icon: Icon }) => {

                          const active =
                            location.pathname === to

                          return (
                            <Link
                              key={to}
                              to={to}
                              className={`${ns.centerNavItemBase} ${
                                active
                                  ? ns.centerNavItemActive
                                  : ns.centerNavItemInactive
                              }`}
                            >
                              <Icon className="w-5 h-5" />

                              <span>
                                {label}
                              </span>
                            </Link>
                          )
                        }
                      )}

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= RIGHT SECTION ================= */}
            <div className={ns.rightContainer}>

              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className={ns.signOutButton}
                >
                  <LogOutIcon className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className={ns.loginButton}
                >
                  Login
                </Link>
              )}

              {/* Mobile menu button */}
              {isAdmin && (
                <button
                  className={ns.mobileMenuButton}
                  onClick={() =>
                    setMobileOpen((o) => !o)
                  }
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? (
                    <XIcon className="w-5 h-5" />
                  ) : (
                    <MenuIcon className="w-5 h-5" />
                  )}
                </button>
              )}

            </div>
          </div>

          {/* ================= MOBILE MENU ================= */}
          {isAdmin && mobileOpen && (
            <>
              <div
                className={ns.mobileOverlay}
                onClick={() =>
                  setMobileOpen(false)
                }
              />

              <div
                className={ns.mobileMenuContainer}
              >
                <div className={ns.mobileMenuInner}>

                  {navItems.map(
                    ({ to, label, icon: Icon }) => {

                      const active =
                        location.pathname === to

                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() =>
                            setMobileOpen(false)
                          }
                          className={`${ns.mobileItemBase} ${
                            active
                              ? ns.mobileItemActive
                              : ns.mobileItemInactive
                          }`}
                        >
                          <Icon className="w-4 h-4" />

                          {label}
                        </Link>
                      )
                    }
                  )}

                  <div
                    className={
                      ns.mobileAuthContainer
                    }
                  >
                    <button
                      onClick={handleLogout}
                      className={
                        ns.mobileSignOutButton
                      }
                    >
                      Sign Out
                    </button>
                  </div>

                </div>
              </div>
            </>
          )}

        </nav>
      </header>
    </div>
  )
}

export default Navbar