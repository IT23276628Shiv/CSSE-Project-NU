// src/controllers/receptionistController.js
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import cloudinary from "../config/cloudinary.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

export const addPatient = async (req, res) => {
  try {
    const { fullName, email, phone, healthCardId, passwordHash, gender, bloodGroup, dateOfBirth, address } = req.body;

    // Check for existing patient
    const existing = await Patient.findOne({ $or: [{ email }, { healthCardId }] });
    if (existing) return res.status(400).json({ error: "Email or Health Card ID already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Upload avatar if present
    let avatarUrl = "";
    if (req.file) {
      const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(fileStr, {
        folder: "healthsystem/avatars/patients",
        public_id: `patient_${healthCardId}`,
        overwrite: true
      });
      avatarUrl = uploadResult.secure_url;
    }

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(healthCardId);

    const patient = await Patient.create({
      fullName,
      email,
      phone,
      healthCardId,
      passwordHash: hashedPassword,
      gender,
      bloodGroup,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, // <-- fix here
      address: JSON.parse(address || "{}"),
      avatarUrl,
      qrCode: qrCodeData
    });

    res.status(201).json({ message: "Patient added successfully", patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/**
 * Get all patients
 */
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}, "fullName email phone qrCode healthCardId");
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

/**
 * Get patient by ID
 */
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id, "fullName qrCode healthCardId");
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
};
// Helper to generate 15-min slots for a day
const generateTimeSlots = (start = "09:00", end = "17:00") => {
  const slots = [];
  let [hour, min] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);

  while (hour < endHour || (hour === endHour && min < endMin)) {
    const startSlot = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    min += 15;
    if (min >= 60) {
      hour++;
      min = min % 60;
    }
    const endSlot = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    slots.push({ start: startSlot, end: endSlot });
  }
  return slots;
};

// GET available times for a doctor on a date
export const getAvailableTimes = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date)
      return res.status(400).json({ message: "Doctor and date required" });

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Parse date safely (local timezone)
    const dt = new Date(date + "T00:00:00"); // treat as local midnight
    const dayName = dt.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Colombo", // adjust if needed
    });

    // Check doctor availability
    if (!doctor.availableDays.includes(dayName)) {
      return res
        .status(400)
        .json({ message: `Doctor not available on ${dayName}` });
    }

    // Generate default slots (9 AM - 5 PM)
    const generateTimeSlots = (start, end, interval = 15) => {
      const slots = [];
      let [startH, startM] = start.split(":").map(Number);
      let [endH, endM] = end.split(":").map(Number);

      while (startH < endH || (startH === endH && startM < endM)) {
        const slotStart = `${String(startH).padStart(2, "0")}:${String(
          startM
        ).padStart(2, "0")}`;

        let nextM = startM + interval;
        let nextH = startH;
        if (nextM >= 60) {
          nextH += 1;
          nextM = nextM % 60;
        }
        const slotEnd = `${String(nextH).padStart(2, "0")}:${String(
          nextM
        ).padStart(2, "0")}`;

        slots.push({ start: slotStart, end: slotEnd });
        startH = nextH;
        startM = nextM;
      }
      return slots;
    };

    const allSlots = generateTimeSlots("09:00", "17:00");

    // Fetch booked appointments
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: dt,
    });

    const bookedSlots = appointments.map((a) => a.timeSlot.start);

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot.start)
    );

    return res.json(availableSlots.map((s) => s.start));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



// POST book appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, healthCardId, reason = "Consultation" } = req.body;

    if (!doctorId || !date || !time || !healthCardId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const patient = await Patient.findOne({ healthCardId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Check if doctor is available on that day
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    if (!doctor.availableDays.includes(dayName)) {
      return res.status(400).json({ message: `Doctor not available on ${dayName}` });
    }

    // Check if slot already booked
    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      "timeSlot.start": time
    });
    if (existing) {
      return res.status(400).json({ message: "Time slot already booked" });
    }

    // Calculate end time
    const [hour, min] = time.split(":").map(Number);
    let endHour = hour;
    let endMin = min + 15;
    if (endMin >= 60) {
      endHour++;
      endMin = endMin % 60;
    }
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // Generate appointment number
    const dateStr = new Date(date).toISOString().split("T")[0].replace(/-/g, "");
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const appointmentNumber = `APT-${dateStr}-${randomNum}`;

    const newAppointment = new Appointment({
      appointmentNumber,
      patient: patient._id,
      doctor: doctor._id,
      date: new Date(date),
      timeSlot: { start: time, end: endTime },
      reason,
    });

    await newAppointment.save();
    res.json({ message: "Appointment booked successfully", appointment: newAppointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all doctors
export const getDoctors = async (req, res) => {
  try {
    // Include availableDays in the returned fields
    const doctors = await Doctor.find({}, "_id firstName lastName specialization availableDays");
    res.status(200).json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
};
