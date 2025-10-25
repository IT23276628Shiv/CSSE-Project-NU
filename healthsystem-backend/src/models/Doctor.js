import mongoose from "mongoose";
import bcrypt from "bcrypt";

const doctorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true }, // in years
  availableDays: [{ type: String }], // e.g., ["Monday", "Wednesday"]
    leaves: [
    {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      reason: String,
    },
  ],
  passwordHash: { type: String, required: true }, // hashed password
  createdAt: { type: Date, default: Date.now },
});

// Method to check password
doctorSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
