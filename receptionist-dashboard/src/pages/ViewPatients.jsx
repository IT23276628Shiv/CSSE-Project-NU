import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner, Form, InputGroup, Card, Badge } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { handleSearch, fetchPatients, handleView, handleDownload, handleViewHistory } from "../pages/functionsset/viewpatientfunction";

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
        <div className="container-fluid mt-4 px-4">
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-primary fw-bold mb-1">Patient Management</h2>
              <p className="text-muted">View and manage all patient records</p>
            </div>
            <Badge bg="light" text="dark" className="fs-6 p-2">
              Total: {filteredPatients.length} patients
            </Badge>
          </div>

          {/* Search Card */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Body className="p-3">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search patients by name or email..."
                      value={search}
                      onChange={(e) =>
                        handleSearch(e, patients, setSearch, setFilteredPatients)
                      }
                      className="border-start-0"
                    />
                  </InputGroup>
                </div>
                <div className="col-md-6 text-md-end mt-2 mt-md-0">
                  <small className="text-muted">
                    {search && `Found ${filteredPatients.length} matching patients`}
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Patients Table */}
          {loading ? (
            <Card className="shadow-sm border-0">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h5 className="text-muted">Loading patient records...</h5>
                <p className="text-muted small">Please wait while we fetch the latest data</p>
              </Card.Body>
            </Card>
          ) : filteredPatients.length === 0 ? (
            <Card className="shadow-sm border-0">
              <Card.Body className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-person-x display-4 text-muted"></i>
                </div>
                <h5 className="text-muted">No patients found</h5>
                <p className="text-muted">
                  {search ? "Try adjusting your search terms" : "No patient records available"}
                </p>
                {search && (
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setFilteredPatients(patients);
                    }}
                  >
                    Clear Search
                  </Button>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom-0 py-3">
                <h6 className="mb-0 text-dark fw-semibold">
                  <i className="bi bi-list-ul me-2"></i>
                  Patient Records
                </h6>
              </Card.Header>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Patient Information</th>
                      <th>Contact Details</th>
                      <th>Health Card</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p) => (
                      <tr key={p._id} className="align-middle">
                        <td className="ps-4">
                          <div>
                            <div className="fw-semibold text-dark">{p.fullName}</div>
                            <small className="text-muted">ID: {p._id?.substring(0, 8)}...</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-envelope me-2 text-muted small"></i>
                              <span>{p.email}</span>
                            </div>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-telephone me-2 text-muted small"></i>
                              <span>{p.phone || "Not provided"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="outline-primary" text="primary" className="border">
                            {p.healthCardId}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="d-flex align-items-center"
                              onClick={() =>
                                handleView(p._id, setSelectedPatient, setShowModal)
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              View
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="d-flex align-items-center"
                              onClick={() => handleViewHistory(navigate, p._id)}
                            >
                              <i className="bi bi-clock-history me-1"></i>
                              History
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* Patient Details Modal */}
          {selectedPatient && (
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
              <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="w-100">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                      <i className="bi bi-person-fill text-white fs-5"></i>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0">{selectedPatient.fullName}</h5>
                      <small className="text-muted">Patient Details</small>
                    </div>
                  </div>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="pt-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label text-muted small mb-1">Health Card ID</label>
                      <p className="fw-semibold mb-0">{selectedPatient.healthCardId}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small mb-1">Email</label>
                      <p className="fw-semibold mb-0">{selectedPatient.email}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small mb-1">Phone</label>
                      <p className="fw-semibold mb-0">{selectedPatient.phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="col-md-6 text-center">
                    {selectedPatient.qrCode && (
                      <>
                        <div className="border rounded p-3 bg-light d-inline-block">
                          <img
                            src={selectedPatient.qrCode}
                            alt="QR Code"
                            className="img-fluid"
                            width="180"
                          />
                        </div>
                        <div className="mt-3">
                          <Button
                            variant="success"
                            className="d-flex align-items-center mx-auto"
                            onClick={() => handleDownload(selectedPatient)}
                          >
                            <i className="bi bi-download me-2"></i>
                            Download QR Code
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="border-top-0 pt-0">
                <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          )}
        </div>
      </div>

      <style jsx>{`
        .app-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        .content-wrapper {
          min-height: calc(100vh - 76px);
        }
        .table-responsive {
          border-radius: 0 0 0.375rem 0.375rem;
          overflow: hidden;
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
        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.1);
          border-color: #0d6efd;
        }
      `}</style>
    </div>
  );
}