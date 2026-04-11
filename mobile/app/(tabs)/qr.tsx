import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function QRCodeScreen() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/patient/me');
        setData(res.data);
      } catch (e) {
        console.log('Error fetching data', e);
      }
    };
    fetchData();
  }, []);

  const calculateStats = () => {
    if (!data?.medicalHistory?.lmp && !data?.patient?.edd) return null;
    
    const lmpDate = data.medicalHistory?.lmp 
      ? new Date(data.medicalHistory.lmp) 
      : new Date(new Date(data.patient.edd).getTime() - 1000 * 60 * 60 * 24 * 280);
    
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(0, Math.floor(diffDays / 7));

    let trimester = "1st Trimester";
    let trimesterColor = "#3b82f6";
    if (weeks >= 14 && weeks <= 26) {
      trimester = "2nd Trimester";
      trimesterColor = "#f59e0b";
    } else if (weeks >= 27) {
      trimester = "3rd Trimester";
      trimesterColor = "#059669";
    }

    return { weeks, trimester, color: trimesterColor };
  };

  const stats = calculateStats();
  const patientId = data?.patient?._id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Digital Health Card</Text>
      <Text style={styles.subtitle}>Present this QR code to the doctor or nurse during your visit.</Text>
      
      <View style={styles.qrContainer}>
        {patientId ? (
          <QRCode
            value={patientId}
            size={200}
            color="#000"
            backgroundColor="#ffffff"
          />
        ) : (
          <Text>Loading QR Code...</Text>
        )}
      </View>
      <Text style={styles.patientId}>#{patientId || '......'}</Text>

      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: stats.color, borderLeftWidth: 5 }]}>
            <Ionicons name="calendar-outline" size={24} color={stats.color} />
            <Text style={styles.statVal}>{stats.weeks} Weeks</Text>
            <Text style={styles.statLabel}>Gestational Age</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: stats.color, borderLeftWidth: 5 }]}>
            <Ionicons name="sparkles" size={24} color={stats.color} />
            <Text style={styles.statVal}>{stats.trimester}</Text>
            <Text style={styles.statLabel}>Current Status</Text>
          </View>
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={20} color="#9ca3af" />
        <Text style={styles.disclaimerText}>
          Your medical records are encrypted and only accessible by authorized medical staff.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', padding: 25, backgroundColor: '#fafafa' },
  title: { fontSize: 24, fontWeight: '900', color: '#1f2937', marginBottom: 10, marginTop: 20 },
  subtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20, marginBottom: 30, lineHeight: 20 },
  qrContainer: { padding: 25, backgroundColor: '#fff', borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  patientId: { marginTop: 15, fontSize: 14, fontWeight: 'bold', color: '#db2777', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 40 },
  statBox: { backgroundColor: '#fff', padding: 15, borderRadius: 15, width: '48%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  statVal: { fontSize: 18, fontWeight: '900', color: '#111827', marginTop: 10 },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  disclaimerBox: { flexDirection: 'row', marginTop: 40, backgroundColor: '#f3f4f6', padding: 15, borderRadius: 15, alignItems: 'center' },
  disclaimerText: { flex: 1, fontSize: 11, color: '#9ca3af', marginLeft: 10 }
});
