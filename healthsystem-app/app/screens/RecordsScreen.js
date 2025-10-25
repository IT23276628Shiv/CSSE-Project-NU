import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Records', icon: 'documents' },
  { id: 'recent', label: 'Last 30 Days', icon: 'time' },
  { id: 'year', label: 'This Year', icon: 'calendar' }
];

export default function RecordsScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);

  const loadRecords = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data } = await client.get("/records");
      
      const transformedRecords = data.map(record => ({
        _id: record._id,
        recordNumber: record.recordNumber,
        hospital: record.hospital?.name || 'Unknown Hospital',
        department: record.department?.name || 'General',
        visitDate: record.visitDate,
        visitType: record.visitType || 'OUTPATIENT',
        diagnosis: record.diagnosis?.primary?.condition || 'No diagnosis',
        prescription: record.prescriptions?.length > 0 
          ? record.prescriptions.map(p => `${p.medicationName} - ${p.dosage}`).join(', ')
          : 'No prescription',
        notes: record.clinicalNotes,
        doctor: {
          name: record.attendingDoctor?.fullName || 'Unknown Doctor',
          specialization: record.attendingDoctor?.specialization || 'General'
        },
        vitalSigns: record.vitalSigns,
        prescriptions: record.prescriptions || [],
        labTests: record.labTests || [],
        status: record.status
      }));
      
      setRecords(transformedRecords);
      applyFilters(transformedRecords, activeFilter, searchQuery);
    } catch (error) {
      console.error("Failed to load records:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    if (user?.id) {
      loadRecords(); 
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    applyFilters(records, activeFilter, searchQuery);
  }, [searchQuery, activeFilter, records]);

  const applyFilters = (recordsList, filter, search) => {
    let filtered = [...recordsList];

    // Apply time filter
    const now = new Date();
    if (filter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(record => new Date(record.visitDate) > thirtyDaysAgo);
    } else if (filter === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(record => new Date(record.visitDate) > yearStart);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(record =>
        record.hospital?.toLowerCase().includes(searchLower) ||
        record.department?.toLowerCase().includes(searchLower) ||
        record.diagnosis?.toLowerCase().includes(searchLower) ||
        record.prescription?.toLowerCase().includes(searchLower) ||
        record.doctor?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
    setFilteredRecords(filtered);
  };

  const toggleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentColor = (department) => {
    const dept = department?.toLowerCase() || '';
    if (dept.includes('cardio')) return '#EF4444';
    if (dept.includes('neuro')) return '#8B5CF6';
    if (dept.includes('ortho')) return '#F59E0B';
    if (dept.includes('dental')) return '#06B6D4';
    if (dept.includes('lab')) return '#A855F7';
    if (dept.includes('pedia')) return '#EC4899';
    return colors.primary;
  };

  const getVisitTypeIcon = (type) => {
    switch (type) {
      case 'EMERGENCY': return 'flash';
      case 'INPATIENT': return 'bed';
      case 'SURGERY': return 'medkit';
      case 'LAB_TEST': return 'flask';
      default: return 'person';
    }
  };

  const renderRecordItem = ({ item }) => {
    const isExpanded = expandedRecord === item._id;
    const departmentColor = getDepartmentColor(item.department);

    return (
      <PCard style={{ marginBottom: 16 }}>
        {/* Header - Always Visible */}
        <TouchableOpacity onPress={() => toggleExpandRecord(item._id)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              {/* Hospital Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: departmentColor,
                  marginRight: 8
                }} />
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "700", 
                  color: colors.text,
                  flex: 1 
                }}>
                  {item.hospital}
                </Text>
              </View>
              
              {/* Department & Date */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="business" size={14} color={colors.textMuted} />
                <Text style={{ 
                  fontSize: 13, 
                  color: colors.textMuted,
                  marginLeft: 6,
                  flex: 1
                }}>
                  {item.department}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar" size={14} color={colors.textMuted} />
                <Text style={{ 
                  fontSize: 13, 
                  color: colors.textMuted,
                  marginLeft: 6
                }}>
                  {formatDate(item.visitDate)}
                </Text>
                
                {/* Visit Type Badge */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: `${departmentColor}15`,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  marginLeft: 12
                }}>
                  <Ionicons name={getVisitTypeIcon(item.visitType)} size={12} color={departmentColor} />
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: "600", 
                    color: departmentColor,
                    marginLeft: 4
                  }}>
                    {item.visitType}
                  </Text>
                </View>
              </View>
            </View>
            
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={colors.primary} 
            />
          </View>

          {/* Quick Preview - Always Visible */}
          {!isExpanded && (
            <View style={{ 
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border
            }}>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }} numberOfLines={2}>
                <Text style={{ fontWeight: "600" }}>Diagnosis: </Text>
                {item.diagnosis}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            {/* Record Number */}
            {item.recordNumber && (
              <View style={{ 
                backgroundColor: `${colors.primary}08`,
                padding: 10,
                borderRadius: 8,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>
                  Record Number
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                  {item.recordNumber}
                </Text>
              </View>
            )}

            {/* Diagnosis */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="medical" size={18} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                  Diagnosis
                </Text>
              </View>
              <Text style={{ 
                fontSize: 14, 
                color: colors.text,
                lineHeight: 20,
                backgroundColor: `${colors.primary}05`,
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary
              }}>
                {item.diagnosis || "No diagnosis recorded"}
              </Text>
            </View>

            {/* Vital Signs */}
            {item.vitalSigns && Object.keys(item.vitalSigns).length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="pulse" size={18} color="#EF4444" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                    Vital Signs
                  </Text>
                </View>
                <View style={{ 
                  backgroundColor: '#FEF2F2',
                  padding: 12,
                  borderRadius: 8,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  {item.vitalSigns.bloodPressure && (
                    <View style={{ minWidth: '45%' }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Blood Pressure</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {item.vitalSigns.bloodPressure.systolic}/{item.vitalSigns.bloodPressure.diastolic} mmHg
                      </Text>
                    </View>
                  )}
                  {item.vitalSigns.heartRate && (
                    <View style={{ minWidth: '45%' }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Heart Rate</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {item.vitalSigns.heartRate.value} bpm
                      </Text>
                    </View>
                  )}
                  {item.vitalSigns.temperature && (
                    <View style={{ minWidth: '45%' }}>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>Temperature</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {item.vitalSigns.temperature.value}°{item.vitalSigns.temperature.unit}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Prescriptions */}
            {item.prescriptions && item.prescriptions.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="medkit" size={18} color="#10B981" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                    Prescriptions
                  </Text>
                </View>
                <View style={{ 
                  backgroundColor: '#F0FDF4',
                  padding: 12,
                  borderRadius: 8
                }}>
                  {item.prescriptions.map((med, idx) => (
                    <View key={idx} style={{ marginBottom: idx < item.prescriptions.length - 1 ? 12 : 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {med.medicationName}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {med.dosage} - {med.frequency}
                      </Text>
                      {med.duration && (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                          Duration: {med.duration}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Lab Tests */}
            {item.labTests && item.labTests.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="flask" size={18} color="#8B5CF6" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                    Lab Tests
                  </Text>
                </View>
                <View style={{ 
                  backgroundColor: '#F5F3FF',
                  padding: 12,
                  borderRadius: 8
                }}>
                  {item.labTests.map((test, idx) => (
                    <View key={idx} style={{ 
                      marginBottom: idx < item.labTests.length - 1 ? 12 : 0,
                      flexDirection: 'row',
                      justifyContent: 'space-between'
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                          {test.testName}
                        </Text>
                        {test.status && (
                          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                            Status: {test.status}
                          </Text>
                        )}
                      </View>
                      {test.status === 'COMPLETED' && (
                        <View style={{
                          backgroundColor: '#22C55E',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8
                        }}>
                          <Text style={{ fontSize: 10, color: colors.white, fontWeight: "600" }}>
                            READY
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Clinical Notes */}
            {item.notes && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="document-text" size={18} color="#F59E0B" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                    Clinical Notes
                  </Text>
                </View>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text,
                  lineHeight: 20,
                  backgroundColor: '#FEF3C7',
                  padding: 12,
                  borderRadius: 8
                }}>
                  {item.notes}
                </Text>
              </View>
            )}

            {/* Doctor Info */}
            {item.doctor && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginTop: 8,
                padding: 12,
                backgroundColor: `${colors.primary}05`,
                borderRadius: 8
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
                  <Text style={{ color: colors.white, fontWeight: '600', fontSize: 16 }}>
                    {item.doctor.name?.charAt(0) || 'D'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                    Dr. {item.doctor.name}
                  </Text>
                  {item.doctor.specialization && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {item.doctor.specialization}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </PCard>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading medical records...</Text>
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
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>
          Medical Records
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
          {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
        </Text>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2
        }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Search by hospital, department, diagnosis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              padding: 12,
              color: colors.text,
              fontSize: 14
            }}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16, marginBottom: 8 }}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setActiveFilter(filter.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: activeFilter === filter.id ? colors.primary : colors.white,
              marginRight: 8,
              borderWidth: 1,
              borderColor: activeFilter === filter.id ? colors.primary : colors.border
            }}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={activeFilter === filter.id ? colors.white : colors.textMuted} 
            />
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: activeFilter === filter.id ? colors.white : colors.text,
              marginLeft: 6
            }}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={renderRecordItem}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecords(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: `${colors.primary}15`,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Ionicons name="document-text-outline" size={48} color={colors.primary} />
            </View>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: colors.text, 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {!user ? "Please Login" : "No Records Found"}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted, 
              textAlign: 'center',
              lineHeight: 20
            }}>
              {!user 
                ? "Please log in to view your medical records" 
                : searchQuery || activeFilter !== 'all' 
                  ? "Try adjusting your search or filter criteria"
                  : "Your medical records will appear here after your first visit"
              }
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Summary Footer */}
      {filteredRecords.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.white,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          justifyContent: 'space-around',
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
              {filteredRecords.length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Total Records
            </Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: colors.border }} />
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.success }}>
              {filteredRecords.filter(r => new Date(r.visitDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).length}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              This Year
            </Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: colors.border }} />
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.warning }}>
              {new Set(filteredRecords.map(r => r.hospital)).size}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Hospitals
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}