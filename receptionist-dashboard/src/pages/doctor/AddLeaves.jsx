import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import DoctorSidebar from "../../components/DoctorSidebar";
import api from "../../api/axiosInstance";
import { Form, Button, Card, Alert, Table, Badge, Container, Row, Col } from "react-bootstrap";
import { FaCalendarPlus, FaCalendarCheck, FaHistory, FaUmbrellaBeach, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function AddLeaves() {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [message, setMessage] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const doctorId = localStorage.getItem("doctorId");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!doctorId) {
      setMessage("❌ Doctor not identified. Please login again.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setMessage("❌ Please select both start and end dates.");
      return;
    }

    if (formData.endDate < formData.startDate) {
      setMessage("❌ End date cannot be before start date.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/doctor-leaves/add", {
        doctorId,
        ...formData,
      });

      setMessage("✅ Leave request submitted successfully!");
      setFormData({ startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setMessage("❌ Error adding leave request");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await api.get(`/doctor-leaves/${doctorId}`);
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate total days for a leave
  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  // Check if leave is upcoming
  const isUpcomingLeave = (startDate) => {
    return new Date(startDate) > new Date();
  };

  // Get status badge
  const getStatusBadge = (startDate) => {
    const isUpcoming = isUpcomingLeave(startDate);
    return (
      <Badge bg={isUpcoming ? "warning" : "secondary"} className="px-2 py-1">
        {isUpcoming ? "Upcoming" : "Completed"}
      </Badge>
    );
  };

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      
      <div className="layout">
        <DoctorSidebar />

        <div className="main-content">
          <Container fluid>
            {/* Header */}
            <div className="page-header mb-4">
              <h2 className="fw-bold text-primary mb-2">
                <FaUmbrellaBeach className="me-3" />
                Leave Management
              </h2>
              <p className="text-muted">Request time off and manage your leave schedule</p>
            </div>

            {message && (
              <Alert 
                variant={message.includes("✅") ? "success" : "danger"} 
                className="mb-4 border-0 shadow-sm"
                onClose={() => setMessage("")} 
                dismissible
              >
                <div className="d-flex align-items-center">
                  {message.includes("✅") ? 
                    <FaCheckCircle className="me-2" /> : 
                    <FaTimesCircle className="me-2" />
                  }
                  {message.replace(/[❌✅]/g, '')}
                </div>
              </Alert>
            )}

            <Row className="g-4">
              {/* Leave Request Form */}
              <Col lg={6}>
                <Card className="shadow-lg border-0 h-100">
                  <Card.Header className="bg-primary text-white py-3">
                    <h5 className="mb-0 d-flex align-items-center">
                      <FaCalendarPlus className="me-2" />
                      New Leave Request
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-dark">
                              Start Date *
                            </Form.Label>
                            <Form.Control
                              type="date"
                              name="startDate"
                              min={today}
                              value={formData.startDate}
                              onChange={handleChange}
                              required
                              className="border-0 shadow-sm py-2"
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-dark">
                              End Date *
                            </Form.Label>
                            <Form.Control
                              type="date"
                              name="endDate"
                              min={formData.startDate || today}
                              value={formData.endDate}
                              onChange={handleChange}
                              required
                              className="border-0 shadow-sm py-2"
                              style={{ backgroundColor: '#f8f9fa' }}
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={12}>
                          {formData.startDate && formData.endDate && (
                            <div className="alert alert-info border-0 py-2">
                              <small>
                                <strong>Duration:</strong> {calculateLeaveDays(formData.startDate, formData.endDate)} day(s)
                              </small>
                            </div>
                          )}
                        </Col>

                        <Col xs={12}>
                          <Form.Group>
                            <Form.Label className="fw-semibold text-dark">
                              Reason for Leave
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              name="reason"
                              value={formData.reason}
                              onChange={handleChange}
                              placeholder="Please provide details about your leave request..."
                              className="border-0 shadow-sm"
                              style={{ backgroundColor: '#f8f9fa', resize: 'vertical' }}
                            />
                          </Form.Group>
                        </Col>

                        <Col xs={12}>
                          <Button 
                            type="submit" 
                            className="w-100 py-2 fw-semibold"
                            disabled={loading}
                            style={{ 
                              backgroundColor: '#198754', 
                              borderColor: '#198754',
                              fontSize: '1.1rem'
                            }}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <FaCalendarCheck className="me-2" />
                                Submit Leave Request
                              </>
                            )}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              {/* Quick Stats */}
              <Col lg={6}>
                <Card className="shadow-lg border-0 h-100">
                  <Card.Header className="bg-info text-white py-3">
                    <h5 className="mb-0 d-flex align-items-center">
                      <FaHistory className="me-2" />
                      Leave Summary
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3 text-center">
                      <Col md={6}>
                        <div className="stat-card p-3 rounded-3" style={{ backgroundColor: '#e8f5e8' }}>
                          <h4 className="text-success fw-bold mb-1">
                            {leaves.filter(leave => isUpcomingLeave(leave.startDate)).length}
                          </h4>
                          <p className="text-muted mb-0 small">Upcoming Leaves</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="stat-card p-3 rounded-3" style={{ backgroundColor: '#fff3cd' }}>
                          <h4 className="text-warning fw-bold mb-1">
                            {leaves.filter(leave => !isUpcomingLeave(leave.startDate)).length}
                          </h4>
                          <p className="text-muted mb-0 small">Past Leaves</p>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="stat-card p-3 rounded-3 mt-2" style={{ backgroundColor: '#e7f1ff' }}>
                          <h4 className="text-primary fw-bold mb-1">
                            {leaves.reduce((total, leave) => 
                              total + calculateLeaveDays(leave.startDate, leave.endDate), 0
                            )}
                          </h4>
                          <p className="text-muted mb-0 small">Total Leave Days</p>
                        </div>
                      </Col>
                    </Row>

                    {/* Quick Tips */}
                    <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <h6 className="fw-semibold text-dark mb-2">💡 Quick Tips</h6>
                      <ul className="list-unstyled mb-0 small text-muted">
                        <li className="mb-1">• Submit requests at least 48 hours in advance</li>
                        <li className="mb-1">• Check your schedule before applying</li>
                        <li className="mb-1">• Provide clear reason for emergency leaves</li>
                      </ul>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Leave History */}
            <Card className="mt-4 shadow-lg border-0">
              <Card.Header className="bg-secondary text-white py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaHistory className="me-2" />
                  Leave History
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {leaves.length > 0 ? (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">#</th>
                          <th>Period</th>
                          <th>Duration</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((leave, index) => (
                          <tr key={index} className="align-middle">
                            <td className="ps-4 fw-semibold text-primary">{index + 1}</td>
                            <td>
                              <div>
                                <strong>From:</strong> {new Date(leave.startDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                <br />
                                <strong>To:</strong> {new Date(leave.endDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="px-3 py-2">
                                {calculateLeaveDays(leave.startDate, leave.endDate)} days
                              </Badge>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px' }}>
                                {leave.reason || (
                                  <span className="text-muted fst-italic">No reason provided</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(leave.startDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <FaUmbrellaBeach size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No leave requests yet</h5>
                    <p className="text-muted">Submit your first leave request using the form above</p>
                  </div>
                )}
              </Card.Body>
            </Card>
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

        .main-content {
          margin-left: 250px;
          flex: 1;
          padding: 30px;
          background: transparent;
        }

        .page-header {
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 1rem;
        }

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

        .form-control {
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
          border-color: #86b7fe;
        }

        button {
          border-radius: 10px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .stat-card {
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: scale(1.05);
        }

        .table th {
          border-top: none;
          font-weight: 600;
          color: #495057;
          padding: 1rem;
        }

        .table td {
          padding: 1rem;
          vertical-align: middle;
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
        }

        @media (max-width: 576px) {
          .main-content {
            padding: 15px 10px;
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
      `}</style>
    </div>
  );
}