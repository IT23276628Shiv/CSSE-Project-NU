import express from "express";
import {getPatientHistory} from "../../controllers/receptionistwithpatientController.js";

const router = express.Router();

// GET patient by health ID
router.get("/:id/history", getPatientHistory);

export default router;
