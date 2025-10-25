// healthsystem-backend/src/utils/validators.js
// Comprehensive validation utilities matching frontend rules

/**
 * Phone number validation (Sri Lankan format)
 * Accepts: +94XXXXXXXXX or 0XXXXXXXXX
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { valid: true, error: null }; // Optional field
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Sri Lankan format
  const sriLankanRegex = /^(\+94[0-9]{9}|0[0-9]{9})$/;

  if (!sriLankanRegex.test(cleaned)) {
    return {
      valid: false,
      error: "Invalid phone format. Use +94XXXXXXXXX or 0XXXXXXXXX"
    };
  }

  return { valid: true, error: null };
};

/**
 * Email validation
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: "Invalid email format"
    };
  }

  return { valid: true, error: null };
};

/**
 * Full name validation
 */
export const validateFullName = (name) => {
  if (!name || name.trim().length < 2) {
    return {
      valid: false,
      error: "Full name must be at least 2 characters"
    };
  }

  if (name.trim().length > 100) {
    return {
      valid: false,
      error: "Full name must be less than 100 characters"
    };
  }

  // Check for at least one space (first and last name)
  if (!name.trim().includes(' ')) {
    return {
      valid: false,
      error: "Please enter both first and last name"
    };
  }

  return { valid: true, error: null };
};

/**
 * Date of birth validation
 */
export const validateDateOfBirth = (dob) => {
  if (!dob) {
    return { valid: true, error: null }; // Optional field
  }

  const date = new Date(dob);
  const today = new Date();

  // Check if valid date
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: "Invalid date"
    };
  }

  // Check if not in future
  if (date > today) {
    return {
      valid: false,
      error: "Date of birth cannot be in the future"
    };
  }

  // Check if not too old (120 years)
  const age = (today - date) / (365.25 * 24 * 60 * 60 * 1000);
  if (age > 120) {
    return {
      valid: false,
      error: "Date of birth seems incorrect (over 120 years)"
    };
  }

  // Check if at least 1 year old
  if (age < 1) {
    return {
      valid: false,
      error: "Patient must be at least 1 year old"
    };
  }

  return { valid: true, error: null };
};

/**
 * Appointment date validation
 * Must be at least 24 hours in advance, max 3 months ahead
 */
export const validateAppointmentDate = (date) => {
  if (!date) {
    return { valid: false, error: "Appointment date is required" };
  }

  const selectedDate = new Date(date);
  const now = new Date();

  // Check if valid date
  if (isNaN(selectedDate.getTime())) {
    return {
      valid: false,
      error: "Invalid date format"
    };
  }

  // Check if date is in the past
  if (selectedDate <= now) {
    return {
      valid: false,
      error: "Cannot book appointments in the past"
    };
  }

  // Check minimum 24 hours advance notice
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 24);

  if (selectedDate < minDate) {
    return {
      valid: false,
      error: "Appointments must be booked at least 24 hours in advance"
    };
  }

  // Check maximum booking window (3 months)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  if (selectedDate > maxDate) {
    return {
      valid: false,
      error: "Cannot book appointments more than 3 months in advance"
    };
  }

  // Check if it's during reasonable hours (8 AM - 8 PM)
  const hour = selectedDate.getHours();
  if (hour < 8 || hour >= 20) {
    return {
      valid: false,
      error: "Appointments must be between 8:00 AM and 8:00 PM"
    };
  }

  return { valid: true, error: null };
};

/**
 * Password validation
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: "Password must be at least 6 characters"
    };
  }

  if (password.length > 100) {
    return {
      valid: false,
      error: "Password must be less than 100 characters"
    };
  }

  return { valid: true, error: null };
};

/**
 * NIC validation (Sri Lankan National Identity Card)
 * Old format: 9 digits + V/X (e.g., 123456789V)
 * New format: 12 digits (e.g., 199012345678)
 */
export const validateNIC = (nic) => {
  if (!nic) {
    return { valid: true, error: null }; // Optional field
  }

  const cleaned = nic.trim().toUpperCase();

  // Old format: 9 digits + V/X
  const oldFormatRegex = /^[0-9]{9}[VX]$/;

  // New format: 12 digits
  const newFormatRegex = /^[0-9]{12}$/;

  if (!oldFormatRegex.test(cleaned) && !newFormatRegex.test(cleaned)) {
    return {
      valid: false,
      error: "Invalid NIC format. Use 123456789V or 199012345678"
    };
  }

  return { valid: true, error: null };
};

/**
 * Blood group validation
 */
export const validateBloodGroup = (bloodGroup) => {
  if (!bloodGroup) {
    return { valid: true, error: null }; // Optional field
  }

  const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  if (!validGroups.includes(bloodGroup)) {
    return {
      valid: false,
      error: "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"
    };
  }

  return { valid: true, error: null };
};

/**
 * Staff ID validation
 * Format: HOSPITALID-ROLE-NUMBER (e.g., NHSL-DOC-001)
 */
export const validateStaffId = (staffId) => {
  if (!staffId) {
    return { valid: false, error: "Staff ID is required" };
  }

  const staffIdRegex = /^[A-Z]{2,10}-[A-Z]{3,10}-[0-9]{3,5}$/;

  if (!staffIdRegex.test(staffId.toUpperCase())) {
    return {
      valid: false,
      error: "Invalid Staff ID format. Use HOSPITALID-ROLE-NUMBER (e.g., NHSL-DOC-001)"
    };
  }

  return { valid: true, error: null };
};

/**
 * Health Card ID validation
 * Format: HC-YYYY-NNNNN (e.g., HC-2025-00001)
 */
export const validateHealthCardId = (healthCardId) => {
  if (!healthCardId) {
    return { valid: false, error: "Health Card ID is required" };
  }

  const healthCardRegex = /^HC-[0-9]{4}-[0-9]{5}$/;

  if (!healthCardRegex.test(healthCardId)) {
    return {
      valid: false,
      error: "Invalid Health Card ID format. Use HC-YYYY-NNNNN (e.g., HC-2025-00001)"
    };
  }

  return { valid: true, error: null };
};

/**
 * Text length validation (for notes, descriptions, etc.)
 */
export const validateTextLength = (text, fieldName, minLength = 0, maxLength = 500) => {
  if (!text) {
    return { valid: minLength === 0, error: minLength > 0 ? `${fieldName} is required` : null };
  }

  const length = text.trim().length;

  if (length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${maxLength} characters`
    };
  }

  return { valid: true, error: null };
};

/**
 * ObjectId validation (MongoDB)
 */
export const validateObjectId = (id, fieldName = "ID") => {
  if (!id) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(id)) {
    return {
      valid: false,
      error: `Invalid ${fieldName} format`
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate multiple fields at once
 * Returns { valid: boolean, errors: { field: error } }
 */
export const validateFields = (validations) => {
  const errors = {};
  let isValid = true;

  Object.keys(validations).forEach((field) => {
    const validation = validations[field];
    if (!validation.valid && validation.error) {
      errors[field] = validation.error;
      isValid = false;
    }
  });

  return { valid: isValid, errors };
};

/**
 * Express middleware for validation
 */
export const validationMiddleware = (validationFunction) => {
  return (req, res, next) => {
    const result = validationFunction(req.body);

    if (!result.valid) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.errors || result.error
      });
    }

    next();
  };
};