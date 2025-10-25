// healthsystem-backend/src/models/Appointment.js
// FIXED: Made doctor and timeSlot optional for flexible booking

import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff",
      required: false  // ✅ FIXED: Made optional
    },
    date: { 
      type: Date, 
      required: true 
    },
    timeSlot: {
      start: { type: String, required: false },  // ✅ FIXED: Made optional
      end: { type: String, required: false }
    },
    status: { 
      type: String, 
      enum: [
        "BOOKED", 
        "CONFIRMED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED", 
        "CANCELLED",
        "NO_SHOW",
        "RESCHEDULED"
      ], 
      default: "BOOKED" 
    },
    reason: {
      type: String,
      default: "General consultation"
    },
    priority: {
      type: String,
      enum: ["NORMAL", "URGENT", "EMERGENCY"],
      default: "NORMAL"
    },
    tokenNumber: Number,
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital",
      required: true  // ✅ Ensure hospital is required
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department",
      required: true  // ✅ Ensure department is required
    },
    consultationStartTime: Date,
    consultationEndTime: Date,
    symptoms: [String],
    notes: String,
    patientNotes: String,
    staffNotes: String,
    cancellationReason: String,  // ✅ ADDED: Missing field
    cancelledBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: { type: String, enum: ["PATIENT", "STAFF"] }
    },
    cancelledAt: Date,
    rescheduledFrom: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    rescheduledTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    payment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Payment" 
    },
    attachments: [{
      name: String,
      url: String,
      uploadedAt: Date
    }],
    reminderSent: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    createdBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: { type: String, enum: ["PATIENT", "STAFF"] }
    }
  },
  { timestamps: true }
);

// Indexes
appointmentSchema.index({ appointmentNumber: 1 });
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ hospital: 1, department: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });

// Virtual for duration
appointmentSchema.virtual("duration").get(function() {
  if (this.consultationStartTime && this.consultationEndTime) {
    return Math.floor((this.consultationEndTime - this.consultationStartTime) / (1000 * 60));
  }
  return 15;
});

export default mongoose.model("Appointment", appointmentSchema);