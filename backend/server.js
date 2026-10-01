import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";

import { connectDB } from "./config/db.js";

import doctorRouter from "./routes/doctorRouter.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";
import adminRouter from "./routes/adminRouter.js";

const app = express();

const PORT = process.env.PORT || 4000;


console.log("======================================");
console.log("CLERK CONFIG CHECK");
console.log("Secret key exists:", !!process.env.CLERK_SECRET_KEY);
console.log("Publishable key exists:", !!process.env.CLERK_PUBLISHABLE_KEY);
console.log("======================================");


// =====================================================
// CORS
// =====================================================

const allowOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow Postman / direct backend requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("❌ CORS blocked:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);


// =====================================================
// CLERK
// =====================================================

app.use(
  clerkMiddleware({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);


// =====================================================
// BODY PARSER
// =====================================================

app.use(
    express.json({
        limit: "50mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "50mb",
    })
);


// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
    console.log("");
    console.log(
        `🔥 REQUEST → ${req.method} ${req.originalUrl}`
    );

    console.log(
        "   Origin:",
        req.headers.origin || "none"
    );

    console.log(
        "   Authorization:",
        req.headers.authorization
            ? "Bearer token received"
            : "NO TOKEN"
    );

    next();
});


// =====================================================
// DATABASE
// =====================================================

connectDB();


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/doctors",
    doctorRouter
);

app.use(
    "/api/services",
    serviceRouter
);

app.use(
    "/api/appointments",
    appointmentRouter
);

app.use(
    "/api/service-appointments",
    serviceAppointmentRouter
);

app.use(
    "/api/admin",
    adminRouter
);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
    console.log("🏠 ROOT REQUEST");

    res.status(200).json({
        success: true,
        message: "API Working",
    });
});


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    console.log("");
    console.log(
        "❌ ROUTE NOT FOUND"
    );

    console.log(
        "   Method:",
        req.method
    );

    console.log(
        "   URL:",
        req.originalUrl
    );

    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("");
    console.error(
        "🔥 SERVER ERROR:"
    );

    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message:
            err.message ||
            "Internal server error",
    });
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log("");
    console.log(
        "======================================"
    );

    console.log(
        `🚀 Server Started on http://localhost:${PORT}`
    );

    console.log(
        "======================================"
    );
});