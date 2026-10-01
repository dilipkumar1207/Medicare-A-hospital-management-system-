import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  Bell,
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  Wallet,
  XCircle,
} from "lucide-react";

import { useAuth, useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

import {
  appointmentPageStyles,
  cardStyles,
  badgeStyles,
  iconSize,
} from "../assets/dummyStyles";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// =====================================================
// API DEBUG INTERCEPTORS
// =====================================================

api.interceptors.request.use(
  (config) => {
    console.log(
      "🚀 REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );

    return config;
  },
  (error) => {
    console.error("❌ REQUEST ERROR:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(
      "✅ RESPONSE:",
      response.status,
      `${response.config?.baseURL}${response.config?.url}`
    );

    console.log(
      "📦 RESPONSE DATA:",
      response.data
    );

    return response;
  },
  (error) => {
    console.error(
      "❌ API ERROR URL:",
      `${error.config?.baseURL || ""}${error.config?.url || ""}`
    );

    console.error(
      "❌ API ERROR STATUS:",
      error.response?.status
    );

    console.error(
      "❌ API ERROR DATA:",
      error.response?.data
    );

    return Promise.reject(error);
  }
);

// =====================================================
// HELPERS
// =====================================================

function pad(number) {
  return String(number ?? 0).padStart(2, "0");
}


// =====================================================
// DATE + TIME PARSER
// =====================================================

function parseDateTime(dateStr, timeStr) {
  if (!dateStr) {
    return new Date();
  }

  // Try normal JavaScript parsing
  if (timeStr) {
    const fastDate = new Date(
      `${dateStr} ${timeStr}`
    );

    if (!isNaN(fastDate.getTime())) {
      return fastDate;
    }
  }

  // Example:
  // 25 Sep 2026
  // 10:30 AM

  const parts = String(dateStr)
    .trim()
    .split(/\s+/);

  if (parts.length === 3) {
    const [
      day,
      monthName,
      year,
    ] = parts;

    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    const month = months[monthName];

    if (month !== undefined) {
      let hours = 0;
      let minutes = 0;

      if (timeStr) {
        const timeParts = String(timeStr)
          .trim()
          .split(/\s+/);

        const time =
          timeParts[0] || "0:00";

        const ampm =
          (timeParts[1] || "")
            .toUpperCase();

        let [
          hh,
          mm,
        ] = time.split(":");

        hours = Number(hh || 0);
        minutes = Number(mm || 0);

        if (
          ampm === "PM" &&
          hours !== 12
        ) {
          hours += 12;
        }

        if (
          ampm === "AM" &&
          hours === 12
        ) {
          hours = 0;
        }
      }

      const parsed = new Date(
        Number(year),
        month,
        Number(day),
        hours,
        minutes
      );

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  const fallback = new Date(dateStr);

  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return new Date();
}


// =====================================================
// STATUS
// =====================================================

function computeStatus(item) {
  if (!item) {
    return "Pending";
  }

  const now = new Date();

  if (
    item.status === "Canceled" ||
    item.status === "Cancelled"
  ) {
    return "Canceled";
  }

  if (item.status === "Rescheduled") {
    if (
      item.rescheduledTo?.date &&
      item.rescheduledTo?.time
    ) {
      const rescheduledDate =
        parseDateTime(
          item.rescheduledTo.date,
          item.rescheduledTo.time
        );

      if (now >= rescheduledDate) {
        return "Completed";
      }
    }

    return "Rescheduled";
  }

  if (item.status === "Completed") {
    return "Completed";
  }

  if (item.status === "Confirmed") {
    const appointmentDate =
      parseDateTime(
        item.date,
        item.time
      );

    if (now >= appointmentDate) {
      return "Completed";
    }

    return "Confirmed";
  }

  if (item.status === "Pending") {
    const appointmentDate =
      parseDateTime(
        item.date,
        item.time
      );

    if (now >= appointmentDate) {
      return "Completed";
    }

    return "Pending";
  }

  const appointmentDate =
    parseDateTime(
      item.date,
      item.time
    );

  if (now >= appointmentDate) {
    return "Completed";
  }

  return item.confirmed
    ? "Confirmed"
    : "Pending";
}


// =====================================================
// RESPONSE HELPER
// =====================================================

function extractArray(response) {
  const data = response?.data;

  // Direct array
  if (Array.isArray(data)) {
    return data;
  }

  // Doctor appointment response
  if (
    Array.isArray(
      data?.appointments
    )
  ) {
    return data.appointments;
  }

  // Service appointment response
  if (
    Array.isArray(data?.data)
  ) {
    return data.data;
  }

  return [];
}


// =====================================================
// PAYMENT BADGE
// =====================================================

const PaymentBadge = ({
  payment,
}) => {
  if (payment === "Online") {
    return (
      <span
        className={
          badgeStyles
            .paymentBadge
            .online
        }
      >
        <CreditCard
          className={
            iconSize.small
          }
        />
        Online
      </span>
    );
  }

  return (
    <span
      className={
        badgeStyles
          .paymentBadge
          .cash
      }
    >
      <Wallet
        className={
          iconSize.small
        }
      />
      Cash
    </span>
  );
};


// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  itemStatus,
}) => {
  switch (itemStatus) {
    case "Completed":
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .completed
          }
        >
          <CheckCircle
            className={
              iconSize.small
            }
          />
          Completed
        </span>
      );

    case "Confirmed":
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .confirmed
          }
        >
          <Bell
            className={
              iconSize.small
            }
          />
          Confirmed
        </span>
      );

    case "Pending":
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .pending
          }
        >
          <Clock
            className={
              iconSize.small
            }
          />
          Pending
        </span>
      );

    case "Canceled":
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .canceled
          }
        >
          <XCircle
            className={
              iconSize.small
            }
          />
          Canceled
        </span>
      );

    case "Rescheduled":
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .default
          }
        >
          <CalendarDays
            className={
              iconSize.small
            }
          />
          Rescheduled
        </span>
      );

    default:
      return (
        <span
          className={
            badgeStyles
              .statusBadge
              .default
          }
        >
          <CalendarDays
            className={
              iconSize.small
            }
          />
          Pending
        </span>
      );
  }
};


// =====================================================
// MAIN COMPONENT
// =====================================================

function AppointmentPage() {
   console.log("🔥 APPOINTMENT PAGE IS RUNNING");
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const { user } = useUser();

  const [
    loadingDoctors,
    setLoadingDoctors,
  ] = useState(true);

  const [
    loadingServices,
    setLoadingServices,
  ] = useState(true);

  const [
    doctorAppts,
    setDoctorAppts,
  ] = useState([]);

  const [
    serviceAppts,
    setServiceAppts,
  ] = useState([]);

  const [
    error,
    setError,
  ] = useState("");


// =====================================================
// LOAD DOCTOR APPOINTMENTS
// =====================================================

  // =====================================================
// LOAD DOCTOR APPOINTMENTS
// =====================================================

const loadDoctorAppointments = useCallback(async () => {
  if (!isLoaded) {
    return;
  }

  if (!isSignedIn) {
    setDoctorAppts([]);
    setLoadingDoctors(false);
    return;
  }

  try {
    setLoadingDoctors(true);
    setError("");

    // Get fresh Clerk session token
    const token = await getToken();

    console.log("======================================");
    console.log("🔐 CLERK FRONTEND DEBUG");
    console.log("User ID:", user?.id);
    console.log("Signed In:", isSignedIn);
    console.log("Token exists:", !!token);
    console.log("======================================");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    // Decode token only for debugging
    try {
      const parts = token.split(".");

      if (parts.length === 3) {
        const payload = JSON.parse(
          atob(
            parts[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
          )
        );

        console.log("🔐 TOKEN INFO");
        console.log("Issuer:", payload.iss);
        console.log("Subject:", payload.sub);
        console.log("Session ID:", payload.sid);
        console.log(
          "Expires:",
          payload.exp
            ? new Date(
                payload.exp * 1000
              ).toLocaleString()
            : "Unknown"
        );

        console.log(
          "Subject matches Clerk User:",
          payload.sub === user?.id
        );
      }
    } catch (decodeError) {
      console.error(
        "❌ Could not decode Clerk token:",
        decodeError
      );
    }

    // Request appointments
    const response = await api.get(
      "/api/appointments/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "👨‍⚕️ Doctor response:",
      response.data
    );

    const appointments =
      extractArray(response);

    console.log(
      "👨‍⚕️ Doctor appointments:",
      appointments
    );

    const doctors =
      appointments.filter(
        (appointment) => {
          return (
            appointment.doctorId !==
              undefined &&
            appointment.doctorId !== null
          ) ||
          !!appointment.doctorName ||
          !appointment.serviceId;
        }
      );

    setDoctorAppts(doctors);

  } catch (error) {
    console.error(
      "❌ Doctor appointment error:",
      error?.response?.data || error
    );

    setDoctorAppts([]);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load doctor appointments.";

    setError(message);

  } finally {
    setLoadingDoctors(false);
  }
}, [
  isLoaded,
  isSignedIn,
  getToken,
  user,
]);


// =====================================================
// LOAD SERVICE APPOINTMENTS
// =====================================================

  const loadServiceAppointments =
    useCallback(async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setServiceAppts([]);
        setLoadingServices(false);
        return;
      }

      try {
        setLoadingServices(true);

        const token =
          await getToken();

        console.log(
          "🔐 Service token exists:",
          !!token
        );

        if (!token) {
          throw new Error(
            "Authentication token not found."
          );
        }

        const response =
          await api.get(
            "/api/service-appointments/me",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        console.log(
          "🛠️ Service response:",
          response.data
        );

        const appointments =
          extractArray(response);

        console.log(
          "🛠️ Service appointments:",
          appointments
        );

        setServiceAppts(
          appointments
        );
      } catch (error) {
        console.error(
          "❌ Service appointment error:",
          error?.response?.data ||
            error
        );

        setServiceAppts([]);

        const message =
          error?.response?.data
            ?.message ||
          error?.message ||
          "Failed to load service appointments.";

        setError(
          (previous) =>
            previous
              ? `${previous} | ${message}`
              : message
        );
      } finally {
        setLoadingServices(false);
      }
    }, [
      isLoaded,
      isSignedIn,
      getToken,
    ]);


// =====================================================
// LOAD WHEN PAGE OPENS
// =====================================================

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setLoadingDoctors(false);
      setLoadingServices(false);
      return;
    }

    loadDoctorAppointments();
    loadServiceAppointments();
  }, [
    isLoaded,
    isSignedIn,
    loadDoctorAppointments,
    loadServiceAppointments,
  ]);


// =====================================================
// RESCHEDULE
// =====================================================

  function normalizeRescheduled(
    value
  ) {
    if (!value) {
      return null;
    }

    if (
      value.date &&
      value.time
    ) {
      return {
        date: value.date,
        time: value.time,
      };
    }

    if (
      value.date &&
      (
        value.hour !==
          undefined ||
        value.minute !==
          undefined ||
        value.ampm
      )
    ) {
      const hour =
        value.hour ?? 0;

      const minute =
        value.minute ?? 0;

      const ampm =
        value.ampm ?? "";

      return {
        date: value.date,
        time:
          `${hour}:${pad(
            minute
          )} ${ampm}`.trim(),
      };
    }

    return {
      date:
        value.date ||
        value.dateString ||
        "",

      time:
        value.time ||
        value.timeString ||
        "",
    };
  }


// =====================================================
// FORMAT DOCTOR APPOINTMENTS
// =====================================================

  const appointmentData =
    useMemo(() => {
      return doctorAppts
        .map((appointment) => {
          const id =
            appointment._id ||
            appointment.id ||
            crypto.randomUUID();

          const doctorObject =
            typeof appointment.doctorId ===
              "object" &&
            appointment.doctorId
              ? appointment.doctorId
              : {};

          const image =
            doctorObject.imageUrl ||
            doctorObject.image ||
            doctorObject.avatar ||
            appointment.doctorImage?.url ||
            appointment.doctorImage ||
            "";

          const doctorName =
            (
              doctorObject.name &&
              String(
                doctorObject.name
              ).trim()
            ) ||
            (
              appointment.doctorName &&
              String(
                appointment.doctorName
              ).trim()
            ) ||
            (
              appointment.doctor &&
              String(
                appointment.doctor
              ).trim()
            ) ||
            "Doctor";

          const patientName =
            appointment.patientName ||
            appointment.patient ||
            "Patient";

          const specialization =
            doctorObject.specialization ||
            appointment.specialization ||
            appointment.speciality ||
            "";

          const experience =
            doctorObject.experience ||
            appointment.experience ||
            "";

          const date =
            appointment.date || "";

          let time =
            appointment.time || "";

          if (!time) {
            if (
              appointment.hour !==
                undefined &&
              appointment.minute !==
                undefined &&
              appointment.ampm
            ) {
              time =
                `${appointment.hour}:${pad(
                  appointment.minute
                )} ${appointment.ampm}`;
            } else if (
              appointment.hour !==
                undefined &&
              appointment.ampm
            ) {
              time =
                `${appointment.hour}:00 ${appointment.ampm}`;
            }
          }

          const payment =
            appointment.payment
              ?.method ||
            appointment.paymentMethod ||
            "Cash";

          const status =
            appointment.status ||
            (
              appointment.payment
                ?.status === "Paid"
                ? "Confirmed"
                : "Pending"
            );

          const rescheduledTo =
            normalizeRescheduled(
              appointment.rescheduledTo ||
              {
                date:
                  appointment.rescheduledDate,
                time:
                  appointment.rescheduledTime,
              }
            );

          return {
            id,
            image,
            doctor: doctorName,
            patientName,
            specialization,
            experience,
            date,
            time,
            payment,
            status,
            rescheduledTo,
          };
        })
        .map(
          (appointment) => ({
            ...appointment,
            status:
              computeStatus(
                appointment
              ),
          })
        );
    }, [doctorAppts]);


// =====================================================
// FORMAT SERVICE APPOINTMENTS
// =====================================================

  const serviceData =
    useMemo(() => {
      return serviceAppts
        .map((appointment) => {
          const id =
            appointment._id ||
            appointment.id ||
            crypto.randomUUID();

          const serviceObject =
            typeof appointment.serviceId ===
              "object" &&
            appointment.serviceId
              ? appointment.serviceId
              : {};

          const image =
            serviceObject.imageUrl ||
            serviceObject.image ||
            serviceObject.imageSmall ||
            appointment.serviceImage?.url ||
            appointment.serviceImage ||
            "";

          const name =
            appointment.serviceName ||
            serviceObject.name ||
            serviceObject.title ||
            "Service";

          const patientName =
            appointment.patientName ||
            appointment.patient ||
            "Patient";

          const price =
            appointment.fees ??
            appointment.amount ??
            appointment.price ??
            0;

          const date =
            appointment.date || "";

          let time =
            appointment.time || "";

          if (!time) {
            if (
              appointment.hour !==
                undefined &&
              appointment.minute !==
                undefined &&
              appointment.ampm
            ) {
              time =
                `${appointment.hour}:${pad(
                  appointment.minute
                )} ${appointment.ampm}`;
            } else if (
              appointment.hour !==
                undefined &&
              appointment.ampm
            ) {
              time =
                `${appointment.hour}:00 ${appointment.ampm}`;
            }
          }

          const payment =
            appointment.payment
              ?.method ||
            appointment.paymentMethod ||
            "Cash";

          const status =
            appointment.status ||
            (
              appointment.payment
                ?.status === "Paid"
                ? "Confirmed"
                : "Pending"
            );

          const rescheduledTo =
            normalizeRescheduled(
              appointment.rescheduledTo
            );

          return {
            id,
            image,
            name,
            patientName,
            price,
            date,
            time,
            payment,
            status,
            rescheduledTo,
          };
        })
        .map(
          (appointment) => ({
            ...appointment,
            status:
              computeStatus(
                appointment
              ),
          })
        );
    }, [serviceAppts]);


// =====================================================
// NOT LOGGED IN
// =====================================================

  if (
    isLoaded &&
    !isSignedIn
  ) {
    return (
      <div
        className={
          appointmentPageStyles
            .pageContainer
        }
      >
        <div
          className={
            appointmentPageStyles
              .maxWidthContainer
          }
        >
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-800">
              Please login to view
              your appointments.
            </h2>
          </div>
        </div>
      </div>
    );
  }


// =====================================================
// PAGE
// =====================================================

  return (
    <div
      className={
        appointmentPageStyles
          .pageContainer
      }
    >
      <Toaster position="top-right" />

      <div
        className={
          appointmentPageStyles
            .maxWidthContainer
        }
      >

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        )}


        {/* ==========================================
            DOCTOR APPOINTMENTS
        ========================================== */}

        <h1
          className={
            appointmentPageStyles
              .doctorTitle
          }
        >
          Your Doctor Appointments
        </h1>


        {loadingDoctors && (
          <div
            className={
              appointmentPageStyles
                .loadingText
            }
          >
            Loading doctor
            appointments...
          </div>
        )}


        {!loadingDoctors &&
          appointmentData.length === 0 && (
            <div
              className={
                appointmentPageStyles
                  .emptyStateText
              }
            >
              No doctor appointments
              found.
            </div>
          )}


        {!loadingDoctors &&
          appointmentData.length > 0 && (
            <div
              className={
                appointmentPageStyles
                  .doctorGrid
              }
            >
              {appointmentData.map(
                (item) => (
                  <div
                    key={item.id}
                    className={
                      cardStyles
                        .doctorCard
                    }
                  >

                    {/* IMAGE */}

                    <div
                      className={
                        cardStyles
                          .doctorImageContainer
                      }
                    >
                      <img
                        src={
                          item.image ||
                          "/placeholder-doctor.png"
                        }
                        alt={item.doctor}
                        className={
                          cardStyles.image
                        }
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/placeholder-doctor.png";
                        }}
                      />
                    </div>


                    {/* NAME */}

                    <h2
                      className={
                        cardStyles
                          .doctorName
                      }
                    >
                      {item.doctor}
                    </h2>


                    {/* SPECIALIZATION */}

                    <div
                      className={
                        cardStyles
                          .specialization
                      }
                    >
                      {item.specialization}

                      {item.experience
                        ? ` • ${item.experience}`
                        : ""}
                    </div>


                    {/* DATE */}

                    <p
                      className={
                        cardStyles
                          .dateContainer
                      }
                    >
                      <CalendarDays
                        className={
                          iconSize.medium
                        }
                      />

                      {item.date ||
                        "Date not available"}
                    </p>


                    {/* TIME */}

                    <p
                      className={
                        cardStyles
                          .timeContainer
                      }
                    >
                      <Clock
                        className={
                          iconSize.medium
                        }
                      />

                      {item.time ||
                        "Time not available"}
                    </p>


                    {/* PAYMENT + STATUS */}

                    <div
                      className={
                        cardStyles
                          .badgesContainer
                      }
                    >
                      <PaymentBadge
                        payment={
                          item.payment
                        }
                      />

                      <StatusBadge
                        itemStatus={
                          item.status
                        }
                      />
                    </div>


                    {/* RESCHEDULE */}

                    {item.status ===
                      "Rescheduled" &&
                      item.rescheduledTo && (
                        <div
                          className={
                            cardStyles
                              .rescheduledText
                          }
                        >
                          Rescheduled to{" "}

                          <span
                            className={
                              cardStyles
                                .rescheduledSpan
                            }
                          >
                            {
                              item
                                .rescheduledTo
                                .date
                            }

                            {" : "}

                            {
                              item
                                .rescheduledTo
                                .time
                            }
                          </span>
                        </div>
                      )}

                  </div>
                )
              )}
            </div>
          )}


        {/* ==========================================
            SERVICE APPOINTMENTS
        ========================================== */}

        <h2
          className={
            appointmentPageStyles
              .serviceTitle
          }
        >
          Your Booked Services
        </h2>


        {loadingServices && (
          <div
            className={
              appointmentPageStyles
                .serviceLoadingText
            }
          >
            Loading service
            bookings...
          </div>
        )}


        {!loadingServices &&
          serviceData.length === 0 && (
            <div
              className={
                appointmentPageStyles
                  .serviceEmptyStateText
              }
            >
              No service bookings
              found.
            </div>
          )}


        {!loadingServices &&
          serviceData.length > 0 && (
            <div
              className={
                appointmentPageStyles
                  .serviceGrid
              }
            >
              {serviceData.map(
                (service) => (
                  <div
                    key={service.id}
                    className={
                      cardStyles
                        .serviceCard
                    }
                  >

                    {/* IMAGE */}

                    <div
                      className={
                        cardStyles
                          .serviceImageContainer
                      }
                    >
                      <img
                        src={
                          service.image ||
                          "/placeholder-service.png"
                        }
                        alt={service.name}
                        className={
                          cardStyles.image
                        }
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/placeholder-service.png";
                        }}
                      />
                    </div>


                    {/* NAME */}

                    <h3
                      className={
                        cardStyles
                          .serviceName
                      }
                    >
                      {service.name}
                    </h3>


                    {/* PRICE */}

                    <p
                      className={
                        cardStyles.price
                      }
                    >
                      ₹{service.price}
                    </p>


                    {/* DATE */}

                    <p
                      className={
                        cardStyles
                          .serviceDateContainer
                      }
                    >
                      <CalendarDays
                        className={
                          iconSize.medium
                        }
                      />

                      {service.date ||
                        "Date not available"}
                    </p>


                    {/* TIME */}

                    <p
                      className={
                        cardStyles
                          .serviceTimeContainer
                      }
                    >
                      <Clock
                        className={
                          iconSize.medium
                        }
                      />

                      {service.time ||
                        "Time not available"}
                    </p>


                    {/* PAYMENT + STATUS */}

                    <div
                      className={
                        cardStyles
                          .badgesContainer
                      }
                    >
                      <PaymentBadge
                        payment={
                          service.payment
                        }
                      />

                      <StatusBadge
                        itemStatus={
                          service.status
                        }
                      />
                    </div>


                    {/* RESCHEDULE */}

                    {service.status ===
                      "Rescheduled" &&
                      service.rescheduledTo && (
                        <div
                          className={
                            cardStyles
                              .serviceRescheduledText
                          }
                        >
                          Rescheduled to{" "}

                          <span
                            className={
                              cardStyles
                                .rescheduledSpan
                            }
                          >
                            {
                              service
                                .rescheduledTo
                                .date
                            }

                            {" : "}

                            {
                              service
                                .rescheduledTo
                                .time
                            }
                          </span>
                        </div>
                      )}

                  </div>
                )
              )}
            </div>
          )}

      </div>
    </div>
  );
}

export default AppointmentPage;