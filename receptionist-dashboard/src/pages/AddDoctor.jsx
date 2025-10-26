import React, { useState } from "react";
import api from "../api/axiosInstance";
import { Form, Button, Card, Alert } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./AddDoctor.css";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

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
    setIsSubmitting(true);
    
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
      setTouched({});
    } catch (err) {
      setError(err.response?.data?.message || "Error adding doctor. Please check all fields and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const daysOfWeek = [
    { day: "Monday", short: "MON" },
    { day: "Tuesday", short: "TUE" },
    { day: "Wednesday", short: "WED" },
    { day: "Thursday", short: "THU" },
    { day: "Friday", short: "FRI" },
    { day: "Saturday", short: "SAT" },
    { day: "Sunday", short: "SUN" },
  ];

  const specializations = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Dermatology",
    "Psychiatry",
    "Surgery",
    "Radiology",
    "Emergency Medicine",
    "Family Medicine",
    "Other"
  ];

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="add-doctor-container">
            {/* Progress Steps */}
            <div className="progress-steps">
              <div className="step active">
                <div className="step-number">1</div>
                <div className="step-label">Basic Info</div>
              </div>
              <div className="step-divider"></div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-label">Professional</div>
              </div>
              <div className="step-divider"></div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-label">Availability</div>
              </div>
              <div className="step-divider"></div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-label">Security</div>
              </div>
            </div>

            <div className="form-header">
              <div className="header-content">
                <div className="header-icon">👨‍⚕️</div>
                <div>
                  <h1>Add New Doctor</h1>
                  <p>Register a healthcare professional to join our medical team</p>
                </div>
              </div>
              <div className="header-stats">
                <div className="stat">
                  <div className="stat-number">24+</div>
                  <div className="stat-label">Doctors</div>
                </div>
                <div className="stat">
                  <div className="stat-number">12+</div>
                  <div className="stat-label">Specialties</div>
                </div>
              </div>
            </div>

            <Card className="form-card">
              <Card.Body className="p-0">
                {message && (
                  <div className="success-message">
                    <div className="success-icon">✅</div>
                    <div className="success-content">
                      <div className="success-title">Doctor Added Successfully!</div>
                      <div className="success-text">{message}</div>
                    </div>
                    <div className="success-actions">
                      <button className="action-btn" onClick={() => setMessage(null)}>✕</button>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                      <div className="error-title">Registration Failed</div>
                      <div className="error-text">{error}</div>
                    </div>
                    <div className="error-actions">
                      <button className="action-btn" onClick={() => setError(null)}>✕</button>
                    </div>
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <div className="form-content">
                    {/* Personal Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">👤</div>
                        <div>
                          <h3>Personal Information</h3>
                          <p>Basic details about the doctor</p>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            First Name 
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Control
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            onBlur={() => handleBlur('firstName')}
                            required
                            className={`custom-input ${touched.firstName && !formData.firstName ? 'error' : ''}`}
                            placeholder="Enter first name"
                          />
                          {touched.firstName && !formData.firstName && (
                            <div className="field-error">First name is required</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Last Name
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Control
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            onBlur={() => handleBlur('lastName')}
                            required
                            className={`custom-input ${touched.lastName && !formData.lastName ? 'error' : ''}`}
                            placeholder="Enter last name"
                          />
                          {touched.lastName && !formData.lastName && (
                            <div className="field-error">Last name is required</div>
                          )}
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Email Address
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            required
                            className={`custom-input ${touched.email && !formData.email ? 'error' : ''}`}
                            placeholder="doctor@hospital.com"
                          />
                          {touched.email && !formData.email && (
                            <div className="field-error">Valid email is required</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Phone Number
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Control
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={() => handleBlur('phone')}
                            required
                            className={`custom-input ${touched.phone && !formData.phone ? 'error' : ''}`}
                            placeholder="+1 (555) 123-4567"
                          />
                          {touched.phone && !formData.phone && (
                            <div className="field-error">Phone number is required</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">💼</div>
                        <div>
                          <h3>Professional Information</h3>
                          <p>Medical expertise and experience</p>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Specialization
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Select
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            onBlur={() => handleBlur('specialization')}
                            required
                            className={`custom-input ${touched.specialization && !formData.specialization ? 'error' : ''}`}
                          >
                            <option value="">Select specialization</option>
                            {specializations.map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </Form.Select>
                          {touched.specialization && !formData.specialization && (
                            <div className="field-error">Please select a specialization</div>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Experience (years)
                            <span className="required">*</span>
                          </Form.Label>
                          <div className="experience-input">
                            <Form.Control
                              type="number"
                              name="experience"
                              value={formData.experience}
                              onChange={handleChange}
                              onBlur={() => handleBlur('experience')}
                              required
                              className={`custom-input ${touched.experience && !formData.experience ? 'error' : ''}`}
                              placeholder="0"
                              min="0"
                              max="50"
                            />
                            <div className="input-suffix">years</div>
                          </div>
                          {touched.experience && !formData.experience && (
                            <div className="field-error">Please enter years of experience</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Availability Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">📅</div>
                        <div>
                          <h3>Weekly Availability</h3>
                          <p>Select days when the doctor is available</p>
                        </div>
                      </div>
                      
                      <Form.Label className="form-label">
                        Available Days
                        <span className="required">*</span>
                      </Form.Label>
                      <div className="days-container">
                        {daysOfWeek.map(({ day, short }) => (
                          <div 
                            key={day} 
                            className={`day-card ${formData.availableDays.includes(day) ? 'selected' : ''}`}
                            onClick={() => handleDayToggle(day)}
                          >
                            <div className="day-checkbox">
                              <div className="checkmark">
                                {formData.availableDays.includes(day) && "✓"}
                              </div>
                            </div>
                            <div className="day-content">
                              <div className="day-short">{short}</div>
                              <div className="day-full">{day}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {touched.availableDays && formData.availableDays.length === 0 && (
                        <div className="field-error">Please select at least one available day</div>
                      )}
                    </div>

                    {/* Security Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">🔒</div>
                        <div>
                          <h3>Account Security</h3>
                          <p>Set up login credentials</p>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <Form.Label className="form-label">
                            Password
                            <span className="required">*</span>
                          </Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={() => handleBlur('password')}
                            required
                            className={`custom-input ${touched.password && !formData.password ? 'error' : ''}`}
                            placeholder="Create a secure password"
                          />
                          {touched.password && !formData.password && (
                            <div className="field-error">Password is required</div>
                          )}
                          <div className="password-hint">
                            Use 8+ characters with letters and numbers
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <div className="action-buttons">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => {
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
                          setTouched({});
                        }}
                      >
                        Clear Form
                      </button>
                      <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isSubmitting}
                      >
                        <span className="btn-icon">
                          {isSubmitting ? (
                            <div className="spinner"></div>
                          ) : (
                            "👨‍⚕️"
                          )}
                        </span>
                        {isSubmitting ? "Adding Doctor..." : "Add Doctor to System"}
                      </button>
                    </div>
                    <div className="form-footer">
                      <div className="footer-text">
                        <span className="required">*</span> indicates required fields
                      </div>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}