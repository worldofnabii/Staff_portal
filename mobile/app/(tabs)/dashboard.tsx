import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { scheduleLocalNotifications } from '../../utils/notifications';

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
      setVitals((res.data.vitals || []).slice(0, 8));
      setAppointments(res.data.appointments || []);
      setPrescriptions(res.data.prescriptions || []);
      
      // Schedule local notifications dynamically based on active prescriptions and future appointments
      scheduleLocalNotifications(res.data.prescriptions || [], res.data.appointments || []);
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

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [])
  );

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

  // Calculate medication and appointment alerts
  const pendingMeds = prescriptions.filter(m => {
    const takenToday = m.logs && m.logs.some((log: any) => {
      const logDate = new Date(log.takenAt);
      const today = new Date();
      return logDate.getDate() === today.getDate() &&
             logDate.getMonth() === today.getMonth() &&
             logDate.getFullYear() === today.getFullYear();
    });
    return !takenToday;
  });

  const upcomingAppt = appointments.find(appt => {
    const apptDate = new Date(appt.date);
    const now = new Date();
    const diffMs = apptDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  });

  const healthTips = [
    "💧 Stay hydrated! Drink at least 8-10 glasses of water daily to support your baby's development.",
    "🚶‍♀️ Remember your daily gentle stretches or short walks to improve circulation and reduce swelling.",
    "👶 Count your baby's kicks. You should feel about 10 movements within a 2-hour window.",
    "🥦 Eat a balanced diet rich in iron, calcium, and folic acid to support healthy fetal growth.",
    "😴 Get at least 8 hours of sleep. Try sleeping on your left side to boost blood flow to the placenta."
  ];
  const activeTip = healthTips[new Date().getDate() % healthTips.length];

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hello, {patient.name.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>Estimated Due Date: {patient.edd ? new Date(patient.edd).toLocaleDateString() : 'Not set'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationBell} 
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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

      {/* Reminders & Notifications Panel */}
      <View style={styles.notificationPanel}>
        <View style={styles.panelHeader}>
          <Ionicons name="notifications-outline" size={20} color="#db2777" />
          <Text style={styles.panelTitle}>Daily Reminders & Tips</Text>
        </View>

        {pendingMeds.length === 0 && !upcomingAppt ? (
          <View style={styles.successState}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.successText}>{"You're all caught up today! Doing great!"}</Text>
            </View>
          </View>
        ) : (
          <View>
            {pendingMeds.map((med, idx) => (
              <View key={idx} style={styles.alertCard}>
                <Ionicons name="alert-circle-outline" size={22} color="#b91c1c" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.alertTitle}>Medication Reminder</Text>
                  <Text style={styles.alertText}>Time to take your {med.medication} ({med.dosage}) today!</Text>
                </View>
                <TouchableOpacity 
                  style={styles.alertActionBtn}
                  onPress={() => markMedTaken(med.id)}
                >
                  <Text style={styles.alertActionText}>Log Taken</Text>
                </TouchableOpacity>
              </View>
            ))}

            {upcomingAppt && (
              <View style={[styles.alertCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Ionicons name="calendar-outline" size={22} color="#1d4ed8" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: '#1e40af' }]}>Upcoming Appointment</Text>
                  <Text style={[styles.alertText, { color: '#1e3a8a' }]}>
                    {upcomingAppt.purpose} checkup is coming up on {new Date(upcomingAppt.date).toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Health Tip of the Day</Text>
          <Text style={styles.tipText}>{activeTip}</Text>
        </View>
      </View>

      {/* Upcoming Visitation Reminder */}
      <View style={{ paddingHorizontal: 20, marginTop: 25 }}>
        {appointments.length > 0 ? (
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
        ) : (
          <View style={[styles.reminderCard, { borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 }]}>
            <View style={[styles.reminderIcon, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.reminderTitle, { color: '#9ca3af' }]}>Next Visitation Date</Text>
              <Text style={[styles.reminderDate, { fontSize: 16, color: '#4b5563', marginTop: 2 }]}>No Visit Scheduled</Text>
              <Text style={[styles.reminderPurpose, { fontSize: 12, color: '#9ca3af', marginTop: 2 }]}>
                Please schedule your next antenatal checkup with your clinic.
              </Text>
            </View>
          </View>
        )}
      </View>

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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notificationBell: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fbcfe8', marginTop: 5 },
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
  sosSubtitle: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  notificationPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fce7f3',
    shadowColor: '#db2777',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  successState: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  alertText: {
    fontSize: 12,
    color: '#7f1d1d',
    marginTop: 2,
    lineHeight: 16,
  },
  alertActionBtn: {
    backgroundColor: '#db2777',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  alertActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#faf5ff',
    padding: 12,
    borderRadius: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  tipText: {
    fontSize: 12,
    color: '#581c87',
    marginTop: 3,
    lineHeight: 16,
  }
});
