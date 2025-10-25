// healthsystem-backend/src/controllers/patientController.js
// FIXED: Proper handling of string arrays to prevent character splitting

import { Patient, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import {
  validatePhone,
  validateFullName,
  validateDateOfBirth,
  validateBloodGroup,
  validateFields
} from "../utils/validators.js";

const upload = multer({ storage: multer.memoryStorage() });
export const avatarUploadMiddleware = upload.single("file");

/**
 * Helper function to properly handle array fields
 * Prevents string-to-character-array conversion
 */
const sanitizeArrayField = (field) => {
  if (!field) return undefined;
  
  // If it's already a proper array of objects/strings, return as-is
  if (Array.isArray(field)) {
    // Check if it's already properly formatted
    if (field.length > 0 && typeof field[0] === 'object' && field[0].hasOwnProperty('0')) {
      // This is a character array - reconstruct the strings
      return field.map(item => {
        if (typeof item === 'string') return item;
        // Reconstruct string from character object
        const chars = Object.keys(item)
          .filter(key => !isNaN(key) && key !== '_id')
          .sort((a, b) => Number(a) - Number(b))
          .map(key => item[key]);
        return chars.join('');
      }).filter(item => item && item.trim());
    }
    return field;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [field];
    } catch {
      return [field];
    }
  }
  
  return undefined;
};

/**
 * Get own profile (for patients)
 * GET /patients/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const me = await Patient.findById(req.user.id)
    .select("-passwordHash")
    .populate("preferredHospital lastVisit.hospital lastVisit.department")
    .lean(); // Use lean() for better performance
  
  if (!me) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // ✅ FIX: Clean up character arrays in the response
  if (me.allergies) {
    me.allergies = me.allergies.map(a => {
      if (typeof a === 'string') return { allergen: a };
      if (a.hasOwnProperty('0')) {
        // Reconstruct string from character object
        const chars = Object.keys(a)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => a[key]);
        const allergen = chars.join('');
        return { allergen };
      }
      return a;
    });
  }

  if (me.chronicConditions) {
    me.chronicConditions = me.chronicConditions.map(c => {
      if (typeof c === 'string') return { condition: c };
      if (c.hasOwnProperty('0')) {
        const chars = Object.keys(c)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => c[key]);
        const condition = chars.join('');
        return { condition };
      }
      return c;
    });
  }

  if (me.currentMedications) {
    me.currentMedications = me.currentMedications.map(m => {
      if (typeof m === 'string') return { name: m };
      if (m.hasOwnProperty('0')) {
        const chars = Object.keys(m)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => m[key]);
        const name = chars.join('');
        return { name };
      }
      return m;
    });
  }

  res.json(me);
});

/**
 * Update own profile (for patients)
 * PATCH /patients/me
 */
export const updateMe = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "alternatePhone",
    "address",
    "bloodGroup",
    "allergies",
    "chronicConditions",
    "currentMedications",
    "emergencyContact",
    "insuranceInfo",
    "preferredLanguage",
    "occupation",
    "maritalStatus",
    "preferredHospital",
    "dateOfBirth"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      // ✅ FIX: Properly handle array fields
      if (key === 'allergies' || key === 'chronicConditions' || key === 'currentMedications') {
        patch[key] = sanitizeArrayField(req.body[key]);
      } else {
        patch[key] = req.body[key];
      }
    }
  });

  // Validate fields that are being updated
  const validations = {};
  
  if (patch.fullName) {
    validations.fullName = validateFullName(patch.fullName);
  }
  
  if (patch.phone) {
    validations.phone = validatePhone(patch.phone);
  }
  
  if (patch.alternatePhone) {
    validations.alternatePhone = validatePhone(patch.alternatePhone);
  }
  
  if (patch.bloodGroup) {
    validations.bloodGroup = validateBloodGroup(patch.bloodGroup);
  }
  
  if (patch.dateOfBirth) {
    validations.dateOfBirth = validateDateOfBirth(patch.dateOfBirth);
  }
  
  // Validate emergency contact phone if provided
  if (patch.emergencyContact && typeof patch.emergencyContact === 'object') {
    if (patch.emergencyContact.phone) {
      validations.emergencyContactPhone = validatePhone(patch.emergencyContact.phone);
    }
  }

  const validationResults = validateFields(validations);
  
  if (!validationResults.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: validationResults.errors
    });
  }

  console.log("Updating patient with patch:", JSON.stringify(patch, null, 2));

  const updated = await Patient.findByIdAndUpdate(req.user.id, patch, { 
    new: true,
    runValidators: true 
  })
  .select("-passwordHash")
  .lean();

  // ✅ FIX: Clean up response data
  if (updated.allergies) {
    updated.allergies = updated.allergies.map(a => {
      if (typeof a === 'string') return { allergen: a };
      if (a.hasOwnProperty('0')) {
        const chars = Object.keys(a)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => a[key]);
        return { allergen: chars.join('') };
      }
      return a;
    });
  }

  if (updated.chronicConditions) {
    updated.chronicConditions = updated.chronicConditions.map(c => {
      if (typeof c === 'string') return { condition: c };
      if (c.hasOwnProperty('0')) {
        const chars = Object.keys(c)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => c[key]);
        return { condition: chars.join('') };
      }
      return c;
    });
  }

  if (updated.currentMedications) {
    updated.currentMedications = updated.currentMedications.map(m => {
      if (typeof m === 'string') return { name: m };
      if (m.hasOwnProperty('0')) {
        const chars = Object.keys(m)
          .filter(key => !isNaN(key))
          .sort((a, b) => Number(a) - Number(b))
          .map(key => m[key]);
        return { name: chars.join('') };
      }
      return m;
    });
  }

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "PATIENT",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "PATIENT",
    resourceId: req.user.id,
    details: { fields: Object.keys(patch) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Upload avatar (for patients)
 * POST /patients/me/avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed" 
    });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: "File too large. Maximum size is 5MB" 
    });
  }

  const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  
  const uploadResult = await cloudinary.uploader.upload(fileStr, {
    folder: "healthsystem/avatars/patients",
    public_id: `patient_${req.user.id}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto" }
    ]
  });

  const updated = await Patient.findByIdAndUpdate(
    req.user.id,
    { avatarUrl: uploadResult.secure_url },
    { new: true }
  ).select("-passwordHash");

  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "PATIENT",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "PATIENT",
    resourceId: req.user.id,
    details: { action: "avatar_upload" },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Get patient by ID (staff only)
 * GET /patients/:id
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .select("-passwordHash")
    .populate("preferredHospital lastVisit.hospital lastVisit.department");

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "READ",
    resource: "PATIENT",
    resourceId: req.params.id,
    details: { staffRole: req.user.role },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(patient);
});

/**
 * Search patients (staff only)
 * GET /patients/search?q=search_term
 */
export const searchPatients = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const skip = (page - 1) * limit;

  const searchQuery = {
    $or: [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { nic: { $regex: q, $options: "i" } },
      { healthCardId: { $regex: q, $options: "i" } }
    ],
    isActive: true
  };

  const [patients, total] = await Promise.all([
    Patient.find(searchQuery)
      .select("fullName email phone healthCardId nic avatarUrl dateOfBirth gender")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 }),
    Patient.countDocuments(searchQuery)
  ]);

  res.json({
    patients,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Update patient (staff only)
 * PATCH /patients/:id
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "alternatePhone",
    "address",
    "bloodGroup",
    "allergies",
    "chronicConditions",
    "currentMedications",
    "emergencyContact",
    "insuranceInfo",
    "notes",
    "isActive",
    "accountStatus",
    "dateOfBirth"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      // ✅ FIX: Properly handle array fields
      if (key === 'allergies' || key === 'chronicConditions' || key === 'currentMedications') {
        patch[key] = sanitizeArrayField(req.body[key]);
      } else {
        patch[key] = req.body[key];
      }
    }
  });

  const validations = {};
  
  if (patch.fullName) {
    validations.fullName = validateFullName(patch.fullName);
  }
  
  if (patch.phone) {
    validations.phone = validatePhone(patch.phone);
  }
  
  if (patch.bloodGroup) {
    validations.bloodGroup = validateBloodGroup(patch.bloodGroup);
  }
  
  if (patch.dateOfBirth) {
    validations.dateOfBirth = validateDateOfBirth(patch.dateOfBirth);
  }

  const validationResults = validateFields(validations);
  
  if (!validationResults.valid) {
    return res.status(400).json({
      error: "Validation failed",
      details: validationResults.errors
    });
  }

  const updated = await Patient.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true
  }).select("-passwordHash");

  if (!updated) {
    return res.status(404).json({ error: "Patient not found" });
  }

  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "PATIENT",
    resourceId: req.params.id,
    details: { fields: Object.keys(patch), staffRole: req.user.role },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * List all patients (staff only, paginated)
 * GET /patients?page=1&limit=20&status=ACTIVE
 */
export const listPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, hospital } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.accountStatus = status;
  if (hospital) query.preferredHospital = hospital;

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .select("fullName email phone healthCardId avatarUrl accountStatus registrationDate")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registrationDate: -1 }),
    Patient.countDocuments(query)
  ]);

  res.json({
    patients,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});