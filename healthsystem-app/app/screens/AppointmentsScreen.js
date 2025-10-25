// healthsystem-app/app/screens/AppointmentsScreen.js
// FIXED: Modal buttons now visible + improved timezone handling

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
  StatusBar
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

// Normalize dates to minute precision to avoid timezone issues
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  return normalized;
};

export default function AppointmentsScreen() {
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
    { id: 'ALL', label: 'All', icon: 'list' },
    { id: 'BOOKED', label: 'Booked', icon: 'calendar' },
    { id: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
    { id: 'COMPLETED', label: 'Completed', icon: 'checkmark-done' },
    { id: 'CANCELLED', label: 'Cancelled', icon: 'close-circle' },
    { id: 'UPCOMING', label: 'Upcoming', icon: 'time' }
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
        return colors.primary;
      case "COMPLETED":
        return colors.success;
      case "CANCELLED":
        return colors.danger;
      case "CONFIRMED":
        return colors.warning;
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
      <PCard style={{ marginBottom: 16, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
              fontWeight: "600", 
              color: statusColor 
            }}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 12,
          padding: 12,
          backgroundColor: `${colors.primary}08`,
          borderRadius: 8
        }}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{date}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{time}</Text>
          </View>
          {isPast && (
            <View style={{ 
              backgroundColor: colors.textMuted, 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 8 
            }}>
              <Text style={{ fontSize: 10, color: colors.white, fontWeight: "600" }}>PAST</Text>
            </View>
          )}
        </View>

        {/* Doctor Info */}
        {item.doctor && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: 12,
            paddingVertical: 8
          }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                {item.doctor.fullName?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
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
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              Appointment No: {item.appointmentNumber}
            </Text>
          </View>
        )}

        {/* Actions */}
        {canModify && (
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
            <PButton 
              title="Cancel" 
              type="outline" 
              onPress={() => handleCancel(item._id, hospitalName, item.date)} 
              style={{ flex: 1 }}
              loading={cancellingId === item._id}
              disabled={cancellingId !== null || rescheduling}
              textStyle={{ color: colors.danger }}
            />
            <PButton 
              title="Reschedule" 
              type="primary" 
              onPress={() => handleReschedule(item._id, hospitalName, item.date)}
              style={{ flex: 1 }}
              disabled={cancellingId !== null || rescheduling}
            />
          </View>
        )}
      </PCard>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading appointments...</Text>
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
      {/* Header with Filter */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8
      }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>
            Appointments
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
            {filteredItems.length} {activeFilter === 'ALL' ? 'total' : activeFilter.toLowerCase()}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => setShowFilterMenu(!showFilterMenu)}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Ionicons name="filter" size={18} color={colors.white} />
          <Text style={{ color: colors.white, marginLeft: 8, fontWeight: "600" }}>
            Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Menu */}
      {showFilterMenu && (
        <View style={{ 
          backgroundColor: colors.white, 
          margin: 16,
          marginTop: 0,
          borderRadius: 12,
          padding: 8,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4
        }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => handleFilterChange(filter.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: activeFilter === filter.id ? `${colors.primary}15` : 'transparent'
              }}
            >
              <Ionicons 
                name={filter.icon} 
                size={20} 
                color={activeFilter === filter.id ? colors.primary : colors.textMuted} 
              />
              <Text style={{ 
                marginLeft: 12, 
                fontSize: 14,
                fontWeight: activeFilter === filter.id ? "600" : "400",
                color: activeFilter === filter.id ? colors.primary : colors.text
              }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAppointments(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: colors.text, 
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              No {activeFilter === 'ALL' ? '' : activeFilter.toLowerCase()} appointments
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted, 
              textAlign: 'center',
              lineHeight: 20
            }}>
              {activeFilter === 'ALL' 
                ? "You don't have any appointments yet. Book your first appointment to get started."
                : `You don't have any ${activeFilter.toLowerCase()} appointments.`
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Reschedule Modal - FIXED BUTTONS */}
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
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            padding: 20,
            maxHeight: '80%',
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 8
            }}>
              Reschedule Appointment
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: colors.textMuted,
              marginBottom: 20
            }}>
              {rescheduleModal.hospitalName}
            </Text>

            {/* Current Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                Current Date & Time
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
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
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                New Date & Time *
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
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text, fontSize: 14, flex: 1 }}>
                  {newDate.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Info Message */}
            <View style={{ 
              backgroundColor: '#FFF3CD', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#F59E0B'
            }}>
              <Text style={{ fontSize: 12, color: '#856404', lineHeight: 18 }}>
                ⓘ New appointment must be at least 24 hours from now and between 8:00 AM - 8:00 PM
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

            {/* Buttons - FIXED: Made them visible */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 12,
              marginTop: 8
            }}>
              <TouchableOpacity
                onPress={closeRescheduleModal}
                disabled={rescheduling}
                style={{
                  flex: 1,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
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
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  alignItems: 'center',
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}