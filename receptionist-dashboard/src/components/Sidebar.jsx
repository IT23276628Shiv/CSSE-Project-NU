import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Add Patients", path: "/add-patient", icon: "➕" },
    { name: "View Patients", path: "/Veiw-patients", icon: "👥" },
    { name: "Add Doctors", path: "/Add-doctors", icon: "🆕" },
    { name: "View Doctors", path: "/doctors", icon: "👨‍⚕️" },
    { name: "Book Appointments", path: "/book-Appointment", icon: "📅" },
    { name: "Check Booking", path: "/Check-bookings", icon: "✅" },
  ];

  // Enhanced inline styles
  const sidebarStyle = {
    width: "280px",
    backgroundColor: "#ffffff",
    height: "100vh",
    boxShadow: "4px 0 15px rgba(0, 0, 0, 0.08)",
    padding: "1.5rem 1rem",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    borderRight: "1px solid #e5e7eb",
    overflowY: "auto",
  };

  const headerStyle = {
    padding: "0 0.75rem 1.5rem 0.75rem",
    marginBottom: "0.5rem",
    borderBottom: "2px solid #f3f4f6",
  };

  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e40af",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const subtitleStyle = {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: "0.25rem 0 0 0",
    fontWeight: "500",
  };

  const listStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: 0,
    margin: 0,
    listStyle: "none",
  };

  const linkStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    borderRadius: "10px",
    textDecoration: "none",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.95rem",
    fontWeight: "500",
    border: "1px solid transparent",
  };

  const activeLinkStyle = {
    backgroundColor: "#1e40af",
    color: "#ffffff",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(30, 64, 175, 0.2)",
    transform: "translateX(4px)",
  };

  const hoverStyle = {
    backgroundColor: "#f0f4ff",
    color: "#1e40af",
    borderColor: "#1e40af",
    transform: "translateX(4px)",
  };

  const iconStyle = {
    fontSize: "1.1rem",
    width: "20px",
    textAlign: "center",
  };

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          <span>⚕️</span>
          Navigation
        </h2>
        <p style={subtitleStyle}>Healthcare Management</p>
      </div>
      
      <ul style={listStyle}>
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  ...linkStyle,
                  ...(isActive ? activeLinkStyle : {}),
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = hoverStyle.backgroundColor;
                    e.target.style.color = hoverStyle.color;
                    e.target.style.borderColor = hoverStyle.borderColor;
                    e.target.style.transform = hoverStyle.transform;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = linkStyle.color;
                    e.target.style.borderColor = "transparent";
                    e.target.style.transform = "translateX(0)";
                  }
                }}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}