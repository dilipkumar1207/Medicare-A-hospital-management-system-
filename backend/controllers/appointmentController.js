import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import dotenv from "dotenv";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { Cashfree } from "cashfree-pg";
import {
    createCashfreeOrder,
    getCashfreePayments,
} from "../utils/cashfreeApi.js";


dotenv.config();

// =====================================================
// CONFIGURATION
// =====================================================

const FRONTEND_URL = process.env.FRONTEND_URL;
const MAJOR_ADMIN_ID = process.env.MAJOR_ADMIN_ID || null;

const CASHFREE_CLIENT_ID =
    process.env.CASHFREE_CLIENT_ID;

const CASHFREE_CLIENT_SECRET =
    process.env.CASHFREE_CLIENT_SECRET;

const CASHFREE_ENV =
    process.env.CASHFREE_ENV === "PRODUCTION"
        ? Cashfree.PRODUCTION
        : Cashfree.SANDBOX;

const cashfree =
    CASHFREE_CLIENT_ID &&
    CASHFREE_CLIENT_SECRET
        ? new Cashfree(
              CASHFREE_ENV,
              CASHFREE_CLIENT_ID,
              CASHFREE_CLIENT_SECRET
          )
        : null;

console.log("========== CASHFREE CONFIG ==========");
console.log(
    "Client ID exists:",
    !!CASHFREE_CLIENT_ID
);
console.log(
    "Secret exists:",
    !!CASHFREE_CLIENT_SECRET
);
console.log(
    "Environment:",
    process.env.CASHFREE_ENV
);
console.log(
    "Cashfree initialized:",
    !!cashfree
);
console.log("=====================================");



console.log("Client ID exists:", !!CASHFREE_CLIENT_ID);
console.log("Secret exists:", !!CASHFREE_CLIENT_SECRET);
console.log("Environment:", process.env.CASHFREE_ENV);
console.log("Cashfree initialized:", !!cashfree);


// =====================================================
// HELPERS
// =====================================================

const safeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
};


const buildFrontendBase = (req) => {
    if (FRONTEND_URL) {
        return FRONTEND_URL.replace(/\/$/, "");
    }

    const origin =
        req.get("origin") ||
        req.get("referer");

    if (origin) {
        return origin.replace(/\/$/, "");
    }

    const host = req.get("host");

    if (host) {
        return `${req.protocol || "http"}://${host}`
            .replace(/\/$/, "");
    }

    return null;
};


// =====================================================
// GET ALL DOCTOR APPOINTMENTS
// GET /api/appointments
// =====================================================

export const getAppointments = async (req, res) => {
    try {
        console.log("");
        console.log("======================================");
        console.log("🔥 GET ALL DOCTOR APPOINTMENTS");
        console.log("======================================");

        console.log("Query:", req.query);

        const {
            doctorId,
            mobile,
            status,
            search = "",
            limit: limitRaw = 50,
            page: pageRaw = 1,
            patientClerkId,
            createdBy,
        } = req.query;

        const limit = Math.min(
            200,
            Math.max(
                1,
                parseInt(limitRaw, 10) || 50
            )
        );

        const page = Math.max(
            1,
            parseInt(pageRaw, 10) || 1
        );

        const skip = (page - 1) * limit;

        const filter = {};

        if (doctorId) {
            filter.doctorId = doctorId;
        }

        if (mobile) {
            filter.mobile = mobile;
        }

        if (status) {
            filter.status = status;
        }

        if (patientClerkId) {
            filter.createdBy =
                patientClerkId;
        }

        if (createdBy) {
            filter.createdBy =
                createdBy;
        }

        if (search.trim()) {
            const re = new RegExp(
                search.trim(),
                "i"
            );

            filter.$or = [
                {
                    patientName: re,
                },
                {
                    mobile: re,
                },
                {
                    notes: re,
                },
            ];
        }

        const items =
            await Appointment.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .populate(
                    "doctorId",
                    "name specialization owner imageUrl image"
                )
                .lean();

        const total =
            await Appointment.countDocuments(
                filter
            );

        return res.status(200).json({
            success: true,

            appointments: items,

            meta: {
                total,
                limit,
                page,
                count: items.length,
            },
        });

    } catch (err) {
        console.error(
            "❌ GetAppointments Error:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};


// =====================================================
// GET APPOINTMENTS OF LOGGED-IN PATIENT
// =====================================================

export const getAppointmentByPatient =
    async (req, res) => {
        try {
            const clerkUserId =
                req.clerkUserId;

            if (!clerkUserId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required",
                });
            }

            const appointments =
                await Appointment.find({
                    createdBy:
                        clerkUserId,
                })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();

            return res.status(200).json({
                success: true,
                appointments,
            });

        } catch (error) {
            console.error(
                "❌ getAppointmentByPatient:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch appointments",
                error:
                    error.message,
            });
        }
    };


// =====================================================
// CREATE APPOINTMENT
// POST /api/appointments
// =====================================================

export const createAppointment =
    async (req, res) => {
        try {
            const {
                doctorId,
                patientName,
                mobile,
                age = "",
                gender = "",
                date,
                time,
                fee,
                fees,
                notes = "",
                email,
                paymentMethod,
                owner: ownerFromBody = null,
                doctorName:
                    doctorNameFromBody,
                speciality:
                    specialityFromBody,
                doctorImageUrl:
                    doctorImageUrlFromBody,
                doctorImagePublicId:
                    doctorImagePublicIdFromBody,
            } = req.body || {};

            // =================================================
            // CLERK USER
            // =================================================

            const clerkUserId =
                req.clerkUserId;

            if (!clerkUserId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication is required",
                });
            }

            // =================================================
            // REQUIRED FIELDS
            // =================================================

            if (
                !doctorId ||
                !patientName ||
                !mobile ||
                !date ||
                !time
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "All fields are required",
                });
            }

            // =================================================
            // FEE
            // =================================================

            const numericFee =
                safeNumber(
                    fee ?? fees ?? 0
                );

            if (
                numericFee === null ||
                numericFee < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid fee amount",
                });
            }

            // =================================================
            // DUPLICATE BOOKING
            // =================================================

            const existingBooking =
                await Appointment.findOne({
                    doctorId,
                    createdBy:
                        clerkUserId,
                    date: String(date),
                    time: String(time),
                    status: {
                        $ne: "Canceled",
                    },
                }).lean();

            if (existingBooking) {
                return res.status(409).json({
                    success: false,
                    message:
                        "You already have an appointment with this doctor at the selected date and time.",
                });
            }

            // =================================================
            // FIND DOCTOR
            // =================================================

            const doctor =
                await Doctor.findById(
                    doctorId
                ).lean();

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Doctor not found",
                });
            }

            // =================================================
            // DOCTOR OWNER
            // =================================================

            let resolvedOwner =
                ownerFromBody ||
                doctor.owner ||
                null;

            if (!resolvedOwner) {
                resolvedOwner =
                    MAJOR_ADMIN_ID ||
                    String(doctorId);
            }

            // =================================================
            // DOCTOR NAME
            // =================================================

            const doctorName =
                (
                    doctor.name &&
                    String(
                        doctor.name
                    ).trim()
                ) ||
                (
                    doctorNameFromBody &&
                    String(
                        doctorNameFromBody
                    ).trim()
                ) ||
                "";

            // =================================================
            // SPECIALIZATION
            // =================================================

            const speciality =
                (
                    doctor.specialization &&
                    String(
                        doctor.specialization
                    ).trim()
                ) ||
                (
                    doctor.speciality &&
                    String(
                        doctor.speciality
                    ).trim()
                ) ||
                (
                    specialityFromBody &&
                    String(
                        specialityFromBody
                    ).trim()
                ) ||
                "";

            // =================================================
            // DOCTOR IMAGE
            // =================================================

            const doctorImageUrl =
                (
                    doctor.imageUrl &&
                    String(
                        doctor.imageUrl
                    ).trim()
                ) ||
                (
                    doctor.image &&
                    String(
                        doctor.image
                    ).trim()
                ) ||
                (
                    doctor.avatarUrl &&
                    String(
                        doctor.avatarUrl
                    ).trim()
                ) ||
                (
                    doctor.profileImage &&
                    doctor.profileImage.url &&
                    String(
                        doctor.profileImage.url
                    ).trim()
                ) ||
                (
                    doctorImageUrlFromBody &&
                    String(
                        doctorImageUrlFromBody
                    ).trim()
                ) ||
                "";

            const doctorImagePublicId =
                (
                    doctor.imagePublicId &&
                    String(
                        doctor.imagePublicId
                    ).trim()
                ) ||
                (
                    doctor.profileImage &&
                    doctor.profileImage.publicId &&
                    String(
                        doctor.profileImage.publicId
                    ).trim()
                ) ||
                (
                    doctorImagePublicIdFromBody &&
                    String(
                        doctorImagePublicIdFromBody
                    ).trim()
                ) ||
                "";

            const doctorImage = {
                url: doctorImageUrl,
                publicId:
                    doctorImagePublicId,
            };

            // =================================================
            // BASE APPOINTMENT
            // =================================================

            const base = {
                doctorId: String(
                    doctor._id ||
                        doctorId
                ),

                doctorName,

                speciality,

                doctorImage,

                patientName:
                    String(
                        patientName
                    ).trim(),

                mobile:
                    String(
                        mobile
                    ).trim(),

                age:
                    age !== "" &&
                    age !== null &&
                    age !== undefined
                        ? Number(age)
                        : undefined,

                gender:
                    gender
                        ? String(gender)
                        : "",

                date:
                    String(date),

                time:
                    String(time),

                fees:
                    numericFee,

                status:
                    "Pending",

                payment: {
                    method:
                        paymentMethod ===
                        "Cash"
                            ? "Cash"
                            : "Online",

                    status:
                        "Pending",

                    amount:
                        numericFee,
                },

                notes:
                    notes || "",

                createdBy:
                    clerkUserId,

                owner:
                    resolvedOwner,

                sessionId:
                    null,
            };

            // =================================================
            // FREE APPOINTMENT
            // =================================================

            if (numericFee === 0) {
                const created =
                    await Appointment.create({
                        ...base,

                        status:
                            "Confirmed",

                        payment: {
                            method:
                                base.payment
                                    .method,

                            status:
                                "Paid",

                            amount:
                                0,

                            paidAt:
                                new Date(),
                        },
                    });

                return res.status(201).json({
                    success: true,

                    message:
                        "Appointment created successfully",

                    appointment:
                        created,

                    checkoutUrl:
                        null,
                });
            }

            // =================================================
            // CASH PAYMENT
            // =================================================

            if (
                paymentMethod === "Cash"
            ) {
                const created =
                    await Appointment.create({
                        ...base,

                        status:
                            "Pending",

                        payment: {
                            method:
                                "Cash",

                            status:
                                "Pending",

                            amount:
                                numericFee,
                        },
                    });

                return res.status(201).json({
                    success: true,

                    message:
                        "Appointment booked successfully",

                    appointment:
                        created,

                    checkoutUrl:
                        null,
                });
            }

            // =================================================
            // ONLINE PAYMENT - CASHFREE
            // =================================================

            if (!cashfree) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Cashfree is not configured on server",
                });
            }

            // =================================================
            // FRONTEND URL
            // =================================================

            const frontBase =
                buildFrontendBase(req);

            if (!frontBase) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Frontend URL could not be determined. Set FRONTEND_URL.",
                });
            }

            // =================================================
            // CASHFREE ORDER ID
            // =================================================

            const orderId =
                `medicare_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}`;

            // =================================================
            // CASHFREE RETURN URL
            // =================================================

            const returnUrl =
                `${frontBase}/appointment/payment-success?order_id={order_id}`;

            // =================================================
            // CASHFREE ORDER REQUEST
            // =================================================

            const orderRequest = {
                order_amount:
                    Number(
                        numericFee.toFixed(2)
                    ),

                order_currency:
                    "INR",

                order_id:
                    orderId,

                customer_details: {
                    customer_id:
                        String(
                            clerkUserId
                        ),

                    customer_name:
                        String(
                            patientName
                        )
                            .trim()
                            .substring(
                                0,
                                100
                            ),

                    customer_email:
                        email
                            ? String(
                                  email
                              )
                                  .trim()
                                  .substring(
                                      0,
                                      100
                                  )
                            : undefined,

                    customer_phone:
                        String(
                            mobile
                        ).trim(),
                },

                order_meta: {
                    return_url:
                        returnUrl,
                },

                order_note:
                    `MediCare Doctor Appointment - ${doctorName}`
                        .substring(
                            0,
                            200
                        ),
            };

            // =================================================
            // CREATE CASHFREE ORDER
            // =================================================

            let cashfreeOrder;

try {
    console.log(
        "💳 Creating Cashfree order:",
        orderId
    );

    cashfreeOrder =
        await createCashfreeOrder(
            orderRequest
        );

    console.log(
        "✅ Cashfree order created"
    );

} catch (cashfreeError) {
    console.error(
        "❌ Cashfree create order error:",
        cashfreeError?.data ||
        cashfreeError?.message ||
        cashfreeError
    );

    return res.status(502).json({
        success: false,
        message:
            cashfreeError?.data?.message ||
            cashfreeError?.message ||
            "Cashfree payment provider error",
    });
}

            // =================================================
            // PAYMENT SESSION CHECK
            // =================================================

            if (
                !cashfreeOrder
                    ?.payment_session_id
            ) {
                return res.status(502).json({
                    success: false,

                    message:
                        "Cashfree payment session was not created",
                });
            }

            // =================================================
            // SAVE APPOINTMENT
            // =================================================

            try {
                const created =
                    await Appointment.create({
                        ...base,

                        sessionId:
                            cashfreeOrder
                                .payment_session_id,

                        payment: {
                            ...base.payment,

                            providerId:
                                orderId,
                        },

                        status:
                            "Pending",
                    });

                console.log(
                    "✅ Online appointment created:",
                    created._id
                );

                return res.status(201).json({
                    success: true,

                    message:
                        "Appointment created successfully",

                    appointment:
                        created,

                    orderId:
                        orderId,

                    paymentSessionId:
                        cashfreeOrder
                            .payment_session_id,

                    checkoutUrl:
                        null,
                });

            } catch (dbError) {
                console.error(
                    "❌ DB error saving appointment:",
                    dbError
                );

                return res.status(500).json({
                    success: false,

                    message:
                        "Failed to create appointment record",
                });
            }

        } catch (error) {
            console.error(
                "❌ CREATE APPOINTMENT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",

                error:
                    error.message,
            });
        }
    };


// =====================================================
// CONFIRM CASHFREE PAYMENT
// GET /api/appointments/confirm-payment
// =====================================================

export const confirmPayment =
    async (req, res) => {
        try {
            const {
                order_id: orderId,
            } = req.query;

            console.log("");
            console.log(
                "======================================"
            );
            console.log(
                "💳 CASHFREE PAYMENT VERIFICATION"
            );
            console.log(
                "======================================"
            );
            console.log(
                "Order ID:",
                orderId
            );

            // =================================================
            // VALIDATE ORDER ID
            // =================================================

            if (!orderId) {
                return res.status(400).json({
                    success: false,

                    message:
                        "order_id is required",
                });
            }

            // =================================================
            // CASHFREE CONFIG
            // =================================================

            if (!cashfree) {
                return res.status(500).json({
                    success: false,

                    message:
                        "Cashfree is not configured",
                });
            }

            // =================================================
            // FETCH CASHFREE PAYMENTS
            // =================================================

            let paymentsResponse;

            try {
                const response =
                    await cashfree.PGOrderFetchPayments(
                        "2025-01-01",
                        orderId
                    );

                paymentsResponse =
                    response.data;

                console.log(
                    "Cashfree payments:",
                    paymentsResponse
                );

            } catch (cashfreeError) {
                console.error(
                    "❌ Cashfree verification error:",
                    cashfreeError
                        ?.response
                        ?.data ||
                    cashfreeError?.message ||
                    cashfreeError
                );

                return res.status(502).json({
                    success: false,

                    message:
                        cashfreeError
                            ?.response
                            ?.data
                            ?.message ||
                        cashfreeError?.message ||
                        "Unable to verify Cashfree payment",
                });
            }

            // =================================================
            // PAYMENT ARRAY
            // =================================================

            const payments =
                Array.isArray(
                    paymentsResponse
                )
                    ? paymentsResponse
                    : [];

            // =================================================
            // SUCCESS PAYMENT
            // =================================================

            const successfulPayment =
                payments.find(
                    (payment) =>
                        String(
                            payment?.payment_status ||
                                ""
                        ).toUpperCase() ===
                        "SUCCESS"
                );

            // =================================================
            // PENDING PAYMENT
            // =================================================

            const pendingPayment =
                payments.find(
                    (payment) =>
                        String(
                            payment?.payment_status ||
                                ""
                        ).toUpperCase() ===
                        "PENDING"
                );

            // =================================================
            // SUCCESS
            // =================================================

            if (successfulPayment) {
                const paymentId =
                    successfulPayment
                        ?.cf_payment_id
                        ? String(
                              successfulPayment
                                  .cf_payment_id
                          )
                        : "";

                const appt =
                    await Appointment.findOneAndUpdate(
                        {
                            "payment.providerId":
                                orderId,
                        },

                        {
                            $set: {
                                "payment.status":
                                    "Paid",

                                "payment.paidAt":
                                    new Date(),

                                "payment.providerId":
                                    orderId,

                                "payment.meta.cashfreePaymentId":
                                    paymentId,

                                status:
                                    "Confirmed",
                            },
                        },

                        {
                            new: true,
                        }
                    );

                if (!appt) {
                    return res.status(404).json({
                        success: false,

                        message:
                            "Appointment not found for this Cashfree order",
                    });
                }

                console.log(
                    "✅ Payment verified"
                );

                console.log(
                    "Appointment:",
                    appt._id
                );

                return res.status(200).json({
                    success: true,

                    status:
                        "Paid",

                    message:
                        "Payment confirmed and appointment updated",

                    appointment:
                        appt,
                });
            }

            // =================================================
            // PENDING
            // =================================================

            if (pendingPayment) {
                console.log(
                    "⏳ Payment pending"
                );

                return res.status(202).json({
                    success: false,

                    status:
                        "Pending",

                    message:
                        "Payment is still pending",
                });
            }

            // =================================================
            // FAILED
            // =================================================

            console.log(
                "❌ Payment failed"
            );

            return res.status(400).json({
                success: false,

                status:
                    "Failed",

                message:
                    "Payment was not successful",
            });

        } catch (error) {
            console.error(
                "❌ Confirm payment error:",
                error
            );

            return res.status(500).json({
                success: false,

                message:
                    "Error confirming payment",

                error:
                    error.message,
            });
        }
    };


// =====================================================
// UPDATE APPOINTMENT
// =====================================================

export const updateAppointment =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const body =
                req.body || {};

            const appt =
                await Appointment.findById(
                    id
                );

            if (!appt) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Appointment not found",
                });
            }

            const terminal =
                appt.status ===
                    "Completed" ||
                appt.status ===
                    "Canceled";

            if (
                terminal &&
                body.status &&
                body.status !==
                    appt.status
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Cannot change status of a completed/canceled appointment",
                });
            }

            const update = {};

            if (body.status) {
                update.status =
                    body.status;
            }

            if (
                body.notes !==
                undefined
            ) {
                update.notes =
                    body.notes;
            }

            if (
                body.date &&
                body.time
            ) {
                if (
                    appt.status ===
                        "Completed" ||
                    appt.status ===
                        "Canceled"
                ) {
                    return res.status(400).json({
                        success: false,

                        message:
                            "Cannot reschedule completed/canceled appointment",
                    });
                }

                update.date =
                    body.date;

                update.time =
                    body.time;

                update.status =
                    "Rescheduled";

                update.rescheduledTo = {
                    date:
                        body.date,

                    time:
                        body.time,
                };
            }

            const updated =
                await Appointment.findByIdAndUpdate(
                    id,
                    update,
                    {
                        new: true,
                        runValidators: true,
                    }
                )
                    .populate({
                        path:
                            "doctorId",

                        select:
                            "name imageUrl image specialization",
                    })
                    .lean();

            return res.json({
                success: true,

                appointment:
                    updated,
            });

        } catch (err) {
            console.error(
                "Update appointment error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// =====================================================
// CANCEL APPOINTMENT
// =====================================================

export const cancelServiceAppointment =
    async (req, res) => {
        try {
            const { id } =
                req.params;

            const appt =
                await Appointment.findById(
                    id
                );

            if (!appt) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Appointment not found",
                });
            }

            appt.status =
                "Canceled";

            await appt.save();

            return res.json({
                success: true,

                message:
                    "Appointment canceled",

                appointment:
                    appt,
            });

        } catch (err) {
            console.error(
                "Cancel appointment error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// =====================================================
// STATS
// =====================================================

export const getStats =
    async (req, res) => {
        try {
            const total =
                await Appointment.countDocuments();

            const paidAgg =
                await Appointment.aggregate([
                    {
                        $match: {
                            "payment.status":
                                "Paid",
                        },
                    },

                    {
                        $group: {
                            _id: null,

                            total: {
                                $sum:
                                    "$fees",
                            },
                        },
                    },
                ]);

            const revenue =
                (
                    paidAgg[0] &&
                    paidAgg[0].total
                ) || 0;

            const sevenDaysAgo =
                new Date();

            sevenDaysAgo.setDate(
                sevenDaysAgo.getDate() -
                    7
            );

            const recent =
                await Appointment.countDocuments(
                    {
                        createdAt: {
                            $gte:
                                sevenDaysAgo,
                        },
                    }
                );

            return res.json({
                success: true,

                stats: {
                    total,

                    revenue,

                    recentLast7Days:
                        recent,
                },
            });

        } catch (err) {
            console.error(
                "Get stats error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// =====================================================
// GET APPOINTMENTS BY DOCTOR
// =====================================================

export const getAppointmentsByDoctor =
    async (req, res) => {
        try {
            const {
                doctorId,
            } = req.params;

            if (!doctorId) {
                return res.status(400).json({
                    success: false,

                    message:
                        "doctorId is required",
                });
            }

            const {
                mobile,
                status,
                search = "",
                limit: limitRaw = 50,
                page: pageRaw = 1,
            } = req.query;

            const limit =
                Math.min(
                    200,
                    Math.max(
                        1,
                        parseInt(
                            limitRaw,
                            10
                        ) || 50
                    )
                );

            const page =
                Math.max(
                    1,
                    parseInt(
                        pageRaw,
                        10
                    ) || 1
                );

            const skip =
                (page - 1) *
                limit;

            const filter = {
                doctorId,
            };

            if (mobile) {
                filter.mobile =
                    mobile;
            }

            if (status) {
                filter.status =
                    status;
            }

            if (search) {
                const re =
                    new RegExp(
                        search,
                        "i"
                    );

                filter.$or = [
                    {
                        patientName:
                            re,
                    },

                    {
                        mobile:
                            re,
                    },

                    {
                        notes:
                            re,
                    },
                ];
            }

            const items =
                await Appointment.find(
                    filter
                )
                    .sort({
                        date: 1,
                        time: 1,
                    })
                    .skip(skip)
                    .limit(limit)
                    .populate(
                        "doctorId",
                        "name specialization owner imageUrl image"
                    )
                    .lean();

            const total =
                await Appointment.countDocuments(
                    filter
                );

            return res.json({
                success: true,

                appointments:
                    items,

                meta: {
                    total,
                    limit,
                    page,
                    count:
                        items.length,
                },
            });

        } catch (err) {
            console.error(
                "GetAppointmentsByDoctor Error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// =====================================================
// REGISTERED USER COUNT
// =====================================================

export const getRegisteredUserCount =
    async (req, res) => {
        try {
            const totalUsers =
                await clerkClient.users.getCount();

            return res.json({
                success: true,

                totalUsers,
            });

        } catch (err) {
            console.error(
                "GetRegisteredUserCount Error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
    getAppointments,
    getAppointmentByPatient,
    confirmPayment,
    createAppointment,
    updateAppointment,
    cancelServiceAppointment,
    getStats,
    getAppointmentsByDoctor,
    getRegisteredUserCount,
};