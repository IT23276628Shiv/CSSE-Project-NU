import React from "react";
import Navbar from "../../components/Navbar";

export default function DoctorDashboard() {
  const name = localStorage.getItem("name");

  return (
    <div className="app-container">
       <Navbar name={localStorage.getItem("name")} />
        <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1>👨‍⚕️ Doctor Dashboard</h1>
        <h3>Welcome Dr. {name}</h3>
        <p>Here you can view your appointments, patients, and schedule.</p>
        </div>
    </div>
  );
}
