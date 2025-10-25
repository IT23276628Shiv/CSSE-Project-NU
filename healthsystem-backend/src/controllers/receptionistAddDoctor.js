import Doctor from "../models/Doctor.js";
import bcrypt from "bcrypt";

// ✅ Add new doctor by receptionist
export const addDoctor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      specialization,
      experience,
      availableDays,
      password,
    } = req.body;

    // validation
    if (!firstName || !lastName || !email || !phone || !specialization || !experience || !password) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // check duplicate email
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ message: "Doctor already exists with this email" });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // create new doctor
    const newDoctor = new Doctor({
      firstName,
      lastName,
      email,
      phone,
      specialization,
      experience,
      availableDays,
      passwordHash,
    });

    await newDoctor.save();

    return res.status(201).json({ message: "Doctor added successfully", doctor: newDoctor });
  } catch (error) {
    console.error("Error adding doctor:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
