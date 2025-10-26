// healthsystem-app/app/screens/BookAppointmentScreen.js
// FIXED: Proper form reset after booking

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
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

const { width } = Dimensions.get('window');

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

export default function BookAppointmentScreen({ navigation }) {
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
  const [refreshing, setRefreshing] = useState(false);

  const loadHospitals = async () => {
    try {
      setLoadingData(true);
      const { data } = await client.get("/hospitals?isActive=true");
      
      if (!data.hospitals || data.hospitals.length === 0) {
        setHospitals([]);
        return;
      }
      
      setHospitals(data.hospitals || []);
    } catch (error) {
      console.error("Failed to load hospitals:", error);
      setHospitals([]);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
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
      setDepartments(data.departments || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
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
      setDoctors(data || []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // ====== NEW: FORM RESET FUNCTION ======
  const resetForm = () => {
    console.log("Resetting form...");
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setDepartments([]);
    setDoctors([]);
    setNotes("");
    setDate(getMinimumBookingDate());
    setDateError(null);
    setShowHospitalPicker(false);
    setShowDepartmentPicker(false);
    setShowDoctorPicker(false);
    setShowDatePicker(false);
  };

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

  const onRefresh = () => {
    setRefreshing(true);
    loadHospitals();
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

    const dateValidation = validateAppointmentDate(date);
    if (!dateValidation.valid) {
      setDateError(dateValidation.error);
      Alert.alert("Invalid Date", dateValidation.error);
      return;
    }

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

      if (selectedDoctor) {
        payload.doctor = selectedDoctor._id;
      }

      await client.post("/appointments", payload);
      
      // ====== FIXED: Proper success handling with form reset ======
      Alert.alert(
        "🎉 Success!", 
        "Your appointment has been booked successfully!",
        [
          { 
            text: "View Appointments", 
            onPress: () => navigation.navigate('Appointments')
          },
          { 
            text: "Book Another", 
            style: "default",
            onPress: () => {
              // Reset form immediately when "Book Another" is pressed
              resetForm();
            }
          }
        ],
        {
          // This callback runs when alert is dismissed (by tapping outside)
          onDismiss: () => {
            // Auto-reset form after 2 seconds if user doesn't choose an option
            setTimeout(() => {
              resetForm();
            }, 2000);
          }
        }
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

  // ====== NEW: Quick Clear Button ======
  const ClearFormButton = () => (
    <TouchableOpacity
      onPress={resetForm}
      style={{
        position: 'absolute',
        top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        right: 20,
        backgroundColor: `${colors.danger}15`,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <Ionicons name="close-circle" size={16} color={colors.danger} />
      <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
        Clear
      </Text>
    </TouchableOpacity>
  );

  if (loadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F7FF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>Loading hospitals...</Text>
      </View>
    );
  }

  if (hospitals.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }} edges={['bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 30,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E8E0FF',
            shadowColor: colors.primary,
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#F0EDFF',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Ionicons name="business-outline" size={50} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 12, textAlign: 'center' }}>
              No Hospitals Available
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, marginBottom: 28, textAlign: 'center', lineHeight: 22 }}>
              There are no hospitals available for booking at the moment. Please check back later or pull down to refresh.
            </Text>
            <TouchableOpacity 
              onPress={loadHospitals}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 25,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 5
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: "700" }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />

      {/* Clear Form Button - Only show when form has data */}
      {(selectedHospital || selectedDepartment || selectedDoctor || notes) && (
        <ClearFormButton />
      )}

      <ScrollView 
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 25,
            padding: 20,
            borderWidth: 1,
            borderColor: '#E8E0FF',
            shadowColor: colors.primary,
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: '#F0EDFF',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}>
                <Ionicons name="calendar" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                  Book Appointment
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500' }}>
                  Schedule your visit in few simple steps
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Steps */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {['Hospital', 'Department', 'Doctor', 'Time'].map((step, index) => {
              const isCompleted = 
                (index === 0 && selectedHospital) ||
                (index === 1 && selectedDepartment) ||
                (index === 2 && (doctors.length === 0 || selectedDoctor)) ||
                (index === 3 && date && !dateError);
              
              const isActive = 
                (index === 0 && !selectedHospital) ||
                (index === 1 && selectedHospital && !selectedDepartment) ||
                (index === 2 && selectedDepartment && !selectedDoctor && doctors.length > 0) ||
                (index === 3 && selectedDepartment && date);

              return (
                <View key={step} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isCompleted ? colors.primary : isActive ? '#F0EDFF' : '#F0F0F0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: isCompleted ? colors.primary : isActive ? colors.primary : 'transparent'
                  }}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    ) : (
                      <Text style={{ 
                        fontSize: 12, 
                        fontWeight: '700', 
                        color: isActive ? colors.primary : colors.textMuted 
                      }}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '600', 
                    color: isCompleted || isActive ? colors.primary : colors.textMuted,
                    marginTop: 6,
                    textAlign: 'center'
                  }}>
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Form Content */}
        <View style={{ padding: 20, paddingTop: 0 }}>

          {/* Hospital Selection */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                Select Hospital
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                Choose where you'd like to visit
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                borderWidth: 2,
                borderColor: selectedHospital ? colors.primary : '#F0EDFF',
                shadowColor: selectedHospital ? colors.primary : "#000",
                shadowOpacity: selectedHospital ? 0.1 : 0.03,
                shadowRadius: selectedHospital ? 12 : 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: selectedHospital ? 4 : 2
              }}
              onPress={() => setShowHospitalPicker(!showHospitalPicker)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: selectedHospital ? `${colors.primary}15` : '#F8F7FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14
                  }}>
                    <Ionicons 
                      name="business" 
                      size={22} 
                      color={selectedHospital ? colors.primary : colors.textMuted} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '700', 
                      color: selectedHospital ? colors.text : colors.textMuted 
                    }}>
                      {selectedHospital ? selectedHospital.name : "Select hospital"}
                    </Text>
                    {selectedHospital && (
                      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                        {selectedHospital.type} • {selectedHospital.address?.city}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons 
                  name={showHospitalPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </View>
            </TouchableOpacity>

            {showHospitalPicker && (
              <View style={{ 
                marginTop: 12,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E8E0FF',
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3
              }}>
                <ScrollView 
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  {hospitals.map((hosp) => (
                    <TouchableOpacity
                      key={hosp._id}
                      style={{
                        padding: 18,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F0F0F0',
                        backgroundColor: selectedHospital?._id === hosp._id ? `${colors.primary}08` : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                      onPress={() => {
                        setSelectedHospital(hosp);
                        setShowHospitalPicker(false);
                      }}
                    >
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: selectedHospital?._id === hosp._id ? colors.primary : '#F0F0F0',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12
                      }}>
                        <Ionicons 
                          name="business" 
                          size={18} 
                          color={selectedHospital?._id === hosp._id ? '#FFFFFF' : colors.textMuted} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 15,
                          fontWeight: selectedHospital?._id === hosp._id ? '700' : '600',
                          color: selectedHospital?._id === hosp._id ? colors.primary : colors.text,
                          marginBottom: 2
                        }}>
                          {hosp.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {hosp.type} • {hosp.address?.city}
                        </Text>
                      </View>
                      {selectedHospital?._id === hosp._id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Department Selection */}
          {selectedHospital && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  Select Department
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Choose your medical department
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: selectedDepartment ? '#22C55E' : '#F0EDFF',
                  shadowColor: selectedDepartment ? '#22C55E' : "#000",
                  shadowOpacity: selectedDepartment ? 0.1 : 0.03,
                  shadowRadius: selectedDepartment ? 12 : 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: selectedDepartment ? 4 : 2
                }}
                onPress={() => selectedHospital && setShowDepartmentPicker(!showDepartmentPicker)}
                disabled={!selectedHospital || loadingDepartments}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {loadingDepartments && (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 12 }} />
                    )}
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: selectedDepartment ? `${colors.success}15` : '#F8F7FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14
                    }}>
                      <Ionicons 
                        name="medical" 
                        size={22} 
                        color={selectedDepartment ? colors.success : colors.textMuted} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: selectedDepartment ? colors.text : colors.textMuted 
                      }}>
                        {loadingDepartments 
                          ? "Loading departments..." 
                          : selectedDepartment 
                            ? selectedDepartment.name 
                            : departments.length === 0 
                              ? "No departments available"
                              : "Select department"}
                      </Text>
                      {selectedDepartment && (
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                          {selectedDepartment.code} • {selectedDepartment.category}
                        </Text>
                      )}
                    </View>
                  </View>
                  {!loadingDepartments && departments.length > 0 && (
                    <Ionicons 
                      name={showDepartmentPicker ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  )}
                </View>
              </TouchableOpacity>

              {showDepartmentPicker && departments.length > 0 && (
                <View style={{ 
                  marginTop: 12,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E8E0FF',
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3
                }}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {departments.map((dept) => (
                      <TouchableOpacity
                        key={dept._id}
                        style={{
                          padding: 18,
                          borderBottomWidth: 1,
                          borderBottomColor: '#F0F0F0',
                          backgroundColor: selectedDepartment?._id === dept._id ? `${colors.success}08` : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                        onPress={() => {
                          setSelectedDepartment(dept);
                          setShowDepartmentPicker(false);
                        }}
                      >
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: selectedDepartment?._id === dept._id ? colors.success : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12
                        }}>
                          <Ionicons 
                            name="medical" 
                            size={18} 
                            color={selectedDepartment?._id === dept._id ? '#FFFFFF' : colors.textMuted} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ 
                            fontSize: 15,
                            fontWeight: selectedDepartment?._id === dept._id ? '700' : '600',
                            color: selectedDepartment?._id === dept._id ? colors.success : colors.text,
                            marginBottom: 2
                          }}>
                            {dept.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            {dept.code} • {dept.category}
                          </Text>
                        </View>
                        {selectedDepartment?._id === dept._id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Doctor Selection (Optional) */}
          {selectedDepartment && doctors.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  Select Doctor
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8, backgroundColor: `${colors.primary}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  Optional
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: selectedDoctor ? '#F59E0B' : '#F0EDFF',
                  shadowColor: selectedDoctor ? '#F59E0B' : "#000",
                  shadowOpacity: selectedDoctor ? 0.1 : 0.03,
                  shadowRadius: selectedDoctor ? 12 : 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: selectedDoctor ? 4 : 2
                }}
                onPress={() => doctors.length > 0 && setShowDoctorPicker(!showDoctorPicker)}
                disabled={loadingDoctors}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {loadingDoctors && (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 12 }} />
                    )}
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: selectedDoctor ? `${colors.warning}15` : '#F8F7FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 14
                    }}>
                      <Ionicons 
                        name="person" 
                        size={22} 
                        color={selectedDoctor ? colors.warning : colors.textMuted} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: selectedDoctor ? colors.text : colors.textMuted 
                      }}>
                        {loadingDoctors 
                          ? "Loading doctors..." 
                          : selectedDoctor 
                            ? `Dr. ${selectedDoctor.fullName}` 
                            : "Select a doctor"}
                      </Text>
                      {selectedDoctor && (
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                          {selectedDoctor.specialization}
                        </Text>
                      )}
                    </View>
                  </View>
                  {!loadingDoctors && doctors.length > 0 && (
                    <Ionicons 
                      name={showDoctorPicker ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textMuted} 
                    />
                  )}
                </View>
              </TouchableOpacity>

              {showDoctorPicker && doctors.length > 0 && (
                <View style={{ 
                  marginTop: 12,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#E8E0FF',
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3
                }}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {doctors.map((doc) => (
                      <TouchableOpacity
                        key={doc._id}
                        style={{
                          padding: 18,
                          borderBottomWidth: 1,
                          borderBottomColor: '#F0F0F0',
                          backgroundColor: selectedDoctor?._id === doc._id ? `${colors.warning}08` : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center'
                        }}
                        onPress={() => {
                          setSelectedDoctor(doc);
                          setShowDoctorPicker(false);
                        }}
                      >
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: selectedDoctor?._id === doc._id ? colors.warning : '#F0F0F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12
                        }}>
                          <Text style={{ 
                            color: selectedDoctor?._id === doc._id ? '#FFFFFF' : colors.textMuted, 
                            fontWeight: '700', 
                            fontSize: 14 
                          }}>
                            {doc.fullName?.charAt(0) || 'D'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ 
                            fontSize: 15,
                            fontWeight: selectedDoctor?._id === doc._id ? '700' : '600',
                            color: selectedDoctor?._id === doc._id ? colors.warning : colors.text,
                            marginBottom: 2
                          }}>
                            Dr. {doc.fullName}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            {doc.specialization}
                          </Text>
                        </View>
                        {selectedDoctor?._id === doc._id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.warning} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Date & Time Selection */}
          {selectedDepartment && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  Select Date & Time
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Choose your preferred appointment time
                </Text>
              </View>

              <View style={{ 
                backgroundColor: '#FFF3CD', 
                padding: 16, 
                borderRadius: 16, 
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#F59E0B',
                flexDirection: 'row',
                alignItems: 'flex-start'
              }}>
                <Ionicons name="information-circle" size={20} color="#F59E0B" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ fontSize: 13, color: '#856404', lineHeight: 18, flex: 1 }}>
                  Appointments must be booked at least 24 hours in advance (8 AM - 8 PM)
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: date && !dateError ? colors.primary : dateError ? colors.danger : '#F0EDFF',
                  shadowColor: date && !dateError ? colors.primary : "#000",
                  shadowOpacity: date && !dateError ? 0.1 : 0.03,
                  shadowRadius: date && !dateError ? 12 : 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: date && !dateError ? 4 : 2,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <LinearGradient
                  colors={['#7B61FF', '#6F4BFF']}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14
                  }}
                >
                  <Ionicons name="calendar" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                    {formatDisplayDate(date)}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                    Tap to change date & time
                  </Text>
                </View>
                <Ionicons name="time" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              
              {dateError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 8 }}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 13, marginLeft: 6, fontWeight: '500' }}>
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
            </View>
          )}

          {/* Additional Notes */}
          {selectedDepartment && (
            <View style={{ marginBottom: 32 }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  Additional Notes
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Any specific concerns or requirements
                </Text>
              </View>

              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: '#E8E0FF',
                shadowColor: "#000",
                shadowOpacity: 0.03,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2
              }}>
                <TextInput
                  placeholder="Describe your symptoms, concerns, or any special requirements..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  style={{
                    color: colors.text,
                    minHeight: 100,
                    textAlignVertical: 'top',
                    fontSize: 15,
                    lineHeight: 20
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 4 }}>
                      Optional but helpful for doctors
                    </Text>
                  </View>
                  <Text style={{ 
                    fontSize: 11, 
                    color: notes.length >= 450 ? colors.danger : colors.textMuted,
                    fontWeight: notes.length >= 450 ? '700' : '400'
                  }}>
                    {notes.length}/500
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          {selectedDepartment && (
            <TouchableOpacity
              onPress={submit}
              disabled={!selectedHospital || !selectedDepartment || !date || !!dateError || loading}
              style={{
                backgroundColor: (!selectedHospital || !selectedDepartment || !date || !!dateError) ? 
                  `${colors.primary}40` : colors.primary,
                paddingVertical: 18,
                borderRadius: 25,
                shadowColor: colors.primary,
                shadowOpacity: (!selectedHospital || !selectedDepartment || !date || !!dateError) ? 0 : 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: (!selectedHospital || !selectedDepartment || !date || !!dateError) ? 0 : 5,
                alignItems: 'center'
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: "700" }}>
                  Confirm Appointment
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Booking Info Card */}
          <LinearGradient
            colors={["#EFF6FF", "#DBEAFE"]}
            style={{
              padding: 20,
              borderRadius: 18,
              borderLeftWidth: 4,
              borderLeftColor: '#3B82F6',
              marginTop: 24
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#3B82F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="time" size={20} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E40AF" }}>
                Booking Information
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 18, fontWeight: '500' }}>
                • 24-hour advance booking required
              </Text>
              <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 18, fontWeight: '500' }}>
                • Available hours: 8:00 AM - 8:00 PM
              </Text>
              <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 18, fontWeight: '500' }}>
                • Maximum booking window: 3 months
              </Text>
              <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 18, fontWeight: '500' }}>
                • Free cancellation up to 12 hours before
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}