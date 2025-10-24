import React, { useState } from "react";
import SearchSection from "./SearchSection";
import PatientProfileCard from "./PatientProfileCard";
import BookingTable from "./BookingTable";
import DoctorCheckModal from "./DoctorCheckModal";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
export default function CheckBooking() {
  const [patientData, setPatientData] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const handleBookingConfirmed = async () => {
    // Refetch patient bookings after confirmation
    if (!patientData?.healthId) return;
    const res = await fetch(`/api/receptionist/patient/${patientData.healthId}`);
    const data = await res.json();
    setPatientData(data.patient);
  };

  return (
      <div className="app-container">
        <Navbar name={localStorage.getItem("name")} />
        <div className="content-wrapper d-flex">
          <Sidebar />
            <div className="container p-4">
              <h3>Check Booking</h3>
              <SearchSection setPatientData={setPatientData} />
              {patientData && <PatientProfileCard patient={patientData} />}
              {patientData && (
                <BookingTable
                  bookings={patientData.bookings || []}
                  onCheckDoctor={(booking) => {
                    setSelectedBooking(booking);
                    setShowDoctorModal(true);
                  }}
                />
              )}
              {showDoctorModal && selectedBooking && (
                <DoctorCheckModal
                  booking={selectedBooking}
                  onClose={() => setShowDoctorModal(false)}
                  onBookingConfirmed={handleBookingConfirmed}
                />
              )}
            </div>
        </div>
    </div>
  );
}
