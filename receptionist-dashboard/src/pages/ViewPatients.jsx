import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { Modal, Button, Table, Spinner, Form, InputGroup } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function ViewPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/receptionist/patients");
      setPatients(res.data);
      setFilteredPatients(res.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = (e) => {
  const value = e.target.value.toLowerCase();
  setSearch(value);

  const filtered = patients.filter(
    (p) =>
      (p.fullName && p.fullName.toLowerCase().includes(value)) ||
      (p.email && p.email.toLowerCase().includes(value))
  );

  setFilteredPatients(filtered);
};


  const handleView = async (id) => {
    try {
      const res = await api.get(`/receptionist/patients/${id}`);
      setSelectedPatient(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error loading patient:", error);
    }
  };

const handleDownload = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.src = selectedPatient.qrCode;

  img.onload = () => {
    const padding = 100;
    const textHeight = 40;
    canvas.width = img.width + padding * 2;
    canvas.height = img.height + textHeight * 3 + padding * 3;

    // Background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw name
    ctx.fillStyle = "#000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(selectedPatient.fullName, canvas.width / 2, padding + 20);

    // Draw health card ID
    ctx.font = "16px Arial";
    ctx.fillText("Health Card ID: " + selectedPatient.healthCardId, canvas.width / 2, padding + 50);

    // Draw QR code below
    ctx.drawImage(img, padding, padding + textHeight * 2, img.width, img.height);

    // Convert canvas to image and download
    const link = document.createElement("a");
    link.download = `${selectedPatient.fullName}_QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
};


  return (
    <div className="app-container">
       <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container mt-4">
          <h2 className="mb-4 text-primary">View Patients</h2>

          {/* 🔍 Search Bar */}
          <InputGroup className="mb-3 w-50">
            <Form.Control
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearch}
            />
            <Button variant="secondary" disabled>
              <i className="bi bi-search"></i> {/* Optional Bootstrap icon */}
            </Button>
          </InputGroup>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="alert alert-info">No patients found.</div>
          ) : (
            <Table bordered hover responsive>
              <thead className="table-light">
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Health Card ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p._id}>
                    <td>{p.fullName}</td>
                    <td>{p.email}</td>
                    <td>{p.phone}</td>
                    <td>{p.healthCardId}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleView(p._id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {/* Patient Details Modal */}
          {selectedPatient && (
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Patient Details</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                <h5 className="fw-bold">{selectedPatient.fullName}</h5>
                <p>Health Card ID: {selectedPatient.healthCardId}</p>

                {selectedPatient.qrCode && (
                  <>
                    <img
                      src={selectedPatient.qrCode}
                      alt="QR Code"
                      className="border rounded mt-3"
                      width="150"
                    />
                    <div className="mt-3">
                      <Button variant="success" onClick={handleDownload}>
                        Download QR
                      </Button>
                    </div>
                  </>
                )}
              </Modal.Body>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
