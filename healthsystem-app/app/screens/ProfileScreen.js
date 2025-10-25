// healthsystem-app/app/screens/ProfileScreen.js
// FIXED: Added validation for phone, NIC, and date of birth

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
    address: "", 
    bloodGroup: "", 
    allergies: [],
    emergencyContact: "",
    dateOfBirth: "",
    nic: ""
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
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address?.street || "",
        bloodGroup: data.bloodGroup || "",
        allergies: data.allergies || [],
        emergencyContact: data.emergencyContact?.phone || "",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
        nic: data.nic || ""
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

    // Validate emergency contact
    const emergencyValidation = validateEmergencyContact(form.emergencyContact);
    if (!emergencyValidation.valid) {
      newErrors.emergencyContact = emergencyValidation.error;
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
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        bloodGroup: form.bloodGroup,
        emergencyContact: {
          phone: form.emergencyContact.trim()
        },
        dateOfBirth: form.dateOfBirth || undefined,
        nic: form.nic.trim() || undefined
      };

      const { data } = await client.patch("/patients/me", payload);
      setUser(data);
      Alert.alert("Success", "Profile updated successfully");
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

            {/* Address */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Address</Text>
              <TextInput 
                value={form.address} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: t }))} 
                style={[inputStyle, { textAlignVertical: 'top', minHeight: 80 }]}
                placeholder="Enter your address"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
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

            {/* Emergency Contact */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Emergency Contact Phone</Text>
              <TextInput 
                value={form.emergencyContact} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, emergencyContact: t }));
                  if (errors.emergencyContact) setErrors((e) => ({ ...e, emergencyContact: null }));
                }}
                style={errors.emergencyContact ? errorInputStyle : inputStyle}
                placeholder="0771234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {errors.emergencyContact && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                    {errors.emergencyContact}
                  </Text>
                </View>
              )}
            </View>

            {/* Save Button */}
            <PButton 
              title={saving ? "Saving..." : "Save Changes"}
              onPress={save} 
              loading={saving}
              disabled={saving}
              style={{ marginBottom: 12 }}
            />

            {/* Logout Button */}
            <PButton 
              title="Logout" 
              onPress={handleLogout} 
              type="outline"
              textStyle={{ color: colors.danger }}
              style={{ borderColor: colors.danger }}
            />
          </PCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}