import axios from "axios";
import React, { useEffect } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

const API_BASE = "http://localhost:4000";

function VerifyServicePaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const verifyServicePayment = async () => {
            const params = new URLSearchParams(
                location.search || ""
            );

            // Cashfree uses order_id
            const orderId = params.get("order_id");

            console.log(
                "================================="
            );
            console.log(
                "💳 CASHFREE SERVICE PAYMENT VERIFICATION"
            );
            console.log(
                "================================="
            );
            console.log(
                "Path:",
                location.pathname
            );
            console.log(
                "Order ID:",
                orderId
            );

            // =========================================
            // CANCEL PAYMENT
            // =========================================

            if (
                location.pathname ===
                "/service-appointment/cancel"
            ) {
                if (!cancelled) {
                    navigate(
                        "/appointments?service_payment=Cancelled",
                        {
                            replace: true,
                        }
                    );
                }

                return;
            }

            // =========================================
            // ORDER ID MISSING
            // =========================================

            if (!orderId) {
                console.error(
                    "❌ Cashfree order_id missing"
                );

                if (!cancelled) {
                    navigate(
                        "/appointments?service_payment=Failed",
                        {
                            replace: true,
                        }
                    );
                }

                return;
            }

            // =========================================
            // VERIFY PAYMENT
            // =========================================

            try {
                console.log(
                    "🔍 Verifying Cashfree service order:",
                    orderId
                );

                const res = await axios.get(
    `${API_BASE}/api/service-appointments/confirm`,
    {
        params: {
            order_id: orderId,
        },
        timeout: 15000,
    }
);

                console.log(
                    "Cashfree service payment response:",
                    res.data
                );

                if (cancelled) return;

                // =====================================
                // PAYMENT SUCCESS
                // =====================================

                if (res?.data?.success) {
                    console.log(
                        "✅ SERVICE PAYMENT VERIFIED"
                    );

                    navigate(
                        "/appointments?service_payment=Paid",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                // =====================================
                // PAYMENT PENDING
                // =====================================

                if (
                    res?.status === 202 ||
                    res?.data?.status === "Pending"
                ) {
                    console.log(
                        "⏳ SERVICE PAYMENT PENDING"
                    );

                    navigate(
                        "/appointments?service_payment=Pending",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                // =====================================
                // PAYMENT FAILED
                // =====================================

                console.log(
                    "❌ SERVICE PAYMENT FAILED"
                );

                navigate(
                    "/appointments?service_payment=Failed",
                    {
                        replace: true,
                    }
                );
            } catch (error) {
                console.error(
                    "❌ Service payment verification failed:",
                    error?.response?.data ||
                        error?.message ||
                        error
                );

                if (!cancelled) {
                    navigate(
                        "/appointments?service_payment=Failed",
                        {
                            replace: true,
                        }
                    );
                }
            }
        };

        verifyServicePayment();

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
                    Verifying Service Payment...
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    Please wait while we confirm your payment.
                </p>

            </div>
        </div>
    );
}

export default VerifyServicePaymentPage;