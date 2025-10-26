import React from "react";

export default function Navbar({ name }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/";
  };

  // Enhanced inline styles
  const navStyle = {
    backgroundColor: "#1e40af", // Deeper blue for better contrast
    color: "#ffffff",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const brandStyle = {
    fontSize: "1.5rem",
    fontWeight: "700",
    letterSpacing: "-0.025em",
  };

  const userContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  };

  const welcomeTextStyle = {
    fontSize: "1rem",
    fontWeight: "500",
    opacity: 0.9,
  };

  const logoutButtonStyle = {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    padding: "0.5rem 1.25rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "600",
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  };

  const logoutButtonHoverStyle = {
    backgroundColor: "#b91c1c",
    transform: "translateY(-1px)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
  };

  const logoutButtonActiveStyle = {
    transform: "translateY(0)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  };

  return (
    <nav style={navStyle}>
      <div style={brandStyle}>🏥 Healthcare System</div>
      <div style={userContainerStyle}>
        <span style={welcomeTextStyle}>Welcome, {name} 👋</span>
        <button
          onClick={handleLogout}
          style={logoutButtonStyle}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = logoutButtonHoverStyle.backgroundColor;
            e.target.style.transform = logoutButtonHoverStyle.transform;
            e.target.style.boxShadow = logoutButtonHoverStyle.boxShadow;
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = logoutButtonStyle.backgroundColor;
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = logoutButtonStyle.boxShadow;
          }}
          onMouseDown={(e) => {
            e.target.style.transform = logoutButtonActiveStyle.transform;
            e.target.style.boxShadow = logoutButtonActiveStyle.boxShadow;
          }}
          onMouseUp={(e) => {
            e.target.style.transform = logoutButtonHoverStyle.transform;
            e.target.style.boxShadow = logoutButtonHoverStyle.boxShadow;
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}