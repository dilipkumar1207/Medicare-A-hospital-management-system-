import express from "express";
import {
  createServiceAppointment,
  confirmServicePayment,
  getServiceAppointments,
  getServiceAppointmentById,
  updateServiceAppointment,
  cancelServiceAppointment,
  getServiceAppointmentStats,
  getServiceAppointmentsByPatient,
} from "../controllers/serviceAppointmentController.js";

import { getAuth } from "@clerk/express";

const serviceAppointmentRouter = express.Router();


// ==========================================
// GET MY SERVICE APPOINTMENTS
// ==========================================
serviceAppointmentRouter.get("/me", (req, res, next) => {
  const auth = getAuth(req);

  console.log("========== SERVICE /ME AUTH ==========");
  console.log("isAuthenticated:", auth.isAuthenticated);
  console.log("userId:", auth.userId);
  console.log("sessionId:", auth.sessionId);
  console.log("======================================");

  if (!auth.isAuthenticated || !auth.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  req.clerkUserId = auth.userId;

  next();
}, getServiceAppointmentsByPatient);


// ==========================================
// GET ALL SERVICE APPOINTMENTS
// ==========================================
serviceAppointmentRouter.get(
  "/",
  getServiceAppointments
);


// ==========================================
// PAYMENT CONFIRMATION
// ==========================================
serviceAppointmentRouter.get(
  "/confirm",
  confirmServicePayment
);


// ==========================================
// SERVICE STATISTICS
// ==========================================
serviceAppointmentRouter.get(
  "/stats/summary",
  getServiceAppointmentStats
);


// ==========================================
// CREATE SERVICE APPOINTMENT
// ==========================================
serviceAppointmentRouter.post("/", (req, res, next) => {
    const auth = getAuth(req);

    console.log("========== CREATE SERVICE APPOINTMENT ==========");
    console.log("isAuthenticated:", auth.isAuthenticated);
    console.log("userId:", auth.userId);
    console.log("body:", req.body);
    console.log("===============================================");

    if (!auth.isAuthenticated || !auth.userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    req.clerkUserId = auth.userId;
    next();
}, createServiceAppointment);


// ==========================================
// GET SINGLE APPOINTMENT
// IMPORTANT: keep this AFTER /me
// ==========================================
serviceAppointmentRouter.get(
  "/:id",
  getServiceAppointmentById
);


// ==========================================
// UPDATE
// ==========================================
serviceAppointmentRouter.put(
  "/:id",
  updateServiceAppointment
);


// ==========================================
// CANCEL
// ==========================================
serviceAppointmentRouter.post(
  "/:id/cancel",
  cancelServiceAppointment
);


export default serviceAppointmentRouter;