// backend/routes/receptionist/checkAppointment.js
import express from "express";
import {
  getPatientByHealthId,
  verifyDoctorBeforeAppointment,
  confirmBooking,
  cancelBooking ,
  rescheduleBooking ,
} from "../../controllers/checkAppointmentController.js";

const router = express.Router();

// GET patient by health ID
router.get("/patient/:healthId", getPatientByHealthId);

// POST check doctor availability
router.post("/check-availability", verifyDoctorBeforeAppointment);
// POST confirm booking
router.post("/booking/confirm", confirmBooking);

// POST /api/receptionist/booking/cancel
router.post("/booking/cancel", cancelBooking);

router.post("/booking/reschedule", rescheduleBooking);

export default router;
