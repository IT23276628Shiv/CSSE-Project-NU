// healthsystem-backend/src/controllers/appointmentController.js
// Updated with comprehensive date validation

import Appointment from "../models/Appointment.js";
import { Notification } from "../models/AuditNotification.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  validateObjectId,
  validateAppointmentDate,
  validateTextLength,
  validateFields
} from "../utils/validators.js";

// Generate unique appointment number
function generateAppointmentNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `APT-${year}${month}${day}-${random}`;
}

export const listMine = asyncHandler(async (req, res) => {
  const { status, upcoming } = req.query;
  let query = { patient: req.user.id };
  
  if (status) query.status = status;
  if (upcoming === 'true') {
    query.date = { $gte: new Date() };
    query.status = "BOOKED";
  }
  
  const items = await Appointment.find(query)
    .populate("hospital", "name hospitalId")
    .populate("department", "name code")
    .populate("doctor", "fullName specialization")
    .sort({ date: 1 });
  
  res.json(items);
});

export const getById = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ 
    _id: req.params.id, 
    patient: req.user.id 
  })
  .populate("hospital", "name hospitalId")
  .populate("department", "name code")
  .populate("doctor", "fullName specialization");
  
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  res.json(appt);
});

export const create = asyncHandler(async (req, res) => {
  const { hospital, department, doctor, date, notes } = req.body;
  
  // Comprehensive validation
  const validationResults = validateFields({
    hospital: validateObjectId(hospital, "Hospital"),
    department: validateObjectId(department, "Department"),
    date: validateAppointmentDate(date),
    notes: notes ? validateTextLength(notes, "Notes", 0, 500) : { valid: true, error: null }
  });

  if (!validationResults.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: validationResults.errors
    });
  }

  // Validate doctor if provided
  if (doctor) {
    const doctorValidation = validateObjectId(doctor, "Doctor");
    if (!doctorValidation.valid) {
      return res.status(400).json({ error: doctorValidation.error });
    }
  }

  // Parse appointment date
  const appointmentDate = new Date(date);

  // Check if slot is already booked (30-minute window)
  const existingAppointment = await Appointment.findOne({
    hospital,
    department,
    date: {
      $gte: new Date(appointmentDate.getTime() - 30 * 60 * 1000), // 30 min before
      $lte: new Date(appointmentDate.getTime() + 30 * 60 * 1000)  // 30 min after
    },
    status: { $in: ["BOOKED", "CONFIRMED"] }
  });

  if (existingAppointment) {
    return res.status(400).json({ 
      error: "Time slot already booked. Please choose a different time." 
    });
  }

  // Create appointment with generated number
  const appt = await Appointment.create({
    appointmentNumber: generateAppointmentNumber(),
    patient: req.user.id,
    hospital,
    department,
    doctor: doctor || undefined,
    date: appointmentDate,
    reason: notes || "General consultation",
    notes,
    createdBy: {
      userId: req.user.id,
      userType: "PATIENT"
    }
  });

  // Populate references for response
  await appt.populate([
    { path: "hospital", select: "name hospitalId" },
    { path: "department", select: "name code" },
    { path: "doctor", select: "fullName specialization" }
  ]);

  // Create notification
  try {
    await Notification.create({
      recipient: {
        userId: req.user.id,
        userType: "PATIENT"
      },
      type: "APPOINTMENT_CONFIRMED",
      priority: "MEDIUM",
      title: "Appointment Booked",
      message: `Your appointment at ${appt.hospital.name} - ${appt.department.name} on ${appointmentDate.toLocaleString()} has been confirmed.`,
      relatedResource: {
        resourceType: "APPOINTMENT",
        resourceId: appt._id
      },
      channels: {
        inApp: { sent: true, sentAt: new Date() }
      },
      sentBy: {
        system: true
      }
    });
  } catch (notifError) {
    console.error("Notification creation failed:", notifError);
  }

  // Send real-time update if socket is available
  if (req.io) {
    req.io.to(req.user.id.toString()).emit("appointment:created", appt);
  }
  
  res.status(201).json(appt);
});

export const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reason = req.body?.reason || "Cancelled by patient";
  
  console.log("=== CANCEL REQUEST ===");
  console.log("Appointment ID:", id);
  console.log("User ID:", req.user.id);
  console.log("Reason:", reason);
  
  try {
    // Find appointment
    const appt = await Appointment.findOne({ 
      _id: id, 
      patient: req.user.id 
    });
    
    if (!appt) {
      console.log("❌ Appointment not found");
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    console.log("✅ Found appointment:", {
      id: appt._id,
      status: appt.status,
      date: appt.date
    });
    
    // Check if appointment can be cancelled
    if (appt.status !== "BOOKED" && appt.status !== "CONFIRMED") {
      console.log("❌ Cannot cancel - wrong status:", appt.status);
      return res.status(400).json({ 
        error: `Cannot cancel appointment with status: ${appt.status}` 
      });
    }

    // Update appointment
    appt.status = "CANCELLED";
    appt.cancellationReason = reason;
    appt.cancelledBy = {
      userId: req.user.id,
      userType: "PATIENT"
    };
    appt.cancelledAt = new Date();
    
    console.log("💾 Saving appointment...");
    await appt.save();
    console.log("✅ Appointment saved successfully");

    // Populate for response
    await appt.populate([
      { path: "hospital", select: "name hospitalId" },
      { path: "department", select: "name code" },
      { path: "doctor", select: "fullName specialization" }
    ]);

    // Send real-time update
    try {
      if (req.io) {
        req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
        console.log("📡 Socket event sent");
      }
    } catch (socketError) {
      console.error("Socket error (non-critical):", socketError.message);
    }
    
    console.log("=== CANCEL SUCCESS ===");
    res.json(appt);
    
  } catch (error) {
    console.error("=== CANCEL ERROR ===");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
});

export const reschedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;

  // Validate new date
  const dateValidation = validateAppointmentDate(newDate);
  if (!dateValidation.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: { date: dateValidation.error }
    });
  }

  const appt = await Appointment.findOne({ _id: id, patient: req.user.id })
    .populate("hospital", "name hospitalId");
  
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  if (appt.status !== "BOOKED" && appt.status !== "CONFIRMED") {
    return res.status(400).json({ error: "Cannot reschedule this appointment" });
  }

  const newAppointmentDate = new Date(newDate);

  // Check if new slot is available
  const conflicting = await Appointment.findOne({
    hospital: appt.hospital._id,
    department: appt.department,
    date: {
      $gte: new Date(newAppointmentDate.getTime() - 30 * 60 * 1000),
      $lte: new Date(newAppointmentDate.getTime() + 30 * 60 * 1000)
    },
    status: { $in: ["BOOKED", "CONFIRMED"] },
    _id: { $ne: id }
  });

  if (conflicting) {
    return res.status(400).json({ error: "New time slot is not available" });
  }

  const oldDate = appt.date;
  appt.date = newAppointmentDate;
  appt.status = "BOOKED"; // Reset to BOOKED after rescheduling
  await appt.save();

  // Create notification
  try {
    await Notification.create({
      recipient: {
        userId: req.user.id,
        userType: "PATIENT"
      },
      type: "APPOINTMENT_RESCHEDULED",
      priority: "HIGH",
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled from ${oldDate.toLocaleString()} to ${newAppointmentDate.toLocaleString()}.`,
      relatedResource: {
        resourceType: "APPOINTMENT",
        resourceId: appt._id
      },
      channels: {
        inApp: { sent: true, sentAt: new Date() }
      },
      sentBy: {
        system: true
      }
    });
  } catch (notifError) {
    console.error("Notification creation failed:", notifError);
  }

  if (req.io) {
    req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
  }
  
  res.json(appt);
});