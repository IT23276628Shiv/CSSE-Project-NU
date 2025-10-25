import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Spinner, Alert, Button, Badge, Card, Row, Col } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function PatientHistory() {
  const { id } = useParams();
  const [history, setHistory] = useState(null); // Will hold the full object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:4000/receptionist/patients/${id}/history`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load patient history.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
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

  const { personalInfo, appointments, medicalRecords } = history;

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
            <Card.Header className="bg-primary text-white fw-bold">Personal Information</Card.Header>
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
                      <th>Specialization</th>
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
                        <td>{a.doctor?.specialization || "—"}</td>
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

          {/* ===== Medical Records ===== */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-warning text-white fw-bold">Medical Records</Card.Header>
            <Card.Body className="table-responsive">
              {medicalRecords?.length === 0 ? (
                <Alert variant="info">No medical records found.</Alert>
              ) : (
                <Table bordered hover className="align-middle">
                  <thead className="table-light text-center">
                    <tr>
                      <th>#</th>
                      <th>Record No</th>
                      <th>Visit Date</th>
                      <th>Doctor</th>
                      <th>Visit Type</th>
                      <th>Chief Complaint</th>
                      <th>Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicalRecords.map((r, i) => (
                      <tr key={r._id}>
                        <td className="text-center">{i + 1}</td>
                        <td>{r.recordNumber}</td>
                        <td>{formatDate(r.visitDate)}</td>
                        <td>{r.attendingDoctor ? `${r.attendingDoctor.firstName} ${r.attendingDoctor.lastName}` : "—"}</td>
                        <td>{r.visitType || "—"}</td>
                        <td>{r.chiefComplaint || "—"}</td>
                        <td>{r.diagnosis?.primary?.condition || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
