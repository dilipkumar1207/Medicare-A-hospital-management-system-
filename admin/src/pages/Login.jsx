import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  StethoscopeIcon,
  AlertCircleIcon,
} from "../components/Icons";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Doctor frontend URL
  const frontendUrl =
    import.meta.env.VITE_FRONTEND_URL ||
    "http://localhost:5173";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(
        email.trim(),
        password
      );

      console.log("Login result:", result);

      // Login failed
      if (!result.success) {
        setError(
          result.message || "Invalid email or password."
        );
        return;
      }

      // ==========================================
      // ADMIN LOGIN
      // ==========================================

      if (result.role === "admin") {
        console.log("Redirecting to Admin Dashboard");

        navigate(
          location.state?.from || "/dashboard",
          {
            replace: true,
          }
        );

        return;
      }

      // ==========================================
      // DOCTOR LOGIN
      // ==========================================

      if (result.role === "doctor") {
        console.log(
          "Redirecting to Doctor Dashboard"
        );

        if (!result.doctorId) {
          setError("Doctor ID is missing.");
          return;
        }

        /*
         * Doctor app runs on port 5173.
         * Admin app runs on port 5174.
         */
        window.location.href =
          `${frontendUrl}/doctor-admin/${result.doctorId}`;

        return;
      }

      // Unknown role
      setError("Unknown user role.");

    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-blue-50 via-white to-indigo-50">

      <Navbar />

      <div className="flex items-center justify-center px-4 py-16">

        <div className="w-full max-w-md bg-white/90 backdrop-blur-sm border border-blue-100 shadow-2xl rounded-3xl p-8">

          {/* ================= LOGO ================= */}

          <div className="flex flex-col items-center mb-6">

            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 shadow-inner">

              <StethoscopeIcon className="w-8 h-8" />

            </div>

            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              MediCare Login
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Login as Admin or Doctor
            </p>

          </div>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">

              <AlertCircleIcon className="w-4 h-4 shrink-0" />

              {error}

            </div>
          )}

          {/* ================= LOGIN FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* EMAIL */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>

              <div className="relative">

                <MailIcon className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter admin or doctor email"
                  className="p-3 pl-11 rounded-full border-2 border-blue-100 bg-white placeholder:text-gray-400 shadow-sm w-full focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">

                <LockIcon className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter password"
                  className="p-3 pl-11 pr-11 rounded-full border-2 border-blue-100 bg-white placeholder:text-gray-400 shadow-sm w-full focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full cursor-pointer text-gray-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-3 rounded-full font-semibold shadow-xl bg-linear-to-r from-blue-500 to-cyan-500 text-white cursor-pointer hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Signing in..."
                : "Login"}
            </button>

          </form>

          {/* ================= FOOTER ================= */}

          <p className="text-xs text-gray-400 text-center mt-6">
            Enter your Admin or Doctor credentials
          </p>

          {/* ================= BACK TO FRONTEND ================= */}

          <p className="text-center mt-2">

            <a
              href={frontendUrl}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to home
            </a>

          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;