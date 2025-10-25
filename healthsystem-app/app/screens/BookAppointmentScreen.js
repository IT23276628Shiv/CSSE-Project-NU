// healthsystem-app/app/screens/BookAppointmentScreen.js
// FIXED: Better department loading, error handling, doctor selection, and validation

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

// ====== VALIDATION FUNCTIONS ======
const getMinimumBookingDate = () => {
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 24);
  return minDate;
};

const getMaximumBookingDate = () => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  return maxDate;
};

const validateAppointmentDate = (date) => {
  if (!date) {
    return { valid: false, error: "Please select a date and time" };
  }

  const selectedDate = new Date(date);
  const now = new Date();
  const minDate = getMinimumBookingDate();
  const maxDate = getMaximumBookingDate();

  if (selectedDate <= now) {
    return { valid: false, error: "Cannot book appointments in the past" };
  }

  if (selectedDate < minDate) {
    return { valid: false, error: "Appointments must be booked at least 24 hours in advance" };
  }

  if (selectedDate > maxDate) {
    return { valid: false, error: "Cannot book appointments more than 3 months in advance" };
  }

  const hour = selectedDate.getHours();
  if (hour < 8 || hour >= 20) {
    return { valid: false, error: "Please select a time between 8:00 AM and 8:00 PM" };
  }

  return { valid: true, error: null };
};

export default function BookAppointmentScreen() {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(getMinimumBookingDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHospitalPicker, setShowHospitalPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [notes, setNotes] = useState("");
  const [dateError, setDateError] = useState(null);

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      loadDepartments(selectedHospital._id);
    } else {
      setDepartments([]);
      setSelectedDepartment(null);
      setDoctors([]);
      setSelectedDoctor(null);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedHospital && selectedDepartment) {
      loadDoctors(selectedHospital._id, selectedDepartment._id);
    } else {
      setDoctors([]);
      setSelectedDoctor(null);
    }
  }, [selectedDepartment]);

  const loadHospitals = async () => {
    try {
      setLoadingData(true);
      const { data } = await client.get("/hospitals?isActive=true");
      
      if (!data.hospitals || data.hospitals.length === 0) {
        Alert.alert("No Hospitals", "No hospitals are currently available for booking.");
        setHospitals([]);
        return;
      }
      
      setHospitals(data.hospitals || []);
    } catch (error) {
      console.error("Failed to load hospitals:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to load hospitals. Please check your connection and try again."
      );
      setHospitals([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadDepartments = async (hospitalId) => {
    try {
      setLoadingDepartments(true);
      setDepartments([]);
      setSelectedDepartment(null);
      setDoctors([]);
      setSelectedDoctor(null);
      
      const { data } = await client.get(`/departments?hospital=${hospitalId}&isActive=true`);
      
      if (!data.departments || data.departments.length === 0) {
        Alert.alert(
          "No Departments", 
          "This hospital has no active departments available for appointments."
        );
        setDepartments([]);
        return;
      }
      
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to load departments. Please try again."
      );
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadDoctors = async (hospitalId, departmentId) => {
    try {
      setLoadingDoctors(true);
      setDoctors([]);
      setSelectedDoctor(null);
      
      const { data } = await client.get(
        `/staff/doctors/available?hospital=${hospitalId}&department=${departmentId}`
      );
      
      if (!data || data.length === 0) {
        // No doctors available is OK - booking can proceed without specific doctor
        setDoctors([]);
        return;
      }
      
      setDoctors(data || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      // Don't show error alert - doctor selection is optional
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setDate(selectedDate);
      const validation = validateAppointmentDate(selectedDate);
      setDateError(validation.error);
    }
  };

  const submit = async () => {
    // Validate all required fields
    if (!selectedHospital) {
      Alert.alert("Missing Information", "Please select a hospital");
      return;
    }

    if (!selectedDepartment) {
      Alert.alert("Missing Information", "Please select a department");
      return;
    }

    if (!date) {
      Alert.alert("Missing Information", "Please select date and time");
      return;
    }

    // Validate date
    const dateValidation = validateAppointmentDate(date);
    if (!dateValidation.valid) {
      setDateError(dateValidation.error);
      Alert.alert("Invalid Date", dateValidation.error);
      return;
    }

    // Validate notes length
    if (notes.length > 500) {
      Alert.alert("Notes Too Long", "Additional notes must be less than 500 characters");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        hospital: selectedHospital._id, 
        department: selectedDepartment._id, 
        date: date.toISOString(),
        notes: notes.trim() || undefined
      };

      // Add doctor if selected
      if (selectedDoctor) {
        payload.doctor = selectedDoctor._id;
      }

      await client.post("/appointments", payload);
      
      Alert.alert(
        "Success", 
        "Appointment booked successfully!", 
        [
          { 
            text: "OK", 
            onPress: () => {
              // Reset form
              setSelectedHospital(null);
              setSelectedDepartment(null);
              setSelectedDoctor(null);
              setDepartments([]);
              setDoctors([]);
              setNotes("");
              setDate(getMinimumBookingDate());
              setDateError(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert(
        "Booking Failed", 
        error.message || "Failed to book appointment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading hospitals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hospitals.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginTop: 16, textAlign: 'center' }}>
            No Hospitals Available
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            There are no hospitals available for booking at the moment.
          </Text>
          <PButton 
            title="Retry" 
            onPress={loadHospitals} 
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={{
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 0
      }}
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hospital */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Hospital *
          </Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onPress={() => setShowHospitalPicker(!showHospitalPicker)}
          >
            <Text style={{ 
              color: selectedHospital ? colors.text : colors.textMuted,
              fontSize: 16,
              flex: 1
            }}>
              {selectedHospital ? selectedHospital.name : "Select hospital"}
            </Text>
            <Ionicons name={showHospitalPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {showHospitalPicker && (
            <ScrollView 
              style={{ 
                maxHeight: 200,
                marginTop: 8,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                backgroundColor: colors.white
              }}
              nestedScrollEnabled={true}
            >
              {hospitals.map((hosp) => (
                <TouchableOpacity
                  key={hosp._id}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: selectedHospital?._id === hosp._id ? `${colors.primary}10` : 'transparent'
                  }}
                  onPress={() => {
                    setSelectedHospital(hosp);
                    setShowHospitalPicker(false);
                  }}
                >
                  <Text style={{ 
                    fontSize: 16,
                    fontWeight: selectedHospital?._id === hosp._id ? '600' : '400',
                    color: selectedHospital?._id === hosp._id ? colors.primary : colors.text
                  }}>
                    {hosp.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {hosp.type} • {hosp.address?.city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </PCard>

        {/* Department */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Department *
          </Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: !selectedHospital ? colors.border : colors.background,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onPress={() => selectedHospital && setShowDepartmentPicker(!showDepartmentPicker)}
            disabled={!selectedHospital || loadingDepartments}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              {loadingDepartments && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              )}
              <Text style={{ 
                color: selectedDepartment ? colors.text : colors.textMuted,
                fontSize: 16,
                flex: 1
              }}>
                {loadingDepartments 
                  ? "Loading departments..." 
                  : selectedDepartment 
                    ? selectedDepartment.name 
                    : !selectedHospital 
                      ? "Select hospital first" 
                      : departments.length === 0 
                        ? "No departments available"
                        : "Select department"}
              </Text>
            </View>
            <Ionicons name={showDepartmentPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {showDepartmentPicker && departments.length > 0 && (
            <ScrollView 
              style={{ 
                maxHeight: 200,
                marginTop: 8,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                backgroundColor: colors.white
              }}
              nestedScrollEnabled={true}
            >
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept._id}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: selectedDepartment?._id === dept._id ? `${colors.primary}10` : 'transparent'
                  }}
                  onPress={() => {
                    setSelectedDepartment(dept);
                    setShowDepartmentPicker(false);
                  }}
                >
                  <Text style={{ 
                    fontSize: 16,
                    fontWeight: selectedDepartment?._id === dept._id ? '600' : '400',
                    color: selectedDepartment?._id === dept._id ? colors.primary : colors.text
                  }}>
                    {dept.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {dept.code} • {dept.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </PCard>

        {/* Doctor (Optional) */}
        {selectedDepartment && (
          <PCard style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16 }}>
                Doctor
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>
                (Optional)
              </Text>
            </View>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                backgroundColor: colors.background,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onPress={() => doctors.length > 0 && setShowDoctorPicker(!showDoctorPicker)}
              disabled={loadingDoctors}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                {loadingDoctors && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                )}
                <Text style={{ 
                  color: selectedDoctor ? colors.text : colors.textMuted,
                  fontSize: 16,
                  flex: 1
                }}>
                  {loadingDoctors 
                    ? "Loading doctors..." 
                    : selectedDoctor 
                      ? `Dr. ${selectedDoctor.fullName}` 
                      : doctors.length === 0 
                        ? "Any available doctor"
                        : "Select a doctor"}
                </Text>
              </View>
              {doctors.length > 0 && (
                <Ionicons name={showDoctorPicker ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>

            {showDoctorPicker && doctors.length > 0 && (
              <ScrollView 
                style={{ 
                  maxHeight: 200,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  backgroundColor: colors.white
                }}
                nestedScrollEnabled={true}
              >
                {doctors.map((doc) => (
                  <TouchableOpacity
                    key={doc._id}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: selectedDoctor?._id === doc._id ? `${colors.primary}10` : 'transparent'
                    }}
                    onPress={() => {
                      setSelectedDoctor(doc);
                      setShowDoctorPicker(false);
                    }}
                  >
                    <Text style={{ 
                      fontSize: 16,
                      fontWeight: selectedDoctor?._id === doc._id ? '600' : '400',
                      color: selectedDoctor?._id === doc._id ? colors.primary : colors.text
                    }}>
                      Dr. {doc.fullName}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {doc.specialization}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </PCard>
        )}

        {/* Date & Time */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Date & Time *
          </Text>
          
          <View style={{ 
            backgroundColor: '#FFF3CD', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B'
          }}>
            <Text style={{ fontSize: 12, color: '#856404', lineHeight: 18 }}>
              ⓘ Appointments must be booked at least 24 hours in advance (8 AM - 8 PM)
            </Text>
          </View>

          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: dateError ? colors.danger : colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>
              {formatDisplayDate(date)}
            </Text>
          </TouchableOpacity>
          
          {dateError && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 12, marginLeft: 4 }}>
                {dateError}
              </Text>
            </View>
          )}
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={getMinimumBookingDate()}
              maximumDate={getMaximumBookingDate()}
            />
          )}
        </PCard>

        {/* Additional Notes */}
        <PCard style={{ marginBottom: 24 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Additional Notes
          </Text>
          <TextInput
            placeholder="Any specific concerns or requirements..."
            value={notes}
            onChangeText={setNotes}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              color: colors.text,
              minHeight: 100,
              textAlignVertical: 'top'
            }}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={{ 
            fontSize: 11, 
            color: colors.textMuted, 
            marginTop: 4, 
            textAlign: 'right' 
          }}>
            {notes.length}/500
          </Text>
        </PCard>

        {/* Submit Button */}
        <PButton 
          title={loading ? "Booking..." : "Confirm Appointment"}
          onPress={submit} 
          loading={loading}
          disabled={!selectedHospital || !selectedDepartment || !date || !!dateError || loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}