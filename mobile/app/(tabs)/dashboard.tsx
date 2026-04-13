import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

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
      setVitals(res.data.vitals);
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

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.greeting}>Hello, {patient.name.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>Estimated Due Date: {new Date(patient.edd).toLocaleDateString()}</Text>
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

      {/* Daily Medications */}
      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 }}>My Medications</Text>
        {prescriptions.length === 0 ? (
          <View style={{ backgroundColor: '#f9fafb', padding: 20, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' }}>
            <Text style={{ color: '#9ca3af', textAlign: 'center' }}>No active prescriptions</Text>
          </View>
        ) : (
          prescriptions.map((m, i) => {
            const takenToday = m.logs && m.logs.length > 0;
            return (
              <View key={i} style={{ backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: takenToday ? '#10b981' : '#db2777', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{m.medication}</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{m.dosage} • {m.frequency} • {m.duration}</Text>
                  </View>
                  <TouchableOpacity 
                    disabled={takenToday}
                    onPress={() => markMedTaken(m.id)}
                    style={{ backgroundColor: takenToday ? '#ecfdf5' : '#db2777', paddingHorizontal: 15, py: 8, borderRadius: 10 }}
                  >
                    <Text style={{ color: takenToday ? '#059669' : '#fff', fontWeight: 'bold', fontSize: 12 }}>
                      {takenToday ? 'Taken ✓' : 'Take Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Upcoming Visits */}
      {appointments.length > 0 && (
// ... existing Appointments ...
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 }}>Upcoming Visit</Text>
          <View style={{ backgroundColor: '#f0f9ff', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', borderColor: '#bae6fd', borderWidth: 1 }}>
            <Ionicons name="calendar-sharp" size={30} color="#0284c7" />
            <View style={{ marginLeft: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0369a1' }}>{new Date(appointments[0].date).toDateString()}</Text>
              <Text style={{ fontSize: 12, color: '#0ea5e9' }}>{appointments[0].purpose}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 }}>Emergency</Text>
        <View style={{ backgroundColor: '#fee2e2', padding: 20, borderRadius: 15, alignItems: 'center', borderColor: '#fca5a5', borderWidth: 2 }}>
          <Ionicons name="alert-circle" size={40} color="#b91c1c" />
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#b91c1c', marginTop: 10 }}>SOS ALARM</Text>
          <Text style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 5 }}>Tap the Emergency Tab Below to trigger instant hospital alert.</Text>
        </View>
      </View>

      <Text style={styles.historyTitle}>Clinical History</Text>
      
      {vitals.length === 0 ? (
        <Text style={styles.noData}>No visit data recorded yet.</Text>
      ) : (
        vitals.map((v, i) => (
          <View key={i} style={styles.historyCard}>
            <Text style={styles.historyDate}>{new Date(v.createdAt).toLocaleDateString()}</Text>
            <View style={styles.historyMetrics}>
              <View>
                <Text style={styles.metricLabel}>BP</Text>
                <Text style={styles.metricVal}>{v.bloodPressure}</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricVal}>{v.weight}kg</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>FHR</Text>
                <Text style={styles.metricVal}>{v.fetalHeartRate ? `${v.fetalHeartRate} bpm` : '-'}</Text>
              </View>
              {v.bloodSugar && (
                <View>
                  <Text style={styles.metricLabel}>Sugar</Text>
                  <Text style={styles.metricVal}>{v.bloodSugar}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardHeader: { backgroundColor: '#db2777', padding: 25, paddingBottom: 40 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#fbcfe8', marginTop: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -20, paddingHorizontal: 20 },
  infoBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, width: '45%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  infoVal: { fontSize: 24, fontWeight: '900', color: '#db2777' },
  infoLabel: { fontSize: 12, color: '#6b7280', fontWeight: 'bold', marginTop: 5, textTransform: 'uppercase' },
  historyTitle: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingTop: 30 },
  noData: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  historyCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#f3f4f6' },
  historyDate: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
  historyMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold' },
  metricVal: { fontSize: 16, fontWeight: '900', color: '#1f2937', marginTop: 5 }
});
