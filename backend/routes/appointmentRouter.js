import express from "express";
import { getAuth } from "@clerk/express";

import {
    getAppointments,
    getAppointmentByPatient,
    confirmPayment,
    updateAppointment,
    cancelServiceAppointment,
    getStats,
    getAppointmentsByDoctor,
    getRegisteredUserCount,
    createAppointment,
} from "../controllers/appointmentController.js";

const appointmentRouter = express.Router();


// =====================================================
// PUBLIC / ADMIN ROUTES
// =====================================================

appointmentRouter.get(
    "/",
    getAppointments
);

appointmentRouter.get(
    "/confirm-payment",
    confirmPayment
);

appointmentRouter.get(
    "/stats/summary",
    getStats
);

appointmentRouter.get(
    "/patients/count",
    getRegisteredUserCount
);


// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const requireAuth = (req, res, next) => {
    try {
        const auth = getAuth(req);

        console.log(
            "======================================"
        );

        console.log(
            "🔐 APPOINTMENT AUTH CHECK"
        );

        console.log(
            "Authenticated:",
            auth.isAuthenticated
        );

        console.log(
            "Clerk User ID:",
            auth.userId
        );

        console.log(
            "Authorization header exists:",
            !!req.headers.authorization
        );

        console.log(
            "Authorization starts with Bearer:",
            req.headers.authorization?.startsWith(
                "Bearer "
            )
        );


        if (
            !auth.isAuthenticated ||
            !auth.userId
        ) {
            console.log(
                "❌ APPOINTMENT AUTH FAILED"
            );

            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }


        // Store Clerk user ID for controller
        req.clerkUserId = auth.userId;


        console.log(
            "✅ APPOINTMENT AUTH SUCCESS"
        );

        console.log(
            "User:",
            req.clerkUserId
        );

        next();

    } catch (error) {
        console.error(
            "❌ Appointment auth error:",
            error
        );

        return res.status(401).json({
            success: false,
            message: "Authentication failed",
        });
    }
};


// =====================================================
// PATIENT APPOINTMENTS
// =====================================================

// Get appointments of logged-in patient
appointmentRouter.get(
    "/me",
    requireAuth,
    getAppointmentByPatient
);


// Create appointment
appointmentRouter.post(
    "/",
    requireAuth,
    createAppointment
);


// =====================================================
// DOCTOR APPOINTMENTS
// =====================================================

appointmentRouter.get(
    "/doctor/:doctorId",
    getAppointmentsByDoctor
);


// =====================================================
// UPDATE / CANCEL
// =====================================================

appointmentRouter.post(
    "/:id/cancel",
    cancelServiceAppointment
);

appointmentRouter.put(
    "/:id",
    updateAppointment
);


export default appointmentRouter;