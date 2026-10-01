import React, { useMemo, useState } from 'react'
import { doctorListStyles as dl } from '../assets/dummyStyles'
import { useAdminData } from '../context/AdminDataContext'
import Toast from '../components/Toast'
import {
  SearchIcon,
  StarIcon,
  ChevronDownIcon,
  TrashIcon,
  UsersIcon,
  ClockIcon,
} from '../components/Icons'

function DoctorCard({ doc, onDelete }) {
  const [open, setOpen] = useState(false)

  // Backend uses "availability"
  const isAvailable = doc.availability === "Available"

  return (
    <article className={dl.article}>
      <div className={dl.articleContent}>

        {/* ================= PHOTO ================= */}
        <img
          src={
            doc.imageUrl ||
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"
          }
          alt={doc.name}
          className={dl.doctorImage}
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"
          }}
        />

        {/* ================= DOCTOR INFO ================= */}
        <div className={dl.doctorInfoContainer}>
          <div className={dl.doctorHeader}>

            <div>
              <h3 className={dl.doctorName}>
                {doc.name}
              </h3>

              {/* Availability */}
              <span
                className={dl.availabilityBadge(
                  isAvailable
                )}
              >
                <span
                  className={dl.availabilityDot(
                    isAvailable
                  )}
                ></span>

                {isAvailable
                  ? "Available"
                  : "Unavailable"}
              </span>
            </div>

            {/* Rating */}
            <div className={dl.ratingContainer}>
              <span className={dl.rating}>
                <StarIcon className="w-4 h-4 text-yellow-400" />

                {doc.rating || "New"}
              </span>

              <button
                type="button"
                className={dl.toggleButton(open)}
                onClick={() =>
                  setOpen((o) => !o)
                }
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Specialization + Degree */}
          <p className={dl.doctorDetails}>
            {doc.specialization} · {doc.degree}
          </p>

          {/* Experience */}
          <div className={dl.statsContainer}>
            <span className={dl.statsValue}>
              <ClockIcon className="w-4 h-4" />

              {doc.experience}
            </span>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className={dl.actionContainer}>

          {/* Backend uses "fee" */}
          <span className={dl.feesValue}>
            ₹{doc.fee || 0}
          </span>

          <button
            type="button"
            onClick={() => onDelete(doc)}
            className={dl.deleteButton}
          >
            <TrashIcon className="w-4 h-4" />

            Remove
          </button>
        </div>
      </div>

      {/* ================= EXPANDED DETAILS ================= */}
      {open && (
        <div className={dl.expandableContent}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">

            {/* ABOUT */}
            <div className={dl.aboutSection}>

              <h4 className={dl.aboutHeading}>
                About
              </h4>

              <p className={dl.aboutText}>
                {doc.about ||
                  "No description provided."}
              </p>

              {/* QUALIFICATIONS */}
              <h4
                className={`${dl.qualificationsHeading} mt-3`}
              >
                Qualifications
              </h4>

              <p className={dl.qualificationsText}>
                {doc.qualifications || "—"}
              </p>

              {/* SCHEDULE */}
              {doc.schedule?.length > 0 && (
                <>
                  <h4
                    className={`${dl.scheduleHeading} mt-3`}
                  >
                    Schedule
                  </h4>

                  {doc.schedule.map((s) => (
                    <div
                      key={s.date}
                      className="mt-1"
                    >
                      <span
                        className={dl.scheduleDate}
                      >
                        {s.date}
                      </span>

                      <div className="flex flex-wrap gap-2 mt-1">
                        {s.slots?.map((t) => (
                          <span
                            key={t}
                            className={dl.scheduleSlot}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* STATISTICS */}
            <div className={dl.statsSidebar}>

              <div>
                <div className={dl.statsItemHeading}>
                  Appointments
                </div>

                <div className={dl.statsItemValue}>
                  {doc.appointments || 0}
                </div>
              </div>

              <div>
                <div className={dl.statsItemHeading}>
                  Completed
                </div>

                <div className={dl.statsItemValue}>
                  {doc.completed || 0}
                </div>
              </div>

              <div>
                <div className={dl.statsItemHeading}>
                  Canceled
                </div>

                <div className={dl.statsItemValue}>
                  {doc.canceled || 0}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function ListDoctors() {
  const {
    doctors,
    removeDoctor,
  } = useAdminData()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [toast, setToast] = useState(null)

  // ============================
  // FILTER DOCTORS
  // ============================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return doctors.filter((d) => {

      const matchesSearch =
        !q ||
        (d.name || "")
          .toLowerCase()
          .includes(q) ||
        (d.specialization || "")
          .toLowerCase()
          .includes(q)

      // Backend uses availability
      const isAvailable =
        d.availability === "Available"

      const matchesFilter =
        filter === "all" ||
        (filter === "available" &&
          isAvailable) ||
        (filter === "unavailable" &&
          !isAvailable)

      return (
        matchesSearch &&
        matchesFilter
      )
    })
  }, [doctors, search, filter])

  // ============================
  // DELETE DOCTOR
  // ============================
  const handleDelete = async (doc) => {
    if (!window.confirm(
      `Remove ${doc.name}?`
    )) {
      return
    }

    await removeDoctor(
      doc._id || doc.id
    )

    setToast({
      type: "success",
      message: `${doc.name} removed.`,
    })
  }

  return (
    <div className={dl.container}>

      {/* ================= HEADER ================= */}
      <div className={dl.headerContainer}>

        <div className={dl.headerTopSection}>

          {/* TITLE */}
          <div className={dl.headerIconContainer}>

            <div className={dl.headerIcon}>
              <UsersIcon
                className={`w-5 h-5 ${dl.headerIconSvg}`}
              />
            </div>

            <div>
              <h1 className={dl.headerTitle}>
                List Doctors
              </h1>

              <p className={dl.headerSubtitle}>
                {doctors.length} registered doctors
              </p>
            </div>

          </div>

          {/* SEARCH */}
          <div className={dl.headerSearchContainer}>

            <div className={dl.searchBox}>

              <SearchIcon
                className={`w-4 h-4 ${dl.searchIcon}`}
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search doctors..."
                className={dl.searchInput}
              />

            </div>

            {search && (
              <button
                type="button"
                className={dl.clearButton}
                onClick={() =>
                  setSearch("")
                }
              >
                Clear
              </button>
            )}

          </div>
        </div>

        {/* ================= FILTER ================= */}
        <div className={dl.filterContainer}>

          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={dl.filterButton(
              filter === "all",
              "blue"
            )}
          >
            All
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("available")
            }
            className={dl.filterButton(
              filter === "available",
              "blue"
            )}
          >
            Available
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("unavailable")
            }
            className={dl.filterButton(
              filter === "unavailable",
              "red"
            )}
          >
            Unavailable
          </button>

        </div>
      </div>

      {/* ================= DOCTORS ================= */}
      {filtered.length === 0 ? (
        <div className={dl.noResultsContainer}>
          No doctors match your search.
        </div>
      ) : (
        <div className={dl.gridContainer}>

          {filtered.map((doc) => (
            <DoctorCard
              key={doc._id || doc.id}
              doc={doc}
              onDelete={handleDelete}
            />
          ))}

        </div>
      )}

      {/* ================= TOAST ================= */}
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
  )
}

export default ListDoctors