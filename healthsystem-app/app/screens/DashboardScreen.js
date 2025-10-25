import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Animated,
  Easing,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";
import useSocket from "../../src/hooks/useSocket";

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);

  const load = async () => {
    try {
      setLoading(true);
      
      const { data: appointmentsData } = await client.get("/appointments");
      setAppointments(appointmentsData);
      
      const { data: recordsData } = await client.get("/records");
      
      const now = new Date();
      const upcoming = appointmentsData.filter(apt => 
        new Date(apt.date) > now && 
        (apt.status === 'BOOKED' || apt.status === 'CONFIRMED')
      );
      const completed = appointmentsData.filter(apt => apt.status === 'COMPLETED');
      
      setStats({
        totalAppointments: appointmentsData.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        totalRecords: recordsData.length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useSocket(user?.id, {
    "appointment:created": load,
    "appointment:updated": load,
  });

  const nextAppointment = appointments
    .filter(a => new Date(a.date) > new Date() && (a.status === "BOOKED" || a.status === "CONFIRMED"))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const recentRecords = appointments
    .filter(a => a.status === "COMPLETED")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 17) return "☀️";
    return "🌙";
  };

  const getDayWish = () => {
    const day = new Date().getDay();
    const dayWishes = [
      "Have a blessed Sunday! 🙏",
      "Start your week strong! 💪",
      "Have a terrific Tuesday! ⭐",
      "Happy Wednesday! 🌟",
      "Almost there! Happy Thursday! 🎯",
      "Happy Friday! Weekend's coming! 🎉",
      "Enjoy your Saturday! 🎨"
    ];
    return dayWishes[day];
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>Loading your dashboard...</Text>
      </View>
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
      >
        {/* Greeting Banner - MUST BE FIRST */}
        <View style={{ paddingHorizontal: 20, paddingTop: 45, backgroundColor: '#F8F7FF' }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 30,
            padding: 16,
            marginBottom: 16,
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
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#F0EDFF',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14
              }}>
                <Text style={{ fontSize: 24 }}>{getGreetingEmoji()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 }}>
                  {getGreeting()}, {user?.fullName?.split(' ')[0] || "Patient"}! 👋
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                  {getDayWish()}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile')}
                style={{
                  shadowColor: colors.primary,
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}>
                  {user?.avatarUrl ? (
                    <Image 
                      source={{ uri: user.avatarUrl }} 
                      style={{ width: 44, height: 44, borderRadius: 22 }} 
                    />
                  ) : (
                    <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
                      {user?.fullName?.charAt(0) || "P"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Cards - Horizontal Scroll */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {/* Upcoming */}
            <View style={{
              width: width * 0.38,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E8E0FF',
              shadowColor: colors.primary,
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#7B61FF',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10
              }}>
                <Ionicons name="calendar" size={20} color="#FFF" />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4, fontWeight: '500' }}>
                Upcoming
              </Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
                {stats.upcomingAppointments}
              </Text>
            </View>

            {/* Completed */}
            <View style={{
              width: width * 0.38,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#ECFDF5',
              shadowColor: '#22C55E',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#22C55E',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10
              }}>
                <Ionicons name="checkmark-done" size={20} color="#FFF" />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4, fontWeight: '500' }}>
                Completed
              </Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
                {stats.completedAppointments}
              </Text>
            </View>

            {/* Records */}
            <View style={{
              width: width * 0.38,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#FEF3C7',
              shadowColor: '#F59E0B',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#F59E0B',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10
              }}>
                <Ionicons name="document-text" size={20} color="#FFF" />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4, fontWeight: '500' }}>
                Records
              </Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800" }}>
                {stats.totalRecords}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Content Area */}
        <View style={{ padding: 20, marginTop: 0 }}>
          {/* Next Appointment Card */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
                  Next Appointment
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Your upcoming visit
                </Text>
              </View>
              {nextAppointment && (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Appointments')}
                  style={{
                    backgroundColor: `${colors.primary}15`,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "700" }}>
                    View All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {nextAppointment ? (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Appointments')}
              >
                <LinearGradient
                  colors={["#FFFFFF", "#F9F7FF"]}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#E8E0FF',
                    shadowColor: "#7B61FF",
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8
                  }}
                >
                  {/* Hospital Name & Status */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
                        {nextAppointment.hospital?.name || nextAppointment.hospital}
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.textMuted }}>
                        {nextAppointment.department?.name || nextAppointment.department}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: '#22C55E15',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#22C55E',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: '#22C55E', letterSpacing: 0.5 }}>
                        {nextAppointment.status}
                      </Text>
                    </View>
                  </View>

                  {/* Date & Time with Icon */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F0EDFF',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 16
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
                        {new Date(nextAppointment.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary, marginTop: 2 }}>
                        {new Date(nextAppointment.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Doctor Info */}
                  {nextAppointment.doctor && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                          {nextAppointment.doctor.fullName?.charAt(0) || 'D'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                          Dr. {nextAppointment.doctor.fullName || "Doctor"}
                        </Text>
                        {nextAppointment.doctor.specialization && (
                          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                            {nextAppointment.doctor.specialization}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 28,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#F0EDFF',
                borderStyle: 'dashed'
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#F0EDFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Ionicons name="calendar-outline" size={40} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                  No Upcoming Appointments
                </Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                  Book your next appointment to stay on top of your health journey
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
                    Book Now
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
                Quick Actions
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                Manage your health easily
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {/* Book Appointment */}
              <TouchableOpacity 
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: '#FFFFFF',
                  padding: 18,
                  borderRadius: 18,
                  alignItems: 'center',
                  shadowColor: "#7B61FF",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: '#F0EDFF'
                }}
                onPress={() => navigation.navigate('Book')}
              >
                <LinearGradient
                  colors={['#7B61FF', '#6F4BFF']}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: 'center' }}>
                  Book Appointment
                </Text>
              </TouchableOpacity>

              {/* View Records */}
              <TouchableOpacity 
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: '#FFFFFF',
                  padding: 18,
                  borderRadius: 18,
                  alignItems: 'center',
                  shadowColor: "#22C55E",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: '#ECFDF5'
                }}
                onPress={() => navigation.navigate('Records')}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Ionicons name="document-text" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: 'center' }}>
                  View Records
                </Text>
              </TouchableOpacity>

              {/* Health Card */}
              <TouchableOpacity 
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: '#FFFFFF',
                  padding: 18,
                  borderRadius: 18,
                  alignItems: 'center',
                  shadowColor: "#F59E0B",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: '#FEF3C7'
                }}
                onPress={() => navigation.navigate('HealthCard')}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Ionicons name="card" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: 'center' }}>
                  Health Card
                </Text>
              </TouchableOpacity>

              {/* Emergency */}
              <TouchableOpacity 
                style={{
                  flex: 1,
                  minWidth: '47%',
                  backgroundColor: '#FFFFFF',
                  padding: 18,
                  borderRadius: 18,
                  alignItems: 'center',
                  shadowColor: "#EF4444",
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: '#FEE2E2'
                }}
                onPress={() => {
                  Alert.alert(
                    '🚨 Emergency Services',
                    'Call 1990 for ambulance services?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Call Now', 
                        style: 'destructive',
                        onPress: () => {
                          Alert.alert('Emergency', 'Dialing emergency services...');
                        }
                      }
                    ]
                  );
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12
                  }}
                >
                  <Ionicons name="call" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, textAlign: 'center' }}>
                  Emergency
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          {recentRecords.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
                  Recent Activity
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                  Your latest visits
                </Text>
              </View>
              {recentRecords.map((record) => (
                <TouchableOpacity
                  key={record._id}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Records')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#F0F0F0',
                    shadowColor: "#000",
                    shadowOpacity: 0.03,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#ECFDF5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
                        {record.hospital?.name || record.hospital}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Health Tip */}
          <LinearGradient
            colors={["#EFF6FF", "#DBEAFE"]}
            style={{
              padding: 20,
              borderRadius: 18,
              borderLeftWidth: 4,
              borderLeftColor: '#3B82F6'
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
                <Ionicons name="bulb" size={20} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E40AF" }}>
                Health Tip of the Day
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#1E3A8A", lineHeight: 21, fontWeight: '500' }}>
              Regular health check-ups can help detect potential health issues early. Schedule your annual check-up today! 💙
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}