import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { doctorDetailStyles as dd } from "../assets/dummyStyles";
import { useAdminData } from "../context/AdminDataContext";
import { specializations } from "../assets/dummyData";

import Toast from "../components/Toast";

import {
    UserPlusIcon,
    ImageIcon,
    XIcon,
    ClockIcon,
    PlusSquareIcon,
    TrashIcon,
} from "../components/Icons";


// ======================================================
// INITIAL FORM
// ======================================================

const emptyForm = {
    name: "",
    email: "",
    password: "",
    specialization: specializations[0] || "",
    degree: "",
    experience: "",
    fees: "",
    about: "",
    qualifications: "",
};


// ======================================================
// AVAILABLE TIME OPTIONS
// ======================================================

const TIME_OPTIONS = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
];


// ======================================================
// COMPONENT
// ======================================================

function AddDoctor() {
    const { addDoctor } = useAdminData();
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyForm);

    // Specialization search
    const [specializationSearch, setSpecializationSearch] = useState(
        specializations[0] || ""
    );
    const [showSpecializationSuggestions, setShowSpecializationSuggestions] =
        useState(false);

    // Image
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    // Schedule
    const [slotDate, setSlotDate] = useState("");
    const [slotTime, setSlotTime] = useState("");

    /*
      IMPORTANT:

      Schedule is stored as an OBJECT:

      {
        "2026-09-26": [
          "10:00 AM",
          "11:00 AM"
        ],
        "2026-09-27": [
          "02:00 PM"
        ]
      }
    */
    const [schedule, setSchedule] = useState({});

    const [toast, setToast] = useState(null);
    const [submitting, setSubmitting] = useState(false);


    // ==================================================
    // FORM UPDATE
    // ==================================================

    const update = (field) => (event) => {
        setForm((previous) => ({
            ...previous,
            [field]: event.target.value,
        }));
    };


    // ==================================================
    // IMAGE SELECTION
    // ==================================================

    const handleImage = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setToast({
                type: "error",
                message: "Please select an image file.",
            });

            return;
        }

        // Remove previous preview
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);

        const previewUrl = URL.createObjectURL(file);

        setImagePreview(previewUrl);
    };


    // ==================================================
    // REMOVE IMAGE
    // ==================================================

    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(null);
        setImagePreview(null);
    };


    // ==================================================
    // ADD SCHEDULE SLOT
    // ==================================================

    const addSlot = () => {
        if (!slotDate) {
            setToast({
                type: "error",
                message: "Please select a date.",
            });

            return;
        }

        if (!slotTime) {
            setToast({
                type: "error",
                message: "Please select a time.",
            });

            return;
        }

        setSchedule((previous) => {
            const existingSlots = previous[slotDate] || [];

            // Prevent duplicate slot
            if (existingSlots.includes(slotTime)) {
                return previous;
            }

            return {
                ...previous,

                [slotDate]: [
                    ...existingSlots,
                    slotTime,
                ],
            };
        });

        // Reset only time.
        // User can add another time for same date.
        setSlotTime("");
    };


    // ==================================================
    // REMOVE SCHEDULE SLOT
    // ==================================================

    const removeSlot = (date, time) => {
        setSchedule((previous) => {
            const existingSlots = previous[date] || [];

            const updatedSlots = existingSlots.filter(
                (slot) => slot !== time
            );

            const updatedSchedule = {
                ...previous,
            };

            if (updatedSlots.length === 0) {
                delete updatedSchedule[date];
            } else {
                updatedSchedule[date] = updatedSlots;
            }

            return updatedSchedule;
        });
    };


    // ==================================================
    // FORM VALIDATION
    // ==================================================

    const isValid =
        form.name.trim() &&
        form.email.trim() &&
        form.password.trim() &&
        form.degree.trim() &&
        form.experience.trim() &&
        form.fees !== "";


    // ==================================================
    // SUBMIT DOCTOR
    // ==================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isValid) {
            setToast({
                type: "error",
                message:
                    "Please fill in all required fields.",
            });

            return;
        }

        setSubmitting(true);

        try {
            // ==========================================
            // DEBUG
            // ==========================================

            console.log(
                "======================================"
            );

            console.log(
                "🚀 CREATING DOCTOR"
            );

            console.log(
                "👨‍⚕️ Doctor:",
                form.name
            );

            console.log(
                "💰 Fee:",
                form.fees
            );

            console.log(
                "📅 Schedule:",
                schedule
            );

            console.log(
                "🖼️ Image:",
                imageFile?.name || "No image"
            );


            // ==========================================
            // ADD DOCTOR
            // ==========================================

            const result = await addDoctor({
                ...form,

                // Backend expects fee
                fee: Number(form.fees),

                // Actual image file
                imageFile,

                // Doctor availability
                availability: "Available",

                // IMPORTANT:
                // schedule is now an object
                schedule,
            });


            console.log(
                "📥 Add doctor response:",
                result
            );


            // ==========================================
            // SUCCESS
            // ==========================================

            if (result?.success) {
                setToast({
                    type: "success",
                    message:
                        "Doctor added successfully!",
                });

                // Reset form
                setForm(emptyForm);
                setSpecializationSearch(specializations[0] || "");
                setShowSpecializationSuggestions(false);

                removeImage();

                setSlotDate("");
                setSlotTime("");
                setSchedule({});

                // Navigate after short delay
                setTimeout(() => {
                    navigate("/doctors");
                }, 900);

                return;
            }


            // ==========================================
            // API ERROR
            // ==========================================

            setToast({
                type: "error",
                message:
                    result?.message ||
                    "Failed to add doctor.",
            });

        } catch (error) {
            console.error(
                "❌ Add doctor error:",
                error
            );

            setToast({
                type: "error",
                message:
                    error?.message ||
                    "Something went wrong while adding doctor.",
            });
        } finally {
            setSubmitting(false);
        }
    };


    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div className={dd.pageContainer}>
            <div className={dd.maxWidthContainerLg}>

                {/* ======================================
                    HEADER
                ====================================== */}

                <div className={dd.headerContainer}>
                    <div
                        className={
                            dd.headerFlexContainer
                        }
                    >
                        <div
                            className={
                                dd.headerIconContainer
                            }
                        >
                            <UserPlusIcon className="w-6 h-6 text-white" />
                        </div>

                        <h1 className={dd.headerTitle}>
                            Add New Doctor
                        </h1>
                    </div>
                </div>


                {/* ======================================
                    FORM
                ====================================== */}

                <form
                    onSubmit={handleSubmit}
                    className={dd.formContainer}
                >
                    <div className={dd.formGrid}>

                        {/* ===============================
                            FULL NAME
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Full Name *
                            </label>

                            <input
                                required
                                type="text"
                                value={form.name}
                                onChange={update("name")}
                                placeholder="Dr. John Doe"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            EMAIL
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Email *
                            </label>

                            <input
                                required
                                type="email"
                                value={form.email}
                                onChange={update("email")}
                                placeholder="doctor@medicare.com"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            PASSWORD
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Password *
                            </label>

                            <input
                                required
                                type="password"
                                value={form.password}
                                onChange={update("password")}
                                placeholder="••••••••"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            SPECIALIZATION
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Specialization *
                            </label>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={specializationSearch}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        setSpecializationSearch(value);

                                        setForm((previous) => ({
                                            ...previous,
                                            specialization: value,
                                        }));

                                        setShowSpecializationSuggestions(true);
                                    }}
                                    onFocus={() =>
                                        setShowSpecializationSuggestions(true)
                                    }
                                    placeholder="Search specialization..."
                                    className={dd.inputBase}
                                />

                                {showSpecializationSuggestions && (
                                    <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-lg">
                                        {specializations
                                            .filter((specialization) =>
                                                specialization
                                                    .toLowerCase()
                                                    .includes(
                                                        specializationSearch.toLowerCase()
                                                    )
                                            )
                                            .map((specialization) => (
                                                <button
                                                    key={specialization}
                                                    type="button"
                                                    onClick={() => {
                                                        setSpecializationSearch(
                                                            specialization
                                                        );

                                                        setForm((previous) => ({
                                                            ...previous,
                                                            specialization,
                                                        }));

                                                        setShowSpecializationSuggestions(
                                                            false
                                                        );
                                                    }}
                                                    className="block w-full cursor-pointer px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50"
                                                >
                                                    {specialization}
                                                </button>
                                            ))}

                                        {specializations.filter((specialization) =>
                                            specialization
                                                .toLowerCase()
                                                .includes(
                                                    specializationSearch.toLowerCase()
                                                )
                                        ).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500">
                                                No specialization found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* ===============================
                            DEGREE
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Degree *
                            </label>

                            <input
                                required
                                type="text"
                                value={form.degree}
                                onChange={update("degree")}
                                placeholder="MBBS, MD"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            EXPERIENCE
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Experience *
                            </label>

                            <input
                                required
                                type="text"
                                value={form.experience}
                                onChange={update(
                                    "experience"
                                )}
                                placeholder="10 Years"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            FEES
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Consultation Fees (₹) *
                            </label>

                            <input
                                required
                                type="number"
                                min="0"
                                value={form.fees}
                                onChange={update("fees")}
                                placeholder="500"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            QUALIFICATIONS
                        =============================== */}

                        <div>
                            <label className={dd.label}>
                                Qualifications
                            </label>

                            <input
                                type="text"
                                value={form.qualifications}
                                onChange={update(
                                    "qualifications"
                                )}
                                placeholder="MBBS - AIIMS Delhi"
                                className={dd.inputBase}
                            />
                        </div>


                        {/* ===============================
                            ABOUT
                        =============================== */}

                        <div className="md:col-span-2">
                            <label className={dd.label}>
                                About Doctor
                            </label>

                            <textarea
                                rows={4}
                                value={form.about}
                                onChange={update("about")}
                                placeholder="Short bio about the doctor..."
                                className={dd.textareaBase}
                            />
                        </div>


                        {/* ===============================
                            PROFILE PHOTO
                        =============================== */}

                        <div className="md:col-span-2">
                            <label className={dd.label}>
                                Profile Photo
                            </label>

                            <div className="flex items-center gap-3">

                                <label
                                    className={`${dd.fileInput} flex items-center gap-2 cursor-pointer`}
                                >
                                    <ImageIcon className="w-4 h-4 text-blue-500" />

                                    <span>
                                        {imageFile
                                            ? "Change photo"
                                            : "Choose file"}
                                    </span>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImage}
                                        className="hidden"
                                    />
                                </label>


                                {imagePreview && (
                                    <div className="relative">

                                        <img
                                            src={imagePreview}
                                            alt="Doctor preview"
                                            className={
                                                dd.imagePreview
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={
                                                removeImage
                                            }
                                            className={
                                                dd.removeImageButton
                                            }
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>

                                    </div>
                                )}

                            </div>


                            {imageFile && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Selected:{" "}
                                    {imageFile.name}
                                </p>
                            )}
                        </div>


                        {/* ===============================
                            SCHEDULE
                        =============================== */}

                        <div className="md:col-span-2">

                            <div
                                className={
                                    dd.scheduleContainer
                                }
                            >

                                <div
                                    className={
                                        dd.scheduleHeader
                                    }
                                >
                                    <ClockIcon className="w-5 h-5 text-blue-600" />

                                    <h3
                                        className={
                                            dd.scheduleTitle
                                        }
                                    >
                                        Available Schedule
                                    </h3>
                                </div>


                                {/* INPUTS */}

                                <div
                                    className={
                                        dd.scheduleInputsContainer
                                    }
                                >

                                    <input
                                        type="date"
                                        value={slotDate}
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        onChange={(event) =>
                                            setSlotDate(
                                                event.target.value
                                            )
                                        }
                                        className={
                                            dd.scheduleDateInput
                                        }
                                    />


                                    <select
                                        value={slotTime}
                                        onChange={(event) =>
                                            setSlotTime(
                                                event.target.value
                                            )
                                        }
                                        className={
                                            dd.scheduleTimeSelect
                                        }
                                    >
                                        <option value="">
                                            Select time
                                        </option>

                                        {TIME_OPTIONS.map(
                                            (time) => (
                                                <option
                                                    key={time}
                                                    value={time}
                                                >
                                                    {time}
                                                </option>
                                            )
                                        )}
                                    </select>


                                    <button
                                        type="button"
                                        onClick={addSlot}
                                        className={
                                            dd.addSlotButton
                                        }
                                    >
                                        <PlusSquareIcon className="w-4 h-4" />

                                        Add Slot
                                    </button>

                                </div>


                                {/* SCHEDULE LIST */}

                                {Object.keys(schedule)
                                    .length > 0 && (
                                    <div
                                        className={
                                            dd.slotsGrid
                                        }
                                    >

                                        {Object.entries(
                                            schedule
                                        ).map(
                                            ([date, slots]) =>
                                                slots.map(
                                                    (time) => (
                                                        <div
                                                            key={`${date}-${time}`}
                                                            className={
                                                                dd.slotItem
                                                            }
                                                        >

                                                            <span>
                                                                {date}{" "}
                                                                ·{" "}
                                                                {time}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeSlot(
                                                                        date,
                                                                        time
                                                                    )
                                                                }
                                                                className="cursor-pointer"
                                                            >
                                                                <TrashIcon className="w-4 h-4 text-rose-400" />
                                                            </button>

                                                        </div>
                                                    )
                                                )
                                        )}

                                    </div>
                                )}

                            </div>
                        </div>


                        {/* ===============================
                            SUBMIT
                        =============================== */}

                        <div
                            className={
                                dd.submitButtonContainer
                            }
                        >
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`${dd.submitButton} ${
                                    dd.submitButtonEnabled
                                } ${
                                    submitting
                                        ? dd.submitButtonDisabled
                                        : dd.cursorPointer
                                }`}
                            >
                                {submitting
                                    ? "Adding Doctor..."
                                    : "Add Doctor"}
                            </button>
                        </div>

                    </div>
                </form>

            </div>


            {/* ==========================================
                TOAST
            ========================================== */}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

export default AddDoctor;