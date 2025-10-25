// healthsystem-app/app/screens/ProfileScreen.js
// FIXED: All fields now persist after logout + improved validation

import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PButton from "../../src/components/PButton";
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import * as ImagePicker from "expo-image-picker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Validation functions
const validatePhone = (phone) => {
  if (!phone) return { valid: true, error: null }; // Optional field
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: "Phone must be 10 digits starting with 0" };
  }
  return { valid: true, error: null };
};

const validateNIC = (nic) => {
  if (!nic) return { valid: true, error: null }; // Optional field
  const nicRegex = /^(\d{9}[vVxX]|\d{12})$/;
  if (!nicRegex.test(nic)) {
    return { valid: false, error: "NIC must be 9 digits + V/X or 12 digits" };
  }
  return { valid: true, error: null };
};

const validateDateOfBirth = (dob) => {
  if (!dob) return { valid: true, error: null }; // Optional field
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dob)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }
  
  const date = new Date(dob);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date" };
  }
  
  if (date > now) {
    return { valid: false, error: "Date of birth cannot be in the future" };
  }
  
  const age = now.getFullYear() - date.getFullYear();
  if (age > 150) {
    return { valid: false, error: "Invalid date of birth" };
  }
  
  return { valid: true, error: null };
};

const validateEmergencyContact = (contact) => {
  if (!contact) return { valid: true, error: null }; // Optional field
  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(contact)) {
    return { valid: false, error: "Emergency contact must be 10 digits starting with 0" };
  }
  return { valid: true, error: null };
};

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ 
    fullName: "", 
    phone: "", 
    alternatePhone: "",
    address: {
      street: "",
      city: "",
      district: "",
      province: "",
      postalCode: ""
    },
    bloodGroup: "", 
    allergies: [],
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },
    dateOfBirth: "",
    nic: "",
    gender: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/patients/me");
      
      // FIXED: Properly load all fields including nested objects
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        alternatePhone: data.alternatePhone || "",
        address: {
          street: data.address?.street || "",
          city: data.address?.city || "",
          district: data.address?.district || "",
          province: data.address?.province || "",
          postalCode: data.address?.postalCode || ""
        },
        bloodGroup: data.bloodGroup || "",
        allergies: data.allergies || [],
        emergencyContact: {
          name: data.emergencyContact?.name || "",
          phone: data.emergencyContact?.phone || "",
          relationship: data.emergencyContact?.relationship || ""
        },
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
        nic: data.nic || "",
        gender: data.gender || ""
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      Alert.alert("Error", error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name (required)
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Validate phone
    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error;
    }

    // Validate alternate phone if provided
    if (form.alternatePhone) {
      const altPhoneValidation = validatePhone(form.alternatePhone);
      if (!altPhoneValidation.valid) {
        newErrors.alternatePhone = altPhoneValidation.error;
      }
    }

    // Validate NIC
    const nicValidation = validateNIC(form.nic);
    if (!nicValidation.valid) {
      newErrors.nic = nicValidation.error;
    }

    // Validate date of birth
    const dobValidation = validateDateOfBirth(form.dateOfBirth);
    if (!dobValidation.valid) {
      newErrors.dateOfBirth = dobValidation.error;
    }

    // Validate emergency contact phone if provided
    if (form.emergencyContact.phone) {
      const emergencyValidation = validateEmergencyContact(form.emergencyContact.phone);
      if (!emergencyValidation.valid) {
        newErrors.emergencyContactPhone = emergencyValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    // Validate form
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please correct the errors and try again");
      return;
    }

    setSaving(true);
    try {
      // FIXED: Send complete address object and emergency contact
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
        address: {
          street: form.address.street.trim(),
          city: form.address.city.trim(),
          district: form.address.district.trim(),
          province: form.address.province.trim(),
          postalCode: form.address.postalCode.trim()
        },
        bloodGroup: form.bloodGroup || undefined,
        emergencyContact: {
          name: form.emergencyContact.name.trim(),
          phone: form.emergencyContact.phone.trim(),
          relationship: form.emergencyContact.relationship.trim()
        },
        dateOfBirth: form.dateOfBirth || undefined,
        nic: form.nic.trim() || undefined,
        gender: form.gender || undefined
      };

      console.log("Saving profile with payload:", payload);

      const { data } = await client.patch("/patients/me", payload);
      setUser(data);
      Alert.alert("Success", "Profile updated successfully");
      
      // Reload profile to ensure data is fresh
      await loadProfile();
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to upload an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const body = new FormData();
      body.append("file", { 
        uri: asset.uri, 
        name: "avatar.jpg", 
        type: "image/jpeg" 
      });
      
      const { data } = await client.post("/patients/me/avatar", body, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      setUser(data);
      Alert.alert("Success", "Profile picture updated");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const inputStyle = { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: colors.danger
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 6 : 0
      }}
    >
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={{ padding: 16 }}>
          <PCard style={{ alignItems: "center", padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                {user?.avatarUrl ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={{ width: 100, height: 100, borderRadius: 50 }} 
                  />
                ) : (
                  <View style={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 50, 
                    backgroundColor: "#EADFFF",
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="person" size={40} color="#2D0057" />
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={uploadAvatar}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.primary,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: colors.white
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="camera" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={{ 
                fontSize: 20, 
                fontWeight: "800", 
                color: colors.text,
                marginTop: 16,
                marginBottom: 4
              }}>
                {form.fullName || "Your Name"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                {user?.email || "No email provided"}
              </Text>
              {user?.healthCardId && (
                <View style={{ 
                  marginTop: 8, 
                  backgroundColor: `${colors.primary}15`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                    ID: {user.healthCardId}
                  </Text>
                </View>
              )}
            </View>

            <PButton 
              title="Change Profile Picture" 
              onPress={uploadAvatar} 
              type="outline" 
              loading={uploading}
              style={{ width: '100%' }}
            />
          </PCard>
        </View>

        {/* Personal Information */}
        <View style={{ padding: 16 }}>
          <PCard style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: 20 
            }}>
              Personal Information
            </Text>

            {/* Full Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Full Name *</Text>
              <TextInput 
                value={form.fullName} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, fullName: t }));
                  if (errors.fullName) setErrors((e) => ({ ...e, fullName: null }));
                }}
                style={errors.fullName ? errorInputStyle : inputStyle}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
              />
              {errors.fullName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.fullName}
                  </Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Phone</Text>
              <TextInput 
                value={form.phone} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, phone: t }));
                  if (errors.phone) setErrors((e) => ({ ...e, phone: null }));
                }}
                style={errors.phone ? errorInputStyle : inputStyle}
                placeholder="0771234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.phone}
                  </Text>
                </View>
              )}
            </View>

            {/* Alternate Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Alternate Phone</Text>
              <TextInput 
                value={form.alternatePhone} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, alternatePhone: t }));
                  if (errors.alternatePhone) setErrors((e) => ({ ...e, alternatePhone: null }));
                }}
                style={errors.alternatePhone ? errorInputStyle : inputStyle}
                placeholder="0771234567 (Optional)"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.alternatePhone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.alternatePhone}
                  </Text>
                </View>
              )}
            </View>

            {/* NIC */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>NIC</Text>
              <TextInput 
                value={form.nic} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, nic: t.toUpperCase() }));
                  if (errors.nic) setErrors((e) => ({ ...e, nic: null }));
                }}
                style={errors.nic ? errorInputStyle : inputStyle}
                placeholder="123456789V or 123456789012"
                placeholderTextColor={colors.textMuted}
                maxLength={12}
                autoCapitalize="characters"
              />
              {errors.nic && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.nic}
                  </Text>
                </View>
              )}
            </View>

            {/* Date of Birth */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Date of Birth</Text>
              <TextInput 
                value={form.dateOfBirth} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, dateOfBirth: t }));
                  if (errors.dateOfBirth) setErrors((e) => ({ ...e, dateOfBirth: null }));
                }}
                style={errors.dateOfBirth ? errorInputStyle : inputStyle}
                placeholder="YYYY-MM-DD (e.g., 1990-01-15)"
                placeholderTextColor={colors.textMuted}
                maxLength={10}
              />
              {errors.dateOfBirth && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.dateOfBirth}
                  </Text>
                </View>
              )}
            </View>

            {/* Gender */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Gender</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                {['MALE', 'FEMALE', 'OTHER'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => setForm((s) => ({ ...s, gender }))}
                    style={{
                      flex: 1,
                      borderWidth: 1.5,
                      borderColor: form.gender === gender ? colors.primary : colors.border,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                      backgroundColor: form.gender === gender ? `${colors.primary}10` : colors.background
                    }}
                  >
                    <Text style={{ 
                      color: form.gender === gender ? colors.primary : colors.text,
                      fontWeight: form.gender === gender ? '600' : '400',
                      fontSize: 14
                    }}>
                      {gender.charAt(0) + gender.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blood Group */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Blood Group</Text>
              <TouchableOpacity
                style={[inputStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
              >
                <Text style={{ color: form.bloodGroup ? colors.text : colors.textMuted }}>
                  {form.bloodGroup || "Select blood group"}
                </Text>
                <Ionicons 
                  name={showBloodGroupPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>

              {showBloodGroupPicker && (
                <View style={{ 
                  backgroundColor: colors.white, 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 12,
                  marginTop: 8,
                  maxHeight: 200
                }}>
                  <ScrollView>
                    {BLOOD_GROUPS.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          backgroundColor: form.bloodGroup === group ? `${colors.primary}10` : 'transparent'
                        }}
                        onPress={() => {
                          setForm((s) => ({ ...s, bloodGroup: group }));
                          setShowBloodGroupPicker(false);
                        }}
                      >
                        <Text style={{ 
                          color: form.bloodGroup === group ? colors.primary : colors.text,
                          fontWeight: form.bloodGroup === group ? '600' : '400'
                        }}>
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </PCard>
        </View>

        {/* Address Section */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <PCard style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: 20 
            }}>
              Address Information
            </Text>

            {/* Street */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Street Address</Text>
              <TextInput 
                value={form.address.street} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: { ...s.address, street: t } }))}
                style={inputStyle}
                placeholder="123 Main Street"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* City */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>City</Text>
              <TextInput 
                value={form.address.city} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: { ...s.address, city: t } }))}
                style={inputStyle}
                placeholder="Colombo"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* District */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>District</Text>
              <TextInput 
                value={form.address.district} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: { ...s.address, district: t } }))}
                style={inputStyle}
                placeholder="Colombo"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Province */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Province</Text>
              <TextInput 
                value={form.address.province} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: { ...s.address, province: t } }))}
                style={inputStyle}
                placeholder="Western"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Postal Code */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Postal Code</Text>
              <TextInput 
                value={form.address.postalCode} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: { ...s.address, postalCode: t } }))}
                style={inputStyle}
                placeholder="00100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </PCard>
        </View>

        {/* Emergency Contact Section */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <PCard style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: 20 
            }}>
              Emergency Contact
            </Text>

            {/* Emergency Contact Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Contact Name</Text>
              <TextInput 
                value={form.emergencyContact.name} 
                onChangeText={(t) => setForm((s) => ({ ...s, emergencyContact: { ...s.emergencyContact, name: t } }))}
                style={inputStyle}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Emergency Contact Relationship */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Relationship</Text>
              <TextInput 
                value={form.emergencyContact.relationship} 
                onChangeText={(t) => setForm((s) => ({ ...s, emergencyContact: { ...s.emergencyContact, relationship: t } }))}
                style={inputStyle}
                placeholder="Father / Mother / Spouse / Friend"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Emergency Contact Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Contact Phone</Text>
              <TextInput 
                value={form.emergencyContact.phone} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, emergencyContact: { ...s.emergencyContact, phone: t } }));
                  if (errors.emergencyContactPhone) setErrors((e) => ({ ...e, emergencyContactPhone: null }));
                }}
                style={errors.emergencyContactPhone ? errorInputStyle : inputStyle}
                placeholder="0771234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.emergencyContactPhone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.emergencyContactPhone}
                  </Text>
                </View>
              )}
            </View>
          </PCard>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <PButton 
            title={saving ? "Saving..." : "Save Changes"}
            onPress={save} 
            loading={saving}
            disabled={saving}
            style={{ marginBottom: 12 }}
          />

          <PButton 
            title="Logout" 
            onPress={handleLogout} 
            type="outline"
            textStyle={{ color: colors.danger }}
            style={{ borderColor: colors.danger }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}