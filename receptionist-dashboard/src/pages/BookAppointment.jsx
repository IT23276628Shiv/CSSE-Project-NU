// src/pages/BookAppointment.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./BookAppointment.css";

export default function BookAppointment() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Utility: format date to local YYYY-MM-DD ---
  const formatDateLocal = (date) => {
    return date.getFullYear() + "-" +
           String(date.getMonth() + 1).padStart(2, "0") + "-" +
           String(date.getDate()).padStart(2, "0");
  };

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/receptionist/patients");
        setPatients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
  }, []);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/receptionist/doctors");
        setDoctors(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch available times when doctor & date are selected
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!selectedDoctor || !appointmentDate) return;

      try {
        const dateStr = formatDateLocal(appointmentDate); // use local date
        const res = await api.get(
          `/receptionist/appointments/available-times?doctorId=${selectedDoctor._id}&date=${dateStr}`
        );
        setAvailableTimes(res.data);
      } catch (err) {
        console.error("Error fetching times:", err.response?.data || err);
        setAvailableTimes([]);
      }
    };
    fetchAvailableTimes();
  }, [selectedDoctor, appointmentDate]);

  // Submit appointment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedDoctor || !appointmentDate || !appointmentTime) {
      toast.warning("Please select patient, doctor, date, and time", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setIsSubmitting(true);

    const appointmentData = {
      doctorId: selectedDoctor._id,
      date: formatDateLocal(appointmentDate), // local date
      time: appointmentTime,
      healthCardId: selectedPatient.value,
    };

    try {
      await api.post("/receptionist/appointments/book", appointmentData);
      
      toast.success("🎉 Appointment booked successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setAppointmentDate(null);
      setAppointmentTime("");
      setAvailableTimes([]);
      
    } catch (err) {
      console.error("Booking error:", err.response?.data || err);
      
      toast.error(err.response?.data?.message || "❌ Appointment booking failed", {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options for react-select
  const patientOptions = patients.map((p) => ({
    value: p.healthCardId,
    label: `${p.fullName} (${p.healthCardId})`,
  }));

  const doctorOptions = doctors.map((d) => ({
    value: d._id,
    label: `${d.firstName} ${d.lastName} (${d.specialization})`,
  }));

  // Disable dates not in doctor's availableDays
  const filterDate = (date) => {
    if (!selectedDoctor || !selectedDoctor.availableDays) return false;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return selectedDoctor.availableDays.includes(dayName);
  };

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="booking-container">
            <div className="booking-header">
              <h1>📅 Book Appointment</h1>
              <p>Schedule a new appointment for your patient</p>
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
              {/* Patient Selection */}
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Select Patient
                  </label>
                  <Select
                    options={patientOptions}
                    value={selectedPatient}
                    onChange={setSelectedPatient}
                    isSearchable
                    placeholder="Search for a patient..."
                    className="custom-select"
                    classNamePrefix="custom-select"
                  />
                </div>

                {/* Doctor Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👨‍⚕️</span>
                    Select Doctor
                  </label>
                  <Select
                    options={doctorOptions}
                    value={
                      selectedDoctor
                        ? { value: selectedDoctor._id, label: `${selectedDoctor.firstName} ${selectedDoctor.lastName} (${selectedDoctor.specialization})` }
                        : null
                    }
                    onChange={(option) => {
                      const fullDoctor = doctors.find((d) => d._id === option.value);
                      setSelectedDoctor(fullDoctor);
                      setAppointmentDate(null);
                      setAppointmentTime("");
                      setAvailableTimes([]);
                    }}
                    isSearchable
                    placeholder="Search for a doctor..."
                    className="custom-select"
                    classNamePrefix="custom-select"
                  />
                </div>
              </div>

              {/* Date and Time Section */}
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📆</span>
                    Appointment Date
                  </label>
                  <DatePicker
                    selected={appointmentDate}
                    onChange={(date) => {
                      setAppointmentDate(date);
                      setAppointmentTime("");
                    }}
                    filterDate={filterDate}
                    placeholderText={selectedDoctor ? "Choose a date" : "Please select a doctor first"}
                    className="date-picker"
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    disabled={!selectedDoctor}
                  />
                </div>

                {/* Appointment Time */}
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⏰</span>
                    Appointment Time
                  </label>
                  <select
                    className="time-select"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    disabled={!availableTimes.length}
                  >
                    <option value="">{availableTimes.length ? "Select a time" : "No available times"}</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {availableTimes.length === 0 && appointmentDate && (
                    <div className="info-message">
                      No available times for selected date
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!selectedPatient || !selectedDoctor || !appointmentDate || !appointmentTime || isSubmitting}
                >
                  <span className="btn-icon">
                    {isSubmitting ? "⏳" : "✅"}
                  </span>
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </form>

            {/* Summary Card */}
            {(selectedPatient || selectedDoctor || appointmentDate) && (
              <div className="summary-card">
                <h3>Appointment Summary</h3>
                <div className="summary-details">
                  {selectedPatient && (
                    <div className="summary-item">
                      <strong>Patient:</strong> {selectedPatient.label}
                    </div>
                  )}
                  {selectedDoctor && (
                    <div className="summary-item">
                      <strong>Doctor:</strong> {selectedDoctor.firstName} {selectedDoctor.lastName}
                    </div>
                  )}
                  {appointmentDate && (
                    <div className="summary-item">
                      <strong>Date:</strong> {appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                  {appointmentTime && (
                    <div className="summary-item">
                      <strong>Time:</strong> {appointmentTime}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}