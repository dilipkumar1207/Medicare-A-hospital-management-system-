import React, { useMemo, useState } from 'react'
import { dashboardStyles as ds } from '../assets/dummyStyles'
import { useAdminData } from '../context/AdminDataContext'
import {
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  RupeeIcon,
} from '../components/Icons'

const PAGE_SIZE = 5

const FALLBACK_DOCTOR_IMAGE =
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"

function Dashboard() {
  const { doctors, appointments } = useAdminData()

  const [search, setSearch] = useState("")
  const [visible, setVisible] = useState(PAGE_SIZE)

  // ==========================================
  // TOTAL DASHBOARD STATISTICS
  // ==========================================
  const stats = useMemo(() => {
    const totalAppointments = appointments.length

    const completed = appointments.filter(
      (a) => a.status === "Completed"
    ).length

    const canceled = appointments.filter(
      (a) =>
        a.status === "Canceled" ||
        a.status === "Cancelled"
    ).length

    const earnings = appointments
      .filter(
        (a) => a.status === "Completed"
      )
      .reduce((sum, a) => {
        const fee =
          Number(a.fee) ||
          Number(a.fees) ||
          0

        return sum + fee
      }, 0)

    return [
      {
        label: "Total Doctors",
        value: doctors.length,
        icon: UsersIcon,
      },
      {
        label: "Total Appointments",
        value: totalAppointments,
        icon: CalendarIcon,
      },
      {
        label: "Completed",
        value: completed,
        icon: CheckCircleIcon,
      },
      {
        label: "Canceled",
        value: canceled,
        icon: XCircleIcon,
      },
      {
        label: "Total Earnings",
        value: `₹${earnings}`,
        icon: RupeeIcon,
      },
    ]
  }, [doctors, appointments])

  // ==========================================
  // SEARCH DOCTORS
  // ==========================================
  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) {
      return doctors
    }

    return doctors.filter((d) => {
      const name =
        (d.name || "").toLowerCase()

      const specialization =
        (d.specialization || "").toLowerCase()

      return (
        name.includes(q) ||
        specialization.includes(q)
      )
    })
  }, [doctors, search])

  // ==========================================
  // CREATE DOCTOR ROW
  // ==========================================
  const doctorRow = (doc) => {

    // MongoDB doctor ID
    const doctorId =
      doc._id || doc.id

    // Find this doctor's appointments
    const docAppointments =
      appointments.filter((a) => {

        const appointmentDoctorId =
          a.doctorId ||
          a.doctor ||
          a.doctor?._id

        return (
          String(appointmentDoctorId) ===
          String(doctorId)
        )
      })

    // Completed
    const completed =
      docAppointments.filter(
        (a) => a.status === "Completed"
      ).length

    // Canceled
    const canceled =
      docAppointments.filter(
        (a) =>
          a.status === "Canceled" ||
          a.status === "Cancelled"
      ).length

    // Earnings
    const earnings =
      docAppointments
        .filter(
          (a) => a.status === "Completed"
        )
        .reduce((sum, a) => {

          const fee =
            Number(a.fee) ||
            Number(a.fees) ||
            Number(doc.fee) ||
            0

          return sum + fee

        }, 0)

    return {
      ...doc,

      doctorId,

      apptCount:
        docAppointments.length,

      completed,

      canceled,

      earnings,
    }
  }

  const rows = filteredDoctors
    .map(doctorRow)
    .slice(0, visible)

  return (
    <div className={ds.pageContainer}>
      <div className={ds.maxWidthContainer}>

        {/* ==========================================
            HEADER
        ========================================== */}
        <div className={ds.headerContainer}>
          <div>
            <h1 className={ds.headerTitle}>
              Dashboard
            </h1>

            <p className={ds.headerSubtitle}>
              Overview of hospital operations
            </p>
          </div>
        </div>

        {/* ==========================================
            STAT CARDS
        ========================================== */}
        <div className={ds.statsGrid}>

          {stats.map(
            ({
              label,
              value,
              icon: Icon,
            }) => (
              <div
                key={label}
                className={ds.statCard}
              >
                <div
                  className={ds.statCardContent}
                >
                  <div
                    className={
                      ds.statIconContainer
                    }
                  >
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>

                  <div>
                    <div
                      className={ds.statLabel}
                    >
                      {label}
                    </div>

                    <div
                      className={ds.statValue}
                    >
                      {value}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

        </div>

        {/* ==========================================
            SEARCH
        ========================================== */}
        <label className={ds.searchLabel}>
          Search Doctors
        </label>

        <div className={ds.searchContainer}>

          <div
            className={
              ds.searchInputContainer
            }
          >
            <SearchIcon
              className={ds.searchIcon}
            />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setVisible(PAGE_SIZE)
              }}
              placeholder="Search by name or specialization..."
              className={ds.searchInput}
            />
          </div>

          {search && (
            <button
              type="button"
              className={ds.clearButton}
              onClick={() => {
                setSearch("")
                setVisible(PAGE_SIZE)
              }}
            >
              Clear
            </button>
          )}

        </div>

        {/* ==========================================
            TABLE
        ========================================== */}
        <div
          className={`${ds.tableContainer} mt-6`}
        >

          <div className={ds.tableHeader}>

            <div className={ds.tableTitle}>
              Doctors Overview
            </div>

            <div className={ds.tableCount}>
              {filteredDoctors.length} doctors
            </div>

          </div>

          <div className={ds.tableWrapper}>

            <table className={ds.table}>

              <thead className={ds.tableHead}>
                <tr>

                  <th
                    className={
                      ds.tableHeaderCell
                    }
                  >
                    Doctor
                  </th>

                  <th
                    className={
                      ds.tableHeaderCell
                    }
                  >
                    Specialization
                  </th>

                  <th
                    className={`${ds.tableHeaderCell} text-right`}
                  >
                    Fee
                  </th>

                  <th
                    className={`${ds.tableHeaderCell} text-center`}
                  >
                    Appointments
                  </th>

                  <th
                    className={`${ds.tableHeaderCell} text-center`}
                  >
                    Completed
                  </th>

                  <th
                    className={`${ds.tableHeaderCell} text-center`}
                  >
                    Canceled
                  </th>

                  <th
                    className={`${ds.tableHeaderCell} text-right`}
                  >
                    Earnings
                  </th>

                </tr>
              </thead>

              <tbody className={ds.tableBody}>

                {rows.map((doc, i) => (

                  <tr
                    key={
                      doc._id ||
                      doc.id
                    }
                    className={`${ds.tableRow} ${
                      i % 2 === 0
                        ? ds.tableRowEven
                        : ds.tableRowOdd
                    }`}
                  >

                    {/* ================= DOCTOR ================= */}
                    <td className={ds.tableCell}>

                      <div
                        className={
                          ds.tableCellFlex
                        }
                      >

                        <div
                          className={
                            ds.verticalLine
                          }
                        ></div>

                        {/* REAL CLOUDINARY IMAGE */}
                        <img
                          src={
                            doc.imageUrl ||
                            FALLBACK_DOCTOR_IMAGE
                          }
                          alt={doc.name}
                          className={
                            ds.doctorImage
                          }
                          onError={(e) => {
                            e.currentTarget.src =
                              FALLBACK_DOCTOR_IMAGE
                          }}
                        />

                        <div>

                          <div
                            className={
                              ds.doctorName
                            }
                          >
                            {doc.name}
                          </div>

                          {/* Show email instead of MongoDB ID */}
                          <div
                            className={
                              ds.doctorId
                            }
                          >
                            {doc.email || ""}
                          </div>

                        </div>

                      </div>

                    </td>

                    {/* ================= SPECIALIZATION ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={
                          ds.doctorSpecialization
                        }
                      >
                        {doc.specialization}
                      </span>

                    </td>

                    {/* ================= FEE ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={ds.feeText}
                      >
                        ₹{Number(doc.fee) || 0}
                      </span>

                    </td>

                    {/* ================= APPOINTMENTS ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={
                          ds.appointmentsText
                        }
                      >
                        {doc.apptCount}
                      </span>

                    </td>

                    {/* ================= COMPLETED ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={
                          ds.completedText
                        }
                      >
                        {doc.completed}
                      </span>

                    </td>

                    {/* ================= CANCELED ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={
                          ds.canceledText
                        }
                      >
                        {doc.canceled}
                      </span>

                    </td>

                    {/* ================= EARNINGS ================= */}
                    <td className={ds.tableCell}>

                      <span
                        className={
                          ds.earningsText
                        }
                      >
                        ₹{doc.earnings}
                      </span>

                    </td>

                  </tr>

                ))}

                {rows.length === 0 && (

                  <tr>

                    <td
                      colSpan={7}
                      className="text-center py-8 text-slate-500"
                    >
                      No doctors found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* ==========================================
              MOBILE VIEW
          ========================================== */}
          <div
            className={
              ds.mobileDoctorContainer
            }
          >

            <div
              className={
                ds.mobileDoctorGrid
              }
            >

              {rows.map((doc) => (

                <div
                  key={
                    doc._id ||
                    doc.id
                  }
                  className={
                    ds.mobileDoctorCard
                  }
                >

                  <div
                    className={
                      ds.mobileDoctorHeader
                    }
                  >

                    {/* MOBILE PHOTO */}
                    <img
                      src={
                        doc.imageUrl ||
                        FALLBACK_DOCTOR_IMAGE
                      }
                      alt={doc.name}
                      className={
                        ds.mobileDoctorImage
                      }
                      onError={(e) => {
                        e.currentTarget.src =
                          FALLBACK_DOCTOR_IMAGE
                      }}
                    />

                    <div className="flex-1 ml-3">

                      <div
                        className={
                          ds.mobileDoctorName
                        }
                      >
                        {doc.name}
                      </div>

                      <div
                        className={
                          ds.mobileDoctorSpecialization
                        }
                      >
                        {doc.specialization}
                      </div>

                    </div>

                    {/* MOBILE FEE */}
                    <div
                      className={
                        ds.mobileDoctorFee
                      }
                    >
                      ₹{Number(doc.fee) || 0}
                    </div>

                  </div>

                  <div
                    className={
                      ds.mobileStatsGrid
                    }
                  >

                    <div>
                      <div
                        className={
                          ds.mobileStatLabel
                        }
                      >
                        Appts
                      </div>

                      <div
                        className={
                          ds.mobileStatValue
                        }
                      >
                        {doc.apptCount}
                      </div>
                    </div>

                    <div>
                      <div
                        className={
                          ds.mobileStatLabel
                        }
                      >
                        Completed
                      </div>

                      <div
                        className={
                          ds.mobileStatValue
                        }
                      >
                        {doc.completed}
                      </div>
                    </div>

                    <div>
                      <div
                        className={
                          ds.mobileStatLabel
                        }
                      >
                        Canceled
                      </div>

                      <div
                        className={
                          ds.mobileStatValue
                        }
                      >
                        {doc.canceled}
                      </div>
                    </div>

                  </div>

                  <div
                    className={
                      ds.mobileEarningsContainer
                    }
                  >
                    <span>
                      Earnings
                    </span>

                    <span className="font-semibold">
                      ₹{doc.earnings}
                    </span>
                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* ==========================================
              SHOW MORE
          ========================================== */}
          {filteredDoctors.length >
            visible && (

            <div
              className={
                ds.showMoreContainer
              }
            >

              <button
                type="button"
                className={
                  ds.showMoreButton
                }
                onClick={() =>
                  setVisible(
                    (v) =>
                      v + PAGE_SIZE
                  )
                }
              >
                Show More
              </button>

            </div>

          )}

        </div>
      </div>
    </div>
  )
}

export default Dashboard