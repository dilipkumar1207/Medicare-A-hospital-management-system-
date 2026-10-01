import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:4000";

export function AuthProvider({ children }) {

  const [isAdmin, setIsAdmin] = useState(
    () =>
      sessionStorage.getItem("medicare_admin") === "true"
  );

  useEffect(() => {
    if (isAdmin) {
      sessionStorage.setItem(
        "medicare_admin",
        "true"
      );
    } else {
      sessionStorage.removeItem(
        "medicare_admin"
      );
      localStorage.removeItem("aToken");
    }
  }, [isAdmin]);

  const login = async (email, password) => {
    try {

      const cleanEmail = email.trim().toLowerCase();

      // =====================================================
      // 1. TRY ADMIN LOGIN
      // =====================================================

      console.log("Trying ADMIN login...");

      try {
        const { data } = await axios.post(
          `${backendUrl}/api/admin/login`,
          {
            email: cleanEmail,
            password,
          }
        );

        console.log("Admin response:", data);

        if (data.success) {

          console.log("✅ ADMIN LOGIN SUCCESS");

          setIsAdmin(true);

          // Remove doctor session
          localStorage.removeItem(
            "doctorToken_v1"
          );

          // Save admin token
          if (data.token) {
            localStorage.setItem(
              "aToken",
              data.token
            );
          }

          return {
            success: true,
            role: "admin",
            token: data.token,
          };
        }

      } catch (adminError) {

        console.log(
          "Admin login failed. Trying doctor login..."
        );

      }

      // =====================================================
      // 2. ADMIN FAILED → TRY DOCTOR LOGIN
      // =====================================================

      console.log("Trying DOCTOR login...");

      try {

        const { data } = await axios.post(
          `${backendUrl}/api/doctors/login`,
          {
            email: cleanEmail,
            password,
          }
        );

        console.log("Doctor response:", data);

        if (data.success) {

          console.log("✅ DOCTOR LOGIN SUCCESS");

          const token = data.token;
          const doctorId = data.data?._id;

          if (!token || !doctorId) {
            return {
              success: false,
              message:
                "Doctor login response is incomplete.",
            };
          }

          // Make sure this is NOT treated as admin
          setIsAdmin(false);

          // Remove admin session
          localStorage.removeItem("aToken");
          sessionStorage.removeItem(
            "medicare_admin"
          );

          // Save doctor token
          localStorage.setItem(
            "doctorToken_v1",
            token
          );

          return {
            success: true,
            role: "doctor",
            token,
            doctorId,
          };
        }

      } catch (doctorError) {

        console.log(
          "Doctor login failed."
        );

      }

      // =====================================================
      // 3. BOTH FAILED
      // =====================================================

      return {
        success: false,
        message: "Invalid email or password.",
      };

    } catch (error) {

      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Unable to connect to server",
      };
    }
  };

  const logout = () => {

    setIsAdmin(false);

    localStorage.removeItem("aToken");

    localStorage.removeItem(
      "doctorToken_v1"
    );

    sessionStorage.removeItem(
      "medicare_admin"
    );
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);