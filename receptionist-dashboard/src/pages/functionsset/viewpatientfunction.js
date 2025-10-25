// src/utils/patientHandlers.js
import api from "../../api/axiosInstance";


/**
 * 🔍 Handle patient search
 */
export const handleSearch = (e, patients, setSearch, setFilteredPatients) => {
  const value = e.target.value.toLowerCase();
  setSearch(value);

  const filtered = patients.filter(
    (p) =>
      (p.fullName && p.fullName.toLowerCase().includes(value)) ||
      (p.email && p.email.toLowerCase().includes(value))
  );

  setFilteredPatients(filtered);
};

/**
 * 📦 Fetch all patients
 */
export const fetchPatients = async (setPatients, setFilteredPatients, setLoading) => {
  try {
    const res = await api.get("/receptionist/patients");
    setPatients(res.data);
    setFilteredPatients(res.data);
  } catch (error) {
    console.error("Error fetching patients:", error);
  } finally {
    setLoading(false);
  }
};

/**
 * 👁️ View single patient
 */
export const handleView = async (id, setSelectedPatient, setShowModal) => {
  try {
    const res = await api.get(`/receptionist/patients/${id}`);
    setSelectedPatient(res.data);
    setShowModal(true);
  } catch (error) {
    console.error("Error loading patient:", error);
  }
};

/**
 * 💾 Download QR Code
 */
export const handleDownload = (selectedPatient) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.src = selectedPatient.qrCode;

  img.onload = () => {
    const padding = 100;
    const textHeight = 40;
    canvas.width = img.width + padding * 2;
    canvas.height = img.height + textHeight * 3 + padding * 3;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(selectedPatient.fullName, canvas.width / 2, padding + 20);

    ctx.font = "16px Arial";
    ctx.fillText("Health Card ID: " + selectedPatient.healthCardId, canvas.width / 2, padding + 50);

    ctx.drawImage(img, padding, padding + textHeight * 2, img.width, img.height);

    const link = document.createElement("a");
    link.download = `${selectedPatient.fullName}_QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
};


import { useNavigate } from "react-router-dom";

/**
 * 📜 Navigate to patient's history page
 */
export const handleViewHistory = (navigate, id) => {
  navigate(`/patients/${id}/history`);
};

