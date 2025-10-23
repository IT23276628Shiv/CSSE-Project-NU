import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      required: true,
      // Format: APT-YYYYMMDD-XXXXX
    },
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Doctor", // changed from Staff to Doctor model
      required: true
    },
    date: { 
      type: Date, 
      required: true 
    },
    timeSlot: {
      start: { type: String, required: true }, // e.g., "15:00"
      end: { type: String, required: true }    // e.g., "15:15"
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
      required: true
    },
    priority: {
      type: String,
      enum: ["NORMAL", "URGENT", "EMERGENCY"],
      default: "NORMAL"
    },
    tokenNumber: Number,  // Queue token for the day
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital"
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department"
    },
    consultationStartTime: Date,
    consultationEndTime: Date,
    symptoms: [String],
    notes: String,
    patientNotes: String,
    staffNotes: String,
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

// Indexes for better performance
appointmentSchema.index({ appointmentNumber: 1 });
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ hospital: 1, department: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });

// Virtual for duration (minutes)
appointmentSchema.virtual("duration").get(function() {
  if (this.consultationStartTime && this.consultationEndTime) {
    return Math.floor((this.consultationEndTime - this.consultationStartTime) / (1000 * 60));
  }
  return 15; // default 15 minutes if not set
});

export default mongoose.model("Appointment", appointmentSchema);
