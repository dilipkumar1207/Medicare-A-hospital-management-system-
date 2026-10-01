import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import axios from "axios";

const AdminDataContext = createContext(null);

const backendUrl =
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000";


// =====================================================
// PROVIDER
// =====================================================

export function AdminDataProvider({ children }) {
    const [doctors, setDoctors] = useState([]);
    const [services, setServices] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [serviceAppointments, setServiceAppointments] =
        useState([]);


    // =====================================================
    // GET DOCTORS
    // =====================================================

    const fetchDoctors = async () => {
        try {
            console.log("🔄 Fetching doctors...");

            const response = await axios.get(
                `${backendUrl}/api/doctors`
            );

            console.log(
                "👨‍⚕️ Doctors response:",
                response.data
            );

            if (response.data?.success) {
                const doctorList =
                    response.data.data ||
                    response.data.doctors ||
                    [];

                setDoctors(
                    Array.isArray(doctorList)
                        ? doctorList
                        : []
                );
            } else {
                setDoctors([]);
            }
        } catch (error) {
            console.error(
                "❌ Error fetching doctors:",
                error
            );

            setDoctors([]);
        }
    };


    // =====================================================
    // ADD DOCTOR
    // =====================================================

    const addDoctor = async (doctor) => {
        try {
            console.log(
                "======================================"
            );

            console.log(
                "🚀 ADD DOCTOR REQUEST"
            );

            console.log(
                "👨‍⚕️ Doctor:",
                doctor.name
            );

            console.log(
                "📅 Schedule before FormData:",
                doctor.schedule
            );


            // ---------------------------------------------
            // CREATE FORMDATA
            // ---------------------------------------------

            const formData = new FormData();


            // ---------------------------------------------
            // BASIC DETAILS
            // ---------------------------------------------

            formData.append(
                "name",
                doctor.name || ""
            );

            formData.append(
                "email",
                doctor.email || ""
            );

            formData.append(
                "password",
                doctor.password || ""
            );

            formData.append(
                "specialization",
                doctor.specialization || ""
            );

            formData.append(
                "degree",
                doctor.degree || ""
            );

            formData.append(
                "experience",
                doctor.experience || ""
            );

            formData.append(
                "fee",
                String(doctor.fee ?? 0)
            );

            formData.append(
                "about",
                doctor.about || ""
            );

            formData.append(
                "qualifications",
                doctor.qualifications || ""
            );

            formData.append(
                "availability",
                doctor.availability ||
                    "Available"
            );


            // ---------------------------------------------
            // IMPORTANT: SCHEDULE
            // ---------------------------------------------

            const doctorSchedule =
                doctor.schedule &&
                typeof doctor.schedule === "object"
                    ? doctor.schedule
                    : {};

            console.log(
                "📅 Final schedule being sent:",
                doctorSchedule
            );

            console.log(
                "📅 Schedule JSON:",
                JSON.stringify(doctorSchedule)
            );

            formData.append(
                "schedule",
                JSON.stringify(doctorSchedule)
            );


            // ---------------------------------------------
            // IMAGE
            // ---------------------------------------------

            if (doctor.imageFile) {
                console.log(
                    "🖼️ Sending image:",
                    doctor.imageFile.name
                );

                formData.append(
                    "image",
                    doctor.imageFile
                );
            }


            // ---------------------------------------------
            // DEBUG FORMDATA
            // ---------------------------------------------

            console.log(
                "📦 FormData contents:"
            );

            for (const [key, value] of formData.entries()) {
                if (key === "image") {
                    console.log(
                        key,
                        value?.name || value
                    );
                } else {
                    console.log(
                        key,
                        value
                    );
                }
            }


            // ---------------------------------------------
            // SEND REQUEST
            // ---------------------------------------------

            const response = await axios.post(
                `${backendUrl}/api/doctors`,
                formData
            );


            console.log(
                "📥 Add doctor response:",
                response.data
            );


            // ---------------------------------------------
            // SUCCESS
            // ---------------------------------------------

            if (response.data?.success) {
                await fetchDoctors();

                console.log(
                    "✅ Doctor added successfully"
                );

                return {
                    success: true,
                    data: response.data.data,
                };
            }


            // ---------------------------------------------
            // API ERROR
            // ---------------------------------------------

            return {
                success: false,
                message:
                    response.data?.message ||
                    "Failed to add doctor",
            };

        } catch (error) {
            console.error(
                "❌ Add doctor error:",
                error
            );

            console.error(
                "❌ Server response:",
                error.response?.data
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to add doctor",
            };
        }
    };


    // =====================================================
    // REMOVE DOCTOR
    // =====================================================

    const removeDoctor = async (id) => {
        try {
            console.log(
                "🗑️ Removing doctor:",
                id
            );

            const response =
                await axios.delete(
                    `${backendUrl}/api/doctors/${id}`
                );

            console.log(
                "Delete doctor response:",
                response.data
            );

            if (response.data?.success) {
                await fetchDoctors();

                return {
                    success: true,
                };
            }

            return {
                success: false,
                message:
                    response.data?.message ||
                    "Failed to remove doctor",
            };

        } catch (error) {
            console.error(
                "❌ Remove doctor error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Failed to remove doctor",
            };
        }
    };


    // =====================================================
    // GET SERVICES
    // =====================================================

    const fetchServices = async () => {
        try {
            console.log(
                "🔄 Fetching services..."
            );

            const response = await axios.get(
                `${backendUrl}/api/services`
            );

            console.log(
                "🛠️ Services response:",
                response.data
            );

            if (response.data?.success) {
                const serviceList =
                    response.data.data ||
                    response.data.services ||
                    [];

                console.log(
                    "📋 Services found:",
                    serviceList.length
                );

                setServices(
                    Array.isArray(serviceList)
                        ? serviceList
                        : []
                );
            } else {
                setServices([]);
            }

        } catch (error) {
            console.error(
                "❌ Error fetching services:",
                error
            );

            setServices([]);
        }
    };


    // =====================================================
    // REMOVE SERVICE
    // =====================================================

    const removeService = async (id) => {
        try {
            console.log(
                "🗑️ Removing service:",
                id
            );

            const response =
                await axios.delete(
                    `${backendUrl}/api/services/${id}`
                );

            console.log(
                "Delete service response:",
                response.data
            );

            if (response.data?.success) {
                await fetchServices();

                return {
                    success: true,
                };
            }

            return {
                success: false,
                message:
                    response.data?.message ||
                    "Failed to delete service",
            };

        } catch (error) {
            console.error(
                "❌ Remove service error:",
                error
            );

            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Failed to delete service",
            };
        }
    };


    // =====================================================
    // GET DOCTOR APPOINTMENTS
    // =====================================================

    const fetchAppointments = async () => {
        try {
            console.log(
                "🔄 Fetching doctor appointments..."
            );

            const response = await axios.get(
                `${backendUrl}/api/appointments`
            );

            console.log(
                "📅 Appointments response:",
                response.data
            );

            if (response.data?.success) {
                const appointmentList =
                    response.data.data ||
                    response.data.appointments ||
                    [];

                console.log(
                    "📋 Doctor appointments found:",
                    appointmentList.length
                );

                setAppointments(
                    Array.isArray(appointmentList)
                        ? appointmentList
                        : []
                );
            } else {
                setAppointments([]);
            }

        } catch (error) {
            console.error(
                "❌ Error fetching appointments:",
                error
            );

            setAppointments([]);
        }
    };


    // =====================================================
    // GET SERVICE APPOINTMENTS
    // =====================================================

    const fetchServiceAppointments = async () => {
        try {
            console.log(
                "🔄 Fetching service appointments..."
            );

            const response = await axios.get(
                `${backendUrl}/api/service-appointments`
            );

            console.log(
                "🧾 Service appointments response:",
                response.data
            );

            if (response.data?.success) {
                const appointmentList =
                    response.data.data ||
                    response.data.appointments ||
                    response.data.appointment ||
                    [];

                console.log(
                    "📋 Service appointments found:",
                    appointmentList.length
                );

                setServiceAppointments(
                    Array.isArray(appointmentList)
                        ? appointmentList
                        : []
                );
            } else {
                setServiceAppointments([]);
            }

        } catch (error) {
            console.error(
                "❌ Error fetching service appointments:",
                error
            );

            setServiceAppointments([]);
        }
    };


    // =====================================================
    // LOAD ADMIN DATA
    // =====================================================

    useEffect(() => {
        fetchDoctors();
        fetchServices();
        fetchAppointments();
        fetchServiceAppointments();
    }, []);


    // =====================================================
    // CONTEXT VALUE
    // =====================================================

    return (
        <AdminDataContext.Provider
            value={{
                // Doctors
                doctors,
                addDoctor,
                removeDoctor,
                fetchDoctors,

                // Services
                services,
                fetchServices,
                removeService,

                // Doctor appointments
                appointments,
                fetchAppointments,

                // Service appointments
                serviceAppointments,
                fetchServiceAppointments,
            }}
        >
            {children}
        </AdminDataContext.Provider>
    );
}


// =====================================================
// CUSTOM HOOK
// =====================================================

export const useAdminData = () =>
    useContext(AdminDataContext);