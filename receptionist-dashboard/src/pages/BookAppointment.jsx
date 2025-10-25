// src/pages/BookAppointment.jsx
import React, { useEffect, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function BookAppointment() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState(null);
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);

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
      alert("Please select patient, doctor, date, and time");
      return;
    }

    const appointmentData = {
      doctorId: selectedDoctor._id,
      date: formatDateLocal(appointmentDate), // local date
      time: appointmentTime,
      healthCardId: selectedPatient.value,
    };

    try {
      await api.post("/receptionist/appointments/book", appointmentData);
      alert("Appointment booked successfully!");
      // Reset form
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setAppointmentDate(null);
      setAppointmentTime("");
      setAvailableTimes([]);
    } catch (err) {
      console.error("Booking error:", err.response?.data || err);
      alert(err.response?.data?.message || "Booking failed");
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
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container mt-5">
          <h2>Book Appointment</h2>

          <form onSubmit={handleSubmit}>
            {/* Patient Selection */}
            <div className="mb-3">
              <label>Patient</label>
              <Select
                options={patientOptions}
                value={selectedPatient}
                onChange={setSelectedPatient}
                isSearchable
                placeholder="Type or select patient..."
              />
            </div>

            {/* Doctor Selection */}
            <div className="mb-3">
              <label>Doctor</label>
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
                placeholder="Type or select doctor..."
              />
            </div>

            {/* Appointment Date */}
            <div className="mb-3">
              <label>Date</label>
              <DatePicker
                selected={appointmentDate}
                onChange={(date) => {
                  setAppointmentDate(date);
                  setAppointmentTime("");
                }}
                filterDate={filterDate}
                placeholderText={selectedDoctor ? "Select a date" : "Select doctor first"}
                className="form-control"
                minDate={new Date()}
                dateFormat="yyyy-MM-dd"
                disabled={!selectedDoctor}
              />
            </div>

            {/* Appointment Time */}
            <div className="mb-3">
              <label>Time</label>
              <select
                className="form-control"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                disabled={!availableTimes.length}
              >
                <option value="">Select Time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Book Appointment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
