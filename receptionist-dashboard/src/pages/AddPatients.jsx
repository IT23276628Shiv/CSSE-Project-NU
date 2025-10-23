import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axiosInstance";
import { Form, Button, Spinner, InputGroup, Container, Row, Col, Alert, Card } from "react-bootstrap";
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
    age: "",
    address: { street: "", city: "", district: "", province: "", postalCode: "", country: "Sri Lanka" },
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleFileChange = e => setAvatar(e.target.files[0]);
  const handleGenerateNewId = () => setFormData(prev => ({ ...prev, healthCardId: generateHealthCardId() }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!formData.age || isNaN(Number(formData.age))) {
      setMessage("Please enter a valid age");
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

      await api.post("/patients", patientData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      setMessage("Patient added successfully!");
      setFormData({
        fullName: "", email: "", phone: "", healthCardId: generateHealthCardId(), passwordHash: "",
        gender: "MALE", bloodGroup: "", age: "",
        address: { street: "", city: "", district: "", province: "", postalCode: "", country: "Sri Lanka" },
      });
      setAvatar(null);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
       <Navbar name={localStorage.getItem("name")} />
      <div className="content-wrapper d-flex">
        <Sidebar />
        <Container className="mt-4">
          <Card className="shadow-sm p-4">
            <h2 className="text-primary mb-4">Add New Patient</h2>

            {message && <Alert variant="info">{message}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone</Form.Label>
                    <Form.Control type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Health Card ID</Form.Label>
                    <InputGroup>
                      <Form.Control type="text" name="healthCardId" value={formData.healthCardId} readOnly />
                      <Button variant="secondary" onClick={handleGenerateNewId}>Generate New ID</Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" name="passwordHash" placeholder="Password" value={formData.passwordHash} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Gender</Form.Label>
                    <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Age</Form.Label>
                    <Form.Control type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Blood Group</Form.Label>
                    <Form.Select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
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
                  </Form.Group>
                </Col>
              </Row>

              <h5 className="mt-4 mb-3">Address</h5>
              <Row className="mb-3">
                {["street", "city", "district", "province", "postalCode"].map(field => (
                  <Col md={6} key={field} className="mb-3">
                    <Form.Group>
                      <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                      <Form.Control type="text" name={`address.${field}`} placeholder={field} value={formData.address[field]} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                ))}
              </Row>

              <Form.Group className="mb-4">
                <Form.Label>Avatar</Form.Label>
                <Form.Control type="file" name="file" onChange={handleFileChange} />
              </Form.Group>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <><Spinner animation="border" size="sm" /> Adding...</> : "Add Patient"}
              </Button>
            </Form>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default AddPatient;
