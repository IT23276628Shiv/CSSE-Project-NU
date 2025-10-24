import React, { useState } from "react";
import api from "../../api/axiosInstance";

export default function DoctorCheckModal({ booking, onClose, onBookingConfirmed }) {
  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAvailability = async () => {
    try {
      setLoading(true);
      const res = await api.post("/doctor/check", {
        doctorId: booking.doctor,
        date: booking.date,
        time: booking.time,
      });
      setAvailable(res.data.available);
    } catch (err) {
      console.error(err);
      alert("Error checking doctor availability");
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    try {
      setLoading(true);
      const res = await api.post("/booking/confirm", {
        bookingId: booking._id,
      });
      alert(res.data.message);
      onBookingConfirmed(); // Refresh bookings
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error confirming booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Doctor Availability</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p>
              Doctor: <strong>{booking.doctorName || booking.doctor}</strong>
              <br />
              Date: {booking.date}
              <br />
              Time: {booking.time}
            </p>
            <p>
              Status:{" "}
              {available === null ? "Not checked" : available ? "Available ✅" : "Unavailable ❌"}
            </p>
          </div>
          <div className="modal-footer">
            {available === null && (
              <button className="btn btn-primary" onClick={checkAvailability} disabled={loading}>
                {loading ? "Checking..." : "Check Availability"}
              </button>
            )}
            {available && (
              <button className="btn btn-success" onClick={confirmBooking} disabled={loading}>
                {loading ? "Confirming..." : "Confirm Appointment"}
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
