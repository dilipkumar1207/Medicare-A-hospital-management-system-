import React, { useEffect, useMemo, useState } from "react";
import { doctorsPageStyles } from "../assets/dummyStyles";
import {
    ChevronRight,
    CircleChevronDown,
    CircleChevronUp,
    Medal,
    Search,
    X,
    MousePointer2Off,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:4000";
const PLACEHOLDER_IMAGE = "/placeholder-doctor.jpg";

function DoctorsPage() {
    const [allDoctors, setAllDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);

    // --------------------------------------------------
    // Load doctors
    // --------------------------------------------------
    const loadDoctors = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/api/doctors`);
            const json = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    json?.message ||
                    `Failed to load doctors (${response.status})`
                );
            }

            const items = Array.isArray(json?.data)
                ? json.data
                : Array.isArray(json)
                    ? json
                    : [];

            const normalizedDoctors = items.map((doctor) => {
                const id = doctor._id || doctor.id;

                const image =
                    doctor.imageUrl ||
                    doctor.image ||
                    doctor.imageSmall ||
                    doctor.imageSrc ||
                    "";

                let available = true;

                if (typeof doctor.availability === "string") {
                    available =
                        doctor.availability.toLowerCase() === "available";
                } else if (typeof doctor.available === "boolean") {
                    available = doctor.available;
                } else if (typeof doctor.availability === "boolean") {
                    available = doctor.availability;
                }

                return {
                    id,
                    name: doctor.name || "Unknown",
                    specialization: doctor.specialization || "",
                    image,
                    experience:
                        doctor.experience !== undefined &&
                        doctor.experience !== null
                            ? String(doctor.experience)
                            : "—",
                    fee: doctor.fee ?? doctor.price ?? 0,
                    available,
                    raw: doctor,
                };
            });

            setAllDoctors(normalizedDoctors);
        } catch (err) {
            console.error("❌ Load doctors error:", err);

            setError(
                err.message || "Network error while loading doctors."
            );

            setAllDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Initial load
    // --------------------------------------------------
    useEffect(() => {
        loadDoctors();
    }, []);

    // --------------------------------------------------
    // Search doctors
    // --------------------------------------------------
    const filteredDoctors = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) {
            return allDoctors;
        }

        return allDoctors.filter((doctor) => {
            const name = (doctor.name || "").toLowerCase();
            const specialization = (
                doctor.specialization || ""
            ).toLowerCase();

            return (
                name.includes(query) ||
                specialization.includes(query)
            );
        });
    }, [allDoctors, searchTerm]);

    // --------------------------------------------------
    // Display doctors
    // --------------------------------------------------
    const displayedDoctors = showAll
        ? filteredDoctors
        : filteredDoctors.slice(0, 8);

    return (
        <div className={doctorsPageStyles.mainContainer}>
            {/* Background shapes */}
            <div className={doctorsPageStyles.backgroundShape1}></div>
            <div className={doctorsPageStyles.backgroundShape2}></div>

            <div className={doctorsPageStyles.wrapper}>
                {/* Header */}
                <div className={doctorsPageStyles.headerContainer}>
                    <h1 className={doctorsPageStyles.headerTitle}>
                        Our Medical Experts
                    </h1>

                    <p className={doctorsPageStyles.headerSubtitle}>
                        Find your ideal doctor by name or specialization
                    </p>
                </div>

                {/* Search */}
                <div className={doctorsPageStyles.searchContainer}>
                    <div className={doctorsPageStyles.searchWrapper}>
                        <input
                            type="text"
                            placeholder="Search by name or specialization..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                            className={doctorsPageStyles.searchInput}
                        />

                        <Search
                            className={doctorsPageStyles.searchIcon}
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                className={doctorsPageStyles.clearButton}
                                onClick={() => setSearchTerm("")}
                            >
                                <X size={20} strokeWidth={3.5} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className={doctorsPageStyles.errorContainer}>
                        <div className={doctorsPageStyles.errorText}>
                            {error}
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={loadDoctors}
                                className={doctorsPageStyles.retryButton}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className={doctorsPageStyles.skeletonGrid}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className={doctorsPageStyles.skeletonCard}
                            >
                                <div
                                    className={
                                        doctorsPageStyles.skeletonImage
                                    }
                                ></div>

                                <div
                                    className={
                                        doctorsPageStyles.skeletonImage
                                    }
                                ></div>

                                <div
                                    className={
                                        doctorsPageStyles.skeletonSpecialization
                                    }
                                ></div>

                                <div
                                    className={
                                        doctorsPageStyles.skeletonButton
                                    }
                                ></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Doctors Grid */}
                        <div
                            className={`${doctorsPageStyles.doctorsGrid} ${
                                filteredDoctors.length === 0
                                    ? "opacity-70"
                                    : "opacity-100"
                            }`}
                        >
                            {displayedDoctors.length > 0 ? (
                                displayedDoctors.map((doctor, index) => (
                                    <div
                                        key={
                                            doctor.id ||
                                            `${doctor.name}-${index}`
                                        }
                                        className={`${doctorsPageStyles.doctorCard} ${
                                            !doctor.available
                                                ? doctorsPageStyles.doctorCardUnavailable
                                                : ""
                                        }`}
                                        style={{
                                            animationDelay: `${
                                                index * 90
                                            }ms`,
                                        }}
                                        role="article"
                                    >
                                        {/* Doctor Image */}
                                        {doctor.available ? (
                                            <Link
                                                to={`/doctors/${doctor.id}`}
                                                state={{
                                                    doctor:
                                                        doctor.raw ||
                                                        doctor,
                                                }}
                                                className={
                                                    doctorsPageStyles.focusRing
                                                }
                                            >
                                                <div
                                                    className={
                                                        doctorsPageStyles.imageContainer
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            doctor.image ||
                                                            PLACEHOLDER_IMAGE
                                                        }
                                                        alt={doctor.name}
                                                        loading="lazy"
                                                        className={
                                                            doctorsPageStyles.doctorImage
                                                        }
                                                        onError={(e) => {
                                                            e.currentTarget.onerror =
                                                                null;
                                                            e.currentTarget.src =
                                                                PLACEHOLDER_IMAGE;
                                                        }}
                                                    />
                                                </div>
                                            </Link>
                                        ) : (
                                            <div
                                                className={`${doctorsPageStyles.imageContainer} ${doctorsPageStyles.imageContainerUnavailable}`}
                                            >
                                                <img
                                                    src={
                                                        doctor.image ||
                                                        PLACEHOLDER_IMAGE
                                                    }
                                                    alt={doctor.name}
                                                    loading="lazy"
                                                    className={
                                                        doctorsPageStyles.doctorImageUnavailable
                                                    }
                                                    onError={(e) => {
                                                        e.currentTarget.onerror =
                                                            null;
                                                        e.currentTarget.src =
                                                            PLACEHOLDER_IMAGE;
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Doctor Name */}
                                        <h3
                                            className={
                                                doctorsPageStyles.doctorName
                                            }
                                        >
                                            {doctor.name}
                                        </h3>

                                        {/* Specialization */}
                                        <p
                                            className={
                                                doctorsPageStyles.doctorSpecialization
                                            }
                                        >
                                            {doctor.specialization}
                                        </p>

                                        {/* Experience */}
                                        <div
                                            className={
                                                doctorsPageStyles.experienceBadge
                                            }
                                        >
                                            <Medal
                                                className={
                                                    doctorsPageStyles.experienceIcon
                                                }
                                            />

                                            <span>
                                                {doctor.experience ||
                                                    "-"}{" "}
                                                years Experience
                                            </span>
                                        </div>

                                        {/* Book Button */}
                                        {doctor.available ? (
                                            <Link
                                                to={`/doctors/${doctor.id}`}
                                                state={{
                                                    doctor:
                                                        doctor.raw ||
                                                        doctor,
                                                }}
                                                className={
                                                    doctorsPageStyles.bookButton
                                                }
                                            >
                                                <ChevronRight
                                                    className={
                                                        doctorsPageStyles.bookButtonIcon
                                                    }
                                                />

                                                Book Now
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className={
                                                    doctorsPageStyles.notAvailableButton
                                                }
                                            >
                                                <MousePointer2Off
                                                    className={
                                                        doctorsPageStyles.notAvailableIcon
                                                    }
                                                />

                                                Not Available
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div
                                    className={
                                        doctorsPageStyles.noResults
                                    }
                                >
                                    No doctors found matching your search
                                    criteria.
                                </div>
                            )}
                        </div>

                        {/* Show More / Hide */}
                        {filteredDoctors.length > 8 && (
                            <div
                                className={
                                    doctorsPageStyles.showMoreContainer
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAll((prev) => !prev)
                                    }
                                    className={
                                        doctorsPageStyles.showMoreButton
                                    }
                                >
                                    {showAll ? (
                                        <>
                                            <CircleChevronUp
                                                className={
                                                    doctorsPageStyles.showMoreIcon
                                                }
                                            />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <CircleChevronDown
                                                className={
                                                    doctorsPageStyles.showMoreIcon
                                                }
                                            />
                                            Show More
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.9s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.9s ease-out both;
                }

                .animate-slide-up {
                    animation: slide-up 0.8s ease-out;
                }

                @media (max-width: 420px) {
                    .max-w-7xl {
                        padding-left: 10px;
                        padding-right: 10px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default DoctorsPage;