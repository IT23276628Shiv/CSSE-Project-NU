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
        date: new Date(date).toISOString(),   // server expects ISO date
        timeSlot: { start, end },
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
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {result?.available && (
          <Button variant="success" onClick={() => { /* call confirm booking if you want */ }}>
            Confirm Appointment
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
