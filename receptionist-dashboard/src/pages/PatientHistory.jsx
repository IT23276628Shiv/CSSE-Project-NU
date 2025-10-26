// src/pages/PatientHistory.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Spinner,
  Alert,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Modal,
  Form,
} from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  fetchPatientHistory,
  updatePatient,
  formatDate,
  savePatientUpdates
} from "../pages/functionsset/viewpatientfunction";

export default function PatientHistory() {
  const { id } = useParams();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  // ✅ Fetch Patient History
  useEffect(() => {
    const getHistory = async () => {
      try {
        const data = await fetchPatientHistory(id);
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load patient history.");
      } finally {
        setLoading(false);
      }
    };
    getHistory();
  }, [id]);

  // ✅ Edit Button Click
  const handleEdit = () => {
    setFormData({ ...history.personalInfo });
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  // ✅ Handle Field Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save Changes
  const handleSave = async () => {
    try {
      const updated = await savePatientUpdates(id, formData);
      setHistory(updated);
      setShowModal(false);
      alert("Patient information updated successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div className="app-container">
        <Navbar name={localStorage.getItem("name")} />
        <div className="content-wrapper d-flex">
          <Sidebar />
          <div className="container-fluid mt-4 px-4">
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5 className="text-muted">Loading patient details...</h5>
              <p className="text-muted small">Please wait while we fetch the records</p>
            </div>
          </div>
        </div>
      </div>
    );

  if (error) return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 px-4">
          <Alert variant="danger" className="mx-auto" style={{maxWidth: '600px'}}>
            <div className="text-center">
              <i className="bi bi-exclamation-triangle-fill display-4 text-danger mb-3"></i>
              <h5>Unable to Load Patient History</h5>
              <p className="mb-3">{error}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );

  if (!history) return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 px-4">
          <Alert variant="info" className="mx-auto" style={{maxWidth: '600px'}}>
            <div className="text-center">
              <i className="bi bi-info-circle display-4 text-info mb-3"></i>
              <h5>No Data Available</h5>
              <p>No patient history records found for this patient.</p>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );

  const { personalInfo, appointments, medicalReports } = history;

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 px-4">
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button 
                variant="outline-secondary" 
                className="d-flex align-items-center mb-2"
                onClick={() => navigate(-1)}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Patients
              </Button>
              <h2 className="text-primary fw-bold mb-1">Patient History</h2>
              <p className="text-muted mb-0">Comprehensive overview of patient records and medical history</p>
            </div>
            <div className="text-end">
              <Badge bg="light" text="dark" className="fs-6 p-2 me-2">
                Patient ID: {id.substring(0, 8)}...
              </Badge>
              <Button 
                variant="warning" 
                className="d-flex align-items-center"
                onClick={handleEdit}
              >
                <i className="bi bi-pencil-square me-2"></i>
                Update Info
              </Button>
            </div>
          </div>

          {/* ===== Personal Info Card ===== */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-gradient-primary text-white py-3 border-0">
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                  <i className="bi bi-person-fill text-white fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Personal Information</h5>
                  <small className="opacity-75">Patient demographics and contact details</small>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <Row>
                <Col md={3} className="text-center mb-4 mb-md-0">
                  {personalInfo.qrCode && (
                    <div className="border rounded p-3 bg-light d-inline-block">
                      <img
                        src={personalInfo.qrCode}
                        alt="QR Code"
                        className="img-fluid"
                        width="150"
                      />
                      <div className="mt-2">
                        <small className="text-muted">Health Card QR</small>
                      </div>
                    </div>
                  )}
                </Col>
                <Col md={9}>
                  <Row>
                    <Col md={6}>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Full Name</label>
                        <p className="fw-semibold mb-0 fs-6">{personalInfo.fullName}</p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Email Address</label>
                        <p className="fw-semibold mb-0 fs-6">
                          <i className="bi bi-envelope me-2 text-primary"></i>
                          {personalInfo.email}
                        </p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Phone Number</label>
                        <p className="fw-semibold mb-0 fs-6">
                          <i className="bi bi-telephone me-2 text-primary"></i>
                          {personalInfo.phone || "Not provided"}
                        </p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Gender</label>
                        <Badge bg="outline-primary" text="primary" className="border">
                          {personalInfo.gender || "—"}
                        </Badge>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Blood Group</label>
                        <Badge bg="danger" className="fs-6">
                          {personalInfo.bloodGroup || "—"}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Address</label>
                        <p className="fw-semibold mb-0 fs-6">
                          <i className="bi bi-geo-alt me-2 text-primary"></i>
                          {personalInfo.address || "—"}
                        </p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Health Card ID</label>
                        <p className="fw-semibold mb-0 fs-6">{personalInfo.healthCardId}</p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Nationality</label>
                        <p className="fw-semibold mb-0 fs-6">{personalInfo.nationality || "—"}</p>
                      </div>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Registration Date</label>
                        <p className="fw-semibold mb-0 fs-6">{formatDate(personalInfo.registrationDate)}</p>
                      </div>
                    </Col>
                  </Row>
                  
                  {/* Additional Medical Info */}
                  <Row className="mt-3 pt-3 border-top">
                    <Col md={4}>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Allergies</label>
                        <p className="fw-semibold mb-0 fs-6">
                          {personalInfo.allergies?.length ? 
                            personalInfo.allergies.join(", ") : 
                            <span className="text-muted">None reported</span>
                          }
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Chronic Conditions</label>
                        <p className="fw-semibold mb-0 fs-6">
                          {personalInfo.chronicConditions?.length ? 
                            personalInfo.chronicConditions.join(", ") : 
                            <span className="text-muted">None reported</span>
                          }
                        </p>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="info-item mb-3">
                        <label className="text-muted small mb-1">Current Medications</label>
                        <p className="fw-semibold mb-0 fs-6">
                          {personalInfo.currentMedications?.length ? 
                            personalInfo.currentMedications.map(m => m.name).join(", ") : 
                            <span className="text-muted">None prescribed</span>
                          }
                        </p>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ===== Appointments Card ===== */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-gradient-info text-white py-3 border-0">
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                  <i className="bi bi-calendar-check text-white fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Appointment History</h5>
                  <small className="opacity-75">Past and upcoming appointments</small>
                </div>
                <Badge bg="white" text="info" className="ms-auto fs-6">
                  {appointments?.length || 0} appointments
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {appointments?.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No Appointments Found</h5>
                  <p className="text-muted">This patient has no appointment records.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Date & Time</th>
                        <th>Appointment No</th>
                        <th>Doctor</th>
                        <th className="text-center">Status</th>
                        <th>Reason</th>
                        <th>Symptoms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a, i) => (
                        <tr key={a._id} className="align-middle">
                          <td className="ps-4">
                            <div className="fw-semibold">{formatDate(a.date)}</div>
                          </td>
                          <td>
                            <Badge bg="outline-secondary" text="dark" className="border">
                              {a.appointmentNumber}
                            </Badge>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : "—"}
                            </div>
                            <small className="text-muted">Doctor</small>
                          </td>
                          <td className="text-center">
                            <Badge
                              bg={
                                a.status === "COMPLETED" ? "success" :
                                a.status === "BOOKED" ? "info" :
                                a.status === "CANCELLED" ? "danger" :
                                "secondary"
                              }
                              className="fs-6 px-2 py-1"
                            >
                              {a.status}
                            </Badge>
                          </td>
                          <td>{a.reason || "—"}</td>
                          <td>
                            {a.symptoms?.length ? 
                              <span className="d-inline-block text-truncate" style={{maxWidth: '150px'}}>
                                {a.symptoms.join(", ")}
                              </span> : 
                              "—"
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* ===== Medical Reports Card ===== */}
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-gradient-warning text-white py-3 border-0">
              <div className="d-flex align-items-center">
                <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                  <i className="bi bi-file-medical text-white fs-5"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Medical Reports</h5>
                  <small className="opacity-75">Clinical notes and medical documentation</small>
                </div>
                <Badge bg="white" text="warning" className="ms-auto fs-6">
                  {medicalReports?.length || 0} reports
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {medicalReports?.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-file-earmark-medical display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No Medical Reports</h5>
                  <p className="text-muted">No medical reports available for this patient.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Visit Date</th>
                        <th>Doctor</th>
                        <th>Medical Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalReports.map((r, i) => (
                        <tr key={i} className="align-middle">
                          <td className="ps-4">
                            <div className="fw-semibold">
                              {formatDate(r.appointment?.date)}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">
                              {r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}` : "—"}
                            </div>
                            <small className="text-muted">Attending Physician</small>
                          </td>
                          <td>
                            <div className="message-container">
                              {r.message || 
                                <span className="text-muted">No notes provided</span>
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* ===== Update Modal ===== */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="w-100">
            <div className="d-flex align-items-center">
              <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-pencil-square text-white fs-5"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0">Update Patient Information</h5>
                <small className="text-muted">Modify personal details and contact information</small>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Blood Group</Form.Label>
                  <Form.Control
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                    placeholder="e.g., O+"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="outline-secondary" onClick={handleClose} className="px-4">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} className="px-4">
            <i className="bi bi-check-circle me-2"></i>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .app-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        .content-wrapper {
          min-height: calc(100vh - 76px);
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%) !important;
        }
        .bg-gradient-info {
          background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%) !important;
        }
        .bg-gradient-warning {
          background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important;
        }
        .info-item {
          padding: 0.5rem 0;
        }
        .table > :not(caption) > * > * {
          padding: 1rem 0.75rem;
        }
        .table tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.04) !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        .card {
          border-radius: 0.75rem;
        }
        .btn {
          border-radius: 0.5rem;
          font-weight: 500;
        }
        .form-control, .form-select {
          border-radius: 0.5rem;
        }
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.1);
          border-color: #0d6efd;
        }
        .message-container {
          max-width: 300px;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
}