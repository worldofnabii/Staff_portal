import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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

  const { vitals, carePlan, preventativeCare, investigations } = data;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Care Plan</Text>
      {carePlan ? (
        <View style={styles.cardHighlight}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="medical-sharp" size={24} color="#db2777" />
            <Text style={[styles.bold, { marginLeft: 10, fontSize: 18 }]}>Maternity Plan</Text>
          </View>
          <Text style={styles.cardText}><Text style={styles.bold}>Delivery Plan:</Text> {carePlan.deliveryPlan || 'Not arranged yet'}</Text>
          <Text style={styles.cardText}><Text style={styles.bold}>Feeding Option:</Text> {carePlan.feedingOption || '-'}</Text>
          <Text style={styles.cardText}><Text style={styles.bold}>Maternity Home:</Text> {carePlan.maternityWaitingHome ? 'Booked' : 'Not Booked'}</Text>
        </View>
      ) : (
        <Text style={styles.empty}>No Care Plan arranged yet.</Text>
      )}

      <Text style={styles.title}>Test Results & Labs</Text>
      {investigations && investigations.length > 0 ? (
        investigations.map((inv: any) => (
          <View key={inv.id} style={styles.recordCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconBox}>
                <Ionicons name={inv.category === 'Imaging' ? 'scan-outline' : 'flask-outline'} size={24} color="#db2777" />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.recordType}>{inv.testType}</Text>
                <Text style={styles.recordResult}>{inv.result}</Text>
                <Text style={styles.dateTextSmall}>{new Date(inv.date).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDownload(inv)} style={styles.downloadBtn}>
                <Ionicons name="download-outline" size={20} color="#db2777" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No lab results recorded.</Text>
      )}
      
      <Text style={styles.title}>Preventative Care</Text>
      <View style={styles.horizScroll}>
        {preventativeCare && preventativeCare.length > 0 ? (
          preventativeCare.map((p: any) => (
            <View key={p.id} style={styles.smallCard}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text style={styles.smallCardText}>{p.supplementType}</Text>
              <Text style={styles.dateTextSmall}>{new Date(p.date).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No supplements given yet.</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 20, color: '#1f2937' },
  cardHighlight: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#fce7f3', shadowColor: '#db2777', shadowOpacity: 0.05, shadowRadius: 10 },
  recordCard: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  iconBox: { width: 45, height: 45, backgroundColor: '#fdf2f8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  recordType: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  recordResult: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  downloadBtn: { padding: 10, backgroundColor: '#fdf2f8', borderRadius: 10 },
  horizScroll: { flexDirection: 'row', flexWrap: 'wrap' },
  smallCard: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 15, marginRight: 10, marginBottom: 10, width: '47%', borderWidth: 1, borderColor: '#dcfce7' },
  smallCardText: { fontSize: 13, fontWeight: 'bold', color: '#064e3b', marginTop: 5 },
  cardText: { fontSize: 15, color: '#4b5563', marginBottom: 8 },
  bold: { fontWeight: 'bold', color: '#111827' },
  dateTextSmall: { fontSize: 11, color: '#9ca3af', marginTop: 5 },
  empty: { color: '#9ca3af', fontStyle: 'italic', marginBottom: 10 }
});
