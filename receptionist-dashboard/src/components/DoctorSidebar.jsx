import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaTachometerAlt, 
  FaFileMedical, 
  FaCalendarPlus, 
  FaUserMd, 
  FaStethoscope,
  FaChevronRight
} from "react-icons/fa";

export default function DoctorSidebar() {
  const location = useLocation();

  const menu = [
    { 
      name: "Dashboard", 
      path: "/doctor-dashboard", 
      icon: FaTachometerAlt,
      description: "Overview and analytics"
    },
    { 
      name: "Give Patient Report", 
      path: "/doctor/give-patient-report", 
      icon: FaFileMedical,
      description: "Create medical reports"
    },
    { 
      name: "Add Leaves", 
      path: "/doctor/add-leaves", 
      icon: FaCalendarPlus,
      description: "Manage time off"
    },
  ];

  return (
    <div className="doctor-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="doctor-profile">
          <div className="profile-avatar">
            <FaUserMd />
          </div>
          <div className="profile-info">
            <h6>Doctor Portal</h6>
            <span>Medical Dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menu.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-icon">
                    <IconComponent />
                  </div>
                  <div className="nav-content">
                    <span className="nav-title">{item.name}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                  <div className="nav-arrow">
                    <FaChevronRight />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="medical-badge">
          <FaStethoscope />
          <span>Medical Professional</span>
        </div>
      </div>

      <style jsx>{`
        .doctor-sidebar {
          width: 280px;
          background: linear-gradient(180deg, #2c3e50 0%, #3498db 100%);
          height: 100vh;
          box-shadow: 2px 0 20px rgba(0,0,0,0.1);
          padding: 0;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          overflow: hidden;
        }

        /* Sidebar Header */
        .sidebar-header {
          padding: 2rem 1.5rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .doctor-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .profile-info h6 {
          color: white;
          margin: 0;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .profile-info span {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          margin: 0;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 0;
        }

        .nav-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin: 0.5rem 1rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: #3498db;
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(5px);
        }

        .nav-link:hover::before {
          transform: scaleY(1);
        }

        .nav-link.active {
          background: rgba(52, 152, 219, 0.2);
          color: white;
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }

        .nav-link.active::before {
          transform: scaleY(1);
          background: #e74c3c;
        }

        .nav-icon {
          font-size: 1.1rem;
          margin-right: 12px;
          width: 24px;
          text-align: center;
          opacity: 0.9;
        }

        .nav-link.active .nav-icon {
          opacity: 1;
          color: #e74c3c;
        }

        .nav-content {
          flex: 1;
        }

        .nav-title {
          display: block;
          font-weight: 500;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          opacity: 0.7;
          color: rgba(255, 255, 255, 0.8);
        }

        .nav-link.active .nav-description {
          opacity: 0.9;
        }

        .nav-arrow {
          opacity: 0;
          transform: translateX(-5px);
          transition: all 0.3s ease;
          font-size: 0.8rem;
        }

        .nav-link:hover .nav-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .nav-link.active .nav-arrow {
          opacity: 1;
          transform: translateX(0);
          color: #e74c3c;
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.1);
        }

        .medical-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          justify-content: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .medical-badge svg {
          color: #e74c3c;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .doctor-sidebar {
            width: 100%;
            height: auto;
            position: relative;
            border-radius: 0 0 20px 20px;
          }

          .sidebar-header {
            padding: 1.5rem 1rem;
          }

          .nav-item {
            margin: 0.25rem 0.5rem;
          }

          .nav-link {
            padding: 0.875rem 1rem;
          }

          .nav-description {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .doctor-profile {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .profile-info h6 {
            font-size: 1rem;
          }

          .nav-title {
            font-size: 0.9rem;
          }
        }

        /* Animation for page load */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .nav-item {
          animation: slideIn 0.5s ease forwards;
        }

        .nav-item:nth-child(1) { animation-delay: 0.1s; }
        .nav-item:nth-child(2) { animation-delay: 0.2s; }
        .nav-item:nth-child(3) { animation-delay: 0.3s; }

        /* Scrollbar Styling */
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}