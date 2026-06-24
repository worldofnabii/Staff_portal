import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function QRCodeScreen() {
  const [data, setData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const res = await api.get('/patient/me');
          setData(res.data);
        } catch (e) {
          console.log('Error fetching data', e);
        }
      };
      fetchData();
    }, [])
  );

  const calculateStats = () => {
    if (!data?.medicalHistory?.lmp && !data?.patient?.edd) return null;
    
    const lmpDate = data.medicalHistory?.lmp 
      ? new Date(data.medicalHistory.lmp) 
      : new Date(new Date(data.patient?.edd || "").getTime() - 1000 * 60 * 60 * 24 * 280);
    
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
  const patientId = data?.patient?.id || data?.patient?._id;
  const latestVisit = data?.vitals?.[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Digital Health Card</Text>
      <Text style={styles.subtitle}>Present this QR code to the doctor or nurse during your visit.</Text>
      
      <View style={styles.qrContainer}>
        {patientId ? (
          Platform.OS === 'web' ? (
            <Image
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${patientId}` }}
              style={{ width: 200, height: 200 }}
            />
          ) : (
            <QRCode
              value={patientId}
              size={200}
              color="#000"
              backgroundColor="#ffffff"
            />
          )
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

      {/* RECENT VITALS SUMMARY */}
      {latestVisit ? (
        <View style={styles.vitalsSummaryCard}>
          <View style={styles.vitalsSummaryHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pulse" size={18} color="#db2777" />
              <Text style={styles.vitalsSummaryTitle}>Latest Vitals Summary</Text>
            </View>
            <Text style={styles.vitalsSummaryDate}>
              {new Date(latestVisit.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.vitalsGrid}>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Blood Pressure</Text>
              <Text style={styles.vitalsValue}>{latestVisit.bloodPressure || 'N/A'}</Text>
            </View>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Weight</Text>
              <Text style={styles.vitalsValue}>{latestVisit.weight ? `${latestVisit.weight}kg` : 'N/A'}</Text>
            </View>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Fetal Heart Rate</Text>
              <Text style={styles.vitalsValue}>{latestVisit.fetalHeartRate ? `${latestVisit.fetalHeartRate} bpm` : 'N/A'}</Text>
            </View>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Blood Sugar</Text>
              <Text style={styles.vitalsValue}>{latestVisit.bloodSugar ? `${latestVisit.bloodSugar} mmol/L` : 'Normal'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyVitalsCard}>
          <Ionicons name="pulse-outline" size={24} color="#9ca3af" />
          <Text style={styles.emptyVitalsText}>No recent vitals recorded yet.</Text>
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
  disclaimerText: { flex: 1, fontSize: 11, color: '#9ca3af', marginLeft: 10 },
  vitalsSummaryCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, width: '100%', marginTop: 25, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
  vitalsSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12, marginBottom: 12 },
  vitalsSummaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  vitalsSummaryDate: { fontSize: 11, color: '#9ca3af' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  vitalsItem: { width: '48%', backgroundColor: '#fafafa', padding: 12, borderRadius: 12, marginBottom: 10 },
  vitalsLabel: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  vitalsValue: { fontSize: 15, fontWeight: 'bold', color: '#1f2937', marginTop: 2 },
  emptyVitalsCard: { width: '100%', marginTop: 25, padding: 20, backgroundColor: '#f9fafb', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  emptyVitalsText: { color: '#9ca3af', fontStyle: 'italic', fontSize: 13, marginTop: 8 }
});
