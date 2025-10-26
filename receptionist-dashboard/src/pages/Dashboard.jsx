import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { 
  FaUsers, 
  FaUserMd, 
  FaCalendarCheck, 
  FaClock, 
  FaDollarSign, 
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaCheckCircle
} from "react-icons/fa";

export default function Dashboard() {
  const name = localStorage.getItem("name");
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    patientSatisfaction: 0
  });

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    // Mock data - replace with actual API calls
    setStats({
      totalPatients: 1247,
      totalDoctors: 24,
      todayAppointments: 18,
      pendingAppointments: 7,
      monthlyRevenue: 28450,
      patientSatisfaction: 94
    });
  };

  const StatCard = ({ title, value, icon, trend, color, subtitle }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            {trend.direction === 'up' ? <FaArrowUp /> : <FaArrowDown />}
            <span>{trend.value}%</span>
          </div>
        )}
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon, action, variant = "primary" }) => (
    <div className={`quick-action-card ${variant}`}>
      <div className="action-icon">
        {icon}
      </div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <button className="action-btn">View</button>
    </div>
  );

  return (
    <div className="app-container">
      <Navbar name={name} />
      <div className="dashboard-wrapper">
        <Sidebar />
        
        <div className="dashboard-content">
          {/* Header Section */}
          <div className="dashboard-header">
            <div className="welcome-section">
              <h1>Receptionist Dashboard</h1>
              <p>Welcome back, {name}! Here's your daily overview.</p>
            </div>
            <div className="date-section">
              <span className="current-date">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Alert Banner */}
          <div className="alert-banner">
            <FaExclamationTriangle className="alert-icon" />
            <span>You have <strong>7 pending appointments</strong> that need attention today.</span>
          </div>

          {/* Statistics Grid */}
          <div className="stats-grid">
            <StatCard
              title="Total Patients"
              value="1,247"
              icon={<FaUsers />}
              trend={{ direction: 'up', value: 12 }}
              color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
            <StatCard
              title="Active Doctors"
              value="24"
              icon={<FaUserMd />}
              trend={{ direction: 'up', value: 3 }}
              color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            />
            <StatCard
              title="Today's Appointments"
              value="18"
              icon={<FaCalendarCheck />}
              subtitle="7 pending"
              color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            />
            <StatCard
              title="Monthly Revenue"
              value="$28,450"
              icon={<FaDollarSign />}
              trend={{ direction: 'up', value: 8 }}
              color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            />
          </div>

          <div className="dashboard-main">
            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions-grid">
                <QuickAction
                  title="Manage Patients"
                  description="View and manage all registered patients"
                  icon={<FaUsers />}
                  variant="primary"
                />
                <QuickAction
                  title="Doctor Schedule"
                  description="Check doctor availability and schedules"
                  icon={<FaUserMd />}
                  variant="success"
                />
                <QuickAction
                  title="Appointments"
                  description="Manage today's appointments"
                  icon={<FaCalendarCheck />}
                  variant="warning"
                />
                <QuickAction
                  title="Reports"
                  description="Generate monthly reports"
                  icon={<FaChartLine />}
                  variant="info"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
              <h2 className="section-title">Recent Activity</h2>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon success">
                    <FaCheckCircle />
                  </div>
                  <div className="activity-content">
                    <p><strong>John Doe</strong> checked in for appointment</p>
                    <span className="activity-time">10:30 AM</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon warning">
                    <FaClock />
                  </div>
                  <div className="activity-content">
                    <p>New appointment request from <strong>Sarah Wilson</strong></p>
                    <span className="activity-time">09:45 AM</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon primary">
                    <FaUsers />
                  </div>
                  <div className="activity-content">
                    <p>New patient <strong>Mike Johnson</strong> registered</p>
                    <span className="activity-time">Yesterday</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon info">
                    <FaUserMd />
                  </div>
                  <div className="activity-content">
                    <p>Dr. Smith updated availability for next week</p>
                    <span className="activity-time">Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="performance-section">
            <h2 className="section-title">Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Patient Satisfaction</h3>
                <div className="metric-value">94%</div>
                <div className="metric-progress">
                  <div className="progress-bar" style={{ width: '94%' }}></div>
                </div>
                <span className="metric-label">+2% from last month</span>
              </div>
              <div className="metric-card">
                <h3>Appointment Completion</h3>
                <div className="metric-value">87%</div>
                <div className="metric-progress">
                  <div className="progress-bar" style={{ width: '87%' }}></div>
                </div>
                <span className="metric-label">+5% from last month</span>
              </div>
              <div className="metric-card">
                <h3>Average Wait Time</h3>
                <div className="metric-value">12 min</div>
                <div className="metric-progress">
                  <div className="progress-bar" style={{ width: '80%' }}></div>
                </div>
                <span className="metric-label">-3min from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .dashboard-wrapper {
          display: flex;
          min-height: calc(100vh - 70px);
        }

        .dashboard-content {
          margin-left: 0px;
          flex: 1;
          padding: 0;
          background: #f8f9fa;
        }

        /* Header Section */
        .dashboard-header {
          background: white;
          padding: 2rem 2.5rem;
          border-bottom: 1px solid #e3e6f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .welcome-section h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2e59d9;
          margin-bottom: 0.5rem;
        }

        .welcome-section p {
          color: #6c757d;
          font-size: 1.1rem;
          margin: 0;
        }

        .current-date {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 500;
        }

        /* Alert Banner */
        .alert-banner {
          background: linear-gradient(135deg, #f6c23e 0%, #e74a3b 100%);
          color: white;
          padding: 1rem 2.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 2rem 2.5rem;
        }

        .stat-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s ease;
          border: 1px solid #e3e6f0;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .stat-icon {
          width: 70px;
          height: 70px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          line-height: 1;
        }

        .stat-title {
          color: #6c757d;
          margin: 0.5rem 0 0 0;
          font-weight: 500;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .stat-trend.up {
          color: #1cc88a;
        }

        .stat-trend.down {
          color: #e74a3b;
        }

        .stat-subtitle {
          color: #6c757d;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }

        /* Main Content */
        .dashboard-main {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
          padding: 0 2.5rem 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 1.5rem;
        }

        /* Quick Actions */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .quick-action-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-left: 4px solid;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .quick-action-card.primary { border-left-color: #4e73df; }
        .quick-action-card.success { border-left-color: #1cc88a; }
        .quick-action-card.warning { border-left-color: #f6c23e; }
        .quick-action-card.info { border-left-color: #36b9cc; }

        .quick-action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .action-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #6c757d;
        }

        .quick-action-card.primary .action-icon { color: #4e73df; }
        .quick-action-card.success .action-icon { color: #1cc88a; }
        .quick-action-card.warning .action-icon { color: #f6c23e; }
        .quick-action-card.info .action-icon { color: #36b9cc; }

        .action-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
        }

        .action-content p {
          color: #6c757d;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }

        .action-btn {
          background: #2e59d9;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: auto;
        }

        .action-btn:hover {
          background: #1a3bb0;
          transform: translateY(-1px);
        }

        /* Recent Activity */
        .activity-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          border-bottom: 1px solid #e3e6f0;
          transition: background-color 0.3s ease;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-item:hover {
          background: #f8f9fa;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .activity-icon.success { background: #1cc88a; }
        .activity-icon.warning { background: #f6c23e; }
        .activity-icon.primary { background: #4e73df; }
        .activity-icon.info { background: #36b9cc; }

        .activity-content p {
          margin: 0 0 0.25rem 0;
          color: #2c3e50;
          line-height: 1.4;
        }

        .activity-time {
          color: #6c757d;
          font-size: 0.875rem;
        }

        /* Performance Metrics */
        .performance-section {
          padding: 0 2.5rem 2.5rem;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-align: center;
        }

        .metric-card h3 {
          color: #6c757d;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .metric-progress {
          background: #e9ecef;
          border-radius: 10px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .metric-label {
          color: #6c757d;
          font-size: 0.875rem;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .dashboard-content {
            margin-left: 0;
          }

          .dashboard-main {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 1.5rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .stats-grid,
          .dashboard-main,
          .performance-section {
            padding: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .dashboard-header,
          .stats-grid,
          .dashboard-main,
          .performance-section {
            padding: 1rem;
          }

          .welcome-section h1 {
            font-size: 1.5rem;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}