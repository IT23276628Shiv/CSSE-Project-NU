import React, { useState } from "react";
import api from "../api/axiosInstance";
import { Form, Button, Card, Alert } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";


export default function AddDoctor() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    availableDays: [],
    password: "",
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // handle text input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle checkbox selection
  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const alreadySelected = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: alreadySelected
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day],
      };
    });
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await api.post("/receptionistAddDoctor/add-doctor", formData);
      setMessage(response.data.message);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialization: "",
        experience: "",
        availableDays: [],
        password: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Error adding doctor");
    }
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="container mt-4">
          <Card className="p-4 shadow-sm">
            <h3 className="mb-3">Add New Doctor</h3>

            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Specialization</Form.Label>
                  <Form.Control
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Experience (years)</Form.Label>
                  <Form.Control
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* ✅ Available Days (Checkboxes) */}
              <div className="mb-3">
                <Form.Label>Available Days</Form.Label>
                <div className="row">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="col-md-3 col-6">
                      <Form.Check
                        type="checkbox"
                        label={day}
                        checked={formData.availableDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="mt-3">
                Add Doctor
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
