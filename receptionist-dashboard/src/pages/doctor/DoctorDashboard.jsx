import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import DoctorSidebar from "../../components/DoctorSidebar";
import { Card, Row, Col, Badge, Table, ProgressBar, Alert } from "react-bootstrap";
import { 
  FaUserInjured, 
  FaCalendarCheck, 
  FaClock, 
  FaStethoscope, 
  FaChartLine, 
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaUsers,
  FaFileMedical,
  FaBell
} from "react-icons/fa";

export default function DoctorDashboard() {
  const name = localStorage.getItem("name");
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingReports: 0,
    monthlyVisits: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);

  useEffect(() => {
    // Simulate API calls to fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    // Mock data - replace with actual API calls
    setStats({
      totalPatients: 1247,
      todayAppointments: 8,
      pendingReports: 3,
      monthlyVisits: 89
    });

    setRecentAppointments([
      { id: 1, patientName: "John Doe", time: "09:00 AM", status: "Completed", type: "Follow-up" },
      { id: 2, patientName: "Sarah Wilson", time: "10:30 AM", status: "In Progress", type: "Consultation" },
      { id: 3, patientName: "Mike Johnson", time: "11:15 AM", status: "Scheduled", type: "Check-up" },
      { id: 4, patientName: "Emily Brown", time: "02:00 PM", status: "Scheduled", type: "Consultation" }
    ]);

    setUpcomingSchedule([
      { id: 1, patientName: "Robert Chen", date: "Tomorrow", time: "09:30 AM", type: "Follow-up" },
      { id: 2, patientName: "Lisa Wang", date: "Tomorrow", time: "11:00 AM", type: "Consultation" },
      { id: 3, patientName: "David Kim", date: "Dec 15", time: "10:00 AM", type: "Check-up" }
    ]);
  };

  const StatCard = ({ title, value, icon, trend, subtitle, color }) => (
    <Card className="stat-card h-100 border-0 shadow-sm">
      <Card.Body className="p-4">
        <Row className="align-items-center">
          <Col xs={8}>
            <div className={`icon-container bg-${color} mb-3`}>
              {icon}
            </div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h3 className="fw-bold mb-1">{value}</h3>
            {trend && (
              <div className={`trend ${trend.value > 0 ? 'text-success' : 'text-danger'}`}>
                {trend.value > 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                <span className="ms-1 small">{Math.abs(trend.value)}% {trend.label}</span>
              </div>
            )}
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Scheduled': return 'primary';
      default: return 'secondary';
    }
  };

  return (
    <div className="app-container">
      <Navbar name={name} />
      
      <div className="layout">
        <DoctorSidebar />
        
        <div className="main-content">
          {/* Header Section */}
          <div className="dashboard-header mb-4">
            <div className="welcome-section">
              <h1 className="fw-bold text-primary mb-2">
                <FaStethoscope className="me-3" />
                Doctor Dashboard
              </h1>
              <p className="text-muted lead">Welcome back, Dr. {name}! Here's your medical practice overview.</p>
            </div>
            <div className="date-section">
              <Badge bg="light" text="dark" className="px-3 py-2">
                <FaCalendarAlt className="me-2" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Badge>
            </div>
          </div>

          {/* Alert Banner */}
          <Alert variant="info" className="border-0 shadow-sm mb-4">
            <div className="d-flex align-items-center">
              <FaBell className="me-3 text-info" size={20} />
              <div>
                <strong>Next Appointment:</strong> Dr. Wilson at 09:00 AM - General Consultation
              </div>
            </div>
          </Alert>

          {/* Statistics Cards */}
          <Row className="g-4 mb-5">
            <Col xl={3} lg={6}>
              <StatCard
                title="Total Patients"
                value={stats.totalPatients.toLocaleString()}
                icon={<FaUsers size={24} />}
                trend={{ value: 12, label: "from last month" }}
                color="primary"
              />
            </Col>
            <Col xl={3} lg={6}>
              <StatCard
                title="Today's Appointments"
                value={stats.todayAppointments}
                icon={<FaCalendarCheck size={24} />}
                subtitle="8 completed • 4 remaining"
                color="success"
              />
            </Col>
            <Col xl={3} lg={6}>
              <StatCard
                title="Pending Reports"
                value={stats.pendingReports}
                icon={<FaFileMedical size={24} />}
                trend={{ value: -5, label: "from yesterday" }}
                color="warning"
              />
            </Col>
            <Col xl={3} lg={6}>
              <StatCard
                title="Monthly Visits"
                value={stats.monthlyVisits}
                icon={<FaChartLine size={24} />}
                trend={{ value: 8, label: "from last month" }}
                color="info"
              />
            </Col>
          </Row>

          <Row className="g-4">
            {/* Recent Appointments */}
            <Col xl={8}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 py-3">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaClock className="me-2 text-primary" />
                    Today's Appointments
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">Patient</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th className="pe-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentAppointments.map((appointment) => (
                          <tr key={appointment.id} className="align-middle">
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div className="patient-avatar bg-light rounded-circle d-flex align-items-center justify-content-center me-3">
                                  <FaUserInjured className="text-muted" />
                                </div>
                                <div>
                                  <strong>{appointment.patientName}</strong>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="fw-semibold">{appointment.time}</span>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="px-2">
                                {appointment.type}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={getStatusVariant(appointment.status)} className="px-2 py-1">
                                {appointment.status}
                              </Badge>
                            </td>
                            <td className="pe-4">
                              <button className="btn btn-sm btn-outline-primary">
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Upcoming Schedule & Quick Stats */}
            <Col xl={4}>
              <Row className="g-4">
                {/* Upcoming Schedule */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <h5 className="mb-0 d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-warning" />
                        Upcoming Schedule
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {upcomingSchedule.map((schedule) => (
                        <div key={schedule.id} className="schedule-item mb-3 pb-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong>{schedule.patientName}</strong>
                            <Badge bg="light" text="dark" className="px-2">
                              {schedule.type}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between text-muted small">
                            <span>{schedule.date}</span>
                            <span>{schedule.time}</span>
                          </div>
                        </div>
                      ))}
                      <button className="btn btn-outline-primary w-100 mt-2">
                        View Full Schedule
                      </button>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Quick Actions */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <h5 className="mb-0 d-flex align-items-center">
                        <FaExclamationTriangle className="me-2 text-danger" />
                        Quick Actions
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-grid gap-2">
                        <button className="btn btn-primary btn-lg">
                          <FaFileMedical className="me-2" />
                          Create New Report
                        </button>
                        <button className="btn btn-outline-success">
                          View Patient Records
                        </button>
                        <button className="btn btn-outline-info">
                          Schedule Appointment
                        </button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Performance Metrics */}
                <Col xs={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white border-0 py-3">
                      <h5 className="mb-0">Today's Performance</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Appointment Completion</small>
                          <small>67%</small>
                        </div>
                        <ProgressBar now={67} variant="success" style={{ height: '6px' }} />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Patient Satisfaction</small>
                          <small>92%</small>
                        </div>
                        <ProgressBar now={92} variant="info" style={{ height: '6px' }} />
                      </div>
                      <div>
                        <div className="d-flex justify-content-between mb-1">
                          <small>Report Completion</small>
                          <small>85%</small>
                        </div>
                        <ProgressBar now={85} variant="warning" style={{ height: '6px' }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </div>

      <style jsx>{`
        .layout {
          display: flex;
          min-height: calc(100vh - 56px);
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .main-content {
          margin-left: 280px;
          flex: 1;
          padding: 30px;
          background: transparent;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .welcome-section h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .stat-card {
          border-radius: 15px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }

        .icon-container {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .bg-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; }
        .bg-success { background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%) !important; }
        .bg-warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important; }
        .bg-info { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important; }

        .patient-avatar {
          width: 40px;
          height: 40px;
        }

        .trend {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }

        .schedule-item:last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
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

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content {
            margin-left: 0;
            padding: 20px;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
          }

          .welcome-section h1 {
            font-size: 2rem;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 15px;
          }

          .welcome-section h1 {
            font-size: 1.75rem;
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