import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Record from "../models/Record.js";
/**
 * 📜 Get patient history by patient ID (based on Appointments)
 * Route: GET /receptionist/patients/:id/history
 */
import Report from "../models/PatientsReports.js"; // ✅ Import your Report model

export const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Find the main patient details
    const patient = await Patient.findById(id)
      .populate("preferredHospital", "name address")
      .populate("lastVisit.hospital", "name")
      .populate("lastVisit.department", "name")
      .lean();

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Step 2: Find all appointments
    const appointments = await Appointment.find({ patient: id })
      .populate("doctor", "firstName lastName email specialization phone")
      .populate("hospital", "name")
      .populate("department", "name")
      .sort({ date: -1 })
      .lean();

    // Step 3: Find all reports
    const reports = await Report.find({ patient: id })
      .populate("doctor", "firstName lastName email phone specialization")
      .populate("appointment", "date hospital department")
      .sort({ createdAt: -1 })
      .lean();

    // Step 4: Combine all into one object
    const result = {
      personalInfo: {
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nic: patient.nic,
        address: patient.fullAddress || "",
        bloodGroup: patient.bloodGroup,
        emergencyContact: patient.emergencyContact,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        currentMedications: patient.currentMedications,
        insuranceInfo: patient.insuranceInfo,
        healthCardId: patient.healthCardId,
        qrCode: patient.qrCode,
        maritalStatus: patient.maritalStatus,
        occupation: patient.occupation,
        nationality: patient.nationality,
        registrationDate: patient.registrationDate,
        lastVisit: patient.lastVisit,
      },
      appointments,
      medicalReports: reports.map((r) => ({
        doctor: r.doctor,
        appointment: r.appointment,
        message: r.message,
        createdAt: r.createdAt,
      })),
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching patient full details:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
};


  export const updatepatient = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.healthCardId; // Prevent healthCardId update

    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedPatient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
