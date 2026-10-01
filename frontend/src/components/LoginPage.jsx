import React, { useState } from 'react';
import { loginPageStyles, toastStyles } from '../assets/dummyStyles';
import logo from '../assets/logo.png';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const API_BASE = 'http://localhost:4000';

const DOCTOR_TOKEN_KEY = 'doctorToken_v1';
const ADMIN_TOKEN_KEY = 'adminToken_v1';

function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [busy, setBusy] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        if (!email || !password) {
            toast.error('Email and password are required.', {
                style: toastStyles.errorToast
            });
            return;
        }

        setBusy(true);

        try {
            // =====================================================
            // 1. TRY ADMIN LOGIN
            // =====================================================

            console.log('Trying ADMIN login...');

            const adminResponse = await fetch(
                `${API_BASE}/api/admin/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const adminData = await adminResponse.json();

            console.log('Admin response:', adminData);

            if (adminResponse.ok && adminData.success) {
                console.log('ADMIN LOGIN SUCCESS');

                // Remove doctor session
                localStorage.removeItem(DOCTOR_TOKEN_KEY);

                // Save admin token if backend sends one
                if (adminData.token) {
                    localStorage.setItem(
                        ADMIN_TOKEN_KEY,
                        adminData.token
                    );
                }

                toast.success('Admin login successful!');

                // Admin is a SEPARATE React application
                window.location.href =
                    'http://localhost:5174/dashboard';

                return;
            }

            // =====================================================
            // 2. ADMIN FAILED → TRY DOCTOR LOGIN
            // =====================================================

            console.log(
                'Admin login failed. Trying DOCTOR login...'
            );

            const doctorResponse = await fetch(
                `${API_BASE}/api/doctors/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const doctorData = await doctorResponse.json();

            console.log('Doctor response:', doctorData);

            if (doctorResponse.ok && doctorData.success) {
                console.log('DOCTOR LOGIN SUCCESS');

                const token = doctorData.token;
                const doctorId = doctorData.data?._id;

                if (!token) {
                    toast.error(
                        'Doctor authentication token missing.',
                        {
                            style: toastStyles.errorToast
                        }
                    );
                    return;
                }

                if (!doctorId) {
                    toast.error(
                        'Doctor ID missing from server.',
                        {
                            style: toastStyles.errorToast
                        }
                    );
                    return;
                }

                // Remove admin session
                localStorage.removeItem(ADMIN_TOKEN_KEY);

                // Save doctor token
                localStorage.setItem(
                    DOCTOR_TOKEN_KEY,
                    token
                );

                toast.success('Doctor login successful!');

                // Doctor dashboard belongs to frontend app
                navigate(`/doctor-admin/${doctorId}`);

                return;
            }

            // =====================================================
            // 3. BOTH LOGIN ATTEMPTS FAILED
            // =====================================================

            toast.error('Invalid email or password.', {
                style: toastStyles.errorToast
            });

        } catch (error) {
            console.error('Login error:', error);

            toast.error(
                'Unable to connect to server.',
                {
                    style: toastStyles.errorToast
                }
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={loginPageStyles.mainContainer}>

            <Toaster
                position="top-right"
                reverseOrder={false}
            />

            {/* Back to Home */}
            <button
                type="button"
                onClick={() => navigate('/')}
                className={loginPageStyles.backButton}
            >
                <ArrowLeft
                    className={loginPageStyles.backButtonIcon}
                />
                Back to Home
            </button>

            {/* Login Card */}
            <div className={loginPageStyles.loginCard}>

                {/* Logo */}
                <div className={loginPageStyles.logoContainer}>
                    <img
                        src={logo}
                        alt="logo"
                        className={loginPageStyles.logo}
                    />
                </div>

                {/* Title */}
                <h2 className={loginPageStyles.title}>
                    Login
                </h2>

                <p className={loginPageStyles.subtitle}>
                    Login as Admin or Doctor
                </p>

                {/* Form */}
                <form
                    onSubmit={handleLogin}
                    className={loginPageStyles.form}
                >

                    {/* Email */}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className={loginPageStyles.input}
                        autoComplete="email"
                        required
                    />

                    {/* Password */}
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className={loginPageStyles.input}
                        autoComplete="current-password"
                        required
                    />

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={busy}
                        className={loginPageStyles.submitButton}
                    >
                        {busy
                            ? 'Signing in...'
                            : 'Login'
                        }
                    </button>

                </form>
            </div>
        </div>
    );
}

export default LoginPage;

