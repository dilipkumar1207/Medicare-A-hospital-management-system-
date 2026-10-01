import axios from "axios";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

function VerifyPaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const verifyPayment = async () => {
            const params = new URLSearchParams(
                location.search || ""
            );

            const orderId = params.get("order_id");

            console.log("=================================");
            console.log("💳 CASHFREE PAYMENT VERIFICATION");
            console.log("=================================");
            console.log("Path:", location.pathname);
            console.log("Order ID:", orderId);

            // -----------------------------------------
            // DETECT APPOINTMENT TYPE
            // -----------------------------------------

            const isServiceAppointment =
                location.pathname.includes(
                    "/service-appointment/"
                );

            const isDoctorAppointment =
                location.pathname.includes(
                    "/appointment/"
                );

            console.log(
                "Service appointment:",
                isServiceAppointment
            );

            console.log(
                "Doctor appointment:",
                isDoctorAppointment
            );

            // -----------------------------------------
            // CANCELLED PAYMENT
            // -----------------------------------------

            if (
                location.pathname ===
                "/appointment/cancel"
            ) {
                if (!cancelled) {
                    navigate(
                        "/appointments?payment_status=Cancelled",
                        {
                            replace: true,
                        }
                    );
                }

                return;
            }

            if (
                location.pathname ===
                "/service-appointment/cancel"
            ) {
                if (!cancelled) {
                    navigate(
                        "/service-appointments?payment_status=Cancelled",
                        {
                            replace: true,
                        }
                    );
                }

                return;
            }

            // -----------------------------------------
            // ORDER ID MISSING
            // -----------------------------------------

            if (!orderId) {
                console.error(
                    "❌ Cashfree order_id missing"
                );

                if (!cancelled) {
                    navigate(
                        isServiceAppointment
                            ? "/service-appointments?payment_status=Failed"
                            : "/appointments?payment_status=Failed",
                        {
                            replace: true,
                        }
                    );
                }

                return;
            }

            // -----------------------------------------
            // SELECT CONFIRMATION API
            // -----------------------------------------

            const confirmUrl =
                isServiceAppointment
                    ? `${API_BASE}/api/service-appointments/confirm`
                    : `${API_BASE}/api/appointments/confirm-payment`;

            console.log(
                "🔗 Verification API:",
                confirmUrl
            );

            // -----------------------------------------
            // VERIFY PAYMENT
            // -----------------------------------------

            try {
                console.log(
                    "🔍 Verifying Cashfree order:",
                    orderId
                );

                const res = await axios.get(
                    confirmUrl,
                    {
                        params: {
                            order_id: orderId,
                        },
                        timeout: 15000,
                    }
                );

                console.log(
                    "Cashfree verification response:",
                    res.data
                );

                if (cancelled) return;

                // -------------------------------------
                // PAYMENT SUCCESS
                // -------------------------------------

                if (res?.data?.success) {
                    console.log(
                        "✅ PAYMENT VERIFIED"
                    );

                    navigate(
                        isServiceAppointment
                            ? "/service-appointments?payment_status=Paid"
                            : "/appointments?payment_status=Paid",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                // -------------------------------------
                // PAYMENT PENDING
                // -------------------------------------

                if (
                    res?.data?.status ===
                        "Pending" ||
                    res?.status === 202
                ) {
                    console.log(
                        "⏳ PAYMENT STILL PENDING"
                    );

                    navigate(
                        isServiceAppointment
                            ? "/service-appointments?payment_status=Pending"
                            : "/appointments?payment_status=Pending",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                // -------------------------------------
                // PAYMENT FAILED
                // -------------------------------------

                console.log(
                    "❌ PAYMENT FAILED"
                );

                navigate(
                    isServiceAppointment
                        ? "/service-appointments?payment_status=Failed"
                        : "/appointments?payment_status=Failed",
                    {
                        replace: true,
                    }
                );

            } catch (error) {
                console.error(
                    "❌ Cashfree payment verification failed:",
                    error?.response?.data ||
                        error?.message ||
                        error
                );

                if (!cancelled) {
                    navigate(
                        isServiceAppointment
                            ? "/service-appointments?payment_status=Failed"
                            : "/appointments?payment_status=Failed",
                        {
                            replace: true,
                        }
                    );
                }
            }
        };

        verifyPayment();

        return () => {
            cancelled = true;
        };
    }, [
        location.pathname,
        location.search,
        navigate,
    ]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">

                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                <h2 className="text-xl font-semibold text-slate-800">
                    Verifying Payment...
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    Please wait while we confirm your payment.
                </p>

            </div>
        </div>
    );
}

export default VerifyPaymentPage;