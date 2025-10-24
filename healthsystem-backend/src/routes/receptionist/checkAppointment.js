// backend/routes/receptionist/checkAppointment.js
import express from "express";
import {
  getPatientByHealthId,
  checkDoctorAvailability,
  confirmBooking,
} from "../../controllers/checkAppointmentController.js";

const router = express.Router();

// GET patient by health ID
router.get("/patient/:healthId", getPatientByHealthId);

// POST check doctor availability
router.post("/doctor/check", checkDoctorAvailability);

// POST confirm booking
router.post("/booking/confirm", confirmBooking);

export default router;
