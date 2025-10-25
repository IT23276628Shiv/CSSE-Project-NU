// DoctorCheckModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import api from "../../api/axiosInstance";

export default function DoctorCheckModal({ booking, onClose, onBookingConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // pre-fill date/time from booking (if available)
  const [date, setDate] = useState(booking?.date ? new Date(booking.date).toISOString().slice(0,10) : "");
  const [start, setStart] = useState(booking?.timeSlot?.start || "");
  const [end, setEnd] = useState(booking?.timeSlot?.end || "");

  useEffect(() => {
    if (booking) {
      setDate(booking.date ? new Date(booking.date).toISOString().slice(0,10) : "");
      setStart(booking.timeSlot?.start || "");
      setEnd(booking.timeSlot?.end || "");
      setResult(null);
    }
  }, [booking]);

  const handleCheckAvailability = async () => {
    if (!booking?.doctor?._id || !date || !start || !end) {
      setResult({ available: false, message: "Missing doctor/date/time" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // Use axios instance with baseURL '/api'
      const res = await api.post("/receptionist/check-availability", {
        doctorId: booking.doctor._id,
        date: new Date(date).toISOString(),
        timeSlot: { start, end },
        currentBookingId: booking._id, // 👈 important
      });

      // res.data should be { available: boolean, message: string, ... }
      setResult(res.data);
    } catch (err) {
      console.error("Check availability error:", err);
      // show server error message when available
      setResult({ available: false, message: err.response?.data?.message || "Server error" });
    } finally {
      setLoading(false);
    }
  };
  
    const isTodaySriLanka = (dateStr) => {
      const inputDate = new Date(dateStr);

      // Get current time in UTC+5:30
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const sriLankaDate = new Date(utc + 5.5 * 60 * 60 * 1000);

      // Only compare year, month, day
      return (
        inputDate.getFullYear() === sriLankaDate.getFullYear() &&
        inputDate.getMonth() === sriLankaDate.getMonth() &&
        inputDate.getDate() === sriLankaDate.getDate()
      );
    };
  const handleConfirmBooking = async () => {
    if (!booking?._id) return;

    setLoading(true);
    try {
      const res = await api.post("/receptionist/booking/confirm", { bookingId: booking._id });

      // Show success in modal
      setResult({ available: true, message: res.data.message });

      // Refresh parent booking list
      if (onBookingConfirmed) onBookingConfirmed();

      // ✅ Close the modal automatically
      onClose(); 
    } catch (err) {
      console.error("Error confirming booking:", err);
      setResult({ available: false, message: err.response?.data?.message || "Server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Check Doctor Availability</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Doctor:</strong> {booking?.doctor?.firstName ?? booking?.doctor?._id}</p>

        <label>Date</label>
        <input className="form-control mb-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>Start</label>
        <input className="form-control mb-2" type="time" value={start} onChange={(e) => setStart(e.target.value)} />

        <label>End</label>
        <input className="form-control mb-2" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />

        <div className="text-center mt-2">
          <Button variant="primary" onClick={handleCheckAvailability} disabled={loading}>
            {loading ? <><Spinner animation="border" size="sm" /> Checking...</> : "Check"}
          </Button>
        </div>

        {result && (
          <Alert className="mt-3 text-center" variant={result.available ? "success" : "danger"}>
            {result.message}
          </Alert>
        )}
      </Modal.Body>
<Modal.Footer>
  {/* Confirm button: show only if booking is NOT cancelled */}
  {booking.status == "BOOKED" && (
    <Button
      variant="success"
      onClick={handleConfirmBooking}
      disabled={
        !isTodaySriLanka(date) || 
        loading || 
        booking.status === "CONFIRMED"
      }
      title={
        booking.status === "CONFIRMED"
          ? "Booking already confirmed"
          : !isTodaySriLanka(date)
          ? "Can only confirm for today's date"
          : ""
      }
    >
      {booking.status === "CONFIRMED"
        ? "Already Confirmed"
        : loading
        ? <><Spinner animation="border" size="sm" /> Confirming...</>
        : "Confirm Appointment"}
    </Button>
  )}

  {/* Cancel button: show only if booking is NOT confirmed */}
  {booking.status == "BOOKED" && (
    <Button
      variant="danger"
      onClick={async () => {
        const reason = prompt("Enter cancellation reason:");
        if (!reason) return; // user cancelled prompt

        const confirmed = window.confirm(
          "Are you sure you want to cancel this appointment?"
        );
        if (!confirmed) return;

        setLoading(true);
        try {
          const res = await api.post("/receptionist/booking/cancel", {
            bookingId: booking._id,
            reason,
            cancelledBy: {
              userId: localStorage.getItem("userId"),
              userType: "STAFF"
            }
          });
          alert(res.data.message);
          if (onBookingConfirmed) onBookingConfirmed();
          onClose();
        } catch (err) {
          console.error("Cancel booking error:", err);
          alert(err.response?.data?.message || "Server error");
        } finally {
          setLoading(false);
        }
      }}
    >
      Cancel Appointment
    </Button>
  )}
</Modal.Footer>



    </Modal>
  );
}
