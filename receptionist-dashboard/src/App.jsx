import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatients";
import ViewPatients from "./pages/ViewPatients";
import BookAppointment from "./pages/BookAppointment";
import CheckBooking from "./pages/checkBookings/CheckBooking";
import DoctorDashboard from "./pages/doctor/DoctorDashboard"; // 👈 New doctor dashboard page
import AddDoctor from "./pages/AddDoctor";

// ✅ Role-based PrivateRoute
function PrivateRoute({ children, allowedType }) {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token) return <Navigate to="/" replace />;
  if (allowedType && userType !== allowedType) return <Navigate to="/unauthorized" replace />;

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Common Login Page */}
        <Route path="/" element={<Login />} />

        {/* 🧾 Receptionist Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-patient"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <AddPatient />
            </PrivateRoute>
          }
        />
        <Route
          path="/Veiw-patients"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <ViewPatients />
            </PrivateRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <BookAppointment />
            </PrivateRoute>
          }
        />
        <Route
          path="/check-bookings"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <CheckBooking />
            </PrivateRoute>
          }
        />
        <Route
          path="/Add-doctors"
          element={
            <PrivateRoute allowedType="RECEPTIONIST">
              <AddDoctor />
            </PrivateRoute>
          }
        />

        {/* 🩺 Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            <PrivateRoute allowedType="DOCTOR">
              <DoctorDashboard />
            </PrivateRoute>
          }
        />

        {/* 🚫 Unauthorized Page */}
        <Route
          path="/unauthorized"
          element={<h2 style={{ textAlign: "center", marginTop: "50px" }}>Access Denied 🚫</h2>}
        />
      </Routes>
    </Router>
  );
}
