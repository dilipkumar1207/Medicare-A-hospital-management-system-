import React, { useMemo, useState } from "react";
import {
  pageStyles as ps,
  statusClasses,
} from "../assets/dummyStyles";
import { useAdminData } from "../context/AdminDataContext";
import Toast from "../components/Toast";
import {
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  RupeeIcon,
  XCircleIcon,
} from "../components/Icons";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Confirmed",
  "Completed",
  "Rescheduled",
  "Canceled",
];

function Appointments() {
  const {
    appointments = [],
    updateAppointmentStatus,
  } = useAdminData();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [status, setStatus] = useState("All");
  const [visible, setVisible] =
    useState(PAGE_SIZE);
  const [toast, setToast] = useState(null);

  // =====================================================
  // DEBUG
  // =====================================================

  console.log(
    "🔥 DOCTOR APPOINTMENTS IN PAGE:",
    appointments
  );

  // =====================================================
  // RESET VISIBLE COUNT WHEN FILTER CHANGES
  // =====================================================

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setVisible(PAGE_SIZE);
  };

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
    setVisible(PAGE_SIZE);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setVisible(PAGE_SIZE);
  };

  // =====================================================
  // FILTER APPOINTMENTS
  // =====================================================

  const filtered = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    return appointments.filter(
      (appointment) => {
        const patientName =
          String(
            appointment.patientName || ""
          ).toLowerCase();

        const doctorName =
          String(
            appointment.doctorName || ""
          ).toLowerCase();

        const appointmentDate =
          String(
            appointment.date || ""
          );

        const appointmentStatus =
          appointment.status ||
          "Pending";

        const matchesSearch =
          !q ||
          patientName.includes(q) ||
          doctorName.includes(q);

        const matchesDate =
          !dateFilter ||
          appointmentDate === dateFilter;

        const matchesStatus =
          status === "All" ||
          appointmentStatus === status;

        return (
          matchesSearch &&
          matchesDate &&
          matchesStatus
        );
      }
    );
  }, [
    appointments,
    search,
    dateFilter,
    status,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setStatus("All");
    setVisible(PAGE_SIZE);
  };

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
  // CANCEL APPOINTMENT
  // =====================================================

  const handleCancel = async (appointment) => {
    const appointmentId =
      appointment._id ||
      appointment.id;

    if (!appointmentId) {
      setToast({
        type: "error",
        message:
          "Appointment ID is missing.",
      });

      return;
    }

    if (!updateAppointmentStatus) {
      setToast({
        type: "error",
        message:
          "Appointment update function is not connected.",
      });

      console.warn(
        "updateAppointmentStatus is missing from AdminDataContext."
      );

      return;
    }

    try {
      const result =
        await updateAppointmentStatus(
          appointmentId,
          "Canceled"
        );

      if (result?.success === false) {
        setToast({
          type: "error",
          message:
            result.message ||
            "Failed to cancel appointment.",
        });

        return;
      }

      setToast({
        type: "success",
        message: `Appointment for ${
          appointment.patientName ||
          "patient"
        } canceled.`,
      });
    } catch (error) {
      console.error(
        "Cancel appointment error:",
        error
      );

      setToast({
        type: "error",
        message:
          "Failed to cancel appointment.",
      });
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={ps.container}>
      <div
        className={
          ps.maxWidthContainer
        }
      >
        {/* ================================================
            HEADER
        ================================================ */}

        <div
          className={
            ps.headerContainer
          }
        >
          <div
            className={
              ps.headerTitleSection
            }
          >
            <h1
              className={
                ps.headerTitle
              }
            >
              Doctor Appointments
            </h1>

            <p
              className={
                ps.headerSubtitle
              }
            >
              {filtered.length} of{" "}
              {appointments.length}{" "}
              appointments
            </p>
          </div>

          <div
            className={
              ps.headerControlsSection
            }
          >
            <div
              className={
                ps.searchContainer
              }
            >
              <SearchIcon
                className={`w-4 h-4 ${ps.searchIcon}`}
              />

              <input
                type="text"
                value={search}
                onChange={
                  handleSearchChange
                }
                placeholder="Search patient or doctor..."
                className={
                  ps.searchInput
                }
              />
            </div>
          </div>
        </div>

        {/* ================================================
            FILTERS
        ================================================ */}

        <div
          className={`${ps.filterContainer} mb-6`}
        >
          {/* DATE */}

          <div
            className={ps.dateFilter}
          >
            <CalendarIcon
              className={`w-4 h-4 ${ps.dateFilterIcon}`}
            />

            <input
              type="date"
              value={dateFilter}
              onChange={
                handleDateChange
              }
              className={
                ps.dateInput
              }
            />
          </div>

          {/* STATUS */}

          <select
            value={status}
            onChange={
              handleStatusChange
            }
            className={
              ps.selectFilter
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

          {/* CLEAR */}

          <button
            type="button"
            onClick={
              clearFilters
            }
            className={
              ps.clearButton
            }
          >
            Clear Filters
          </button>
        </div>

        {/* ================================================
            NO RESULTS
        ================================================ */}

        {filtered.length === 0 ? (
          <div
            className={
              ps.noResultsContainer
            }
          >
            {appointments.length ===
            0
              ? "No doctor appointments found."
              : "No appointments match your filters."}
          </div>
        ) : (
          /* ================================================
             APPOINTMENT CARDS
          ================================================ */

          <div
            className={
              ps.gridContainer
            }
          >
            {filtered
              .slice(0, visible)
              .map(
                (
                  appointment,
                  index
                ) => {
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

                  const doctorName =
                    appointment.doctorName ||
                    "Doctor";

                  const specialization =
                    appointment.doctorSpeciality ||
                    appointment.specialization ||
                    "";

                  const date =
                    appointment.date ||
                    "Date not available";

                  const time =
                    appointment.time ||
                    `${appointment.hour || ""}:${String(
                      appointment.minute ??
                        ""
                    ).padStart(
                      2,
                      "0"
                    )} ${
                      appointment.ampm ||
                      ""
                    }`.trim() ||
                    "Time not available";

                  const fees =
                    appointment.fees ??
                    appointment.fee ??
                    appointment.amount ??
                    0;

                  return (
                    <div
                      key={
                        appointmentId
                      }
                      className={
                        ps.card
                      }
                    >
                      {/* CARD HEADER */}

                      <div
                        className={
                          ps.cardHeader
                        }
                      >
                        <h3
                          className={
                            ps.cardTitle
                          }
                        >
                          {appointment.patientName ||
                            "Unknown Patient"}
                        </h3>

                        <span
                          className={`${ps.statusBadge} ${statusClasses(
                            currentStatus
                          )}`}
                        >
                          {currentStatus}
                        </span>
                      </div>

                      {/* DOCTOR */}

                      <p
                        className={
                          ps.doctorInfo
                        }
                      >
                        <span
                          className={
                            ps.doctorSpeciality
                          }
                        >
                          {doctorName}
                        </span>

                        {specialization &&
                          ` · ${specialization}`}
                      </p>

                      {/* DATE + TIME */}

                      <div
                        className={
                          ps.slotContainer
                        }
                      >
                        <ClockIcon
                          className={`w-4 h-4 ${ps.slotIcon}`}
                        />

                        {date} · {time}
                      </div>

                      {/* FEES */}

                      <div
                        className={
                          ps.feeLabel
                        }
                      >
                        <span
                          className={
                            ps.feeAmount
                          }
                        >
                          <RupeeIcon className="w-4 h-4" />

                          {fees}
                        </span>
                      </div>

                      {/* CANCEL */}

                      <button
                        type="button"
                        disabled={
                          terminal ||
                          !updateAppointmentStatus
                        }
                        onClick={() =>
                          handleCancel(
                            appointment
                          )
                        }
                        className={ps.cancelButton(
                          terminal,
                          currentStatus ===
                            "Completed"
                        )}
                      >
                        <XCircleIcon className="w-4 h-4" />

                        {currentStatus ===
                        "Canceled"
                          ? "Canceled"
                          : "Cancel"}
                      </button>
                    </div>
                  );
                }
              )}
          </div>
        )}

        {/* ================================================
            SHOW MORE
        ================================================ */}

        {filtered.length >
          visible && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              className={
                ps.showMoreButton
              }
              onClick={() =>
                setVisible(
                  (value) =>
                    value +
                    PAGE_SIZE
                )
              }
            >
              Show More
            </button>
          </div>
        )}
      </div>

      {/* ================================================
          TOAST
      ================================================ */}

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

export default Appointments;