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
  const [isLoading, setIsLoading] = useState(false);

  const handleBookingConfirmed = async () => {
    if (!patientData?.healthId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/receptionist/patient/${patientData.healthId}`);
      const data = await res.json();
      setPatientData(data.patient);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="main-content-container">
          {/* Header with Clinic Info */}
          <div className="clinic-header">
            <div className="clinic-info">
              <div className="clinic-logo">
                <i className="bi bi-heart-pulse"></i>
              </div>
              <div>
                <h1 className="clinic-name">MediCare Center</h1>
                <p className="clinic-department">Appointment Management System</p>
              </div>
            </div>
            <div className="header-actions">
              <div className="current-time">
                <i className="bi bi-clock"></i>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {patientData && (
                <div className="patient-indicator">
                  <div className="indicator-dot"></div>
                  <span>Patient Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-icon appointment">
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className="stat-info">
                <span className="stat-number">{patientData?.bookings?.length || 0}</span>
                <span className="stat-label">Total Appointments</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon pending">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="stat-info">
                <span className="stat-number">
                  {patientData?.bookings?.filter(b => b.status === 'CANCELLED')?.length || 0}
                </span>
                <span className="stat-label">Cancel</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon confirmed">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-number">
                  {patientData?.bookings?.filter(b => b.status === 'CONFIRMED')?.length || 0}
                </span>
                <span className="stat-label">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content">
            {/* Top Row - Search & Profile Side by Side */}
            <div className="top-row">
              {/* Search Card */}
              <div className="content-card search-section">
                <div className="card-header with-icon">
                  <div className="header-icon primary">
                    <i className="bi bi-search-heart"></i>
                  </div>
                  <div>
                    <h3>Patient Search</h3>
                    <p>Find patient by Health ID, Name, or Phone</p>
                  </div>
                </div>
                <div className="card-content">
                  <SearchSection setPatientData={setPatientData} />
                </div>
              </div>

              {/* Patient Profile Card */}
              {patientData && (
                <div className="content-card profile-section">
                  <div className="card-header with-icon">
                    <div className="header-icon success">
                      <i className="bi bi-person-badge"></i>
                    </div>
                    <div>
                      <h3>Patient Profile</h3>
                      <p>Personal and medical information</p>
                    </div>
                  </div>
                  <div className="card-content">
                    <PatientProfileCard patient={patientData} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Row - Appointments */}
            <div className="bottom-row">
              {patientData ? (
                <div className="content-card appointments-section">
                  <div className="card-header with-icon">
                    <div className="header-icon warning">
                      <i className="bi bi-clipboard2-pulse"></i>
                    </div>
                    <div>
                      <h3>Appointment History</h3>
                      <p>Manage patient appointments and schedules</p>
                    </div>
                    <div className="header-badge">
                      <span className="badge-count">{patientData.bookings?.length || 0}</span>
                      <span>Appointments</span>
                    </div>
                  </div>
                  <div className="card-content full-height">
                    {isLoading ? (
                      <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Updating appointments...</p>
                      </div>
                    ) : (
                      <BookingTable
                        bookings={patientData.bookings || []}
                        onCheckDoctor={(booking) => {
                          setSelectedBooking(booking);
                          setShowDoctorModal(true);
                        }}
                        onBookingUpdated={async () => {
                          if (!patientData?.healthId) return;
                          setIsLoading(true);
                          try {
                            const res = await fetch(`/api/receptionist/patient/${patientData.healthId}`);
                            const data = await res.json();
                            setPatientData(data.patient);
                          } catch (error) {
                            console.error("Error updating bookings:", error);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="content-card empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">
                      <i className="bi bi-person-plus"></i>
                    </div>
                    <h4>No Patient Selected</h4>
                    <p>Search for a patient to view their appointment history and manage bookings</p>
                    <div className="empty-actions">
                      <i className="bi bi-arrow-up"></i>
                      <span>Use the search panel above to find a patient</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Check Modal */}
          {showDoctorModal && selectedBooking && (
            <DoctorCheckModal
              booking={selectedBooking}
              onClose={() => setShowDoctorModal(false)}
              onBookingConfirmed={async () => {
                if (!patientData?.healthId) return;
                setIsLoading(true);
                try {
                  const res = await fetch(`/api/receptionist/patient/${patientData.healthId}`);
                  const data = await res.json();
                  setPatientData(data.patient);
                  setShowDoctorModal(false);
                } catch (error) {
                  console.error("Error confirming booking:", error);
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .app-container {
          background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
          min-height: 100vh;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .content-wrapper {
          min-height: calc(100vh - 70px);
        }

        .main-content-container {
          flex: 1;
          padding: 1.5rem 2rem;
          background: #f8fbff;
          overflow-x: hidden;
        }

        /* Clinic Header */
        .clinic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e1e8f0;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .clinic-logo {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #3498db, #2980b9);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .clinic-name {
          color: #2c3e50;
          font-weight: 700;
          font-size: 1.5rem;
          margin: 0;
        }

        .clinic-department {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .current-time {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          color: #2c3e50;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e1e8f0;
        }

        .patient-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #e8f5e8;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #27ae60;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid #c8e6c9;
        }

        .indicator-dot {
          width: 8px;
          height: 8px;
          background: #27ae60;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* Stats Bar */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-item {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e1e8f0;
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .stat-icon.appointment { background: linear-gradient(135deg, #3498db, #2980b9); }
        .stat-icon.pending { background: linear-gradient(135deg, #f39c12, #e67e22); }
        .stat-icon.confirmed { background: linear-gradient(135deg, #27ae60, #229954); }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #7f8c8d;
          font-weight: 500;
        }

        /* Main Content Layout */
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Top Row - Search and Profile Side by Side */
        .top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        /* Bottom Row - Appointments Full Width */
        .bottom-row {
          width: 100%;
        }

        /* Content Cards */
        .content-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e1e8f0;
          overflow: hidden;
          height: fit-content;
        }

        .search-section {
          min-height: 300px;
        }

        .profile-section {
          min-height: 300px;
        }

        .appointments-section {
          min-height: 500px;
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e1e8f0;
          background: #fafbfc;
        }

        .card-header.with-icon {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: white;
        }

        .header-icon.primary { background: linear-gradient(135deg, #3498db, #2980b9); }
        .header-icon.success { background: linear-gradient(135deg, #27ae60, #229954); }
        .header-icon.warning { background: linear-gradient(135deg, #f39c12, #e67e22); }

        .card-header h3 {
          margin: 0;
          color: #2c3e50;
          font-weight: 600;
          font-size: 1.3rem;
        }

        .card-header p {
          margin: 0.25rem 0 0 0;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .header-badge {
          margin-left: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #f8f9fa;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .badge-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #3498db;
          line-height: 1;
        }

        .card-content {
          padding: 1.5rem;
        }

        .card-content.full-height {
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }

        /* Empty State */
        .empty-state {
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .empty-content {
          text-align: center;
          padding: 3rem 2rem;
          color: #7f8c8d;
        }

        .empty-icon {
          font-size: 4rem;
          color: #bdc3c7;
          margin-bottom: 1rem;
        }

        .empty-content h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .empty-content p {
          font-size: 1rem;
          margin-bottom: 1.5rem;
        }

        .empty-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px dashed #bdc3c7;
          font-weight: 500;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #7f8c8d;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        /* Animations */
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .top-row {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .search-section,
          .profile-section {
            min-height: auto;
          }
        }

        @media (max-width: 768px) {
          .main-content-container {
            padding: 1rem;
          }
          
          .clinic-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          
          .stats-bar {
            grid-template-columns: 1fr;
          }
          
          .top-row {
            gap: 1rem;
          }
        }

        @media (max-width: 576px) {
          .card-header.with-icon {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }
          
          .header-badge {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}