import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosInstance";
import { Form, Button, Spinner, InputGroup, Container, Row, Col, Card } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AddPatient.css";

const AddPatient = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    healthCardId: "",
    passwordHash: "",
    gender: "MALE",
    bloodGroup: "",
    dateOfBirth: "",
    address: { street: "", city: "", district: "", province: "", postalCode: "", country: "Sri Lanka" },
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const generateHealthCardId = () => `HC${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  useEffect(() => setFormData(prev => ({ ...prev, healthCardId: generateHealthCardId() })), []);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value || "" } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value || "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleFileChange = e => setAvatar(e.target.files[0]);
  
  const handleGenerateNewId = () => {
    setFormData(prev => ({ ...prev, healthCardId: generateHealthCardId() }));
    toast.info("🆕 New Health Card ID generated!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    if (!formData.dateOfBirth) {
      toast.error("📅 Please select a valid Date of Birth", {
        position: "top-right",
        autoClose: 5000,
      });
      setLoading(false);
      return;
    }

    try {
      const patientData = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        key === "address" ? patientData.append("address", JSON.stringify(value)) : patientData.append(key, value)
      );
      if (avatar) patientData.append("file", avatar);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in!");

      await api.post("/receptionist/patients", patientData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      toast.success("🎉 Patient added successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        healthCardId: generateHealthCardId(),
        passwordHash: "",
        gender: "MALE",
        bloodGroup: "",
        dateOfBirth: "",
        address: { street: "", city: "", district: "", province: "", postalCode: "", country: "Sri Lanka" },
      });
      setAvatar(null);
      setTouched({});
      
    } catch (error) {
      console.error(error);
      toast.error(`❌ ${error.response?.data?.error || error.message || "Something went wrong"}`, {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      healthCardId: generateHealthCardId(),
      passwordHash: "",
      gender: "MALE",
      bloodGroup: "",
      dateOfBirth: "",
      address: { street: "", city: "", district: "", province: "", postalCode: "", country: "Sri Lanka" },
    });
    setAvatar(null);
    setTouched({});
    toast.info("🧹 Form cleared!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  return (
    <div className="app-container">
      <Navbar name={localStorage.getItem("name")} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="add-patient-container">
            {/* Header Section */}
            <div className="form-header">
              <div className="header-content">
                <div className="header-icon">👤</div>
                <div>
                  <h1>Register New Patient</h1>
                  <p>Add a new patient to the healthcare system</p>
                </div>
              </div>
              <div className="header-stats">
                <div className="stat">
                  <div className="stat-number">HCID</div>
                  <div className="stat-label">Auto-generated</div>
                </div>
              </div>
            </div>

            <Card className="form-card">
              <Card.Body className="p-0">
                <Form onSubmit={handleSubmit}>
                  <div className="form-content">
                    {/* Personal Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">📋</div>
                        <div>
                          <h3>Personal Information</h3>
                          <p>Basic details about the patient</p>
                        </div>
                      </div>
                      
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">
                            Full Name <span className="required">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="text" 
                            name="fullName" 
                            placeholder="Enter patient's full name" 
                            value={formData.fullName} 
                            onChange={handleChange}
                            onBlur={() => handleBlur('fullName')}
                            required 
                            className={`custom-input ${touched.fullName && !formData.fullName ? 'error' : ''}`}
                          />
                          {touched.fullName && !formData.fullName && (
                            <div className="field-error">Full name is required</div>
                          )}
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">
                            Email Address <span className="required">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="email" 
                            name="email" 
                            placeholder="patient@example.com" 
                            value={formData.email} 
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            required 
                            className={`custom-input ${touched.email && !formData.email ? 'error' : ''}`}
                          />
                          {touched.email && !formData.email && (
                            <div className="field-error">Valid email is required</div>
                          )}
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">
                            Phone Number <span className="required">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="text" 
                            name="phone" 
                            placeholder="+94 XX XXX XXXX" 
                            value={formData.phone} 
                            onChange={handleChange}
                            onBlur={() => handleBlur('phone')}
                            required 
                            className={`custom-input ${touched.phone && !formData.phone ? 'error' : ''}`}
                          />
                          {touched.phone && !formData.phone && (
                            <div className="field-error">Phone number is required</div>
                          )}
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">
                            Date of Birth <span className="required">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="date" 
                            name="dateOfBirth" 
                            value={formData.dateOfBirth} 
                            onChange={handleChange}
                            onBlur={() => handleBlur('dateOfBirth')}
                            required 
                            className={`custom-input ${touched.dateOfBirth && !formData.dateOfBirth ? 'error' : ''}`}
                          />
                          {touched.dateOfBirth && !formData.dateOfBirth && (
                            <div className="field-error">Date of birth is required</div>
                          )}
                        </Col>
                      </Row>
                    </div>

                    {/* Medical Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">🏥</div>
                        <div>
                          <h3>Medical Information</h3>
                          <p>Health and demographic details</p>
                        </div>
                      </div>
                      
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">Gender</Form.Label>
                          <Form.Select 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange}
                            className="custom-input"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                          </Form.Select>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label className="form-label">Blood Group</Form.Label>
                          <Form.Select 
                            name="bloodGroup" 
                            value={formData.bloodGroup} 
                            onChange={handleChange}
                            className="custom-input"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </Form.Select>
                        </Col>
                      </Row>
                    </div>

                    {/* Health Card & Security Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">🔐</div>
                        <div>
                          <h3>Health Card & Security</h3>
                          <p>Patient identification and account security</p>
                        </div>
                      </div>
                      
                      {/* Health Card ID - Full Width */}
                      <Row>
                        <Col md={12} className="mb-3">
                          <Form.Label className="form-label">
                            Health Card ID <span className="required">*</span>
                          </Form.Label>
                          <InputGroup>
                            <Form.Control 
                              type="text" 
                              name="healthCardId" 
                              value={formData.healthCardId} 
                              readOnly 
                              className="custom-input health-card-id full-width-id"
                            />
                            <Button 
                              variant="outline-secondary" 
                              onClick={handleGenerateNewId}
                              className="generate-btn"
                            >
                              🔄 Generate
                            </Button>
                          </InputGroup>
                          <div className="input-hint">Automatically generated unique ID</div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12} className="mb-3">
                          <Form.Label className="form-label">
                            Password <span className="required">*</span>
                          </Form.Label>
                          <Form.Control 
                            type="password" 
                            name="passwordHash" 
                            placeholder="Create a secure password" 
                            value={formData.passwordHash} 
                            onChange={handleChange}
                            onBlur={() => handleBlur('passwordHash')}
                            required 
                            className={`custom-input ${touched.passwordHash && !formData.passwordHash ? 'error' : ''}`}
                          />
                          {touched.passwordHash && !formData.passwordHash && (
                            <div className="field-error">Password is required</div>
                          )}
                          <div className="password-hint">Minimum 8 characters recommended</div>
                        </Col>
                      </Row>
                    </div>

                    {/* Address Information Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">📍</div>
                        <div>
                          <h3>Address Information</h3>
                          <p>Patient's residential address</p>
                        </div>
                      </div>
                      
                      <Row>
                        {[
                          { field: "street", label: "Street Address", placeholder: "House number and street" },
                          { field: "city", label: "City", placeholder: "City name" },
                          { field: "district", label: "District", placeholder: "District" },
                          { field: "province", label: "Province", placeholder: "Province" },
                          { field: "postalCode", label: "Postal Code", placeholder: "Postal code" }
                        ].map(({ field, label, placeholder }) => (
                          <Col md={6} key={field} className="mb-3">
                            <Form.Label className="form-label">{label}</Form.Label>
                            <Form.Control 
                              type="text" 
                              name={`address.${field}`} 
                              placeholder={placeholder} 
                              value={formData.address[field]} 
                              onChange={handleChange}
                              className="custom-input"
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    {/* Profile Picture Section */}
                    <div className="form-section">
                      <div className="section-header">
                        <div className="section-icon">📷</div>
                        <div>
                          <h3>Profile Picture</h3>
                          <p>Upload patient's photo (optional)</p>
                        </div>
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label className="form-label">Patient Photo</Form.Label>
                        <Form.Control 
                          type="file" 
                          name="file" 
                          onChange={handleFileChange}
                          className="custom-file-input"
                          accept="image/*"
                        />
                        <div className="file-hint">Supported formats: JPG, PNG, GIF. Max size: 5MB</div>
                      </Form.Group>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <div className="action-buttons">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={clearForm}
                        disabled={loading}
                      >
                        🗑️ Clear Form
                      </button>
                      <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Registering Patient...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">✅</span>
                            Register Patient
                          </>
                        )}
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
};

export default AddPatient;