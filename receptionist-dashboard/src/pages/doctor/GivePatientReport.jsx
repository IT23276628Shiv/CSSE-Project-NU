import React, { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../api/axiosInstance";
import { Card, Form, Button, Alert, ListGroup, Spinner, Badge, Container, Row, Col } from "react-bootstrap";
import Navbar from "../../components/Navbar";
import DoctorSidebar from "../../components/DoctorSidebar";
import { FaUserInjured, FaFileMedical, FaQrcode, FaSearch, FaPlus, FaHistory, FaStop, FaIdCard, FaPhone, FaMapMarkerAlt, FaVenusMars, FaCalendarAlt } from "react-icons/fa";

export default function GivePatientReport() {
  const [healthId, setHealthId] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [patient, setPatient] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const qrScannerRef = useRef(null);

  // Fetch patient info by Health Card ID
  const fetchPatient = async (id) => {
    try {
      setLoading(true);
      const res = await api.post("/doctor/patient", { 
        healthCardId: id, 
        doctorId: localStorage.getItem("doctorId") 
      });
      setPatient(res.data.patient);
      setAppointment(res.data.appointment);

      // Fetch past reports
      const reportsRes = await api.get(`/doctor/reports/${res.data.patient._id}`);
      setReports(reportsRes.data.reports);
      setAlert({ type: "success", message: "Patient loaded successfully" });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: "danger", 
        message: err.response?.data?.message || "Patient not found or no appointment" 
      });
      setPatient(null);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual search
  const handleSearch = () => {
    if (!healthId.trim()) {
      setAlert({ type: "warning", message: "Please enter Health Card ID" });
      return;
    }
    fetchPatient(healthId);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // QR Scanner
 const startScanner = () => {
  setScanning(true);
  setScanResult("");

  setTimeout(() => {
    const html5Qrcode = new Html5Qrcode("qr-reader");
    qrScannerRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setScanResult(decodedText);
          html5Qrcode.stop();
          setScanning(false);
          fetchPatient(decodedText);
        }
      )
      .catch((err) => {
        console.error("Scanner error:", err);
        setAlert({
          type: "danger",
          message: "Failed to start camera. Please check permissions and try again."
        });
        setScanning(false);
      });
  }, 500); // Delay to ensure DOM element is ready
};


  // Stop scanner
  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().then(() => {
        setScanning(false);
        qrScannerRef.current = null;
      }).catch(() => {
        setScanning(false);
        qrScannerRef.current = null;
      });
    } else {
      setScanning(false);
    }
  };

  // Add new report
  const handleAddReport = async () => {
    if (!message.trim()) {
      setAlert({ type: "warning", message: "Report cannot be empty" });
      return;
    }
    try {
      const res = await api.post("/doctor/report", {
        patientId: patient._id,
        doctorId: localStorage.getItem("doctorId"),
        appointmentId: appointment?._id,
        message
      });
      setReports([res.data.report, ...reports]);
      setMessage("");
      setAlert({ type: "success", message: "Report added successfully" });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: "danger", 
        message: err.response?.data?.message || "Error adding report" 
      });
    }
  };

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />

      {/* Sidebar + main content */}
      <div className="layout">
        <DoctorSidebar className="sidebar" />

        <div className="main-content">
          <Container fluid>
            {/* Page Header */}
            <div className="page-header mb-4">
              <h2 className="fw-bold text-primary mb-2">
                <FaFileMedical className="me-3" />
                Patient Medical Reports
              </h2>
              <p className="text-muted">Search for patients and create medical reports</p>
            </div>

            {alert.message && (
              <Alert 
                variant={alert.type} 
                className="mb-4 shadow-sm border-0"
                onClose={() => setAlert({ type: "", message: "" })} 
                dismissible
              >
                {alert.message}
              </Alert>
            )}

            {/* Search & QR Scan Section */}
            <Card className="mb-4 shadow-lg border-0">
              <Card.Header className="bg-primary text-white py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaSearch className="me-2" />
                  Find Patient
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark">
                        <FaIdCard className="me-2 text-primary" />
                        Health Card ID
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={healthId}
                        onChange={(e) => setHealthId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter patient's Health Card ID"
                        className="py-2 border-0 shadow-sm"
                        style={{ backgroundColor: '#f8f9fa' }}
                        disabled={scanning}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button 
                      className="w-100 py-2 fw-semibold"
                      onClick={handleSearch} 
                      disabled={!healthId.trim() || loading || scanning}
                      style={{ backgroundColor: '#198754', borderColor: '#198754' }}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Searching...
                        </>
                      ) : (
                        "Search Patient"
                      )}
                    </Button>
                  </Col>
                </Row>

                <div className="text-center my-4">
                  <div className="text-muted fw-semibold" style={{ fontSize: '0.9rem' }}>OR</div>
                </div>

                <div className="text-center">
                  {!scanning ? (
                    <Button 
                      className="btn-success px-4 py-2 fw-semibold"
                      onClick={startScanner}
                      disabled={loading}
                    >
                      <FaQrcode className="me-2" />
                      Scan QR Code
                    </Button>
                  ) : (
                    <div className="text-center">
                      <div className="mb-3">
                        <p className="text-muted mb-2">
                          <FaQrcode className="me-2" />
                          Point your camera at the patient's QR code
                        </p>
                        <div 
                          id="qr-reader" 
                          className="mx-auto border-2 border-success rounded-3 overflow-hidden"
                          style={{ 
                            width: "100%", 
                            maxWidth: "300px",
                            minHeight: "300px"
                          }}
                        ></div>
                      </div>
                      <Button 
                        variant="outline-danger" 
                        className="mt-3 px-4"
                        onClick={stopScanner}
                      >
                        <FaStop className="me-2" />
                        Stop Scanner
                      </Button>
                    </div>
                  )}
                  
                  {scanResult && !scanning && (
                    <Alert variant="success" className="mt-3">
                      <strong>✓ QR Scanned Successfully!</strong><br />
                      Health ID: <strong>{scanResult}</strong>
                    </Alert>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Patient Info & Add Report */}
            {patient && (
              <Row className="g-4">
                <Col lg={6}>
                  <Card className="shadow-lg border-0 h-100">
                    <Card.Header className="bg-info text-white py-3">
                      <h5 className="mb-0 d-flex align-items-center">
                        <FaUserInjured className="me-2" />
                        Patient Information
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="patient-info">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <h6 className="text-primary mb-0">Personal Details</h6>
                          <Badge bg="success">Active Patient</Badge>
                        </div>
                        
                        <div className="row g-3">
                          <div className="col-sm-6">
                            <div className="d-flex align-items-center mb-3">
                              <FaUserInjured className="text-primary me-2" />
                              <div>
                                <label className="text-muted small mb-1">Full Name</label>
                                <p className="fw-semibold text-dark mb-0">{patient.fullName}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-sm-6">
                            <div className="d-flex align-items-center mb-3">
                              <FaVenusMars className="text-primary me-2" />
                              <div>
                                <label className="text-muted small mb-1">Gender</label>
                                <p className="fw-semibold text-dark mb-0">{patient.gender}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-sm-6">
                            <div className="d-flex align-items-center mb-3">
                              <FaCalendarAlt className="text-primary me-2" />
                              <div>
                                <label className="text-muted small mb-1">Age</label>
                                <p className="fw-semibold text-dark mb-0">{patient.age} years</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-sm-6">
                            <div className="d-flex align-items-center mb-3">
                              <FaPhone className="text-primary me-2" />
                              <div>
                                <label className="text-muted small mb-1">Phone</label>
                                <p className="fw-semibold text-dark mb-0">{patient.phone}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* <div className="col-12">
                            <div className="d-flex align-items-start mb-3">
                              <FaMapMarkerAlt className="text-primary me-2 mt-1" />
                              <div>
                                <label className="text-muted small mb-1">Address</label>
                                <p className="fw-semibold text-dark mb-0">{patient.fullAddress}</p>
                              </div>
                            </div>
                          </div> */}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6}>
                  <Card className="shadow-lg border-0 h-100">
                    <Card.Header className="bg-warning text-dark py-3">
                      <h5 className="mb-0 d-flex align-items-center">
                        <FaFileMedical className="me-2" />
                        New Medical Report
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-4 d-flex flex-column">
                      <Form.Group className="flex-grow-1 mb-3">
                        <Form.Label className="fw-semibold text-dark mb-3">
                          Clinical Notes & Findings
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={10}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter detailed medical report including:
• Symptoms and observations
• Diagnosis and findings  
• Treatment plan and medications
• Follow-up instructions
• Any additional notes..."
                          className="border-0 shadow-sm"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            resize: 'vertical',
                            minHeight: '200px'
                          }}
                        />
                      </Form.Group>
                      <div className="mt-auto">
                        <Button 
                          className="w-100 py-3 fw-semibold"
                          onClick={handleAddReport}
                          disabled={!message.trim()}
                          style={{ 
                            backgroundColor: '#fd7e14', 
                            borderColor: '#fd7e14',
                            fontSize: '1.1rem'
                          }}
                        >
                          <FaPlus className="me-2" />
                          Save Medical Report
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Past Reports */}
            {reports.length > 0 && (
              <Card className="mt-4 shadow-lg border-0">
                <Card.Header className="bg-secondary text-white py-3">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaHistory className="me-2" />
                    Medical History & Previous Reports
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {reports.map((r, index) => (
                      <ListGroup.Item 
                        key={r._id} 
                        className={`p-4 ${index !== reports.length - 1 ? 'border-bottom' : ''}`}
                        style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="px-3 py-2 fw-semibold"
                          >
                            Report #{reports.length - index}
                          </Badge>
                          <small className="text-muted">
                            <FaCalendarAlt className="me-1" />
                            {new Date(r.createdAt).toLocaleString("en-GB", { 
                              timeZone: "Asia/Colombo",
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                        <div className="report-content">
                          <p 
                            className="mb-0 text-dark" 
                            style={{ 
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {r.message}
                          </p>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {/* Empty State for No Patient */}
            {!patient && !loading && (
              <Card className="text-center shadow-lg border-0 mt-4">
                <Card.Body className="py-5">
                  <FaUserInjured size={64} className="text-muted mb-3" />
                  <h5 className="text-muted">No Patient Selected</h5>
                  <p className="text-muted mb-0">
                    Use the search above or scan a QR code to load patient information
                  </p>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>

      {/* Enhanced CSS */}
      <style jsx>{`
        .layout {
          display: flex;
          min-height: calc(100vh - 56px);
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        /* Sidebar fixed */
        .sidebar {
          width: 250px;
          min-height: 100vh;
          position: fixed;
          top: 56px;
          left: 0;
          background: linear-gradient(180deg, #2c3e50 0%, #3498db 100%);
          overflow-y: auto;
          padding: 20px 0;
          z-index: 1000;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }

        /* Main content */
        .main-content {
          margin-left: 250px;
          flex: 1;
          padding: 30px;
          background: transparent;
        }

        /* Page Header */
        .page-header {
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 1rem;
        }

        /* Cards enhancement */
        .card {
          border-radius: 15px;
          border: none;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .card:hover {
          transform: translateY(-2px);
        }

        .card-header {
          border-radius: 15px 15px 0 0 !important;
          border: none;
          font-weight: 600;
        }

        /* Form controls */
        .form-control {
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
          border-color: #86b7fe;
        }

        /* Buttons */
        button {
          border-radius: 10px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        /* Patient info styling */
        .patient-info label {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .patient-info p {
          margin-bottom: 0;
          font-size: 1rem;
        }

        /* List group items */
        .list-group-item {
          border: none;
          transition: background-color 0.3s ease;
        }

        .list-group-item:hover {
          background-color: #e9ecef !important;
        }

        /* QR Scanner */
        #qr-reader {
          border: 3px solid #28a745 !important;
          border-radius: 10px;
        }

        #qr-reader__dashboard {
          display: none !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: relative;
            top: 0;
            min-height: auto;
          }
          .main-content {
            margin-left: 0;
            padding: 20px 15px;
          }
          
          .card-body {
            padding: 1.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .main-content {
            padding: 15px 10px;
          }
          
          .card-body {
            padding: 1rem !important;
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Loading overlay */
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}