import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Doctor from "../models/Doctor.js";

export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Find doctor
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, doctor.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate token
    const token = jwt.sign(
      {
        id: doctor._id,
        userType: "DOCTOR",
        email: doctor.email,
        specialization: doctor.specialization,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Doctor login successful",
      token,
      doctor: {
        id: doctor._id,
        fullName: `${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
        email: doctor.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
};
