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
      .populate("doctor", "fullName")
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
// export const checkDoctorAvailability = async (req, res) => {
//   try {
//     const { doctorId, date, timeSlot } = req.body;

//     // 🧩 Validate input
//     if (!doctorId || !date || !timeSlot?.start || !timeSlot?.end) {
//       return res.status(400).json({
//         available: false,
//         message: "Missing required fields (doctorId, date, timeSlot.start, timeSlot.end)",
//       });
//     }

//     // 🧠 Fetch doctor
//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor) {
//       return res.status(404).json({ available: false, message: "Doctor not found" });
//     }

//     // 📅 Check if the date matches doctor’s available days
//     const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
//     if (!doctor.availableDays.includes(dayName)) {
//       return res.json({
//         available: false,
//         message: `Doctor not available on ${dayName}`,
//       });
//     }

//     // 🚫 Check if doctor is on leave (if you add leave support later)
//     if (doctor.leaves?.some((leave) =>
//       new Date(date) >= new Date(leave.startDate) &&
//       new Date(date) <= new Date(leave.endDate)
//     )) {
//       return res.json({
//         available: false,
//         message: "Doctor is on leave on this date",
//       });
//     }

//     // 🕒 Check if another booking already exists at that time
//     const existingAppointment = await Appointment.findOne({
//       doctor: doctorId,
//       date: new Date(date),
//       "timeSlot.start": timeSlot.start,
//       "timeSlot.end": timeSlot.end,
//       status: { $in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
//     });

//     if (existingAppointment) {
//       return res.json({
//         available: false,
//         message: "Doctor already booked at this time slot",
//       });
//     }

//     // ✅ If all checks pass
//     res.json({ available: true, message: "Doctor available for this slot" });
//   } catch (err) {
//     console.error("Error checking doctor availability:", err);
//     res.status(500).json({ available: false, message: "Server error" });
//   }
// };
export const checkDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;

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
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      "timeSlot.start": timeSlot.start,
      "timeSlot.end": timeSlot.end,
      status: { $in: ["BOOKED", "CONFIRMED", "IN_PROGRESS"] },
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

    booking.status = "Confirmed";
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
