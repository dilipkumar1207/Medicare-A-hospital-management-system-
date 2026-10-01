import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { heroStyles as hs } from "../assets/dummyStyles";
import { StethoscopeIcon } from "../components/Icons";

function Hero() {
  return (
    <div className={hs.container}>
      <Navbar />

      <main className={hs.mainContainer}>
        <div className={hs.section}>
          <div className={hs.decorativeBg.container}>

            {/* Background Decoration */}
            <div className={hs.decorativeBg.blurBackground}>
              <div className={hs.decorativeBg.blurShape}></div>
            </div>

            <div className={hs.contentBox}>

              {/* Logo */}
              <div className={hs.logoContainer}>
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <StethoscopeIcon className="w-12 h-12" />
                </div>
              </div>

              {/* Heading */}
              <h1 className={hs.heading}>
                WELCOME TO MEDICARE ADMIN PANEL
              </h1>

              {/* Description */}
              <p className={hs.description}>
                Manage hospital operations, doctors, services, appointments,
                and system settings from a centralized control panel.
              </p>

              {/* Login Button */}
              <div className="flex justify-center mt-8 mb-8">
                <Link
                  to="/login"
                  className="px-10 py-3 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Admin Login
                </Link>
              </div>

              {/* Information Cards */}
              <div className={hs.infoCards.container}>

                <div className={hs.infoCards.card}>
                  <h3 className={hs.infoCards.cardTitle}>
                    Secure Access
                  </h3>

                  <p className={hs.infoCards.cardText}>
                    Secure admin login with protected access to hospital
                    management features.
                  </p>
                </div>

                <div className={hs.infoCards.card}>
                  <h3 className={hs.infoCards.cardTitle}>
                    Real-time Management
                  </h3>

                  <p className={hs.infoCards.cardText}>
                    Monitor doctors, appointments, services, and hospital
                    activities from one place.
                  </p>
                </div>

                <div className={hs.infoCards.card}>
                  <h3 className={hs.infoCards.cardTitle}>
                    Medical Dashboard
                  </h3>

                  <p className={hs.infoCards.cardText}>
                    Access a clean and organized dashboard for managing
                    MediCare operations.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Hero;
