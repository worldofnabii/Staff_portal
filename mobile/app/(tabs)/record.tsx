import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-chart-kit';

export default function RecordTab() {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get('/patient/me');
      setData(res.data);
    } catch (e) {
      console.log('Error fetching details', e);
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

  const handleDownload = async (record: any) => {
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1 style="color: #db2777; text-align: center;">MammaCare Medical Record</h1>
          <div style="border: 2px solid #fdf2f8; padding: 20px; border-radius: 10px;">
            <p><strong>Record Type:</strong> ${record.testType || record.supplementType || 'Medical Record'}</p>
            <p><strong>Category:</strong> ${record.category || 'N/A'}</p>
            <p><strong>Result / Detail:</strong> ${record.result || 'Provided'}</p>
            <p><strong>Date:</strong> ${new Date(record.date || record.createdAt).toLocaleDateString()}</p>
          </div>
          <br/>
          <p style="font-size: 10px; color: gray; text-align: center;">This is a digitally generated report from the MammaCare Mobile Platform.</p>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Error", "Could not generate download file.");
    }
  };

  if (!data) return <View style={styles.center}><Text>Loading Record...</Text></View>;

  const { patient, vitals, carePlan, preventativeCare, investigations, prescriptions } = data;

  // Process data for charts
  const sortedVitals = [...vitals].reverse();
  const chartLabels = sortedVitals.map(v => new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }));
  
  const weightData = sortedVitals.map(v => v.weight || 0);
  
  const bpSystolic = sortedVitals.map(v => parseInt(v.bloodPressure?.split('/')[0] || '0'));
  const bpDiastolic = sortedVitals.map(v => parseInt(v.bloodPressure?.split('/')[1] || '0'));

  const urineMap = (val: string) => {
    if (!val || val === 'Nil') return 0;
    if (val === 'Trace') return 0.5;
    if (val === '1+') return 1;
    if (val === '2+') return 2;
    if (val === '3+') return 3;
    return 0;
  };
  const urineProteinData = sortedVitals.map(v => urineMap(v.urineProtein));
  const urineSugarData = sortedVitals.map(v => urineMap(v.urineSugar));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* SECTION 1: VISITATION HISTORY */}
      <Text style={styles.title}>Visitation History</Text>
      {vitals && vitals.length > 0 ? (
        <View style={styles.historyList}>
          {vitals.map((v: any, idx: number) => (
            <View key={idx} style={styles.historyItem}>
              <View style={styles.historyBullet} />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.historyDate}>{new Date(v.createdAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.historyGA}>Gestational Age: {v.gestationalAge || 'Not recorded'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}><Text style={styles.empty}>No visitation records yet.</Text></View>
      )}

      {/* SECTION 2: HEALTH TRENDS (VITALS) */}
      <Text style={styles.title}>Medical Vitals (Trends)</Text>

      {/* Weight Trend */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Weight Progress (kg)</Text>
        <LineChart
          data={{ labels: chartLabels, datasets: [{ data: weightData }] }}
          width={Dimensions.get("window").width - 40}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* BP Trend */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Blood Pressure (mmHg)</Text>
        <LineChart
          data={{ 
            labels: chartLabels, 
            datasets: [
              { data: bpSystolic, color: (opacity = 1) => `rgba(219, 39, 119, ${opacity})` }, // Systolic
              { data: bpDiastolic, color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` } // Diastolic
            ],
            legend: ["Systolic", "Diastolic"]
          }}
          width={Dimensions.get("window").width - 40}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Urine Analysis Trend */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Urine Analysis (Level)</Text>
        <LineChart
          data={{ 
            labels: chartLabels, 
            datasets: [
              { data: urineProteinData, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }, // Protein
              { data: urineSugarData, color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})` }   // Sugar
            ],
            legend: ["Protein", "Sugar"]
          }}
          width={Dimensions.get("window").width - 40}
          height={180}
          chartConfig={{
            ...chartConfig,
            decimalPlaces: 1,
          }}
          style={styles.chart}
        />
        <Text style={styles.chartHint}>0=Nil, 0.5=Trace, 1=1+, 2=2+, 3=3+</Text>
      </View>

      {/* SECTION 3: OTHER RECORDS */}
      <Text style={styles.title}>Maternity Care Plan</Text>
      {carePlan ? (
        <View style={styles.cardHighlight}>
          <View style={styles.planInfo}>
             <Ionicons name="location-outline" size={18} color="#6b7280" />
             <Text style={styles.cardText}><Text style={styles.bold}>Delivery Site:</Text> {carePlan.deliveryPlan || 'Not arranged'}</Text>
          </View>
          <View style={styles.planInfo}>
             <Ionicons name="restaurant-outline" size={18} color="#6b7280" />
             <Text style={styles.cardText}><Text style={styles.bold}>Feeding Option:</Text> {carePlan.feedingOption || '-'}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}><Text style={styles.empty}>No Care Plan recorded.</Text></View>
      )}

      <Text style={styles.title}>Medication History</Text>
      {prescriptions && prescriptions.length > 0 ? (
        prescriptions.map((m: any, idx: number) => (
          <View key={idx} style={styles.medCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.medName}>{m.medication}</Text>
              <View style={[styles.statusTag, { backgroundColor: m.isActive ? '#ecfdf5' : '#f3f4f6' }]}>
                <Text style={[styles.statusText, { color: m.isActive ? '#059669' : '#6b7280' }]}>{m.isActive ? 'Active' : 'Completed'}</Text>
              </View>
            </View>
            <Text style={styles.medDose}>{m.dosage} • {m.frequency}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}><Text style={styles.empty}>No medication history.</Text></View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(219, 39, 119, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#db2777" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 15, color: '#1f2937' },
  historyList: { backgroundColor: '#fff', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  historyBullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#db2777' },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  historyGA: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  chartSection: { backgroundColor: '#fff', padding: 15, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  chartTitle: { fontSize: 14, color: '#6b7280', fontWeight: 'bold', marginBottom: 10 },
  chartHint: { fontSize: 10, color: '#9ca3af', marginTop: 5 },
  chart: { marginVertical: 8, borderRadius: 16 },
  cardHighlight: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#fce7f3' },
  planInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  medCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#db2777' },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  medDose: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardText: { fontSize: 15, color: '#4b5563', marginLeft: 10 },
  bold: { fontWeight: 'bold', color: '#111827' },
  emptyCard: { padding: 20, backgroundColor: '#f9fafb', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' },
  empty: { color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' }
});
