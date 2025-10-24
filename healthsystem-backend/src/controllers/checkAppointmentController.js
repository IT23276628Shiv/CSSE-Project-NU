// backend/controllers/checkAppointmentController.js
import Patient from "../models/Patient.js";
import Booking from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

// Get patient + bookings
export const getPatientByHealthId = async (req, res) => {
  try {
    const { healthId } = req.params;

    const patient = await Patient.findOne({ healthCardId: healthId }).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // fetch all bookings for this patient
    const bookings = await Booking.find({ patient: patient._id })
      .populate("doctor", "fullName") // populate doctor name
      .lean();

    res.json({ patient: { ...patient, bookings } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Check doctor availability for a specific booking
export const checkDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    const exists = await Booking.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $in: ["Pending", "Confirmed"] },
    });

    if (exists) {
      return res.json({ available: false, message: "Doctor already booked at this time" });
    }

    res.json({ available: true, message: "Doctor available" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
