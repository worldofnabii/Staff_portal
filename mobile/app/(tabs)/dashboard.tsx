import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get('/patient/me');
      setPatient(res.data.patient);
      setVitals(res.data.vitals || []);
      setAppointments(res.data.appointments || []);
      setPrescriptions(res.data.prescriptions || []);
    } catch (e) {
      console.log('Error fetching details', e);
    }
  };

  const markMedTaken = async (id: string) => {
    try {
      await api.post('/patient/medication-log', { prescriptionId: id });
      await fetchDetails();
    } catch (e) {
      console.log('Error logging med', e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDetails();
    setRefreshing(false);
  };

  if (!patient) return <View style={styles.center}><Text>Loading...</Text></View>;

  // Prepare chart data from vitals
  const chartData = {
    labels: vitals.slice(0, 6).reverse().map(v => new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })),
    datasets: [
      {
        data: vitals.slice(0, 6).reverse().map(v => v.weight || 0),
        color: (opacity = 1) => `rgba(219, 39, 119, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.greeting}>Hello, {patient.name.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>Estimated Due Date: {patient.edd ? new Date(patient.edd).toLocaleDateString() : 'Not set'}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoVal}>{patient.bloodGroup || '-'}</Text>
          <Text style={styles.infoLabel}>Blood Grp</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoVal}>{vitals.length}</Text>
          <Text style={styles.infoLabel}>Visits</Text>
        </View>
      </View>

      {/* Upcoming Visitation Reminder */}
      {appointments.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 25 }}>
          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="calendar-outline" size={24} color="#db2777" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.reminderTitle}>Next Visitation Date</Text>
              <Text style={styles.reminderDate}>
                {new Date(appointments[0].date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.reminderPurpose}>{appointments[0].purpose}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Daily Medications */}
      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Medications</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/record')}>
             <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        {prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active prescriptions</Text>
          </View>
        ) : (
          prescriptions.slice(0, 3).map((m, i) => {
            const takenToday = m.logs && m.logs.length > 0;
            return (
              <View key={i} style={[styles.medCard, { borderLeftColor: takenToday ? '#10b981' : '#db2777' }]}>
                <View style={styles.medContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{m.medication}</Text>
                    <Text style={styles.medDetails}>{m.dosage} • {m.frequency}</Text>
                  </View>
                  <TouchableOpacity 
                    disabled={takenToday}
                    onPress={() => markMedTaken(m.id)}
                    style={[styles.takeBtn, { backgroundColor: takenToday ? '#ecfdf5' : '#db2777' }]}
                  >
                    <Text style={[styles.takeBtnText, { color: takenToday ? '#059669' : '#fff' }]}>
                      {takenToday ? 'Taken' : 'Take'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Clinical History Graph */}
      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weight Trend (kg)</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/record')}>
             <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        {vitals.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>More visits needed for chart</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={200}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(219, 39, 119, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#db2777" }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        )}
      </View>

      {/* Emergency Section */}
      <View style={{ paddingHorizontal: 20, marginTop: 30, marginBottom: 40 }}>
        <Text style={styles.sectionTitle}>Emergency</Text>
        <TouchableOpacity 
          style={styles.sosBanner}
          onPress={() => router.push('/(tabs)/sos')}
        >
          <Ionicons name="alert-circle" size={40} color="#b91c1c" />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.sosTitle}>SOS ALARM</Text>
            <Text style={styles.sosSubtitle}>Tap to trigger instant hospital alert.</Text>
          </View>
           <Ionicons name="chevron-forward" size={24} color="#fca5a5" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardHeader: { backgroundColor: '#db2777', padding: 25, paddingBottom: 50 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#fbcfe8', marginTop: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -25, paddingHorizontal: 20 },
  infoBox: { backgroundColor: '#fff', padding: 20, borderRadius: 20, width: '45%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  infoVal: { fontSize: 24, fontWeight: '900', color: '#db2777' },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  viewAll: { fontSize: 14, fontWeight: 'bold', color: '#db2777' },
  emptyContainer: { backgroundColor: '#f9fafb', padding: 30, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontWeight: 'bold' },
  medCard: { backgroundColor: '#fff', padding: 15, borderRadius: 18, marginBottom: 12, borderLeftWidth: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  medContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  medDetails: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  takeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  takeBtnText: { fontWeight: 'bold', fontSize: 12 },
  chartContainer: { backgroundColor: '#fff', padding: 10, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, alignItems: 'center' },
  reminderCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#fce7f3', shadowColor: '#db2777', shadowOpacity: 0.08, shadowRadius: 15, elevation: 3 },
  reminderIcon: { width: 45, height: 45, backgroundColor: '#fdf2f8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reminderTitle: { fontSize: 13, color: '#f472b6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  reminderDate: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  reminderPurpose: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  sosBanner: { backgroundColor: '#fee2e2', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderColor: '#fca5a5', borderWidth: 1 },
  sosTitle: { fontSize: 20, fontWeight: '900', color: '#b91c1c' },
  sosSubtitle: { fontSize: 12, color: '#ef4444', marginTop: 2 }
});
