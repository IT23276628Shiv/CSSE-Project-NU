import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Report from "../models/PatientsReports.js";

// 1️⃣ Get patient by QR or Health Card ID
export const getPatientByQR = async (req, res) => {
  try {
    const { qrCode, healthCardId, doctorId } = req.body;

    if (!qrCode && !healthCardId) return res.status(400).json({ message: "QR code or Health Card ID required" });

    const patient = await Patient.findOne(qrCode ? { qrCode } : { healthCardId });

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Check if patient has appointment with this doctor today or future
    const appointment = await Appointment.findOne({
      patient: patient._id,
      doctor: doctorId,
      date: { $gte: new Date() },
      status: { $in: ["BOOKED", "CONFIRMED"] },
    });

    if (!appointment) return res.status(403).json({ message: "No active appointment with this doctor" });

    res.json({ patient, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Add a report
export const addReport = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, message } = req.body;

    if (!patientId || !doctorId || !message) return res.status(400).json({ message: "Missing fields" });

    const report = new Report({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      message,
      createdAt: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }))
    });

    await report.save();

    res.status(201).json({ message: "Report added successfully", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// 3️⃣ Get all reports for a patient
export const getReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    const reports = await Report.find({ patient: patientId })
      .populate("doctor", "fullName")
      .sort({ createdAt: -1 }); // latest first

    res.json({ reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
