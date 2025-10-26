import React from "react";
import { toast } from "react-toastify";

export default function BookingTable({ bookings, onCheckDoctor }) {
  const handleCheckDoctor = (booking) => {
    if (!booking.doctor) {
      toast.warning("No doctor assigned to this booking", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    onCheckDoctor(booking);
    toast.info("Opening doctor details...", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "CONFIRMED":
        return { class: "status-confirmed", icon: "bi-check-circle" };
      case "PENDING":
        return { class: "status-pending", icon: "bi-clock" };
      case "CANCELLED":
        return { class: "status-cancelled", icon: "bi-x-circle" };
      case "COMPLETED":
        return { class: "status-completed", icon: "bi-check-all" };
      default:
        return { class: "status-unknown", icon: "bi-question-circle" };
    }
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bookings-empty-state">
        <div className="empty-icon">
          <i className="bi bi-calendar-x"></i>
        </div>
        <h4>No Appointments Found</h4>
        <p>This patient doesn't have any scheduled appointments yet.</p>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <div className="bookings-title-section">
          <i className="bi bi-calendar-week bookings-title-icon"></i>
          <div>
            <h3 className="bookings-title">Appointment Schedule</h3>
            <p className="bookings-subtitle">{bookings.length} appointment(s) found</p>
          </div>
        </div>
        <div className="bookings-stats">
          <div className="stat-item">
            <span className="stat-number">
              {bookings.filter(b => b.status === "CONFIRMED").length}
            </span>
            <span className="stat-label">Confirmed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {bookings.filter(b => b.status === "CANCELLED").length}
            </span>
            <span className="stat-label">Cancel</span>
          </div>
                    <div className="stat-item">
            <span className="stat-number">
              {bookings.filter(b => b.status === "BOOKED").length}
            </span>
            <span className="stat-label">Booked</span>
          </div>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th className="col-doctor">
                <i className="bi bi-person-badge me-2"></i>
                Doctor
              </th>
              <th className="col-date">
                <i className="bi bi-calendar-date me-2"></i>
                Date
              </th>
              <th className="col-time">
                <i className="bi bi-clock me-2"></i>
                Time Slot
              </th>
              <th className="col-status">
                <i className="bi bi-info-circle me-2"></i>
                Status
              </th>
              <th className="col-actions">
                <i className="bi bi-gear me-2"></i>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => {
              const statusInfo = getStatusVariant(booking.status);
              return (
                <tr key={booking._id || index} className="booking-row">
                  <td className="doctor-cell">
                    <div className="doctor-info">
                      <div className="doctor-avatar">
                        <i className="bi bi-person-circle"></i>
                      </div>
                      <div className="doctor-details">
                        <span className="doctor-name">
                          {booking.doctor 
                            ? `${booking.doctor.firstName} ${booking.doctor.lastName}`
                            : "Not Assigned"
                          }
                        </span>
                        {booking.doctor?.specialization && (
                          <span className="doctor-specialization">
                            {booking.doctor.specialization}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="date-cell">
                    <div className="date-display">
                      <span className="date-day">
                        {new Date(booking.date).toLocaleDateString('en-US', { 
                          weekday: 'short' 
                        })}
                      </span>
                      <span className="date-main">
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="time-cell">
                    {booking.timeSlot ? (
                      <div className="time-slot">
                        <i className="bi bi-clock-fill time-icon"></i>
                        <span className="time-range">
                          {booking.timeSlot.start} - {booking.timeSlot.end}
                        </span>
                      </div>
                    ) : (
                      <span className="time-na">Not specified</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <div className={`status-badge ${statusInfo.class}`}>
                      <i className={`bi ${statusInfo.icon} status-icon`}></i>
                      <span className="status-text">{booking.status}</span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button
                      className={`action-btn ${!booking.doctor ? 'btn-disabled' : 'btn-primary'}`}
                      onClick={() => handleCheckDoctor(booking)}
                      disabled={!booking.doctor}
                      title={!booking.doctor ? "No doctor assigned" : "View doctor details"}
                    >
                      <i className="bi bi-person-check me-1"></i>
                      Check Doctor
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .bookings-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid #dee2e6;
        }

        .bookings-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bookings-title-icon {
          font-size: 2rem;
          color: #3498db;
          background: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
        }

        .bookings-title {
          margin: 0;
          color: #2c3e50;
          font-weight: 700;
          font-size: 1.4rem;
        }

        .bookings-subtitle {
          margin: 0.25rem 0 0 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .bookings-stats {
          display: flex;
          gap: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #7f8c8d;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .bookings-table-container {
          overflow-x: auto;
        }

        .bookings-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .bookings-table th {
          background: #f8f9fa;
          padding: 1rem 1.5rem;
          text-align: left;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 2px solid #dee2e6;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bookings-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }

        .booking-row {
          transition: all 0.3s ease;
          background: white;
        }

        .booking-row:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .doctor-cell {
          min-width: 200px;
        }

        .doctor-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .doctor-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
        }

        .doctor-details {
          display: flex;
          flex-direction: column;
        }

        .doctor-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95rem;
        }

        .doctor-specialization {
          font-size: 0.8rem;
          color: #7f8c8d;
          margin-top: 0.1rem;
        }

        .date-cell {
          min-width: 120px;
        }

        .date-display {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .date-day {
          font-size: 0.8rem;
          color: #7f8c8d;
          font-weight: 500;
          text-transform: uppercase;
        }

        .date-main {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .time-cell {
          min-width: 120px;
        }

        .time-slot {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-icon {
          color: #e74c3c;
          font-size: 0.9rem;
        }

        .time-range {
          font-weight: 500;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .time-na {
          color: #bdc3c7;
          font-style: italic;
          font-size: 0.85rem;
        }

        .status-cell {
          min-width: 120px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-confirmed {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .status-cancelled {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .status-completed {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .status-unknown {
          background: #e2e3e5;
          color: #383d41;
          border: 1px solid #d6d8db;
        }

        .status-icon {
          font-size: 0.7rem;
        }

        .actions-cell {
          min-width: 140px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
          background: linear-gradient(135deg, #2980b9, #2471a3);
        }

        .btn-disabled {
          background: #bdc3c7;
          color: #7f8c8d;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .bookings-empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: #7f8c8d;
        }

        .empty-icon {
          font-size: 4rem;
          color: #bdc3c7;
          margin-bottom: 1rem;
        }

        .bookings-empty-state h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .bookings-empty-state p {
          margin: 0;
          font-size: 0.95rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .bookings-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .bookings-stats {
            width: 100%;
            justify-content: space-between;
          }

          .bookings-table {
            min-width: 600px;
          }

          .bookings-table th,
          .bookings-table td {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}