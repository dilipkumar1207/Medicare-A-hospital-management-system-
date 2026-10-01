import React, { useMemo, useState } from "react";
import {
  serviceAppointmentsStyles as sa,
} from "../assets/dummyStyles";
import { useAdminData } from "../context/AdminDataContext";
import Toast from "../components/Toast";
import {
  SearchIcon,
  XIcon,
  RefreshIcon,
  ClockIcon,
  RupeeIcon,
  UsersIcon,
  CalendarIcon,
} from "../components/Icons";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Confirmed",
  "Completed",
  "Rescheduled",
  "Canceled",
];

function ServiceAppointments() {
  const {
    serviceAppointments = [],
    updateServiceAppointmentStatus,
  } = useAdminData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [toast, setToast] = useState(null);

  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "🔥 SERVICE APPOINTMENTS IN PAGE:",
    serviceAppointments
  );

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const getAppointmentTime = (appointment) => {
    // If backend already gives time
    if (appointment.time) {
      return appointment.time;
    }

    // Backend stores hour, minute and ampm separately
    if (
      appointment.hour !== undefined &&
      appointment.minute !== undefined
    ) {
      return `${appointment.hour}:${String(
        appointment.minute
      ).padStart(2, "0")} ${
        appointment.ampm || ""
      }`.trim();
    }

    return "Time not available";
  };

  // =====================================================
  // PATIENT DETAILS
  // =====================================================

  const getPatientDetails = (appointment) => {
    const details = [];

    if (appointment.mobile) {
      details.push(`Mobile: ${appointment.mobile}`);
    }

    if (appointment.age !== undefined) {
      details.push(`Age: ${appointment.age}`);
    }

    if (appointment.gender) {
      details.push(`Gender: ${appointment.gender}`);
    }

    return details.length > 0
      ? details.join(" • ")
      : "Patient details not available";
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return serviceAppointments.filter(
      (appointment) => {
        const patientName =
          String(
            appointment.patientName || ""
          ).toLowerCase();

        const serviceName =
          String(
            appointment.serviceName || ""
          ).toLowerCase();

        const matchesSearch =
          !q ||
          patientName.includes(q) ||
          serviceName.includes(q);

        const matchesStatus =
          status === "All" ||
          appointment.status === status;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    serviceAppointments,
    search,
    status,
  ]);

  // =====================================================
  // TERMINAL STATUS
  // =====================================================

  const isTerminal = (currentStatus) => {
    return (
      currentStatus === "Completed" ||
      currentStatus === "Canceled"
    );
  };

  // =====================================================
  // CANCEL BOOKING
  // =====================================================

  const handleCancel = async (appointment) => {
    const appointmentId =
      appointment._id ||
      appointment.id;

    if (!appointmentId) {
      setToast({
        type: "error",
        message:
          "Booking ID is missing.",
      });

      return;
    }

    if (
      !updateServiceAppointmentStatus
    ) {
      setToast({
        type: "error",
        message:
          "Cancel API is not connected yet.",
      });

      console.warn(
        "updateServiceAppointmentStatus is not available in AdminDataContext."
      );

      return;
    }

    try {
      const result =
        await updateServiceAppointmentStatus(
          appointmentId,
          "Canceled"
        );

      if (result?.success === false) {
        setToast({
          type: "error",
          message:
            result.message ||
            "Failed to cancel booking.",
        });

        return;
      }

      setToast({
        type: "success",
        message: `Booking for ${
          appointment.patientName ||
          "patient"
        } canceled.`,
      });
    } catch (error) {
      console.error(
        "Cancel service appointment error:",
        error
      );

      setToast({
        type: "error",
        message:
          "Failed to cancel booking.",
      });
    }
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={sa.container}>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className={sa.headerContainer}>
        <div
          className={
            sa.headerTitleContainer
          }
        >
          <h1
            className={sa.headerTitle}
          >
            Service Appointments
          </h1>

          <p
            className={
              sa.headerSubtitle
            }
          >
            {filtered.length} of{" "}
            {serviceAppointments.length}{" "}
            bookings
          </p>
        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className={
            sa.searchContainer
          }
        >
          <div
            className={
              sa.searchInputWrapper
            }
          >
            <label
              className={sa.searchLabel}
            >
              <span
                className={
                  sa.searchIconContainer
                }
              >
                <SearchIcon
                  className={
                    sa.searchIcon
                  }
                />
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search patient or service..."
                className={
                  sa.searchInput
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className={
                    sa.clearSearchButton
                  }
                >
                  <XIcon
                    className={
                      sa.clearSearchIcon
                    }
                  />
                </button>
              )}
            </label>

            {/* STATUS FILTER */}

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
              className={
                sa.statusFilterSelect
              }
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SEARCH INFO */}

          <div
            className={sa.searchInfo}
          >
            <span>
              Showing{" "}
              {filtered.length}{" "}
              results
            </span>

            <button
              type="button"
              className={
                sa.refreshButton
              }
              onClick={
                resetFilters
              }
            >
              <RefreshIcon className="w-3 h-3 inline mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          BOOKINGS
      ================================================= */}

      {filtered.length === 0 ? (
        <div
          className={
            sa.noResultsContainer
          }
        >
          <div
            className={
              sa.noResultsIcon
            }
          >
            ·
          </div>

          <p
            className={
              sa.noResultsText
            }
          >
            {serviceAppointments.length ===
            0
              ? "No service bookings found"
              : "No bookings match your filters."}
          </p>

          <p
            className={
              sa.noResultsSubtext
            }
          >
            {serviceAppointments.length ===
            0
              ? "Bookings will appear here after a patient books a service."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div
          className={
            sa.gridContainer
          }
        >
          {filtered.map(
            (appointment, index) => {
              const appointmentId =
                appointment._id ||
                appointment.id ||
                `appointment-${index}`;

              const currentStatus =
                appointment.status ||
                "Pending";

              const terminal =
                isTerminal(
                  currentStatus
                );

              const appointmentTime =
                getAppointmentTime(
                  appointment
                );

              const patientDetails =
                getPatientDetails(
                  appointment
                );

              return (
                <div
                  key={appointmentId}
                  className={sa.article}
                >
                  <div
                    className={
                      sa.cardInner
                    }
                  >
                    {/* =====================================
                        CARD HEADER
                    ===================================== */}

                    <div
                      className={
                        sa.cardHeader
                      }
                    >
                      {/* PATIENT */}

                      <div
                        className={
                          sa.patientInfoContainer
                        }
                      >
                        <div
                          className={
                            sa.patientAvatar
                          }
                        >
                          <UsersIcon
                            className={
                              sa.patientAvatarIcon
                            }
                          />
                        </div>

                        <div
                          className={
                            sa.patientInfo
                          }
                        >
                          <div
                            className={
                              sa.patientName
                            }
                          >
                            {appointment.patientName ||
                              "Unknown Patient"}
                          </div>

                          <div
                            className={
                              sa.patientDetails
                            }
                          >
                            {patientDetails}
                          </div>
                        </div>
                      </div>

                      {/* STATUS */}

                      <div
                        className={
                          sa.statusContainer
                        }
                      >
                        <span
                          className={sa.statusBadge(
                            currentStatus
                          )}
                        >
                          {currentStatus}
                        </span>
                      </div>
                    </div>

                    {/* =====================================
                        DETAILS
                    ===================================== */}

                    <div
                      className={
                        sa.detailsContainer
                      }
                    >
                      {/* DATE */}

                      <div
                        className={
                          sa.detailItem
                        }
                      >
                        <CalendarIcon
                          className={
                            sa.detailIcon
                          }
                        />

                        <span
                          className={
                            sa.detailText
                          }
                        >
                          {appointment.date ||
                            "Date not available"}
                        </span>
                      </div>

                      {/* TIME */}

                      <div
                        className={
                          sa.detailItem
                        }
                      >
                        <ClockIcon
                          className={
                            sa.detailIcon
                          }
                        />

                        <span
                          className={
                            sa.detailText
                          }
                        >
                          {appointmentTime}
                        </span>
                      </div>

                      {/* FEES */}

                      <div
                        className={
                          sa.detailItem
                        }
                      >
                        <RupeeIcon
                          className={
                            sa.detailIcon
                          }
                        />

                        <span
                          className={
                            sa.feesText
                          }
                        >
                          ₹
                          {appointment.fees ??
                            appointment.amount ??
                            appointment.price ??
                            0}
                        </span>
                      </div>

                      {/* SERVICE */}

                      <div
                        className={
                          sa.serviceText
                        }
                      >
                        Service:{" "}
                        <span
                          className={
                            sa.serviceName
                          }
                        >
                          {appointment.serviceName ||
                            "Service"}
                        </span>
                      </div>
                    </div>

                    {/* =====================================
                        NOTES
                    ===================================== */}

                    {appointment.notes && (
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>
                          Notes:
                        </strong>{" "}
                        {appointment.notes}
                      </div>
                    )}

                    {/* =====================================
                        ACTIONS
                    ===================================== */}

                    <div
                      className={
                        sa.actionsContainer
                      }
                    >
                      <div
                        className={
                          sa.actionsInnerContainer
                        }
                      >
                        <button
                          type="button"
                          disabled={
                            terminal ||
                            !updateServiceAppointmentStatus
                          }
                          onClick={() =>
                            handleCancel(
                              appointment
                            )
                          }
                          className={sa.cancelButton(
                            terminal
                          )}
                        >
                          {currentStatus ===
                          "Canceled"
                            ? "Canceled"
                            : "Cancel Booking"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* =================================================
          STATUS LEGEND
      ================================================= */}

      <div
        className={
          sa.legendContainer
        }
      >
        <div
          className={sa.legendItem}
        >
          <span
            className={`${sa.legendDot} bg-yellow-400`}
          ></span>
          Pending
        </div>

        <div
          className={sa.legendItem}
        >
          <span
            className={`${sa.legendDot} bg-blue-400`}
          ></span>
          Confirmed
        </div>

        <div
          className={sa.legendItem}
        >
          <span
            className={`${sa.legendDot} bg-sky-400`}
          ></span>
          Completed
        </div>

        <div
          className={sa.legendItem}
        >
          <span
            className={`${sa.legendDot} bg-indigo-400`}
          ></span>
          Rescheduled
        </div>

        <div
          className={sa.legendItem}
        >
          <span
            className={`${sa.legendDot} bg-red-400`}
          ></span>
          Canceled
        </div>
      </div>

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </div>
  );
}

export default ServiceAppointments;