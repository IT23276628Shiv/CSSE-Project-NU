import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner, Form, InputGroup } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { handleSearch, fetchPatients, handleView,handleDownload , handleViewHistory} from "../pages/functionsset/viewpatientfunction";

export default function ViewPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients(setPatients, setFilteredPatients, setLoading);
  }, []);

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
              onChange={(e) =>
                handleSearch(e, patients, setSearch, setFilteredPatients)
              }
            />
            <Button variant="secondary" disabled>
              <i className="bi bi-search"></i>
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
                        onClick={() =>
                          handleView(p._id, setSelectedPatient, setShowModal)
                        }
                      >
                        View
                      </Button>

                       {/* 🆕 View History Button */}
                      <Button
                       variant="info"
                       size="sm"
                       onClick={() => handleViewHistory(navigate, p._id)}
                      >
                        View History
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
                      <Button
                        variant="success"
                        onClick={() => handleDownload(selectedPatient)}
                      >
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
