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
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

// ====== VALIDATION FUNCTIONS ======
const getMinimumBookingDate = () => {
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 24); // 24 hours from now
  return minDate;
};

const getMaximumBookingDate = () => {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead
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

  // Check if date is in the past
  if (selectedDate <= now) {
    return {
      valid: false,
      error: "Cannot book appointments in the past"
    };
  }

  // Check minimum 24 hours advance notice
  if (selectedDate < minDate) {
    return {
      valid: false,
      error: "Appointments must be booked at least 24 hours in advance"
    };
  }

  // Check maximum booking window (3 months)
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
      error: "Please select a time between 8:00 AM and 8:00 PM"
    };
  }

  return { valid: true, error: null };
};

export default function BookAppointmentScreen() {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [date, setDate] = useState(getMinimumBookingDate()); // Set to 24h from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHospitalPicker, setShowHospitalPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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
    }
  }, [selectedHospital]);

  const loadHospitals = async () => {
    try {
      setLoadingData(true);
      const { data } = await client.get("/hospitals?isActive=true");
      setHospitals(data.hospitals || []);
    } catch (error) {
      console.error("Failed to load hospitals:", error);
      Alert.alert("Error", "Failed to load hospitals");
    } finally {
      setLoadingData(false);
    }
  };

  const loadDepartments = async (hospitalId) => {
    try {
      const { data } = await client.get(`/departments?hospital=${hospitalId}&isActive=true`);
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
      Alert.alert("Error", "Failed to load departments");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setDate(selectedDate);
      
      // Validate immediately
      const validation = validateAppointmentDate(selectedDate);
      setDateError(validation.error);
    }
  };

  const submit = async () => {
    // Validate all fields
    if (!selectedHospital || !selectedDepartment || !date) {
      Alert.alert("Missing Information", "Please fill in all required fields");
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
      await client.post("/appointments", { 
        hospital: selectedHospital._id, 
        department: selectedDepartment._id, 
        date: date.toISOString(),
        notes: notes.trim() || undefined
      });
      
      Alert.alert(
        "Success", 
        "Appointment booked successfully!", 
        [
          { 
            text: "OK", 
            onPress: () => {
              setSelectedHospital(null);
              setSelectedDepartment(null);
              setNotes("");
              setDate(getMinimumBookingDate());
              setDateError(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", error?.response?.data?.error || "Booking failed");
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

  return (
    <SafeAreaView 
      style={{
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 0
      }}
    >
      {loadingData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading hospitals...</Text>
        </View>
      ) : (
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
              disabled={loadingData}
            >
              <Text style={{ 
                color: selectedHospital ? colors.text : colors.textMuted,
                fontSize: 16,
                flex: 1
              }}>
                {selectedHospital ? selectedHospital.name : "Select hospital"}
              </Text>
              <Text style={{ color: colors.textMuted }}>▼</Text>
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
                backgroundColor: !selectedHospital || departments.length === 0 ? colors.border : colors.background,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onPress={() => setShowDepartmentPicker(!showDepartmentPicker)}
              disabled={!selectedHospital || departments.length === 0}
            >
              <Text style={{ 
                color: selectedDepartment ? colors.text : colors.textMuted,
                fontSize: 16,
                flex: 1
              }}>
                {selectedDepartment 
                  ? selectedDepartment.name 
                  : !selectedHospital 
                    ? "Select hospital first" 
                    : departments.length === 0 
                      ? "No departments available"
                      : "Select department"}
              </Text>
              <Text style={{ color: colors.textMuted }}>▼</Text>
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
                      {dept.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </PCard>

          {/* Date & Time */}
          <PCard style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
              Date & Time *
            </Text>
            
            {/* Info Message */}
            <View style={{ 
              backgroundColor: '#FFF3CD', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#F59E0B'
            }}>
              <Text style={{ fontSize: 12, color: '#856404', lineHeight: 18 }}>
                ⓘ Appointments must be booked at least 24 hours in advance
              </Text>
            </View>

            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: dateError ? colors.danger : colors.border,
                borderRadius: 12,
                padding: 16,
                backgroundColor: colors.background
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>
                {formatDisplayDate(date)}
              </Text>
            </TouchableOpacity>
            
            {dateError && (
              <Text style={{ color: colors.danger, fontSize: 12, marginTop: 8 }}>
                {dateError}
              </Text>
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
            title="Confirm Appointment" 
            onPress={submit} 
            loading={loading}
            disabled={!selectedHospital || !selectedDepartment || !date || !!dateError}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}