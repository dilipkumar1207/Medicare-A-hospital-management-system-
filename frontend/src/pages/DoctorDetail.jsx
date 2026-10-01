import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    CalendarCheck,
    MapPin,
    BadgeInfo,
    GraduationCap,
    Award,
    Clock,
    Star,
    Heart,
    Zap,
    Shield,
    Users,
    Phone,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth, useUser } from "@clerk/clerk-react";
import { doctorDetailStyles } from "../assets/dummyStyles";

const API_BASE = "http://localhost:4000";

let cashfreeInstance = null;
let cashfreeSdkPromise = null;

function loadCashfreeSdk() {
    if (window.Cashfree) {
        return Promise.resolve(window.Cashfree);
    }

    if (cashfreeSdkPromise) {
        return cashfreeSdkPromise;
    }

    cashfreeSdkPromise = new Promise((resolve, reject) => {
        const existingScript =
            document.getElementById("cashfree-sdk");

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                () => resolve(window.Cashfree)
            );

            existingScript.addEventListener(
                "error",
                () => reject(new Error("Cashfree SDK failed to load."))
            );

            return;
        }

        const script = document.createElement("script");
        script.id = "cashfree-sdk";
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;

        script.onload = () => {
            if (window.Cashfree) {
                resolve(window.Cashfree);
            } else {
                reject(new Error("Cashfree SDK loaded but is unavailable."));
            }
        };

        script.onerror = () => {
            reject(new Error("Cashfree payment SDK failed to load."));
        };

        document.body.appendChild(script);
    });

    return cashfreeSdkPromise;
}

async function getCashfree() {
    const Cashfree = await loadCashfreeSdk();

    if (!cashfreeInstance) {
        cashfreeInstance = Cashfree({
            mode: "sandbox",
        });
    }

    return cashfreeInstance;
}


// ======================================================
// DATE HELPERS
// ======================================================

function getLocalDateKey(date) {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseScheduleDate(key) {
    if (!key) return null;

    // YYYY-MM-DD
    const match = String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
        const [, year, month, day] = match;

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );
    }

    // ISO/date fallback
    const date = new Date(key);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}


// ======================================================
// GET AVAILABLE SCHEDULE DATES
// ======================================================

function getScheduleDates(schedule) {
    if (!schedule) return [];

    let keys = [];

    // Normal format:
    // {
    //   "2026-09-26": ["10:00 AM", "11:00 AM"],
    //   "2026-09-27": ["12:00 PM"]
    // }
    if (
        typeof schedule === "object" &&
        !Array.isArray(schedule)
    ) {
        keys = Object.keys(schedule);
    }

    const today = new Date();

    const todayKey = getLocalDateKey(today);

    const dates = keys
        .map((key) => {
            const date = parseScheduleDate(key);

            if (!date) return null;

            const dateKey = getLocalDateKey(date);

            if (dateKey < todayKey) {
                return null;
            }

            return date;
        })
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

    return dates;
}


// ======================================================
// PHONE
// ======================================================

function normalizePhoneTo10(phone) {
    if (!phone) return "";

    const digits = String(phone).replace(/\D/g, "");

    if (!digits) return "";

    return digits.length <= 10
        ? digits
        : digits.slice(-10);
}


// ======================================================
// DOCTOR DETAIL
// ======================================================

export default function DoctorDetail() {
    const { id } = useParams();

    const [doctor, setDoctor] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState("");

    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        mobile: "",
        gender: "",
        email: "",
    });

    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const {
        getToken,
        isLoaded: authLoaded,
    } = useAuth();

    const {
        isSignedIn,
        user,
        isLoaded: userLoaded,
    } = useUser();


    // ==================================================
    // PAGE ANIMATION
    // ==================================================

    useEffect(() => {
        setIsVisible(true);

        if (!document.getElementById("cashfree-sdk")) {
            const script = document.createElement("script");
            script.id = "cashfree-sdk";
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);


    // ==================================================
    // PREFILL USER INFORMATION
    // ==================================================

    useEffect(() => {
        if (!userLoaded) return;

        if (!user) return;

        const fullName =
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim();

        const rawPhone =
            user.primaryPhoneNumber ||
            user.primaryPhone ||
            user.phoneNumbers?.[0]?.phoneNumber ||
            "";

        const phone = normalizePhoneTo10(rawPhone);

        const email =
            user.primaryEmailAddress?.emailAddress ||
            user.emailAddresses?.[0]?.emailAddress ||
            "";

        setFormData((previous) => ({
            ...previous,

            name: previous.name || fullName,
            mobile: previous.mobile || phone,
            email: previous.email || email,
        }));
    }, [userLoaded, user]);


    // ==================================================
    // FETCH DOCTOR
    // ==================================================

    useEffect(() => {
        let mounted = true;

        async function fetchDoctor() {
            setLoading(true);
            setError(null);

            try {
                console.log("🔍 Loading doctor:", id);

                const response = await fetch(
                    `${API_BASE}/api/doctors/${id}`
                );

                const body = await response
                    .json()
                    .catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        body?.message ||
                        `Failed to fetch doctor (${response.status})`
                    );
                }

                const doctorData =
                    body?.data ||
                    body?.doctor ||
                    body;

                console.log("👨‍⚕️ Doctor data:", doctorData);
                console.log("📅 Doctor schedule:", doctorData?.schedule);

                if (mounted) {
                    setDoctor(doctorData);
                }
            } catch (err) {
                console.error("❌ Doctor fetch error:", err);

                if (mounted) {
                    setError(
                        err.message ||
                        "Failed to fetch doctor"
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        if (id) {
            fetchDoctor();
        }

        return () => {
            mounted = false;
        };
    }, [id]);


    // ==================================================
    // AVAILABLE DATES
    // ==================================================

    const availableDates = useMemo(() => {
        return getScheduleDates(
            doctor?.schedule
        );
    }, [doctor]);


    // ==================================================
    // CONSULTATION FEE
    // ==================================================

    const fee = Number(
        doctor?.fee ??
        doctor?.fees ??
        0
    );


    // ==================================================
    // AVAILABLE SLOTS
    // ==================================================

    const slots = useMemo(() => {
        if (!selectedDate) return [];

        if (!doctor?.schedule) return [];

        const dateKey = getLocalDateKey(selectedDate);

        console.log("📅 Selected date:", dateKey);
        console.log("📋 Doctor schedule:", doctor.schedule);

        let dateSlots = [];

        // Object schedule
        if (
            typeof doctor.schedule === "object" &&
            !Array.isArray(doctor.schedule)
        ) {
            dateSlots =
                doctor.schedule[dateKey] ||
                [];
        }

        console.log("⏰ Slots found:", dateSlots);

        if (!Array.isArray(dateSlots)) {
            return [];
        }

        return dateSlots;
    }, [selectedDate, doctor]);


    // ==================================================
    // DATE SELECTION
    // ==================================================

    const handleDateSelect = (date) => {
        setSelectedDate(date);

        // Important:
        // reset old time when changing date
        setSelectedSlot("");

        console.log(
            "📅 Date selected:",
            getLocalDateKey(date)
        );
    };


    // ==================================================
    // MOBILE
    // ==================================================

    const handleMobileChange = (value) => {
        const digits = value
            .replace(/\D/g, "")
            .slice(0, 10);

        setFormData((previous) => ({
            ...previous,
            mobile: digits,
        }));
    };


    const handleMobilePaste = (event) => {
        event.preventDefault();

        const pasted =
            event.clipboardData?.getData("text") ||
            "";

        const digits = pasted
            .replace(/\D/g, "")
            .slice(0, 10);

        setFormData((previous) => ({
            ...previous,
            mobile: digits,
        }));
    };


    // ==================================================
    // BOOK APPOINTMENT
    // ==================================================

    const handleBooking = async () => {
        if (isSubmitting) return;


        // ----------------------------------------------
        // PATIENT VALIDATION
        // ----------------------------------------------

        if (
            !formData.name.trim() ||
            !formData.age ||
            !formData.mobile ||
            !formData.gender
        ) {
            toast.error(
                "Please fill all patient details!",
                {
                    position: "top-center",
                    autoClose: 2000,
                }
            );

            return;
        }


        // ----------------------------------------------
        // MOBILE VALIDATION
        // ----------------------------------------------

        const mobileDigits =
            formData.mobile.replace(/\D/g, "");

        if (mobileDigits.length !== 10) {
            toast.error(
                "Mobile number must be exactly 10 digits.",
                {
                    position: "top-center",
                    autoClose: 2500,
                }
            );

            return;
        }


        // ----------------------------------------------
        // DATE + TIME VALIDATION
        // ----------------------------------------------

        if (!selectedDate) {
            toast.error(
                "Please select a date.",
                {
                    position: "top-center",
                }
            );

            return;
        }

        if (!selectedSlot) {
            toast.error(
                "Please select a time slot.",
                {
                    position: "top-center",
                }
            );

            return;
        }


        // ----------------------------------------------
        // AUTH VALIDATION
        // ----------------------------------------------

        if (!authLoaded || !userLoaded) {
            toast.error(
                "Authentication is still loading. Please try again.",
                {
                    position: "top-center",
                }
            );

            return;
        }

        if (!isSignedIn) {
            toast.error(
                "Please sign in before booking an appointment.",
                {
                    position: "top-center",
                }
            );

            return;
        }


        setIsSubmitting(true);


        // ----------------------------------------------
        // DATE KEY
        // ----------------------------------------------

        const dateISO =
            getLocalDateKey(selectedDate);


        // ----------------------------------------------
        // PAYLOAD
        // ----------------------------------------------

        const payload = {
            doctorId:
                doctor?._id ||
                doctor?.id,

            doctorName:
                doctor?.name || "",

            speciality:
                doctor?.specialization ||
                doctor?.speciality ||
                "",

            owner:
                doctor?.owner || undefined,

            doctorImageUrl:
                doctor?.imageUrl ||
                doctor?.image ||
                "",

            doctorImagePublicId:
                doctor?.imagePublicId ||
                doctor?.image?.publicId ||
                "",

            patientName:
                formData.name.trim(),

            mobile:
                mobileDigits,

            age:
                Number(formData.age),

            gender:
                formData.gender,

            date:
                dateISO,

            time:
                selectedSlot,

            fee:
                fee,

            fees:
                fee,

            paymentMethod:
                paymentMethod,

            email:
                formData.email?.trim() ||
                undefined,
        };


        // ----------------------------------------------
        // DEBUG LOGS
        // ----------------------------------------------

        console.log(
            "======================================"
        );

        console.log(
            "🚀 CREATING DOCTOR APPOINTMENT"
        );

        console.log(
            "👤 Clerk User:",
            user?.id
        );

        console.log(
            "🔑 Auth loaded:",
            authLoaded
        );

        console.log(
            "🔐 Signed in:",
            isSignedIn
        );

        console.log(
            "📅 Date:",
            dateISO
        );

        console.log(
            "⏰ Time:",
            selectedSlot
        );

        console.log(
            "👨‍⚕️ Doctor ID:",
            payload.doctorId
        );

        console.log(
            "💰 Fee:",
            fee
        );

        console.log(
            "💳 Payment:",
            paymentMethod
        );

        console.log(
            "📦 Booking payload:",
            payload
        );


        try {

            // ------------------------------------------
            // GET CLERK TOKEN
            // ------------------------------------------

            const token = await getToken();

            console.log(
                "🔑 Token exists:",
                !!token
            );

            if (!token) {
                throw new Error(
                    "Failed to obtain authentication token."
                );
            }


            // ------------------------------------------
            // POST APPOINTMENT
            // ------------------------------------------

            console.log(
                "📤 POST /api/appointments"
            );

            const response = await fetch(
                `${API_BASE}/api/appointments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(payload),
                }
            );


            const body =
                await response
                    .json()
                    .catch(() => null);


            console.log(
                "📥 Appointment response:",
                body
            );


            // ------------------------------------------
            // ERROR
            // ------------------------------------------

            if (!response.ok) {
                const message =
                    body?.message ||
                    body?.error ||
                    `Booking failed (${response.status})`;

                throw new Error(message);
            }


            // ------------------------------------------
            // CASHFREE ONLINE PAYMENT
            // ------------------------------------------

            if (paymentMethod === "Online") {
                const paymentSessionId =
                    body?.paymentSessionId;

                if (!paymentSessionId) {
                    throw new Error(
                        "Cashfree payment session was not received."
                    );
                }

                console.log(
                    "💳 Cashfree Payment Session:",
                    paymentSessionId
                );

                const cashfree = await getCashfree();

                cashfree.checkout({
                    paymentSessionId,
                    redirectTarget: "_self",
                });

                return;
            }


            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            toast.success(
                "Appointment booked successfully!",
                {
                    position: "top-center",
                    autoClose: 1500,
                }
            );

            console.log(
                "✅ APPOINTMENT CREATED SUCCESSFULLY"
            );


            // Go to appointments
            setTimeout(() => {
                window.location.href =
                    "/appointments";
            }, 1000);

        } catch (err) {

            console.error(
                "❌ BOOKING ERROR:",
                err
            );

            toast.error(
                err.message ||
                "Booking failed. Please try again.",
                {
                    position: "top-center",
                    autoClose: 3000,
                }
            );

        } finally {
            setIsSubmitting(false);
        }
    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div
                className={
                    doctorDetailStyles.loadingContainer
                }
            >
                <div>
                    Loading doctor...
                </div>
            </div>
        );
    }


    // ==================================================
    // ERROR
    // ==================================================

    if (error) {
        return (
            <div
                className={
                    doctorDetailStyles.errorContainer
                }
            >
                <div
                    className={
                        doctorDetailStyles.errorContent
                    }
                >
                    <div
                        className={
                            doctorDetailStyles.errorText
                        }
                    >
                        Error
                    </div>

                    <div
                        className={
                            doctorDetailStyles.errorMessage
                        }
                    >
                        {error}
                    </div>

                    <Link
                        to="/doctors"
                        className={
                            doctorDetailStyles.backButton
                        }
                    >
                        <ArrowLeft size={20} />
                        Back to Doctors
                    </Link>
                </div>
            </div>
        );
    }


    // ==================================================
    // NOT FOUND
    // ==================================================

    if (!doctor) {
        return (
            <div
                className={
                    doctorDetailStyles.notFoundContainer
                }
            >
                <div
                    className={
                        doctorDetailStyles.notFoundContent
                    }
                >
                    <div
                        className={
                            doctorDetailStyles.notFoundEmoji
                        }
                    >
                        😷
                    </div>

                    <h1
                        className={
                            doctorDetailStyles.notFoundTitle
                        }
                    >
                        Doctor Not Found
                    </h1>

                    <Link
                        to="/doctors"
                        className={
                            doctorDetailStyles.backButton
                        }
                    >
                        <ArrowLeft size={20} />
                        Back to Doctors
                    </Link>
                </div>
            </div>
        );
    }


    // ==================================================
    // UI
    // ==================================================

    return (
        <div
            className={
                doctorDetailStyles.pageContainer
            }
        >
            <ToastContainer />


            {/* HEADER */}

            <div
                className={
                    doctorDetailStyles.headerContainer
                }
            >
                <div
                    className={
                        doctorDetailStyles.headerContent
                    }
                >
                    <div
                        className={
                            doctorDetailStyles.headerFlex
                        }
                    >
                        <Link
                            to="/doctors"
                            className={
                                doctorDetailStyles.headerBackButton
                            }
                        >
                            <ArrowLeft size={18} />

                            <span
                                className={
                                    doctorDetailStyles.headerBackButtonText
                                }
                            >
                                Back
                            </span>
                        </Link>


                        <h1
                            className={
                                doctorDetailStyles.headerTitle
                            }
                        >
                            Doctor Profile
                        </h1>


                        <div
                            className={
                                doctorDetailStyles.headerRatingContainer
                            }
                        >
                            <Star
                                className={
                                    doctorDetailStyles.headerRatingIcon
                                }
                                size={18}
                            />

                            <span
                                className={
                                    doctorDetailStyles.headerRatingText
                                }
                            >
                                {doctor.rating || "—"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>


            {/* MAIN */}

            <div
                className={`${doctorDetailStyles.mainContent} ${
                    isVisible
                        ? doctorDetailStyles.visibleState
                        : doctorDetailStyles.hiddenState
                }`}
            >

                {/* ==================================================
                    DOCTOR PROFILE
                ================================================== */}

                <div
                    className={
                        doctorDetailStyles.profileCard
                    }
                >
                    <div
                        className={
                            doctorDetailStyles.profileGrid
                        }
                    >

                        {/* LEFT */}

                        <div
                            className={
                                doctorDetailStyles.leftColumn
                            }
                        >
                            <div
                                className={
                                    doctorDetailStyles.avatarContainer
                                }
                            >
                                <div
                                    className={
                                        doctorDetailStyles.avatarGlow
                                    }
                                />

                                <img
                                    src={
                                        doctor.imageUrl ||
                                        doctor.image ||
                                        "/placeholder-doctor.jpg"
                                    }
                                    alt={doctor.name}
                                    className={
                                        doctorDetailStyles.avatarImage
                                    }
                                />
                            </div>


                            <div
                                className={
                                    doctorDetailStyles.statsGrid
                                }
                            >
                                <div
                                    className={
                                        doctorDetailStyles.statBox
                                    }
                                >
                                    <Heart
                                        className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.heartIcon}`}
                                    />

                                    <div
                                        className={
                                            doctorDetailStyles.statValue
                                        }
                                    >
                                        {doctor.success ?? "—"}%
                                    </div>

                                    <div
                                        className={
                                            doctorDetailStyles.statLabel
                                        }
                                    >
                                        Success
                                    </div>
                                </div>


                                <div
                                    className={
                                        doctorDetailStyles.statBox
                                    }
                                >
                                    <Award
                                        className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.awardIcon}`}
                                    />

                                    <div
                                        className={
                                            doctorDetailStyles.statValue
                                        }
                                    >
                                        {doctor.experience ?? "—"} Years
                                    </div>

                                    <div
                                        className={
                                            doctorDetailStyles.statLabel
                                        }
                                    >
                                        Experience
                                    </div>
                                </div>


                                <div
                                    className={
                                        doctorDetailStyles.statBox
                                    }
                                >
                                    <Users
                                        className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.usersIcon}`}
                                    />

                                    <div
                                        className={
                                            doctorDetailStyles.statValue
                                        }
                                    >
                                        {doctor.patients ?? "—"}
                                    </div>

                                    <div
                                        className={
                                            doctorDetailStyles.statLabel
                                        }
                                    >
                                        Patients
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* RIGHT */}

                        <div
                            className={
                                doctorDetailStyles.rightColumn
                            }
                        >
                            <div className="space-y-3">

                                <h1
                                    className={
                                        doctorDetailStyles.doctorName
                                    }
                                >
                                    {doctor.name}
                                </h1>

                                <div
                                    className={
                                        doctorDetailStyles.specializationBadge
                                    }
                                >
                                    <Zap
                                        className={
                                            doctorDetailStyles.badgeIcon
                                        }
                                    />

                                    {doctor.specialization ||
                                        doctor.speciality ||
                                        "Specialist"}
                                </div>
                            </div>


                            <div
                                className={
                                    doctorDetailStyles.infoGrid
                                }
                            >

                                <div
                                    className={
                                        doctorDetailStyles.infoItem
                                    }
                                >
                                    <GraduationCap
                                        className={
                                            doctorDetailStyles.infoIcon
                                        }
                                    />

                                    <div>
                                        <div
                                            className={
                                                doctorDetailStyles.infoLabel
                                            }
                                        >
                                            Qualifications
                                        </div>

                                        <div
                                            className={
                                                doctorDetailStyles.infoValue
                                            }
                                        >
                                            {doctor.qualifications ||
                                                "—"}
                                        </div>
                                    </div>
                                </div>


                                <div
                                    className={
                                        doctorDetailStyles.infoItem
                                    }
                                >
                                    <MapPin
                                        className={
                                            doctorDetailStyles.infoIcon
                                        }
                                    />

                                    <div>
                                        <div
                                            className={
                                                doctorDetailStyles.infoLabel
                                            }
                                        >
                                            Location
                                        </div>

                                        <div
                                            className={
                                                doctorDetailStyles.infoValue
                                            }
                                        >
                                            {doctor.location ||
                                                "—"}
                                        </div>
                                    </div>
                                </div>


                                <div
                                    className={
                                        doctorDetailStyles.infoItem
                                    }
                                >
                                    <Clock
                                        className={
                                            doctorDetailStyles.infoIcon
                                        }
                                    />

                                    <div>
                                        <div
                                            className={
                                                doctorDetailStyles.infoLabel
                                            }
                                        >
                                            Consultation Fee
                                        </div>

                                        <div
                                            className={
                                                doctorDetailStyles.feeValue
                                            }
                                        >
                                            ₹{fee}
                                        </div>
                                    </div>
                                </div>


                                <div
                                    className={
                                        doctorDetailStyles.infoItem
                                    }
                                >
                                    <Shield
                                        className={
                                            doctorDetailStyles.infoIcon
                                        }
                                    />

                                    <div>
                                        <div
                                            className={
                                                doctorDetailStyles.infoLabel
                                            }
                                        >
                                            Availability
                                        </div>

                                        <div
                                            className={
                                                doctorDetailStyles.infoValue
                                            }
                                        >
                                            {doctor.availability ===
                                                "Available" ||
                                            doctor.available
                                                ? "Available"
                                                : "Available Soon"}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div
                                className={
                                    doctorDetailStyles.aboutContainer
                                }
                            >
                                <div
                                    className={
                                        doctorDetailStyles.aboutHeader
                                    }
                                >
                                    <BadgeInfo
                                        className={
                                            doctorDetailStyles.aboutIcon
                                        }
                                    />

                                    <h3
                                        className={
                                            doctorDetailStyles.aboutTitle
                                        }
                                    >
                                        About Doctor
                                    </h3>
                                </div>

                                <p
                                    className={
                                        doctorDetailStyles.aboutText
                                    }
                                >
                                    {doctor.about ||
                                        doctor.bio ||
                                        "No information available."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ==================================================
                    APPOINTMENT
                ================================================== */}

                <div
                    className={
                        doctorDetailStyles.appointmentContainer
                    }
                >
                    <div
                        className={
                            doctorDetailStyles.appointmentContent
                        }
                    >

                        <div
                            className={
                                doctorDetailStyles.appointmentHeader
                            }
                        >
                            <CalendarCheck
                                className={
                                    doctorDetailStyles.appointmentIcon
                                }
                            />

                            <h2
                                className={
                                    doctorDetailStyles.appointmentTitle
                                }
                            >
                                Book Your Appointment
                            </h2>
                        </div>


                        <div
                            className={
                                doctorDetailStyles.appointmentGrid
                            }
                        >

                            {/* LEFT COLUMN */}

                            <div
                                className={
                                    doctorDetailStyles.dateSection
                                }
                            >

                                <h3
                                    className={
                                        doctorDetailStyles.dateTitle
                                    }
                                >
                                    <CalendarCheck
                                        className={
                                            doctorDetailStyles.dateTitleIcon
                                        }
                                    />

                                    Select Date
                                </h3>


                                <div
                                    className={
                                        doctorDetailStyles.dateScrollContainer
                                    }
                                >
                                    <div
                                        className={
                                            doctorDetailStyles.dateButtonsContainer
                                        }
                                    >
                                        {availableDates.length > 0 ? (
                                            availableDates.map(
                                                (date) => {
                                                    const selected =
                                                        selectedDate &&
                                                        getLocalDateKey(
                                                            selectedDate
                                                        ) ===
                                                        getLocalDateKey(
                                                            date
                                                        );

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={getLocalDateKey(
                                                                date
                                                            )}
                                                            onClick={() =>
                                                                handleDateSelect(
                                                                    date
                                                                )
                                                            }
                                                            className={`${doctorDetailStyles.dateButton} ${
                                                                selected
                                                                    ? doctorDetailStyles.dateButtonSelected
                                                                    : doctorDetailStyles.dateButtonUnselected
                                                            }`}
                                                        >
                                                            <div
                                                                className={
                                                                    doctorDetailStyles.dateContent
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        doctorDetailStyles.dateWeekday
                                                                    }
                                                                >
                                                                    {date.toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            weekday:
                                                                                "short",
                                                                        }
                                                                    )}
                                                                </div>

                                                                <div
                                                                    className={
                                                                        doctorDetailStyles.dateDay
                                                                    }
                                                                >
                                                                    {date.getDate()}
                                                                </div>

                                                                <div
                                                                    className={
                                                                        doctorDetailStyles.dateMonth
                                                                    }
                                                                >
                                                                    {date.toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            month:
                                                                                "short",
                                                                        }
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <p className="text-gray-500">
                                                No available dates for this
                                                doctor.
                                            </p>
                                        )}
                                    </div>
                                </div>


                                {/* PATIENT FORM */}

                                <div
                                    className={
                                        doctorDetailStyles.patientForm
                                    }
                                >
                                    <h3
                                        className={
                                            doctorDetailStyles.patientFormTitle
                                        }
                                    >
                                        Patient Details
                                    </h3>

                                    <div
                                        className={
                                            doctorDetailStyles.patientFormGrid
                                        }
                                    >
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            className={
                                                doctorDetailStyles.formInput
                                            }
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                        />

                                        <input
                                            type="number"
                                            placeholder="Age"
                                            min="1"
                                            max="120"
                                            className={
                                                doctorDetailStyles.formInput
                                            }
                                            value={formData.age}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    age: e.target.value,
                                                })
                                            }
                                        />

                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="Mobile Number (10 digits)"
                                            className={
                                                doctorDetailStyles.formInput
                                            }
                                            value={formData.mobile}
                                            onChange={(e) =>
                                                handleMobileChange(
                                                    e.target.value
                                                )
                                            }
                                            onPaste={
                                                handleMobilePaste
                                            }
                                        />

                                        <select
                                            className={
                                                doctorDetailStyles.formSelect
                                            }
                                            value={formData.gender}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    gender: e.target.value,
                                                })
                                            }
                                        >
                                            <option value="">
                                                Gender
                                            </option>

                                            <option value="Male">
                                                Male
                                            </option>

                                            <option value="Female">
                                                Female
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>

                                        <input
                                            type="email"
                                            placeholder="Email (optional - for receipts)"
                                            className={
                                                doctorDetailStyles.emailInput
                                            }
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* RIGHT COLUMN */}

                            <div
                                className={
                                    doctorDetailStyles.timeSlotsSection
                                }
                            >

                                <h3
                                    className={
                                        doctorDetailStyles.timeSlotsTitle
                                    }
                                >
                                    <Clock
                                        className={
                                            doctorDetailStyles.timeSlotsIcon
                                        }
                                    />

                                    Available Time Slots
                                </h3>


                                <div
                                    className={
                                        doctorDetailStyles.timeSlotsContainer
                                    }
                                >
                                    {!selectedDate ? (
                                        <p
                                            className={
                                                doctorDetailStyles.noSlotsMessage
                                            }
                                        >
                                            Please select a date first.
                                        </p>
                                    ) : slots.length === 0 ? (
                                        <p
                                            className={
                                                doctorDetailStyles.noSlotsMessage
                                            }
                                        >
                                            No time slots for this date.
                                        </p>
                                    ) : (
                                        slots.map((slot) => (
                                            <button
                                                type="button"
                                                key={slot}
                                                onClick={() =>
                                                    setSelectedSlot(
                                                        slot
                                                    )
                                                }
                                                className={`${doctorDetailStyles.timeSlotButton} ${
                                                    selectedSlot ===
                                                    slot
                                                        ? doctorDetailStyles.timeSlotButtonSelected
                                                        : doctorDetailStyles.timeSlotButtonUnselected
                                                }`}
                                            >
                                                <div
                                                    className={
                                                        doctorDetailStyles.timeSlotContent
                                                    }
                                                >
                                                    <Clock
                                                        className={
                                                            doctorDetailStyles.timeSlotIcon
                                                        }
                                                    />

                                                    <span>
                                                        {slot}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>


                                {/* SUMMARY */}

                                <div
                                    className={
                                        doctorDetailStyles.summaryContainer
                                    }
                                >
                                    <div
                                        className={
                                            doctorDetailStyles.summaryItem
                                        }
                                    >

                                        <div
                                            className={
                                                doctorDetailStyles.summaryRow
                                            }
                                        >
                                            <span
                                                className={
                                                    doctorDetailStyles.summaryLabel
                                                }
                                            >
                                                Selected Doctor:
                                            </span>

                                            <span
                                                className={
                                                    doctorDetailStyles.summaryValue
                                                }
                                            >
                                                {doctor.name}
                                            </span>
                                        </div>


                                        <div
                                            className={
                                                doctorDetailStyles.summaryRow
                                            }
                                        >
                                            <span
                                                className={
                                                    doctorDetailStyles.summaryLabel
                                                }
                                            >
                                                Doctor Speciality:
                                            </span>

                                            <span
                                                className={
                                                    doctorDetailStyles.summaryValue
                                                }
                                            >
                                                {doctor.specialization ||
                                                    doctor.speciality ||
                                                    "—"}
                                            </span>
                                        </div>


                                        <div
                                            className={
                                                doctorDetailStyles.summaryRow
                                            }
                                        >
                                            <span
                                                className={
                                                    doctorDetailStyles.summaryLabel
                                                }
                                            >
                                                Selected Date:
                                            </span>

                                            <span
                                                className={
                                                    doctorDetailStyles.summaryValue
                                                }
                                            >
                                                {selectedDate
                                                    ? selectedDate.toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            weekday:
                                                                "long",
                                                            year:
                                                                "numeric",
                                                            month:
                                                                "long",
                                                            day:
                                                                "numeric",
                                                        }
                                                    )
                                                    : "Not selected"}
                                            </span>
                                        </div>


                                        <div
                                            className={
                                                doctorDetailStyles.summaryRow
                                            }
                                        >
                                            <span
                                                className={
                                                    doctorDetailStyles.summaryLabel
                                                }
                                            >
                                                Selected Time:
                                            </span>

                                            <span
                                                className={
                                                    doctorDetailStyles.summaryValue
                                                }
                                            >
                                                {selectedSlot ||
                                                    "Not selected"}
                                            </span>
                                        </div>


                                        <div
                                            className={
                                                doctorDetailStyles.summaryRow
                                            }
                                        >
                                            <span
                                                className={
                                                    doctorDetailStyles.summaryLabel
                                                }
                                            >
                                                Consultation Fee:
                                            </span>

                                            <span
                                                className={
                                                    doctorDetailStyles.feeDisplay
                                                }
                                            >
                                                ₹{fee}
                                            </span>
                                        </div>
                                    </div>


                                    {/* PAYMENT */}

                                    <div
                                        className={
                                            doctorDetailStyles.paymentContainer
                                        }
                                    >
                                        <label
                                            className={
                                                doctorDetailStyles.paymentLabel
                                            }
                                        >
                                            Payment:
                                        </label>

                                        <div
                                            className={
                                                doctorDetailStyles.paymentOptions
                                            }
                                        >
                                            <label
                                                className={`${doctorDetailStyles.paymentOption} ${
                                                    paymentMethod ===
                                                    "Cash"
                                                        ? doctorDetailStyles.paymentOptionSelected
                                                        : doctorDetailStyles.paymentOptionUnselected
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="Cash"
                                                    checked={
                                                        paymentMethod ===
                                                        "Cash"
                                                    }
                                                    onChange={() =>
                                                        setPaymentMethod(
                                                            "Cash"
                                                        )
                                                    }
                                                    className={
                                                        doctorDetailStyles.paymentRadio
                                                    }
                                                />

                                                Cash
                                            </label>


                                            <label
                                                className={`${doctorDetailStyles.paymentOption} ${
                                                    paymentMethod ===
                                                    "Online"
                                                        ? doctorDetailStyles.paymentOptionSelected
                                                        : doctorDetailStyles.paymentOptionUnselected
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment"
                                                    value="Online"
                                                    checked={
                                                        paymentMethod ===
                                                        "Online"
                                                    }
                                                    onChange={() =>
                                                        setPaymentMethod(
                                                            "Online"
                                                        )
                                                    }
                                                    className={
                                                        doctorDetailStyles.paymentRadio
                                                    }
                                                />

                                                Online
                                            </label>
                                        </div>
                                    </div>


                                    {/* BOOK */}

                                    <button
                                        type="button"
                                        onClick={
                                            handleBooking
                                        }
                                        disabled={
                                            !selectedDate ||
                                            !selectedSlot ||
                                            isSubmitting
                                        }
                                        className={`${doctorDetailStyles.bookingButton} ${
                                            !selectedDate ||
                                            !selectedSlot ||
                                            isSubmitting
                                                ? doctorDetailStyles.bookingButtonDisabled
                                                : doctorDetailStyles.bookingButtonEnabled
                                        }`}
                                    >
                                        <div
                                            className={
                                                doctorDetailStyles.bookingButtonContent
                                            }
                                        >
                                            <Phone
                                                className={
                                                    doctorDetailStyles.bookingIcon
                                                }
                                            />

                                            <span>
                                                {isSubmitting
                                                    ? "Booking..."
                                                    : "Confirm Booking"}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}