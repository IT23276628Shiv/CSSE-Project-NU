import express from "express";
import {getPatientHistory , updatepatient} from "../../controllers/receptionistwithpatientController.js";

const router = express.Router();

// GET patient by health ID
router.get("/:id/history", getPatientHistory);
router.put("/:id", updatepatient);



export default router;
