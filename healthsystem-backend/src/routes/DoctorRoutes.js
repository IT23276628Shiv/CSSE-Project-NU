import express from "express";
import { getPatientByQR, addReport, getReports } from "../controllers/DoctorController.js";

const router = express.Router();

// Scan QR or search by healthCardId
router.post("/patient", getPatientByQR);

// Add report
router.post("/report", addReport);

// Get all reports for patient
router.get("/reports/:patientId", getReports);

export default router;
