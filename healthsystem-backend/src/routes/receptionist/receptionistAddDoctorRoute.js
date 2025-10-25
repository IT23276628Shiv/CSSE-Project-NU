import express from "express";
import { addDoctor } from "../../controllers/receptionistAddDoctor.js";

const router = express.Router();

// POST /api/receptionist/add-doctor
router.post("/add-doctor", addDoctor);

export default router;
