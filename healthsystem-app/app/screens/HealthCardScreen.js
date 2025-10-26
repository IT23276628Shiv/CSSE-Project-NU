// healthsystem-app/app/screens/HealthCardScreen.js
// UPDATED: Fixed data display and added better debugging

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function HealthCardScreen() {
  const { user, setUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/patients/me");
      console.log("=== HEALTH CARD DATA LOADED ===");
      console.log("User data:", JSON.stringify(data, null, 2));
      console.log("Allergies:", data.allergies);
      console.log("Chronic Conditions:", data.chronicConditions);
      console.log("Current Medications:", data.currentMedications);
      console.log("Emergency Contact:", data.emergencyContact);
      console.log("===============================");
      
      setUser(prevUser => ({ ...prevUser, ...data }));
    } catch (error) {
      console.error("Failed to load user data:", error);
      Alert.alert("Error", "Failed to load health card data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Comprehensive health card data matching MongoDB structure
  const healthCardData = {
    _id: user?._id || user?.id,
    healthCardId: user?.healthCardId,
    email: user?.email,
    fullName: user?.fullName,
    phone: user?.phone,
    alternatePhone: user?.alternatePhone,
    nic: user?.nic,
    dateOfBirth: user?.dateOfBirth,
    age: user?.age,
    gender: user?.gender,
    address: user?.address || null,
    bloodGroup: user?.bloodGroup,
    allergies: user?.allergies || [],
    chronicConditions: user?.chronicConditions || [],
    currentMedications: user?.currentMedications || [],
    emergencyContact: user?.emergencyContact || null,
    insuranceInfo: user?.insuranceInfo || [],
    preferredLanguage: user?.preferredLanguage,
    nationality: user?.nationality,
    occupation: user?.occupation,
    maritalStatus: user?.maritalStatus,
    ethnicity: user?.ethnicity,
    religion: user?.religion,
    lastVisit: user?.lastVisit || null,
    preferredHospital: user?.preferredHospital,
    isActive: user?.isActive,
    accountStatus: user?.accountStatus,
    registrationDate: user?.registrationDate,
    avatarUrl: user?.avatarUrl,
    qrGeneratedAt: new Date().toISOString(),
    qrVersion: "2.0"
  };

  const payload = JSON.stringify(healthCardData);

  const handleShare = async () => {
    try {
      let allergyText = 'None';
      if (user?.allergies && user.allergies.length > 0) {
        allergyText = user.allergies.map(a => {
          if (typeof a === 'string') return a;
          return `${a.allergen || 'Unknown'} (${a.severity || 'unknown severity'})`;
        }).join(', ');
      }

      const emergencyName = user?.emergencyContact?.name || 'Not set';
      const emergencyPhone = user?.emergencyContact?.phone || 'Not set';
      const emergencyRelation = user?.emergencyContact?.relationship || 'N/A';

      const shareMessage = `
🏥 My Health Card
━━━━━━━━━━━━━━━━━━━━
Name: ${user?.fullName || 'Not provided'}
Health Card ID: ${user?.healthCardId || 'Not available'}
Blood Group: ${user?.bloodGroup || 'Not specified'}
Phone: ${user?.phone || 'Not provided'}

⚠️ Allergies: ${allergyText}

🚨 Emergency Contact:
   Name: ${emergencyName}
   Relation: ${emergencyRelation}
   Phone: ${emergencyPhone}
━━━━━━━━━━━━━━━━━━━━
Present this QR code at any hospital for quick check-in.
      `.trim();

      await Share.share({
        message: shareMessage,
        title: 'My Health Card'
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share health card");
    }
  };

  const handleEmergencyInfo = () => {
    let allergiesText = 'None recorded';
    if (user?.allergies && user.allergies.length > 0) {
      allergiesText = user.allergies.map(a => {
        if (typeof a === 'string') return `• ${a}`;
        const allergen = a.allergen || 'Unknown allergen';
        const reaction = a.reaction || 'No reaction noted';
        const severity = a.severity || 'Severity not specified';
        return `• ${allergen} - ${reaction} (${severity})`;
      }).join('\n   ');
    }

    let conditionsText = 'None recorded';
    if (user?.chronicConditions && user.chronicConditions.length > 0) {
      conditionsText = user.chronicConditions.map(c => {
        if (typeof c === 'string') return `• ${c}`;
        const condition = c.condition || 'Unknown condition';
        const status = c.status || 'Status unknown';
        return `• ${condition} (${status})`;
      }).join('\n   ');
    }

    let medicationsText = 'None';
    if (user?.currentMedications && user.currentMedications.length > 0) {
      medicationsText = user.currentMedications.map(m => {
        if (typeof m === 'string') return `• ${m}`;
        const name = m.name || 'Unknown medication';
        const dosage = m.dosage || 'Dosage not specified';
        const frequency = m.frequency || '';
        return `• ${name} - ${dosage} ${frequency}`;
      }).join('\n   ');
    }

    const emergencyName = user?.emergencyContact?.name || 'Not set';
    const emergencyRelation = user?.emergencyContact?.relationship || 'N/A';
    const emergencyPhone = user?.emergencyContact?.phone || 'Not provided';
    const emergencyAltPhone = user?.emergencyContact?.alternatePhone || '';

    const emergencyInfo = `
━━━━━━━━━━━━━━━━━━━━
EMERGENCY INFORMATION
━━━━━━━━━━━━━━━━━━━━

👤 Name: ${user?.fullName || 'Not provided'}
🆔 Health Card: ${user?.healthCardId || 'N/A'}
📧 Email: ${user?.email || 'N/A'}

🩸 Blood Group: ${user?.bloodGroup || 'Not specified'}
📞 Phone: ${user?.phone || 'Not provided'}
${user?.alternatePhone ? `📱 Alternate: ${user.alternatePhone}` : ''}

🚨 Emergency Contact:
   Name: ${emergencyName}
   Relation: ${emergencyRelation}
   Phone: ${emergencyPhone}
   ${emergencyAltPhone ? `Alternate: ${emergencyAltPhone}` : ''}

⚠️ ALLERGIES:
   ${allergiesText}

🏥 CHRONIC CONDITIONS:
   ${conditionsText}

💊 CURRENT MEDICATIONS:
   ${medicationsText}

📍 Address: ${user?.address?.street || ''} ${user?.address?.city || ''} ${user?.address?.district || ''}
    `.trim();

    Alert.alert("Emergency Information", emergencyInfo, [
      { 
        text: "Share", 
        onPress: () => {
          Share.share({
            message: emergencyInfo,
            title: 'Emergency Health Information'
          });
        }
      },
      { text: "Close" }
    ]);
  };

  const formatHealthCardId = (id) => {
    if (!id) return 'Not Available';
    return id.match(/.{1,4}/g)?.join(' ') || id;
  };

  const getDataCompleteness = () => {
    let completed = 0;
    let total = 10;
    
    if (user?.healthCardId) completed++;
    if (user?.phone) completed++;
    if (user?.bloodGroup) completed++;
    if (user?.emergencyContact?.phone) completed++;
    if (user?.address?.city) completed++;
    if (user?.allergies && user.allergies.length > 0) completed++;
    if (user?.dateOfBirth) completed++;
    if (user?.gender) completed++;
    if (user?.nic) completed++;
    if (user?.avatarUrl) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completeness = getDataCompleteness();

  const getAllergiesDisplay = () => {
    console.log("Getting allergies display for:", user?.allergies);
    
    if (!user?.allergies || user.allergies.length === 0) return null;
    
    return user.allergies.map(a => {
      // If it's just a string, return it
      if (typeof a === 'string') return a;
      
      // If it has an allergen property, use it
      if (a.allergen) {
        // Only show severity if it's specified and not UNKNOWN
        if (a.severity && a.severity !== 'UNKNOWN') {
          return `${a.allergen} (${a.severity})`;
        }
        return a.allergen; // Just the allergen without unknown severity
      }
      
      return 'Unknown allergen';
    }).join(', ');
  };

  const getChronicConditionsDisplay = () => {
    console.log("Getting chronic conditions display for:", user?.chronicConditions);
    
    if (!user?.chronicConditions || user.chronicConditions.length === 0) return null;
    
    return user.chronicConditions.map(c => {
      // If it's just a string, return it
      if (typeof c === 'string') return c;
      
      // If it has a condition property, use it
      if (c.condition) {
        // Only show status if it's specified and meaningful
        if (c.status && c.status !== 'ACTIVE') {
          return `${c.condition} (${c.status})`;
        }
        return c.condition; // Just the condition without active status
      }
      
      return 'Unknown condition';
    }).join(', ');
  };

  const getCurrentMedicationsDisplay = () => {
    console.log("Getting medications display for:", user?.currentMedications);
    
    if (!user?.currentMedications || user.currentMedications.length === 0) return null;
    
    return user.currentMedications.map(m => {
      // If it's just a string, return it
      if (typeof m === 'string') return m;
      
      // If it has a name property, use it
      if (m.name) {
        // Show dosage if available
        if (m.dosage) {
          return `${m.name} - ${m.dosage}`;
        }
        return m.name;
      }
      
      return 'Unknown medication';
    }).join(', ');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading health card...</Text>
        </View>
      </SafeAreaView>
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
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
        {/* Main Health Card */}
        <LinearGradient 
          colors={["#EADFFF", "#DCD3FF"]}
          start={[0, 0]} 
          end={[1, 1]} 
          style={{
            margin: 16,
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            shadowColor: "#B28EFF",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            width: '100%', 
            marginBottom: 20 
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#5E4B91", fontSize: 14, fontWeight: "600" }}>
                Digital Health Card
              </Text>
              <Text style={{ color: "#2D0057", fontSize: 16, fontWeight: "800", marginTop: 4 }}>
                {user?.fullName || 'Patient Name'}
              </Text>
              <Text style={{ color: "#5E4B91", fontSize: 12, marginTop: 2 }}>
                {user?.email || 'No email'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={{
              padding: 8,
              backgroundColor: 'rgba(45, 0, 87, 0.1)',
              borderRadius: 12
            }}>
              <Ionicons name="share-outline" size={20} color="#2D0057" />
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          <View style={{ 
            backgroundColor: colors.white, 
            padding: 20, 
            borderRadius: 16,
            marginBottom: 20
          }}>
            {user?.healthCardId ? (
              <QRCode 
                size={200} 
                value={payload}
                logoBackgroundColor="transparent"
              />
            ) : (
              <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
                  No Health Card ID Available
                </Text>
              </View>
            )}
          </View>

          {/* Health Card ID */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: "#5E4B91", fontSize: 12, fontWeight: "500", marginBottom: 8 }}>
              HEALTH CARD ID
            </Text>
            <Text style={{ color: "#2D0057", fontSize: 18, fontWeight: "700" }}>
              {formatHealthCardId(user?.healthCardId)}
            </Text>
          </View>

          {/* Data Completeness Indicator */}
          <View style={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            padding: 12, 
            borderRadius: 12,
            marginBottom: 12
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: "#2D0057", fontSize: 12, fontWeight: "600" }}>
                Profile Completeness
              </Text>
              <Text style={{ color: "#2D0057", fontSize: 12, fontWeight: "700" }}>
                {completeness}%
              </Text>
            </View>
            <View style={{ 
              height: 6, 
              backgroundColor: 'rgba(255,255,255,0.5)', 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{ 
                width: `${completeness}%`, 
                height: '100%', 
                backgroundColor: completeness === 100 ? '#22C55E' : '#2D0057',
                borderRadius: 3
              }} />
            </View>
          </View>

          {/* Info */}
          <Text style={{ 
            color: "#5E4B91", 
            fontSize: 14, 
            textAlign: 'center',
            lineHeight: 20
          }}>
            Scan this QR code at hospital check-in for instant access to your complete medical profile
          </Text>
        </LinearGradient>

        {/* Additional Information */}
        <View style={{ padding: 16 }}>
          {/* Emergency Information */}
          <TouchableOpacity 
            onPress={handleEmergencyInfo} 
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="medical" size={20} color="#EF4444" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                Emergency Information
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <View style={{ marginBottom: 12, minWidth: '45%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Blood Group</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {user?.bloodGroup || 'Not specified'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 12, minWidth: '45%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Emergency Contact</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {user?.emergencyContact?.name || 'Not set'}
                </Text>
                {user?.emergencyContact?.phone && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {user.emergencyContact.phone}
                  </Text>
                )}
              </View>

              {/* Always show allergies section */}
              <View style={{ marginBottom: 12, width: '100%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Known Allergies</Text>
                {getAllergiesDisplay() ? (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: '#EF4444' }}>
                    {getAllergiesDisplay()}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>
                    No known allergies
                  </Text>
                )}
              </View>

              {/* Always show chronic conditions section */}
              <View style={{ marginBottom: 12, width: '100%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Chronic Conditions</Text>
                {getChronicConditionsDisplay() ? (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: '#F59E0B' }}>
                    {getChronicConditionsDisplay()}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>
                    No chronic conditions
                  </Text>
                )}
              </View>

              {/* Always show medications section */}
              <View style={{ marginBottom: 12, width: '100%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Current Medications</Text>
                {getCurrentMedicationsDisplay() ? (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                    {getCurrentMedicationsDisplay()}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>
                    No current medications
                  </Text>
                )}
              </View>
            </View>
            
            <Text style={{ fontSize: 12, color: colors.primary, textAlign: 'center', marginTop: 8 }}>
              Tap to view full emergency information
            </Text>
          </TouchableOpacity>

          {/* QR Code Data Summary */}
          <View style={{
            backgroundColor: `${colors.primary}08`,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: `${colors.primary}20`,
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              QR Code Contains
            </Text>
            
            {[
              { icon: "person", text: "Full personal details & contact info" },
              { icon: "location", text: "Complete address information" },
              { icon: "water", text: "Blood group & medical alerts" },
              { icon: "medkit", text: "Allergies (with severity levels)" },
              { icon: "fitness", text: "Chronic conditions & status" },
              { icon: "medical", text: "Current medications & dosages" },
              { icon: "call", text: "Emergency contact details" },
              { icon: "shield-checkmark", text: "Insurance information" },
              { icon: "time", text: "Medical history & last visit" }
            ].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name={item.icon} size={14} color={colors.white} />
                </View>
                <Text style={{ fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 }}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Security Notice */}
          <View style={{
            backgroundColor: '#FFF3CD',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#FFE69C'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={18} color="#856404" />
              <Text style={{ 
                fontSize: 13, 
                color: '#856404', 
                marginLeft: 8,
                flex: 1,
                lineHeight: 18
              }}>
                Your QR code contains sensitive medical information. Only share with authorized healthcare providers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}