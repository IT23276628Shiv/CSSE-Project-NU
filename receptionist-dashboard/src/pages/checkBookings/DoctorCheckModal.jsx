// DoctorCheckModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner, Alert, Form } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/axiosInstance";

export default function DoctorCheckModal({ booking, onClose, onBookingConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

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
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/receptionist/check-availability", {
        doctorId: booking.doctor._id,
        date: new Date(date).toISOString(),
        timeSlot: { start, end },
        currentBookingId: booking._id,
      });

      setResult(res.data);
      
      if (res.data.available) {
        toast.success("Doctor is available for this time slot!");
      } else {
        toast.warning("Doctor is not available for this time slot");
      }
    } catch (err) {
      console.error("Check availability error:", err);
      setResult({ available: false, message: err.response?.data?.message || "Server error" });
      toast.error(err.response?.data?.message || "Error checking availability");
    } finally {
      setLoading(false);
    }
  };
  
  const isTodaySriLanka = (dateStr) => {
    const inputDate = new Date(dateStr);
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const sriLankaDate = new Date(utc + 5.5 * 60 * 60 * 1000);

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

      setResult({ available: true, message: res.data.message });
      toast.success("Appointment confirmed successfully!");

      if (onBookingConfirmed) onBookingConfirmed();
      onClose(); 
    } catch (err) {
      console.error("Error confirming booking:", err);
      setResult({ available: false, message: err.response?.data?.message || "Server error" });
      toast.error(err.response?.data?.message || "Error confirming appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/receptionist/booking/cancel", {
        bookingId: booking._id,
        reason: cancelReason,
        cancelledBy: {
          userId: localStorage.getItem("userId"),
          userType: "STAFF"
        }
      });
      
      toast.success("Appointment cancelled successfully!");
      if (onBookingConfirmed) onBookingConfirmed();
      setShowCancelModal(false);
      onClose();
    } catch (err) {
      console.error("Cancel booking error:", err);
      toast.error(err.response?.data?.message || "Error cancelling appointment");
    } finally {
      setLoading(false);
      setCancelReason("");
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason("");
  };

  return (
    <>
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
      
      {/* Main Modal */}
      <Modal show onHide={onClose} centered className="doctor-check-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            <i className="fas fa-calendar-check me-2"></i>
            Check Doctor Availability
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="modal-body-custom">
          {/* Doctor Info Card */}
          <div className="doctor-info-card">
            <div className="doctor-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="doctor-details">
              <h6 className="doctor-name">
                Dr. {booking?.doctor?.firstName} {booking?.doctor?.lastName}
              </h6>
              <span className="doctor-specialty">
                {booking?.doctor?.specialization || "General Practitioner"}
              </span>
            </div>
          </div>

          {/* Date & Time Inputs */}
          <div className="time-input-section">
            <div className="input-group">
              <label className="input-label">
                <i className="fas fa-calendar-day me-2"></i>
                Appointment Date
              </label>
              <div className="date-input-container">
                <input 
                  className="form-control date-input-field" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
                <i className="fas fa-calendar input-icon"></i>
              </div>
            </div>

            <div className="time-inputs-row">
              <div className="input-group">
                <label className="input-label">
                  <i className="fas fa-play-circle me-2"></i>
                  Start Time
                </label>
                <div className="time-input-container">
                  <input 
                    className="form-control time-input-field" 
                    type="time" 
                    value={start} 
                    onChange={(e) => setStart(e.target.value)} 
                  />
                  <i className="fas fa-clock input-icon"></i>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <i className="fas fa-stop-circle me-2"></i>
                  End Time
                </label>
                <div className="time-input-container">
                  <input 
                    className="form-control time-input-field" 
                    type="time" 
                    value={end} 
                    onChange={(e) => setEnd(e.target.value)} 
                  />
                  <i className="fas fa-clock input-icon"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Check Availability Button */}
          <div className="check-button-container">
            <Button 
              variant="primary" 
              onClick={handleCheckAvailability} 
              disabled={loading}
              className="check-availability-btn"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> 
                  Checking Availability...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  Check Availability
                </>
              )}
            </Button>
          </div>

          {/* Result Alert */}
          {result && (
            <Alert className={`result-alert mt-3 text-center ${result.available ? 'alert-success' : 'alert-danger'}`}>
              <div className="alert-content">
                <i className={`fas ${result.available ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2`}></i>
                {result.message}
              </div>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          {booking?.status === "BOOKED" && (
            <Button
              variant="success"
              onClick={handleConfirmBooking}
              disabled={
                !isTodaySriLanka(date) || 
                loading || 
                booking.status === "CONFIRMED"
              }
              className="confirm-btn"
              title={
                booking.status === "CONFIRMED"
                  ? "Booking already confirmed"
                  : !isTodaySriLanka(date)
                  ? "Can only confirm for today's date"
                  : ""
              }
            >
              {booking.status === "CONFIRMED" ? (
                <>
                  <i className="fas fa-check-circle me-2"></i>
                  Already Confirmed
                </>
              ) : loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" /> 
                  Confirming...
                </>
              ) : (
                <>
                  <i className="fas fa-calendar-check me-2"></i>
                  Confirm Appointment
                </>
              )}
            </Button>
          )}

          {booking?.status === "BOOKED" && (
            <Button
              variant="outline-danger"
              onClick={handleCancelBooking}
              disabled={loading}
              className="cancel-btn"
            >
              <i className="fas fa-times-circle me-2"></i>
              Cancel Appointment
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={onClose}
            className="close-btn"
          >
            <i className="fas fa-times me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered className="cancel-confirmation-modal">
        <Modal.Header closeButton className="cancel-modal-header">
          <Modal.Title className="cancel-modal-title">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Cancel Appointment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="cancel-modal-body">
          <div className="warning-section">
            <i className="fas fa-exclamation-circle warning-icon"></i>
            <h6>Are you sure you want to cancel this appointment?</h6>
            <p className="text-muted">This action cannot be undone.</p>
          </div>
          
          <Form.Group className="reason-input-group">
            <Form.Label className="reason-label">
              <i className="fas fa-comment-dots me-2"></i>
              Cancellation Reason *
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Please provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="reason-textarea"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="cancel-modal-footer">
          <Button 
            variant="secondary" 
            onClick={closeCancelModal}
            className="cancel-modal-close-btn"
          >
            <i className="fas fa-times me-2"></i>
            Keep Appointment
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmCancellation}
            disabled={!cancelReason.trim() || loading}
            className="cancel-modal-confirm-btn"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cancelling...
              </>
            ) : (
              <>
                <i className="fas fa-ban me-2"></i>
                Confirm Cancellation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .doctor-check-modal {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom: none;
          padding: 1.5rem;
        }

        .modal-title-custom {
          font-weight: 600;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
        }

        .modal-body-custom {
          padding: 2rem;
          background: #f8f9fa;
        }

        .modal-footer-custom {
          border-top: 1px solid #e3e6f0;
          padding: 1.5rem;
          background: white;
          gap: 0.75rem;
        }

        /* Doctor Info Card */
        .doctor-info-card {
          display: flex;
          align-items: center;
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 1.5rem;
          border-left: 4px solid #4e73df;
        }

        .doctor-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          margin-right: 1rem;
        }

        .doctor-details {
          flex: 1;
        }

        .doctor-name {
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
        }

        .doctor-specialty {
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Time Input Section */
        .time-input-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 1.5rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group:last-child {
          margin-bottom: 0;
        }

        .input-label {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.75rem;
          display: block;
          font-size: 0.95rem;
        }

        /* Date and Time Input Containers */
        .date-input-container,
        .time-input-container {
          position: relative;
        }

        .date-input-field,
        .time-input-field {
          border: 2px solid #e3e6f0;
          border-radius: 10px;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          background: #ffffff;
          height: 50px;
        }

        .date-input-field:focus,
        .time-input-field:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.3rem rgba(102, 126, 234, 0.15);
          background: #ffffff;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #667eea;
          font-size: 1rem;
          z-index: 2;
        }

        /* Remove default calendar icon in some browsers */
        .date-input-field::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }

        .time-inputs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        /* Check Button */
        .check-button-container {
          text-align: center;
          margin-bottom: 1rem;
        }

        .check-availability-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          min-width: 220px;
          height: 50px;
        }

        .check-availability-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .check-availability-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Result Alert */
        .result-alert {
          border: none;
          border-radius: 10px;
          padding: 1.25rem 1.5rem;
          font-weight: 500;
          font-size: 1rem;
        }

        .alert-success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          border-left: 4px solid #28a745;
        }

        .alert-danger {
          background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);
          color: #721c24;
          border-left: 4px solid #dc3545;
        }

        .alert-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Footer Buttons */
        .confirm-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 180px;
        }

        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }

        .cancel-btn {
          border: 2px solid #dc3545;
          color: #dc3545;
          background: transparent;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 160px;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #dc3545;
          color: white;
          transform: translateY(-2px);
        }

        .close-btn {
          background: #6c757d;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .close-btn:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        /* Cancellation Modal Styles */
        .cancel-confirmation-modal {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .cancel-modal-header {
          background: linear-gradient(135deg, #e74a3b 0%, #f6c23e 100%);
          color: white;
          border-bottom: none;
          padding: 1.5rem;
        }

        .cancel-modal-title {
          font-weight: 600;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
        }

        .cancel-modal-body {
          padding: 2rem;
          background: #f8f9fa;
        }

        .warning-section {
          text-align: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 10px;
          border-left: 4px solid #f6c23e;
        }

        .warning-icon {
          font-size: 3rem;
          color: #f6c23e;
          margin-bottom: 1rem;
        }

        .warning-section h6 {
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .reason-input-group {
          margin-bottom: 0;
        }

        .reason-label {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.75rem;
          display: block;
        }

        .reason-textarea {
          border: 2px solid #e3e6f0;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          resize: vertical;
        }

        .reason-textarea:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        .cancel-modal-footer {
          border-top: 1px solid #e3e6f0;
          padding: 1.5rem;
          background: white;
          gap: 0.75rem;
        }

        .cancel-modal-close-btn {
          background: #6c757d;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cancel-modal-close-btn:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .cancel-modal-confirm-btn {
          background: linear-gradient(135deg, #e74a3b 0%, #dc3545 100%);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .cancel-modal-confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(231, 74, 59, 0.4);
        }

        /* Responsive Design */
        @media (max-width: 576px) {
          .modal-body-custom,
          .cancel-modal-body {
            padding: 1.5rem;
          }

          .time-inputs-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .doctor-info-card {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
          }

          .doctor-avatar {
            margin-right: 0;
            margin-bottom: 0.75rem;
          }

          .modal-footer-custom,
          .cancel-modal-footer {
            flex-direction: column;
          }

          .modal-footer-custom .btn,
          .cancel-modal-footer .btn {
            width: 100%;
            margin: 0.25rem 0;
          }

          .check-availability-btn {
            min-width: 100%;
          }
        }

        /* Loading States */
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Icon animations */
        .fas {
          transition: transform 0.2s ease;
        }

        .btn:hover .fas {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}