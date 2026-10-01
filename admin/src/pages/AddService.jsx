import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addServiceStyles as as_ } from "../assets/dummyStyles";
import Toast from "../components/Toast";
import {
  PlusSquareIcon,
  ImageIcon,
  TrashIcon,
  ClockIcon,
  XIcon,
} from "../components/Icons";

const API_BASE = "http://localhost:4000";

function AddService() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // Actual image file
  const [imageFile, setImageFile] = useState(null);

  // Image preview only
  const [imagePreview, setImagePreview] = useState(null);

  const [instructions, setInstructions] = useState([""]);

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [schedule, setSchedule] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // ==============================
  // IMAGE
  // ==============================
 const handleImage = (e) => {
  const file = e.target.files?.[0];

  console.log("📸 SELECTED FILE:", file);

  if (!file) {
    console.log("❌ No image selected");
    return;
  }

  // Check image type
  if (!file.type.startsWith("image/")) {
    setToast({
      type: "error",
      message: "Please select a valid image file.",
    });

    e.target.value = "";
    return;
  }

  // Check image size - maximum 5 MB
  if (file.size > 5 * 1024 * 1024) {
    setToast({
      type: "error",
      message: "Image size must be less than 5 MB.",
    });

    e.target.value = "";
    return;
  }

  // Save the REAL image file
  setImageFile(file);

  // Create preview URL
  const previewUrl = URL.createObjectURL(file);
  setImagePreview(previewUrl);

  console.log("✅ Image selected:", file.name);
  console.log("📦 Image size:", file.size);
  console.log("📄 Image type:", file.type);
};

const removeImage = () => {
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setImageFile(null);
  setImagePreview(null);

  console.log("🗑️ Image removed");
};

  // ==============================
  // INSTRUCTIONS
  // ==============================
  const addInstruction = () => {
    setInstructions((prev) => [...prev, ""]);
  };

  const updateInstruction = (index, value) => {
    setInstructions((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const removeInstruction = (index) => {
    setInstructions((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // ==============================
  // SLOTS
  // ==============================
  const addSlot = () => {
    if (!slotDate || !slotTime) {
      setToast({
        type: "error",
        message: "Please select date and time.",
      });
      return;
    }

    setSchedule((prev) => {
      const existing = prev.find(
        (item) => item.date === slotDate
      );

      if (existing) {
        // Don't add duplicate time
        if (existing.slots.includes(slotTime)) {
          return prev;
        }

        return prev.map((item) =>
          item.date === slotDate
            ? {
                ...item,
                slots: [...item.slots, slotTime],
              }
            : item
        );
      }

      return [
        ...prev,
        {
          date: slotDate,
          slots: [slotTime],
        },
      ];
    });

    setSlotTime("");
  };

  const removeSlot = (date, time) => {
    setSchedule((prev) =>
      prev
        .map((item) =>
          item.date === date
            ? {
                ...item,
                slots: item.slots.filter(
                  (t) => t !== time
                ),
              }
            : item
        )
        .filter((item) => item.slots.length > 0)
    );
  };

  // ==============================
  // DATE FORMAT
  // Backend expects:
  // "02 Oct 2027 • 10:00 AM"
  // ==============================
  const formatSlotForBackend = (date, time) => {
    const [year, month, day] = date.split("-");

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthName = monthNames[Number(month) - 1];

    return `${Number(day)} ${monthName} ${year} • ${time}`;
  };

  // ==============================
  // VALIDATION
  // ==============================
  const isValid =
    name.trim() &&
    price &&
    description.trim();

  // ==============================
  // SUBMIT
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      setToast({
        type: "error",
        message:
          "Please fill in name, price and description.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // ==========================================
      // CREATE FORMDATA
      // ==========================================
      const formData = new FormData();

      formData.append("name", name.trim());

      formData.append(
        "about",
        description.trim()
      );

      formData.append(
        "shortDescription",
        description.trim()
      );

      formData.append(
        "price",
        String(Number(price))
      );

      formData.append(
        "availability",
        "available"
      );

      // Instructions
      const cleanInstructions =
        instructions
          .map((item) => item.trim())
          .filter(Boolean);

      formData.append(
        "instructions",
        JSON.stringify(cleanInstructions)
      );

      // Convert schedule to backend format
      const backendSlots = [];

      schedule.forEach((item) => {
        item.slots.forEach((time) => {
          backendSlots.push(
            formatSlotForBackend(
              item.date,
              time
            )
          );
        });
      });

      formData.append(
        "slots",
        JSON.stringify(backendSlots)
      );

      // ==========================================
      // ACTUAL IMAGE FILE
      // ==========================================
      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      // ==========================================
      // DEBUG
      // ==========================================
      console.log(
        "🚀 CREATING SERVICE"
      );

      console.log(
        "📦 Name:",
        name
      );

      console.log(
        "💰 Price:",
        price
      );

      console.log(
        "📸 Image:",
        imageFile
      );

      console.log(
        "📅 Slots:",
        backendSlots
      );

      // ==========================================
      // SEND TO BACKEND
      // ==========================================
      const response = await fetch(
        `${API_BASE}/api/services`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json().catch(
          () => null
        );

      console.log(
        "📥 Server response:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Failed to create service (${response.status})`
        );
      }

      // ==========================================
      // SUCCESS
      // ==========================================
      console.log(
        "✅ SERVICE CREATED"
      );

      console.log(
        "🖼️ Saved image URL:",
        result?.data?.imageUrl
      );

      setToast({
        type: "success",
        message:
          "Service added successfully!",
      });

      // Reset
      setName("");
      setPrice("");
      setDescription("");
      removeImage();
      setInstructions([""]);
      setSlotDate("");
      setSlotTime("");
      setSchedule([]);

      // Navigate after success
      setTimeout(() => {
        navigate("/services");
      }, 1000);
    } catch (error) {
      console.error(
        "❌ Add Service Error:",
        error
      );

      setToast({
        type: "error",
        message:
          error.message ||
          "Failed to add service.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================
  // RESET
  // ==============================
  const handleReset = () => {
    setName("");
    setPrice("");
    setDescription("");
    removeImage();
    setInstructions([""]);
    setSlotDate("");
    setSlotTime("");
    setSchedule([]);
  };

  return (
    <div className={as_.container.main}>
      <form
        onSubmit={handleSubmit}
        className={as_.container.form}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={as_.header.title}>
              Add New Service
            </h1>

            <p className={as_.header.subtitle}>
              Create a new hospital service
            </p>
          </div>

          <PlusSquareIcon className="w-8 h-8 text-blue-500" />
        </div>

        {/* ================= SERVICE DETAILS ================= */}
        <div className={as_.grids.main}>
          {/* NAME */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Service Name *
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="e.g. Full Body Checkup"
              className={as_.formFields.input(
                !name && submitting
              )}
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Price (₹) *
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              placeholder="999"
              className={as_.formFields.input(
                !price && submitting
              )}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Description *
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe the service..."
              className={as_.formFields.textarea(
                !description && submitting
              )}
            />
          </div>

          {/* ================= IMAGE ================= */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Service Image
            </label>

            <div
              className={as_.imageUpload.container(
                false
              )}
            >
              {imagePreview ? (
                <div
                  className={
                    as_.imageUpload.preview
                  }
                >
                  <img
                    src={imagePreview}
                    alt="Service preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={
                    as_.imageUpload.placeholder
                  }
                >
                  <ImageIcon className="w-10 h-10" />

                  <span className="text-sm mt-2">
                    No image selected
                  </span>
                </div>
              )}

              <div className="flex gap-2 w-full">
                <label
                  className={
                    as_.buttons.uploadImage
                  }
                >
                  <ImageIcon className="w-4 h-4" />

                  Upload Image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className={
                      as_.buttons.removeImage
                    }
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= INSTRUCTIONS ================= */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Instructions
              </label>

              <button
                type="button"
                onClick={addInstruction}
                className={
                  as_.buttons.addInstruction
                }
              >
                <PlusSquareIcon className="w-4 h-4" />
                Add
              </button>
            </div>

            <div
              className={
                as_.instructions.container(false)
              }
            >
              {instructions.map(
                (ins, i) => (
                  <div
                    key={i}
                    className={
                      as_.instructions.item
                    }
                  >
                    <input
                      value={ins}
                      onChange={(e) =>
                        updateInstruction(
                          i,
                          e.target.value
                        )
                      }
                      placeholder={`Instruction ${
                        i + 1
                      }`}
                      className={
                        as_.instructions.input
                      }
                    />

                    {instructions.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeInstruction(i)
                        }
                        className={
                          as_.instructions
                            .removeButton
                        }
                      >
                        <TrashIcon className="w-4 h-4 text-rose-400" />
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ================= SLOTS ================= */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Available Slots
            </label>

            <div
              className={
                as_.slots.container(false)
              }
            >
              <div
                className={
                  as_.grids.timeGrid
                }
              >
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) =>
                    setSlotDate(
                      e.target.value
                    )
                  }
                  className={
                    as_.formFields.smallSelect
                  }
                />

                <select
                  value={slotTime}
                  onChange={(e) =>
                    setSlotTime(
                      e.target.value
                    )
                  }
                  className={
                    as_.formFields.timeSelect
                  }
                >
                  <option value="">
                    Select time
                  </option>

                  {[
                    "09:00 AM",
                    "10:00 AM",
                    "11:00 AM",
                    "12:00 PM",
                    "01:00 PM",
                    "02:00 PM",
                    "03:00 PM",
                    "04:00 PM",
                  ].map((t) => (
                    <option
                      key={t}
                      value={t}
                    >
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addSlot}
                  className={
                    as_.buttons.addSlot
                  }
                >
                  <ClockIcon className="w-4 h-4" />
                  Add Slot
                </button>
              </div>

              {schedule.length > 0 && (
                <div
                  className={
                    as_.grids.slotsGrid
                  }
                >
                  {schedule.map(
                    (s) =>
                      s.slots.map(
                        (t) => (
                          <div
                            key={`${s.date}-${t}`}
                            className={
                              as_.slots.slotItem
                            }
                          >
                            <span
                              className={
                                as_.slots.slotText
                              }
                            >
                              {s.date} · {t}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                removeSlot(
                                  s.date,
                                  t
                                )
                              }
                              className={
                                as_.buttons
                                  .slotRemove
                              }
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
        </div>

        {/* ================= BUTTONS ================= */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className={as_.buttons.reset}
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={as_.buttons.submit}
          >
            {submitting
              ? "Saving..."
              : "Save Service"}
          </button>
        </div>
      </form>

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

export default AddService;