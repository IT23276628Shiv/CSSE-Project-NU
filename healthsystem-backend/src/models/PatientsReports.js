import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    message: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })) },
  },
  { timestamps: true }
);

reportSchema.index({ patient: 1, doctor: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
