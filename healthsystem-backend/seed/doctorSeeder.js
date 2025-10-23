import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Doctor from "../src/models/Doctor.js";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Sample doctors with plaintext passwords
const doctors = [
  { firstName: "John", lastName: "Doe", email: "john.doe@example.com", phone: "0771234567", specialization: "Cardiologist", experience: 10, availableDays: ["Monday","Wednesday","Friday"], password: "password123" },
  { firstName: "Alice", lastName: "Smith", email: "alice.smith@example.com", phone: "0772345678", specialization: "Dermatologist", experience: 7, availableDays: ["Tuesday","Thursday"], password: "password123" },
  { firstName: "Robert", lastName: "Brown", email: "robert.brown@example.com", phone: "0773456789", specialization: "Neurologist", experience: 12, availableDays: ["Monday","Thursday"], password: "password123" },
  { firstName: "Emma", lastName: "Johnson", email: "emma.johnson@example.com", phone: "0774567890", specialization: "Pediatrician", experience: 5, availableDays: ["Wednesday","Friday"], password: "password123" },
  { firstName: "Michael", lastName: "Davis", email: "michael.davis@example.com", phone: "0775678901", specialization: "Orthopedic", experience: 15, availableDays: ["Monday","Tuesday","Thursday"], password: "password123" },
  { firstName: "Sophia", lastName: "Miller", email: "sophia.miller@example.com", phone: "0776789012", specialization: "Gynecologist", experience: 8, availableDays: ["Tuesday","Friday"], password: "password123" },
  { firstName: "William", lastName: "Wilson", email: "william.wilson@example.com", phone: "0777890123", specialization: "General Physician", experience: 20, availableDays: ["Monday","Wednesday"], password: "password123" },
  { firstName: "Olivia", lastName: "Moore", email: "olivia.moore@example.com", phone: "0778901234", specialization: "Ophthalmologist", experience: 6, availableDays: ["Thursday","Friday"], password: "password123" },
  { firstName: "James", lastName: "Taylor", email: "james.taylor@example.com", phone: "0779012345", specialization: "ENT", experience: 9, availableDays: ["Monday","Tuesday"], password: "password123" },
  { firstName: "Isabella", lastName: "Anderson", email: "isabella.anderson@example.com", phone: "0770123456", specialization: "Psychiatrist", experience: 11, availableDays: ["Wednesday","Thursday"], password: "password123" },
];

const seedDoctors = async () => {
  try {
    await Doctor.deleteMany(); // clear existing doctors

    for (let doc of doctors) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(doc.password, salt);
      await Doctor.create({ ...doc, passwordHash, password: undefined }); // remove plaintext password
    }

    console.log("Doctors seeded successfully with passwords!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDoctors();
