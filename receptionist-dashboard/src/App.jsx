import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatients"; 
import ViewPatients from "./pages/ViewPatients";
import BookAppointment from "./pages/BookAppointment";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-patient"
          element={
            <PrivateRoute>
              <AddPatient />
            </PrivateRoute>
          }
        />
        <Route
          path="/Veiw-patients"
          element={
            <PrivateRoute>
              <ViewPatients />
            </PrivateRoute>
          }
        />
        <Route
          path="/book-Appointment"
          element={
            <PrivateRoute>
              <BookAppointment />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
