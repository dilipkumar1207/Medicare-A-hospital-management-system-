import React, { useMemo, useState } from "react";
import { serviceListStyles as sl } from "../assets/dummyStyles";
import { useAdminData } from "../context/AdminDataContext";
import Toast from "../components/Toast";
import {
  SearchIcon,
  ChevronDownIcon,
  TrashIcon,
  ClockIcon,
  ImageIcon,
} from "../components/Icons";

// ======================================================
// SERVICE CARD
// ======================================================

function ServiceCard({ service, onRemove }) {
  const [open, setOpen] = useState(false);

  // MongoDB ID
  const serviceId = service._id || service.id;

  // Cloudinary image
  const imageUrl =
    service.imageUrl ||
    service.image ||
    service.imageSmall ||
    "";

  // Description
  const description =
    service.shortDescription ||
    service.about ||
    "";

  // Backend stores slots as:
  // {
  //   "2027-10-02": ["10:00 AM", "02:00 PM"]
  // }
  const slots = service.slots || {};

  const slotDates = Object.keys(slots);

  // Count total slots
  const totalSlots = Object.values(slots).reduce(
    (total, times) => {
      return (
        total +
        (Array.isArray(times)
          ? times.length
          : 0)
      );
    },
    0
  );

  // ====================================================
  // REMOVE
  // ====================================================

  const handleRemove = (e) => {
    e.stopPropagation();

    onRemove(service);
  };

  return (
    <div className={sl.serviceCard}>
      {/* ==================================================
          SERVICE HEADER
      ================================================== */}

      <div
        className={sl.serviceCardContent}
        onClick={() =>
          setOpen((prev) => !prev)
        }
      >
        {/* IMAGE */}
        <div
          className={
            sl.serviceImageContainer
          }
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                service.name ||
                "Service"
              }
              className={sl.serviceImage}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror =
                  null;

                e.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div
              className={
                sl.serviceImagePlaceholder
              }
            >
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* SERVICE INFORMATION */}
        <div
          className={
            sl.serviceInfoContainer
          }
        >
          <div
            className={
              sl.serviceHeader
            }
          >
            <div>
              {/* NAME */}
              <h3
                className={
                  sl.serviceName
                }
              >
                {service.name ||
                  "Unnamed Service"}
              </h3>

              {/* DESCRIPTION */}
              <p
                className={
                  sl.serviceDescription
                }
              >
                {description}
              </p>
            </div>

            {/* PRICE + AVAILABILITY */}
            <div
              className={
                sl.servicePriceContainer
              }
            >
              <div
                className={
                  sl.servicePrice
                }
              >
                ₹{service.price ?? 0}
              </div>

              <span
                className={`${sl.availabilityBadge} ${
                  service.available
                    ? sl.availabilityAvailable
                    : sl.availabilityUnavailable
                }`}
              >
                {service.available
                  ? "Available"
                  : "Unavailable"}
              </span>
            </div>
          </div>

          {/* SLOT COUNT */}
          {totalSlots > 0 && (
            <div
              className={
                sl.slotsInfo
              }
            >
              <ClockIcon className="w-4 h-4" />

              {totalSlots}{" "}
              {totalSlots === 1
                ? "slot"
                : "slots"}{" "}
              open
            </div>
          )}
        </div>

        {/* CHEVRON */}
        <div
          className={
            sl.chevronContainer
          }
        >
          <ChevronDownIcon
            className={`${sl.chevronIcon} ${
              open
                ? sl.chevronOpen
                : sl.chevronClosed
            }`}
          />
        </div>
      </div>

      {/* ==================================================
          EXPANDED DETAILS
      ================================================== */}

      {open && (
        <div
          className={
            sl.detailsContainer
          }
        >
          {/* DESCRIPTION */}
          <div
            className={
              sl.viewSection
            }
          >
            <h4
              className={
                sl.viewSectionTitle
              }
            >
              Full Description
            </h4>

            <p
              className={
                sl.viewSectionContent
              }
            >
              {service.about ||
                service.shortDescription ||
                "No description available."}
            </p>
          </div>

          {/* INSTRUCTIONS */}
          {Array.isArray(
            service.instructions
          ) &&
            service.instructions
              .length > 0 && (
              <div
                className={
                  sl.viewSection
                }
              >
                <h4
                  className={
                    sl.viewSectionTitle
                  }
                >
                  Instructions
                </h4>

                <ul
                  className={
                    sl.instructionsList
                  }
                >
                  {service.instructions.map(
                    (
                      instruction,
                      index
                    ) => (
                      <li
                        key={`instruction-${serviceId}-${index}`}
                      >
                        {instruction}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

          {/* AVAILABLE SLOTS */}
          {slotDates.length > 0 && (
            <div
              className={
                sl.viewSection
              }
            >
              <h4
                className={
                  sl.viewSectionTitle
                }
              >
                Available Slots
              </h4>

              <div
                className={
                  sl.slotsList
                }
              >
                {slotDates.map(
                  (date) => (
                    <div
                      key={`${serviceId}-${date}`}
                      className={
                        sl.slotItem
                      }
                    >
                      <ClockIcon
                        className={
                          sl.slotIcon
                        }
                      />

                      <span>
                        {date}:{" "}
                        {Array.isArray(
                          slots[date]
                        )
                          ? slots[
                              date
                            ].join(
                              ", "
                            )
                          : ""}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* REMOVE BUTTON */}
          <div
            className={`${sl.viewActions} mt-3`}
          >
            <button
              type="button"
              onClick={
                handleRemove
              }
              className={
                sl.removeButton
              }
            >
              <TrashIcon className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// LIST SERVICES
// ======================================================

function ListServices() {
  const {
    services,
    removeService,
  } = useAdminData();

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [toast, setToast] =
    useState(null);

  // ====================================================
  // SEARCH + FILTER
  // ====================================================

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return services.filter(
      (service) => {
        const serviceName =
          service.name
            ?.toLowerCase() || "";

        const matchesSearch =
          !query ||
          serviceName.includes(
            query
          );

        let matchesFilter =
          true;

        if (
          filter === "available"
        ) {
          matchesFilter =
            service.available ===
            true;
        }

        if (
          filter === "unavailable"
        ) {
          matchesFilter =
            service.available !==
            true;
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    services,
    search,
    filter,
  ]);

  // ====================================================
  // REMOVE SERVICE
  // ====================================================

  const handleRemove = async (
    service
  ) => {
    const serviceId =
      service._id ||
      service.id;

    const confirmed =
      window.confirm(
        `Remove "${service.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const result =
        await removeService(
          serviceId
        );

      if (result?.success) {
        setToast({
          type: "success",
          message: `${service.name} removed successfully.`,
        });
      } else {
        setToast({
          type: "error",
          message:
            result?.message ||
            "Failed to remove service.",
        });
      }
    } catch (error) {
      console.error(
        "Remove service error:",
        error
      );

      setToast({
        type: "error",
        message:
          "Failed to remove service.",
      });
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      className={
        sl.pageContainer
      }
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className={
          sl.headerContainer
        }
      >
        <div>
          <h1
            className={
              sl.headerTitle
            }
          >
            List Services
          </h1>

          <p
            className={
              sl.headerSubtitle
            }
          >
            {services.length}{" "}
            {services.length === 1
              ? "service"
              : "services"}{" "}
            available
          </p>
        </div>

        {/* FILTER + SEARCH */}
        <div
          className={
            sl.filterContainer
          }
        >
          {/* FILTER BUTTONS */}
          <div
            className={
              sl.filterButtonsContainer
            }
          >
            {[
              "all",
              "available",
              "unavailable",
            ].map(
              (
                filterValue
              ) => (
                <button
                  key={
                    filterValue
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      filterValue
                    )
                  }
                  className={`${
                    sl.filterButton
                  } ${
                    filter ===
                    filterValue
                      ? sl.filterButtonActive
                      : sl.filterButtonInactive
                  }`}
                >
                  {filterValue
                    .charAt(0)
                    .toUpperCase() +
                    filterValue.slice(
                      1
                    )}
                </button>
              )
            )}
          </div>

          {/* SEARCH */}
          <div
            className={
              sl.searchContainer
            }
          >
            <div
              className={
                sl.searchIcon
              }
            >
              <SearchIcon
                className={
                  sl.searchIconSvg
                }
              />
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search services..."
              className={
                sl.searchInput
              }
            />
          </div>
        </div>
      </div>

      {/* ==================================================
          SERVICES
      ================================================== */}

      {filtered.length === 0 ? (
        <div
          className={
            sl.emptyState
          }
        >
          {services.length === 0
            ? "No services available."
            : "No services found."}
        </div>
      ) : (
        <div
          className={
            sl.servicesGrid
          }
        >
          {filtered.map(
            (service, index) => (
              <ServiceCard
                key={`service-${
                  service._id ||
                  service.id ||
                  "item"
                }-${index}`}
                service={service}
                onRemove={
                  handleRemove
                }
              />
            )
          )}
        </div>
      )}

      {/* ==================================================
          TOAST
      ================================================== */}

      {toast && (
        <Toast
          message={
            toast.message
          }
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </div>
  );
}

export default ListServices;