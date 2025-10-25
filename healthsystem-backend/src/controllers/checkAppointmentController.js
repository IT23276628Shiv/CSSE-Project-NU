// backend/controllers/checkAppointmentController.js
import Patient from "../models/Patient.js";
import Booking from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

// Get patient + bookings
export const getPatientByHealthId = async (req, res) => {
  try {
    const { healthId } = req.params;

    // Fetch patient
    const patient = await Patient.findOne({ healthCardId: healthId }).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    console.log("Patient DOB from DB:", patient.dateOfBirth); // <-- debug

    // fetch all bookings for this patient
    const bookings = await Booking.find({ patient: patient._id })
      .populate("doctor", "firstName lastName")
      .lean();

    // Calculate age safely
    let age = null;
    if (patient.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth);
    //   console.log("Parsed DOB:", dob); // <-- debug

      if (!isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        // console.log("Calculated Age:", age); // <-- debug
      }
    }

    res.json({ patient: { ...patient, bookings, age } });
  } catch (err) {
    console.error("Error in getPatientByHealthId:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// Check doctor availability for a specific booking

export const verifyDoctorBeforeAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, currentBookingId } = req.body;

    // Validate input
    if (!doctorId || !date || !timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({
        available: false,
        message: "Missing required fields (doctorId, date, timeSlot.start, timeSlot.end)",
      });
    }

    // Fetch doctor
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({ available: false, message: "Doctor not found" });
    }

    // Ensure availableDays exists
    const availableDays = Array.isArray(doctor.availableDays) ? doctor.availableDays : [];

    // Check if the date matches doctor’s available days
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    if (!availableDays.includes(dayName)) {
      return res.json({
        available: false,
        message: `Doctor not available on ${dayName}`,
      });
    }

    // Ensure leaves exists
    const leaves = Array.isArray(doctor.leaves) ? doctor.leaves : [];
    
    // Check if doctor is on leave
    const onLeave = leaves.some((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const checkDate = new Date(date);
      return checkDate >= start && checkDate <= end;
    });

    if (onLeave) {
      return res.json({
        available: false,
        message: "Doctor is on leave on this date",
      });
    }

    // Check if another booking already exists at that time
    const existingAppointment = await Booking.findOne({
      doctor: doctorId,
      date: new Date(date),
      "timeSlot.start": timeSlot.start,
      "timeSlot.end": timeSlot.end,
      status: { $in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
      ...(currentBookingId ? { _id: { $ne: currentBookingId } } : {}), // exclude current booking
    });

    if (existingAppointment) {
      return res.json({
        available: false,
        message: "Doctor already booked at this time slot",
      });
    }

    // All checks passed
    res.json({ available: true, message: "Doctor available for this slot" });
  } catch (err) {
    console.error("Error checking doctor availability:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
};

// Confirm a booking
export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CONFIRMED";
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason, cancelledBy } = req.body;

    // 🧩 Validate input
    if (!bookingId || !reason || !cancelledBy) {
      return res.status(400).json({
        message: "Missing required fields (bookingId, reason, cancelledBy)",
      });
    }

    // 🔍 Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🚫 Update cancellation fields
    booking.status = "CANCELLED";
    booking.cancellationReason = reason;
    booking.cancelledBy = cancelledBy;
    booking.cancelledAt = new Date();

    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.error("❌ Cancel booking error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// POST /api/receptionist/booking/reschedule
export const rescheduleBooking = async (req, res) => {
  try {
    const { bookingId, newDate, newTimeSlot } = req.body;

    if (!bookingId || !newDate || !newTimeSlot?.start || !newTimeSlot?.end) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find existing booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Mark current booking as RESCHEDULED
    booking.status = "RESCHEDULED";
    await booking.save();

    // Create a new booking with same patient/doctor
    const newBooking = new Booking({
      patient: booking.patient,
      doctor: booking.doctor,
      date: new Date(newDate),
      timeSlot: newTimeSlot,
      status: "BOOKED",
      rescheduledFrom: booking._id,
      hospital: booking.hospital,
      department: booking.department,
      reason: booking.reason,
      priority: booking.priority,
      createdBy: booking.createdBy,
      appointmentNumber: `APT-${Date.now()}`, // <-- generate unique number
    });


    await newBooking.save();

    res.json({
      message: "Booking rescheduled successfully",
      newBooking
    });
  } catch (err) {
    console.error("Reschedule booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};