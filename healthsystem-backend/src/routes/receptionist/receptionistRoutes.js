// src/routes/receptionist/receptionistRoutes.js
import express from "express";
import { addPatient , getAllPatients, getPatientById } from "../../controllers/receptionistController.js";
import { authenticate, requireStaff, requireReceptionist } from "../../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Login route (already exists)
import receptionistLoginRouter from "./receptionistAuthRoutes.js";
router.use("/", receptionistLoginRouter);

// Add patient (Receptionist only)
router.post(
  "/patients",
  authenticate,       // use your existing auth
  requireStaff,       // receptionist is a type of staff
  upload.single("file"),
  addPatient
);

// ✅ Receptionist can view all patients
router.get("/patients", authenticate, requireStaff, getAllPatients);

// ✅ Get single patient details
router.get("/patients/:id", authenticate, requireStaff, getPatientById);

export default router;
