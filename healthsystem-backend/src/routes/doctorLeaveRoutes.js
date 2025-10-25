// routes/doctorLeaveRoutes.js
import express from "express";
import { addLeave, getDoctorLeaves } from "../controllers/doctorLeaveController.js";

const router = express.Router();

// POST: Add new leave
router.post("/add", addLeave);

// GET: Fetch doctor leaves
router.get("/:doctorId", getDoctorLeaves);

export default router;
