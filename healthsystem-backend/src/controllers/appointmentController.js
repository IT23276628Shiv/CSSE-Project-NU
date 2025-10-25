// healthsystem-backend/src/controllers/appointmentController.js
// FIXED: Improved booking logic with time slots

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

// Calculate time slot end (15 minutes later)
function calculateEndTime(startTime) {
  if (!startTime) return null;
  
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + 15;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

export const listMine = asyncHandler(async (req, res) => {
  const { status, upcoming } = req.query;
  let query = { patient: req.user.id };
  
  if (status) query.status = status;
  if (upcoming === 'true') {
    query.date = { $gte: new Date() };
    query.status = { $in: ["BOOKED", "CONFIRMED"] };
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
  const { hospital, department, doctor, date, notes, timeSlot } = req.body;
  
  console.log("=== CREATE APPOINTMENT REQUEST ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  // Comprehensive validation
  const validationResults = validateFields({
    hospital: validateObjectId(hospital, "Hospital"),
    department: validateObjectId(department, "Department"),
    date: validateAppointmentDate(date),
    notes: notes ? validateTextLength(notes, "Notes", 0, 500) : { valid: true, error: null }
  });

  if (!validationResults.valid) {
    console.log("❌ Validation failed:", validationResults.errors);
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

  const appointmentDate = new Date(date);
  
  // Extract time from appointment date
  const hours = appointmentDate.getHours();
  const minutes = appointmentDate.getMinutes();
  const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const endTime = calculateEndTime(startTime);
  
  console.log("✅ Parsed time slot:", { startTime, endTime });

  // Check for conflicting appointments (30-minute window)
  const conflictStart = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
  const conflictEnd = new Date(appointmentDate.getTime() + 30 * 60 * 1000);
  
  const existingAppointment = await Appointment.findOne({
    hospital,
    department,
    date: {
      $gte: conflictStart,
      $lte: conflictEnd
    },
    status: { $in: ["BOOKED", "CONFIRMED"] }
  });

  if (existingAppointment) {
    console.log("❌ Slot conflict detected");
    return res.status(400).json({ 
      error: "Time slot already booked. Please choose a different time." 
    });
  }

  // Create appointment
  const appt = await Appointment.create({
    appointmentNumber: generateAppointmentNumber(),
    patient: req.user.id,
    hospital,
    department,
    doctor: doctor || undefined,
    date: appointmentDate,
    timeSlot: {
      start: startTime,
      end: endTime
    },
    reason: notes || "General consultation",
    notes,
    createdBy: {
      userId: req.user.id,
      userType: "PATIENT"
    }
  });

  console.log("✅ Appointment created:", appt._id);

  // Populate references
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

  // Send real-time update
  if (req.io) {
    req.io.to(req.user.id.toString()).emit("appointment:created", appt);
  }
  
  console.log("=== APPOINTMENT CREATION SUCCESS ===");
  res.status(201).json(appt);
});

export const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reason = req.body?.reason || "Cancelled by patient";
  
  const appt = await Appointment.findOne({ 
    _id: id, 
    patient: req.user.id 
  });
  
  if (!appt) {
    return res.status(404).json({ error: "Appointment not found" });
  }
  
  if (appt.status !== "BOOKED" && appt.status !== "CONFIRMED") {
    return res.status(400).json({ 
      error: `Cannot cancel appointment with status: ${appt.status}` 
    });
  }

  appt.status = "CANCELLED";
  appt.cancellationReason = reason;
  appt.cancelledBy = {
    userId: req.user.id,
    userType: "PATIENT"
  };
  appt.cancelledAt = new Date();
  
  await appt.save();

  await appt.populate([
    { path: "hospital", select: "name hospitalId" },
    { path: "department", select: "name code" },
    { path: "doctor", select: "fullName specialization" }
  ]);

  if (req.io) {
    req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
  }
  
  res.json(appt);
});

export const reschedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;

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
  
  // Extract time
  const hours = newAppointmentDate.getHours();
  const minutes = newAppointmentDate.getMinutes();
  const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const endTime = calculateEndTime(startTime);

  // Check conflicts
  const conflictStart = new Date(newAppointmentDate.getTime() - 30 * 60 * 1000);
  const conflictEnd = new Date(newAppointmentDate.getTime() + 30 * 60 * 1000);
  
  const conflicting = await Appointment.findOne({
    hospital: appt.hospital._id,
    department: appt.department,
    date: {
      $gte: conflictStart,
      $lte: conflictEnd
    },
    status: { $in: ["BOOKED", "CONFIRMED"] },
    _id: { $ne: id }
  });

  if (conflicting) {
    return res.status(400).json({ error: "New time slot is not available" });
  }

  const oldDate = appt.date;
  appt.date = newAppointmentDate;
  appt.timeSlot = {
    start: startTime,
    end: endTime
  };
  appt.status = "BOOKED";
  await appt.save();

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