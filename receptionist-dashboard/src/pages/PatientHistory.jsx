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
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading patient details...</p>
      </div>
    );

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!history) return <Alert variant="info">No data available.</Alert>;

  const { personalInfo, appointments, medicalReports } = history;

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container mt-4">
          <Button variant="secondary" className="mb-3" onClick={() => navigate(-1)}>
            ← Back
          </Button>

          {/* ===== Personal Info ===== */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              Personal Information
              <Button variant="warning" size="sm" onClick={handleEdit}>
                Update
              </Button>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  {personalInfo.qrCode && (
                    <img
                      src={personalInfo.qrCode}
                      alt="QR Code"
                      className="img-fluid border rounded mb-2"
                    />
                  )}
                </Col>
                <Col md={9}>
                  <p><strong>Name:</strong> {personalInfo.fullName}</p>
                  <p><strong>Email:</strong> {personalInfo.email}</p>
                  <p><strong>Phone:</strong> {personalInfo.phone}</p>
                  <p><strong>Gender:</strong> {personalInfo.gender}</p>
                  <p><strong>Blood Group:</strong> {personalInfo.bloodGroup}</p>
                  <p><strong>Address:</strong> {personalInfo.address || "—"}</p>
                  <p><strong>Health Card ID:</strong> {personalInfo.healthCardId}</p>
                  <p><strong>Nationality:</strong> {personalInfo.nationality}</p>
                  <p><strong>Registration Date:</strong> {formatDate(personalInfo.registrationDate)}</p>
                  <p><strong>Allergies:</strong> {personalInfo.allergies?.length ? personalInfo.allergies.join(", ") : "—"}</p>
                  <p><strong>Chronic Conditions:</strong> {personalInfo.chronicConditions?.length ? personalInfo.chronicConditions.join(", ") : "—"}</p>
                  <p><strong>Current Medications:</strong> {personalInfo.currentMedications?.length ? personalInfo.currentMedications.map(m => m.name).join(", ") : "—"}</p>
                  <p><strong>Insurance Info:</strong> {personalInfo.insuranceInfo?.length ? personalInfo.insuranceInfo.map(i => i.provider).join(", ") : "—"}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* ===== Appointments ===== */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-info text-white fw-bold">Appointments</Card.Header>
            <Card.Body className="table-responsive">
              {appointments?.length === 0 ? (
                <Alert variant="info">No appointments found.</Alert>
              ) : (
                <Table bordered hover className="align-middle">
                  <thead className="table-light text-center">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Appointment No</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Symptoms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a, i) => (
                      <tr key={a._id}>
                        <td className="text-center">{i + 1}</td>
                        <td>{formatDate(a.date)}</td>
                        <td>{a.appointmentNumber}</td>
                        <td>{a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : "—"}</td>
                        <td className="text-center">
                          <Badge
                            bg={
                              a.status === "COMPLETED"
                                ? "success"
                                : a.status === "BOOKED"
                                ? "info"
                                : a.status === "CANCELLED"
                                ? "danger"
                                : "secondary"
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td>{a.reason || "—"}</td>
                        <td>{a.symptoms?.length ? a.symptoms.join(", ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* ===== Medical Reports ===== */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-warning text-white fw-bold">Medical Reports</Card.Header>
            <Card.Body className="table-responsive">
              {medicalReports?.length === 0 ? (
                <Alert variant="info">No medical reports found.</Alert>
              ) : (
                <Table bordered hover className="align-middle">
                  <thead className="table-light text-center">
                    <tr>
                      <th>#</th>
                      <th>Doctor</th>
                      <th>Visit Date</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalReports.map((r, i) => (
                      <tr key={i}>
                        <td className="text-center">{i + 1}</td>
                        <td>{r.doctor ? `${r.doctor.firstName} ${r.doctor.lastName}` : "—"}</td>
                        <td>{formatDate(r.appointment?.date)}</td>
                        <td>{r.message || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* ===== Update Modal ===== */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Update Personal Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName || ""}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Blood Group</Form.Label>
              <Form.Control
                type="text"
                name="bloodGroup"
                value={formData.bloodGroup || ""}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
