import ServiceAppointment from "../models/serviceAppointment.js";
import Service from "../models/Service.js";
import { getAuth } from "@clerk/express";
import { Cashfree } from "cashfree-pg";
import {
    createCashfreeOrder,
    getCashfreePayments,
} from "../utils/cashfreeApi.js";

// ======================================================
// CASHFREE CONFIGURATION
// ======================================================

const CASHFREE_CLIENT_ID =
    process.env.CASHFREE_CLIENT_ID || null;

const CASHFREE_CLIENT_SECRET =
    process.env.CASHFREE_CLIENT_SECRET || null;

const CASHFREE_ENV =
    process.env.CASHFREE_ENV === "PRODUCTION"
        ? Cashfree.PRODUCTION
        : Cashfree.SANDBOX;

const cashfree =
    CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET
        ? new Cashfree(
              CASHFREE_ENV,
              CASHFREE_CLIENT_ID,
              CASHFREE_CLIENT_SECRET
          )
        : null;

const CASHFREE_API_VERSION = "2025-01-01";

console.log("========== SERVICE CASHFREE CONFIG ==========");
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
console.log("=============================================");


// ======================================================
// SAFE NUMBER
// ======================================================

const safeNumber = (val) => {
    if (
        val === undefined ||
        val === null ||
        val === ""
    ) {
        return null;
    }

    const n = Number(val);

    return Number.isFinite(n) ? n : null;
};


// ======================================================
// PARSE TIME
// ======================================================

function parseTimeString(timeStr) {
    if (
        !timeStr ||
        typeof timeStr !== "string"
    ) {
        return null;
    }

    const t = timeStr.trim();

    const m = t.match(
        /([0-9]{1,2}):?([0-9]{0,2})\s*(AM|PM|am|pm)?/
    );

    if (!m) return null;

    let hh = parseInt(m[1], 10);
    let mm = m[2]
        ? parseInt(m[2], 10)
        : 0;

    const ampm =
        (m[3] || "").toUpperCase();

    if (
        Number.isNaN(hh) ||
        Number.isNaN(mm)
    ) {
        return null;
    }

    // 12-hour format
    if (ampm) {
        if (
            hh < 1 ||
            hh > 12 ||
            mm < 0 ||
            mm > 59
        ) {
            return null;
        }

        return {
            hour: hh,
            minute: mm,
            ampm,
        };
    }

    // 24-hour format
    if (
        hh < 0 ||
        hh > 23 ||
        mm < 0 ||
        mm > 59
    ) {
        return null;
    }

    if (hh === 0) {
        return {
            hour: 12,
            minute: mm,
            ampm: "AM",
        };
    }

    if (hh === 12) {
        return {
            hour: 12,
            minute: mm,
            ampm: "PM",
        };
    }

    if (hh > 12) {
        return {
            hour: hh - 12,
            minute: mm,
            ampm: "PM",
        };
    }

    return {
        hour: hh,
        minute: mm,
        ampm: "AM",
    };
}


// ======================================================
// FRONTEND URL
// ======================================================

const buildFrontendBase = (req) => {
    const env = process.env.FRONTEND_URL;

    if (env) {
        return env.replace(/\/$/, "");
    }

    const origin =
        req.get("origin") ||
        req.get("referer") ||
        null;

    return origin
        ? origin.replace(/\/$/, "")
        : null;
};


// ======================================================
// CLERK USER
// ======================================================

function resolveClerkUserId(req) {
    try {
        const auth = req.auth || {};

        const candidate =
            auth?.userId ||
            auth?.user_id ||
            auth?.user?.id ||
            req.user?.id ||
            null;

        if (candidate) {
            return candidate;
        }

        try {
            const serverAuth =
                getAuth ? getAuth(req) : null;

            return serverAuth?.userId || null;
        } catch (e) {
            return null;
        }
    } catch (e) {
        return null;
    }
}


// ======================================================
// CREATE SERVICE APPOINTMENT
// ======================================================

export const createServiceAppointment =
    async (req, res) => {
        try {
            const body = req.body || {};

            const clerkUserId =
                resolveClerkUserId(req);

            if (!clerkUserId) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required",
                });
            }

            const {
                serviceId,
                serviceName:
                    serviceNameFromBody,

                patientName,
                mobile,
                age,
                gender,

                date,
                time,

                hour,
                minute,
                ampm,

                paymentMethod = "Online",

                amount:
                    amountFromBody,

                fees:
                    feesFromBody,

                email,

                meta = {},

                notes = "",

                serviceImageUrl:
                    serviceImageUrlFromBody,

                serviceImagePublicId:
                    serviceImagePublicIdFromBody,
            } = body;


            // ==================================================
            // BASIC VALIDATION
            // ==================================================

            if (!serviceId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "serviceId is required",
                });
            }

            if (
                !patientName ||
                !String(patientName).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "patientName is required",
                });
            }

            if (
                !mobile ||
                !String(mobile).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "mobile is required",
                });
            }

            if (
                !date ||
                !String(date).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "date is required (YYYY-MM-DD)",
                });
            }


            // ==================================================
            // AMOUNT
            // ==================================================

            const numericAmount =
                safeNumber(
                    amountFromBody ??
                    feesFromBody ??
                    0
                );

            if (
                numericAmount === null ||
                numericAmount < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "amount/fees must be a valid number",
                });
            }


            // ==================================================
            // TIME
            // ==================================================

            let finalHour =
                hour !== undefined
                    ? safeNumber(hour)
                    : null;

            let finalMinute =
                minute !== undefined
                    ? safeNumber(minute)
                    : null;

            let finalAmpm =
                ampm || null;


            if (
                time &&
                (
                    finalHour === null ||
                    finalHour === undefined
                )
            ) {
                const parsed =
                    parseTimeString(time);

                if (!parsed) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "time string couldn't be parsed",
                    });
                }

                finalHour = parsed.hour;
                finalMinute = parsed.minute;
                finalAmpm = parsed.ampm;
            }


            if (
                finalHour === null ||
                finalMinute === null ||
                (
                    finalAmpm !== "AM" &&
                    finalAmpm !== "PM"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Time missing or invalid — provide time string or hour, minute and ampm.",
                });
            }


            // ==================================================
            // DUPLICATE BOOKING CHECK
            // ==================================================

            try {
                const existing =
                    await ServiceAppointment
                        .findOne({
                            serviceId:
                                String(serviceId),

                            createdBy:
                                clerkUserId,

                            date:
                                String(date),

                            hour:
                                Number(finalHour),

                            minute:
                                Number(finalMinute),

                            ampm:
                                finalAmpm,

                            status: {
                                $ne: "Canceled",
                            },
                        })
                        .lean();

                if (existing) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "You already have a booking for this service at the selected date and time.",
                    });
                }
            } catch (chkErr) {
                console.warn(
                    "Duplicate booking check failed:",
                    chkErr
                );
            }


            // ==================================================
            // FETCH SERVICE
            // ==================================================

            let svc = null;

            try {
                svc =
                    await Service
                        .findById(serviceId)
                        .lean();
            } catch (e) {
                console.warn(
                    "Service lookup failed:",
                    e?.message || e
                );
            }


            const resolvedServiceName =
                serviceNameFromBody ||
                (
                    svc &&
                    (
                        svc.name ||
                        svc.title
                    )
                ) ||
                "Service";


            const svcImageUrlFromDB =
                svc &&
                (
                    String(
                        svc.imageUrl ||
                        svc.image ||
                        svc.image?.url ||
                        svc.profileImage?.url ||
                        ""
                    ).trim() ||
                    ""
                );


            const svcImagePublicIdFromDB =
                svc &&
                (
                    String(
                        svc.imagePublicId ||
                        svc.image?.publicId ||
                        svc.profileImage?.publicId ||
                        ""
                    ).trim() ||
                    ""
                );


            const finalServiceImageUrl =
                svcImageUrlFromDB &&
                svcImageUrlFromDB.length
                    ? svcImageUrlFromDB
                    : (
                        serviceImageUrlFromBody &&
                        String(
                            serviceImageUrlFromBody
                        ).trim()
                    ) || "";


            const finalServiceImagePublicId =
                svcImagePublicIdFromDB &&
                svcImagePublicIdFromDB.length
                    ? svcImagePublicIdFromDB
                    : (
                        serviceImagePublicIdFromBody &&
                        String(
                            serviceImagePublicIdFromBody
                        ).trim()
                    ) || "";


            // ==================================================
            // BASE APPOINTMENT
            // ==================================================

            const base = {
                serviceId,

                serviceName:
                    resolvedServiceName,

                serviceImage: {
                    url:
                        finalServiceImageUrl,

                    publicId:
                        finalServiceImagePublicId,
                },

                patientName:
                    String(patientName).trim(),

                mobile:
                    String(mobile).trim(),

                age:
                    age
                        ? Number(age)
                        : undefined,

                gender:
                    gender || "",

                date:
                    String(date),

                hour:
                    Number(finalHour),

                minute:
                    Number(finalMinute),

                ampm:
                    finalAmpm,

                fees:
                    numericAmount,

                createdBy:
                    clerkUserId,

                notes:
                    notes || "",
            };


            // ==================================================
            // FREE APPOINTMENT
            // ==================================================

            if (numericAmount === 0) {
                const created =
                    await ServiceAppointment.create({
                        ...base,

                        status:
                            "Pending",

                        payment: {
                            method:
                                "Cash",

                            status:
                                "Pending",

                            amount:
                                0,

                            paidAt:
                                new Date(),
                        },
                    });

                return res.status(201).json({
                    success: true,
                    appointment: created,
                });
            }


            // ==================================================
            // CASH BOOKING
            // ==================================================

            if (
                paymentMethod === "Cash"
            ) {
                const created =
                    await ServiceAppointment.create({
                        ...base,

                        status:
                            "Pending",

                        payment: {
                            method:
                                "Cash",

                            status:
                                "Pending",

                            amount:
                                numericAmount,

                            meta,
                        },
                    });

                return res.status(201).json({
                    success: true,

                    appointment:
                        created,

                    checkoutUrl:
                        null,
                });
            }


            // ==================================================
            // ONLINE CASHFREE PAYMENT
            // ==================================================

            if (!cashfree) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Cashfree is not configured on server",
                });
            }


            const frontendBase =
                buildFrontendBase(req);

            if (!frontendBase) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Frontend base URL not available. Set FRONTEND_URL or provide Origin header.",
                });
            }


            // ==================================================
            // CASHFREE ORDER ID
            // ==================================================

            const orderId =
                `service_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 8)}`;


            // Cashfree appends the actual order_id
            // to this URL after payment.
            const returnUrl =
                `${frontendBase}/service-appointment/payment-success?order_id={order_id}`;


            // ==================================================
            // CASHFREE ORDER REQUEST
            // ==================================================

            const orderRequest = {
                order_amount:
                    Number(
                        numericAmount.toFixed(2)
                    ),

                order_currency:
                    "INR",

                order_id:
                    orderId,

                customer_details: {
                    customer_id:
                        String(clerkUserId),

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
                    `MediCare Service Appointment - ${resolvedServiceName}`
                        .substring(
                            0,
                            200
                        ),
            };


            // ==================================================
// CREATE CASHFREE ORDER
// ==================================================

let cashfreeOrder;

try {
    console.log(
        "💳 Creating Cashfree service order:",
        orderId
    );

    cashfreeOrder =
        await createCashfreeOrder(
            orderRequest
        );

    console.log(
        "✅ Cashfree service order created"
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

            // ==================================================
            // CHECK PAYMENT SESSION
            // ==================================================

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


            // ==================================================
            // SAVE APPOINTMENT
            // ==================================================

            try {
                const created =
                    await ServiceAppointment.create({
                        ...base,

                        status:
                            "Pending",

                        payment: {
                            method:
                                "Online",

                            status:
                                "Pending",

                            amount:
                                numericAmount,

                            // Cashfree ORDER ID
                            providerId:
                                orderId,

                            // Cashfree PAYMENT SESSION ID
                            sessionId:
                                cashfreeOrder
                                    .payment_session_id,

                            meta,
                        },
                    });


                return res.status(201).json({
                    success: true,

                    message:
                        "Service appointment created successfully",

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

            } catch (dbErr) {
                console.error(
                    "❌ DB error saving service appointment:",
                    dbErr
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to create appointment record",
                });
            }

        } catch (err) {
            console.error(
                "createServiceAppointment unexpected:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// CONFIRM SERVICE PAYMENT
// ======================================================

export const confirmServicePayment =
    async (req, res) => {
        try {
            const {
                order_id: orderId,
            } = req.query;


            // ==================================================
            // VALIDATE ORDER ID
            // ==================================================

            if (!orderId) {
                return res.status(400).json({
                    success: false,

                    message:
                        "order_id is required",
                });
            }


            // ==================================================
            // CASHFREE CONFIG CHECK
            // ==================================================

            if (!cashfree) {
                return res.status(500).json({
                    success: false,

                    message:
                        "Cashfree is not configured",
                });
            }


            // ==================================================
            // FETCH CASHFREE PAYMENTS
            // ==================================================

            let paymentsResponse;

            try {
                console.log(
                    "🔍 Checking Cashfree service order:",
                    orderId
                );

                const response =
                    await cashfree.PGOrderFetchPayments(
                        CASHFREE_API_VERSION,
                        orderId
                    );

                paymentsResponse =
                    response.data;

                console.log(
                    "Cashfree service payments:",
                    paymentsResponse
                );

            } catch (cashfreeError) {
                console.error(
                    "❌ Cashfree payment verification error:",
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


            // ==================================================
            // PAYMENT LIST
            // ==================================================

            const payments =
                Array.isArray(
                    paymentsResponse
                )
                    ? paymentsResponse
                    : [];


            // ==================================================
            // DETERMINE PAYMENT STATUS
            // ==================================================

            const hasSuccess =
                payments.some(
                    (payment) =>
                        String(
                            payment?.payment_status ||
                            ""
                        ).toUpperCase() ===
                        "SUCCESS"
                );


            const hasPending =
                payments.some(
                    (payment) =>
                        String(
                            payment?.payment_status ||
                            ""
                        ).toUpperCase() ===
                        "PENDING"
                );


            // ==================================================
            // SUCCESS
            // ==================================================

            if (hasSuccess) {

                const successfulPayment =
                    payments.find(
                        (payment) =>
                            String(
                                payment?.payment_status ||
                                ""
                            ).toUpperCase() ===
                            "SUCCESS"
                    );


                const cfPaymentId =
                    successfulPayment
                        ?.cf_payment_id
                        ? String(
                              successfulPayment.cf_payment_id
                          )
                        : "";


                const appt =
                    await ServiceAppointment.findOneAndUpdate(
                        {
                            "payment.providerId":
                                orderId,
                        },

                        {
                            $set: {
                                "payment.status":
                                    "Paid",

                                "payment.providerId":
                                    orderId,

                                "payment.paidAt":
                                    new Date(),

                                "payment.meta.cashfreePaymentId":
                                    cfPaymentId,

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
                            "Service appointment not found for this Cashfree order",
                    });
                }


                console.log(
                    "✅ SERVICE PAYMENT VERIFIED:",
                    orderId
                );


                return res.status(200).json({
                    success: true,

                    status:
                        "Paid",

                    message:
                        "Service payment verified successfully",

                    appointment:
                        appt,
                });
            }


            // ==================================================
            // PENDING
            // ==================================================

            if (hasPending) {
                console.log(
                    "⏳ SERVICE PAYMENT PENDING:",
                    orderId
                );

                return res.status(202).json({
                    success: false,

                    status:
                        "Pending",

                    message:
                        "Service payment is still pending",
                });
            }


            // ==================================================
            // FAILED
            // ==================================================

            console.log(
                "❌ SERVICE PAYMENT FAILED:",
                orderId
            );


            return res.status(400).json({
                success: false,

                status:
                    "Failed",

                message:
                    "Service payment was not successful",
            });

        } catch (err) {
            console.error(
                "confirmServicePayment Error:",
                err
            );

            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// ======================================================
// GET SERVICE APPOINTMENTS
// ======================================================

export const getServiceAppointments =
    async (req, res) => {
        try {
            const {
                serviceId,
                mobile,
                status,

                page:
                    pageRaw = 1,

                limit:
                    limitRaw = 50,

                search = "",
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
                (page - 1) * limit;


            const filter = {};


            if (serviceId) {
                filter.serviceId =
                    serviceId;
            }


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


            const appointment =
                await ServiceAppointment
                    .find(filter)
                    .populate(
                        "serviceId",
                        "name image imageUrl imageSmall"
                    )
                    .sort({
                        createdAt: -1,
                    })
                    .skip(skip)
                    .limit(limit)
                    .lean();


            const total =
                await ServiceAppointment
                    .countDocuments(
                        filter
                    );


            return res.json({
                success: true,

                appointment,

                meta: {
                    page,
                    limit,
                    total,

                    count:
                        appointment.length,
                },
            });

        } catch (err) {
            console.error(
                "getServiceAppointments Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// GET SERVICE APPOINTMENT BY ID
// ======================================================

export const getServiceAppointmentById =
    async (req, res) => {
        try {
            const {
                id,
            } = req.params;


            const appt =
                await ServiceAppointment
                    .findById(id)
                    .lean();


            if (!appt) {
                return res.status(404).json({
                    success: false,

                    message:
                        "Not found the appointment",
                });
            }


            return res.json({
                success: true,
                data: appt,
            });

        } catch (err) {
            console.error(
                "getServiceAppointmentById Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// UPDATE SERVICE APPOINTMENT
// ======================================================

export const updateServiceAppointment =
    async (req, res) => {
        try {
            const {
                id,
            } = req.params;


            const body =
                req.body || null;


            const updates = {};


            if (
                body.status !==
                undefined
            ) {
                updates.status =
                    body.status;
            }


            if (
                body.notes !==
                undefined
            ) {
                updates.notes =
                    body.notes;
            }


            if (
                body.payment !==
                undefined
            ) {
                updates.payment =
                    body.payment;
            }


            if (
                body["payment.status"] !==
                undefined
            ) {
                updates[
                    "payment.status"
                ] =
                    body[
                        "payment.status"
                    ];
            }


            // ==================================================
            // RESCHEDULE
            // ==================================================

            if (body.rescheduledTo) {
                const {
                    date,
                    time,
                } =
                    body.rescheduledTo || {};


                updates.rescheduledTo =
                    {};


                if (date) {
                    if (
                        !/^\d{4}-\d{2}-\d{2}$/.test(
                            date
                        )
                    ) {
                        return res.status(400).json({
                            success: false,

                            message:
                                "rescheduledTo.date must be YYYY-MM-DD",
                        });
                    }


                    updates.rescheduledTo.date =
                        date;

                    updates.date =
                        date;
                }


                if (time) {
                    updates.rescheduledTo.time =
                        String(time);


                    const parsed =
                        parseTimeString(
                            String(time)
                        );


                    if (!parsed) {
                        return res.status(400).json({
                            success: false,

                            message:
                                "rescheduledTo.time couldn't be parsed",
                        });
                    }


                    updates.hour =
                        parsed.hour;

                    updates.minute =
                        parsed.minute;

                    updates.ampm =
                        parsed.ampm;


                    updates.time =
                        `${String(
                            parsed.hour
                        ).padStart(
                            2,
                            "0"
                        )}:${String(
                            parsed.minute
                        ).padStart(
                            2,
                            "0"
                        )} ${
                            parsed.ampm
                        }`;
                }


                if (!body.status) {
                    updates.status =
                        "Rescheduled";
                }
            }


            // ==================================================
            // PAYMENT UPDATE
            // ==================================================

            if (updates.payment) {
                const method =
                    updates.payment.method ||
                    updates.payment?.method;


                if (
                    method &&
                    String(
                        method
                    ).toLowerCase() ===
                        "online"
                ) {
                    updates.status =
                        updates.status ||
                        "Confirmed";
                }


                if (
                    updates.payment.status &&
                    updates.payment.status ===
                        "Confirmed"
                ) {
                    updates.status =
                        "Confirmed";


                    if (
                        updates.payment
                            .paidAt ===
                        undefined
                    ) {
                        updates.payment.paidAt =
                            new Date();
                    }
                }
            }


            const updated =
                await ServiceAppointment
                    .findByIdAndUpdate(
                        id,

                        {
                            $set:
                                updates,
                        },

                        {
                            new: true,
                            runValidators: true,
                        }
                    );


            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Not found",
                });
            }


            return res.json({
                success: true,
                data: updated,
            });

        } catch (err) {
            console.error(
                "updateServiceAppointment Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// CANCEL SERVICE APPOINTMENT
// ======================================================

export const cancelServiceAppointment =
    async (req, res) => {
        try {
            const {
                id,
            } = req.params;


            const appt =
                await ServiceAppointment
                    .findById(id);


            if (!appt) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Not found",
                });
            }


            if (
                appt.status ===
                "Completed"
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Cannot cancel a completed appointment",
                });
            }


            appt.status =
                "Canceled";


            if (appt.payment) {
                appt.payment.status =
                    appt.payment.status ===
                    "Confirmed"
                        ? "Canceled"
                        : "Pending";
            }


            await appt.save();


            return res.json({
                success: true,
                data: appt,
            });

        } catch (err) {
            console.error(
                "cancelServiceAppointment Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// SERVICE APPOINTMENT STATS
// ======================================================

export const getServiceAppointmentStats =
    async (req, res) => {
        try {
            const services =
                await Service.aggregate([
                    {
                        $lookup: {
                            from:
                                "serviceappointments",

                            localField:
                                "_id",

                            foreignField:
                                "serviceId",

                            as:
                                "appointments",
                        },
                    },

                    {
                        $addFields: {
                            totalAppointments:
                                {
                                    $size:
                                        "$appointments",
                                },

                            completed: {
                                $size: {
                                    $filter: {
                                        input:
                                            "$appointments",

                                        as:
                                            "a",

                                        cond: {
                                            $eq: [
                                                "$$a.status",
                                                "Completed",
                                            ],
                                        },
                                    },
                                },
                            },

                            canceled: {
                                $size: {
                                    $filter: {
                                        input:
                                            "$appointments",

                                        as:
                                            "a",

                                        cond: {
                                            $eq: [
                                                "$$a.status",
                                                "Canceled",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },

                    {
                        $addFields: {
                            earning: {
                                $multiply: [
                                    "$completed",
                                    "$price",
                                ],
                            },
                        },
                    },

                    {
                        $project: {
                            name: 1,

                            price: 1,

                            image:
                                "$imageUrl",

                            totalAppointments:
                                1,

                            completed:
                                1,

                            canceled:
                                1,

                            earning:
                                1,
                        },
                    },

                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },
                ]);


            return res.json({
                success: true,

                services,

                totalServices:
                    services.length,
            });

        } catch (err) {
            console.error(
                "getServiceAppointmentStats Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server error",
            });
        }
    };


// ======================================================
// GET SERVICE APPOINTMENTS BY PATIENT
// ======================================================

export const getServiceAppointmentsByPatient =
    async (req, res) => {
        try {
            const clerkUserId =
                req.clerkUserId;


            console.log(
                "👤 Service appointments for:",
                clerkUserId
            );


            if (!clerkUserId) {
                return res.status(401).json({
                    success: false,

                    message:
                        "Authentication required",
                });
            }


            const list =
                await ServiceAppointment
                    .find({
                        createdBy:
                            clerkUserId,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();


            console.log(
                "📋 Service appointments found:",
                list.length
            );


            return res.status(200).json({
                success: true,

                data: list,
            });

        } catch (err) {
            console.error(
                "getServiceAppointmentsByPatient Error:",
                err
            );


            return res.status(500).json({
                success: false,

                message:
                    "Server error",
            });
        }
    };


// ======================================================
// DEFAULT EXPORT
// ======================================================

export default {
    createServiceAppointment,

    confirmServicePayment,

    getServiceAppointments,

    getServiceAppointmentById,

    updateServiceAppointment,

    cancelServiceAppointment,

    getServiceAppointmentStats,

    getServiceAppointmentsByPatient,
};


