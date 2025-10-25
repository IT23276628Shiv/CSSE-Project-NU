import express from "express";
import { loginDoctor } from "../controllers/doctorAuthController.js";

const router = express.Router();

router.post("/login", loginDoctor);

export default router;
