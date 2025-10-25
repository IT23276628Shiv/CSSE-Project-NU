// controllers/doctorLeaveController.js
import Doctor from "../models/Doctor.js";

// ✅ Add Leave
export const addLeave = async (req, res) => {
  try {
    const { doctorId, startDate, endDate, reason } = req.body;

    if (!doctorId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Push new leave record
    doctor.leaves.push({ startDate, endDate, reason });
    await doctor.save();

    res.status(201).json({
      message: "Leave added successfully",
      leaves: doctor.leaves,
    });
  } catch (error) {
    console.error("Error adding leave:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get all leaves for doctor
export const getDoctorLeaves = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.status(200).json({ leaves: doctor.leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
