// healthsystem-app/app/screens/AppointmentsScreen.js
// ENHANCED: Modern UI matching dashboard design

import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

const { width } = Dimensions.get('window');

// Normalize dates to minute precision to avoid timezone issues
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  return normalized;
};

export default function AppointmentsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState({
    visible: false,
    appointmentId: null,
    hospitalName: "",
    currentDate: new Date()
  });
  const [newDate, setNewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const FILTERS = [
    { id: 'ALL', label: 'All', icon: 'list', color: colors.primary },
    { id: 'BOOKED', label: 'Booked', icon: 'calendar', color: '#7B61FF' },
    { id: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle', color: '#F59E0B' },
    { id: 'COMPLETED', label: 'Completed', icon: 'checkmark-done', color: '#22C55E' },
    { id: 'CANCELLED', label: 'Cancelled', icon: 'close-circle', color: '#EF4444' },
    { id: 'UPCOMING', label: 'Upcoming', icon: 'time', color: '#8B5CF6' }
  ];

  const loadAppointments = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data } = await client.get("/appointments");
      setItems(data);
      applyFilter(data, activeFilter);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      Alert.alert("Error", error.message || "Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadAppointments(); 
  }, []);

  const applyFilter = (appointments, filter) => {
    let filtered = [...appointments];
    const now = normalizeDate(new Date());

    switch (filter) {
      case 'UPCOMING':
        filtered = filtered.filter(apt => 
          normalizeDate(apt.date) > now && 
          (apt.status === 'BOOKED' || apt.status === 'CONFIRMED')
        );
        break;
      case 'ALL':
        // Show all
        break;
      default:
        filtered = filtered.filter(apt => apt.status === filter);
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredItems(filtered);
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    applyFilter(items, filterId);
    setShowFilterMenu(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "BOOKED":
        return '#7B61FF';
      case "COMPLETED":
        return '#22C55E';
      case "CANCELLED":
        return '#EF4444';
      case "CONFIRMED":
        return '#F59E0B';
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "BOOKED":
        return "Booked";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "CONFIRMED":
        return "Confirmed";
      default:
        return status;
    }
  };

  const validateCancellation = (appointmentDate) => {
    const now = normalizeDate(new Date());
    const appointment = normalizeDate(appointmentDate);
    const hoursDiff = (appointment - now) / (1000 * 60 * 60);

    if (appointment <= now) {
      return { valid: false, error: "Cannot cancel past appointments" };
    }

    if (hoursDiff < 24) {
      return { 
        valid: false, 
        error: "Cannot cancel appointments less than 24 hours before scheduled time" 
      };
    }

    return { valid: true, error: null };
  };

  const handleCancel = async (id, hospitalName, appointmentDate) => {
    const validation = validateCancellation(appointmentDate);
    
    if (!validation.valid) {
      Alert.alert("Cannot Cancel", validation.error);
      return;
    }

    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment at ${hospitalName}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(id);
              const response = await client.patch(`/appointments/${id}/cancel`);
              
              if (response.status === 200) {
                await loadAppointments();
                Alert.alert("Success", "Appointment cancelled successfully");
              }
            } catch (error) {
              console.error("Cancel failed:", error);
              Alert.alert("Error", error.message || "Failed to cancel appointment");
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
  };

  const validateReschedule = (currentDate, newDate) => {
    const now = normalizeDate(new Date());
    const current = normalizeDate(currentDate);
    const scheduled = normalizeDate(newDate);

    // Can't reschedule past appointments
    if (current <= now) {
      return { valid: false, error: "Cannot reschedule past appointments" };
    }

    // New date must be in the future
    if (scheduled <= now) {
      return { valid: false, error: "New date must be in the future" };
    }

    // Must be at least 24 hours in advance
    const hoursDiff = (scheduled - now) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      return { 
        valid: false, 
        error: "New appointment must be at least 24 hours from now" 
      };
    }

    // Check business hours (8 AM - 8 PM)
    const hour = scheduled.getHours();
    if (hour < 8 || hour >= 20) {
      return {
        valid: false,
        error: "Appointments must be between 8:00 AM and 8:00 PM"
      };
    }

    // Can't be more than 3 months ahead
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (scheduled > maxDate) {
      return {
        valid: false,
        error: "Cannot schedule more than 3 months in advance"
      };
    }

    return { valid: true, error: null };
  };

  const handleReschedule = (appointmentId, hospitalName, currentDate) => {
    const appointmentDate = normalizeDate(currentDate);
    
    const validation = validateReschedule(currentDate, appointmentDate);
    if (!validation.valid) {
      Alert.alert("Cannot Reschedule", validation.error);
      return;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    setRescheduleModal({
      visible: true,
      appointmentId,
      hospitalName,
      currentDate: appointmentDate
    });
    
    setNewDate(appointmentDate > tomorrow ? appointmentDate : tomorrow);
  };

  const confirmReschedule = async () => {
    const validation = validateReschedule(rescheduleModal.currentDate, newDate);
    
    if (!validation.valid) {
      Alert.alert("Invalid Date", validation.error);
      return;
    }

    try {
      setRescheduling(true);
      
      const response = await client.patch(
        `/appointments/${rescheduleModal.appointmentId}/reschedule`,
        { newDate: newDate.toISOString() }
      );
      
      if (response.status === 200) {
        setRescheduleModal({ 
          visible: false, 
          appointmentId: null, 
          hospitalName: "", 
          currentDate: new Date() 
        });
        await loadAppointments();
        Alert.alert("Success", "Appointment rescheduled successfully");
      }
    } catch (error) {
      console.error("Reschedule failed:", error);
      Alert.alert("Error", error.message || "Failed to reschedule appointment");
    } finally {
      setRescheduling(false);
    }
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ 
      visible: false, 
      appointmentId: null, 
      hospitalName: "", 
      currentDate: new Date() 
    });
    setShowDatePicker(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const renderAppointmentItem = ({ item }) => {
    const { date, time } = formatDateTime(item.date);
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);
    const hospitalName = item.hospital?.name || item.hospital || "Unknown Hospital";
    const departmentName = item.department?.name || item.department || "General";
    const isPast = normalizeDate(item.date) < normalizeDate(new Date());
    const canModify = item.status === "BOOKED" && !isPast;

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {/* Could navigate to appointment details */}}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F9F7FF"]}
          style={{
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E8E0FF',
            shadowColor: statusColor,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: "800", 
                color: colors.text,
                marginBottom: 4 
              }}>
                {hospitalName}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: colors.textMuted,
                marginBottom: 8 
              }}>
                {departmentName}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View style={{ 
              backgroundColor: `${statusColor}15`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: statusColor
            }}>
              <Text style={{ 
                fontSize: 12, 
                fontWeight: "700", 
                color: statusColor,
                letterSpacing: 0.5
              }}>
                {statusText}
              </Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#F0EDFF',
            borderRadius: 16
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14
            }}>
              <Ionicons name="calendar" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3, fontWeight: '500' }}>
                Scheduled for
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                {date}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginTop: 2 }}>
                {time}
              </Text>
            </View>
            {isPast && (
              <View style={{ 
                backgroundColor: colors.textMuted, 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 8 
              }}>
                <Text style={{ fontSize: 10, color: colors.white, fontWeight: "700" }}>PAST</Text>
              </View>
            )}
          </View>

          {/* Doctor Info */}
          {item.doctor && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 16,
              padding: 12,
              backgroundColor: `${colors.primary}05`,
              borderRadius: 12
            }}>
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>
                  {item.doctor.fullName?.charAt(0) || 'D'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                  Dr. {item.doctor.fullName || "Doctor"}
                </Text>
                {item.doctor.specialization && (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {item.doctor.specialization}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Appointment Number */}
          {item.appointmentNumber && (
            <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="receipt" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Appointment No: <Text style={{ fontWeight: '700', color: colors.text }}>{item.appointmentNumber}</Text>
              </Text>
            </View>
          )}

          {/* Actions */}
          {canModify && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleCancel(item._id, hospitalName, item.date)} 
                disabled={cancellingId !== null || rescheduling}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: '#EF4444',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: `${colors.danger}05`,
                  opacity: (cancellingId !== null || rescheduling) ? 0.5 : 1
                }}
              >
                {cancellingId === item._id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: "700", 
                    color: '#EF4444' 
                  }}>
                    Cancel
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleReschedule(item._id, hospitalName, item.date)}
                disabled={cancellingId !== null || rescheduling}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  opacity: (cancellingId !== null || rescheduling) ? 0.5 : 1
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: "700", 
                  color: colors.white 
                }}>
                  Reschedule
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }} edges={['bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FF' }} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAppointments(true)}
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
                  My Appointments
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500' }}>
                  {filteredItems.length} {activeFilter === 'ALL' ? 'total' : activeFilter.toLowerCase()} appointments
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Book')}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4
                }}
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={{ color: colors.white, marginLeft: 6, fontWeight: "700", fontSize: 14 }}>
                  New
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 20, marginBottom: 16 }}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleFilterChange(filter.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: activeFilter === filter.id ? filter.color : colors.white,
                marginRight: 8,
                borderWidth: 1,
                borderColor: activeFilter === filter.id ? filter.color : colors.border,
                shadowColor: filter.color,
                shadowOpacity: activeFilter === filter.id ? 0.15 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: activeFilter === filter.id ? 3 : 0
              }}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={activeFilter === filter.id ? colors.white : colors.textMuted} 
              />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeFilter === filter.id ? colors.white : colors.text,
                marginLeft: 6
              }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Appointments List */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <View key={item._id}>
                {renderAppointmentItem({ item })}
              </View>
            ))
          ) : (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 40,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#F0EDFF',
              borderStyle: 'dashed'
            }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#F0EDFF',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              }}>
                <Ionicons name="calendar-outline" size={48} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8, textAlign: 'center' }}>
                No Appointments Found
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                {activeFilter === 'ALL' 
                  ? "You don't have any appointments yet. Book your first appointment to get started."
                  : `You don't have any ${activeFilter.toLowerCase()} appointments.`
                }
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Book')}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 25,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 5
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: "700" }}>
                  Book Appointment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRescheduleModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 20
        }}>
          <LinearGradient
            colors={["#FFFFFF", "#F9F7FF"]}
            style={{
              borderRadius: 24,
              padding: 24,
              shadowColor: "#7B61FF",
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
              elevation: 10
            }}
          >
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: colors.text,
              marginBottom: 8
            }}>
              Reschedule Appointment
            </Text>
            
            <Text style={{
              fontSize: 15,
              color: colors.textMuted,
              marginBottom: 20
            }}>
              {rescheduleModal.hospitalName}
            </Text>

            {/* Current Date */}
            <View style={{ 
              marginBottom: 20,
              padding: 16,
              backgroundColor: '#F0EDFF',
              borderRadius: 16
            }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6, fontWeight: '500' }}>
                Current Date & Time
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                {rescheduleModal.currentDate.toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            {/* New Date */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: '500' }}>
                New Date & Time *
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: colors.background,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons name="calendar" size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>
                    {newDate.toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Info Message */}
            <View style={{ 
              backgroundColor: '#FFF3CD', 
              padding: 16, 
              borderRadius: 12, 
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor: '#F59E0B',
              flexDirection: 'row',
              alignItems: 'flex-start'
            }}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={{ fontSize: 13, color: '#856404', lineHeight: 18, flex: 1 }}>
                New appointment must be at least 24 hours from now and between 8:00 AM - 8:00 PM
              </Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {/* Buttons */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 12
            }}>
              <TouchableOpacity
                onPress={closeRescheduleModal}
                disabled={rescheduling}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: rescheduling ? 0.5 : 1
                }}
              >
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "700", 
                  color: colors.primary 
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmReschedule}
                disabled={rescheduling}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  opacity: rescheduling ? 0.5 : 1
                }}
              >
                {rescheduling ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: "700", 
                    color: colors.white 
                  }}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
}