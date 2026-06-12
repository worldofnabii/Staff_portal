import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Dimensions, Image } from 'react-native';
import { api } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LineChart } from 'react-native-chart-kit';

export default function RecordTab() {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [expandedMedIndex, setExpandedMedIndex] = useState<number | null>(null);

  const fetchDetails = async () => {
    try {
      const res = await api.get('/patient/me');
      if (res.data && res.data.vitals) {
        res.data.vitals = res.data.vitals.slice(0, 8);
      }
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
    let imageHtml = "";
    if (record.attachmentUrl) {
      imageHtml = `
        <div style="text-align: center; margin-top: 30px;">
          <h3 style="color: #4b5563;">Scan Attachment:</h3>
          <img src="${record.attachmentUrl}" style="max-width: 100%; max-height: 400px; border: 2px solid #f3f4f6; border-radius: 12px; padding: 5px; background: white;" />
        </div>
      `;
    }
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 40px; color: #1f2937;">
          <h1 style="color: #db2777; text-align: center; margin-bottom: 30px;">MammaCare Clinical Scan Report</h1>
          <div style="border: 2px solid #fce7f3; padding: 25px; border-radius: 16px; background-color: #fffdfd;">
            <p style="font-size: 16px;"><strong>Record Type:</strong> ${record.testType || record.supplementType || 'Medical Record'}</p>
            <p style="font-size: 16px;"><strong>Result / Detail:</strong> ${record.result || 'Provided'}</p>
            <p style="font-size: 16px;"><strong>Date:</strong> ${new Date(record.date || record.createdAt).toLocaleDateString()}</p>
          </div>
          ${imageHtml}
          <br/>
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 50px;">This is a digitally generated report from the MammaCare Mobile Platform.</p>
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
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>BP</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Weight</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>GA</Text>
            <View style={{ width: 20 }} />
          </View>

          {/* Table Rows (Limited to 8 most recent visits) */}
          {vitals.slice(0, 8).map((v: any, idx: number) => {
            const isExpanded = expandedIndex === idx;
            const dateStr = new Date(v.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
            return (
              <View key={idx} style={[styles.tableRowContainer, isExpanded && styles.activeRow]}>
                <TouchableOpacity 
                  style={styles.tableRow} 
                  activeOpacity={0.7}
                  onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <Text style={[styles.rowCell, styles.boldText, { flex: 1.5 }]}>{dateStr}</Text>
                  <Text style={[styles.rowCell, { flex: 1 }]}>{v.bloodPressure || 'N/A'}</Text>
                  <Text style={[styles.rowCell, { flex: 1 }]}>{v.weight ? `${v.weight}kg` : 'N/A'}</Text>
                  <Text style={[styles.rowCell, { flex: 1 }]}>{v.gestationalAge || 'N/A'}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={isExpanded ? "#db2777" : "#9ca3af"} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Fetal Heart Rate</Text>
                        <Text style={styles.detailValue}>
                          <Ionicons name="heart" size={12} color="#ef4444" /> {v.fetalHeartRate ? `${v.fetalHeartRate} bpm` : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Blood Sugar</Text>
                        <Text style={styles.detailValue}>{v.bloodSugar ? `${v.bloodSugar} mmol/L` : 'N/A'}</Text>
                      </View>
                    </View>

                    <View style={[styles.detailsGrid, { marginTop: 12 }]}>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Urine Protein</Text>
                        <Text style={styles.detailValue}>{v.urineProtein || 'Nil'}</Text>
                      </View>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Urine Sugar</Text>
                        <Text style={styles.detailValue}>{v.urineSugar || 'Nil'}</Text>
                      </View>
                    </View>

                    {v.doctorNotes && (
                      <View style={styles.notesSection}>
                        <Text style={styles.detailLabel}>Clinical Notes</Text>
                        <Text style={styles.notesText}>"{v.doctorNotes}"</Text>
                      </View>
                    )}

                    {v.recordedBy && (
                      <View style={styles.recordedBySection}>
                        <Text style={styles.recordedByText}>
                          Recorded by: <Text style={styles.boldText}>{v.recordedBy.name}</Text> ({v.recordedBy.role})
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
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
      <Text style={styles.title}>Labs & Scans</Text>
      {investigations && investigations.length > 0 ? (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Test/Scan</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Result</Text>
          </View>
          
          {/* Table Rows */}
          {investigations.map((l: any, idx: number) => {
            const dateStr = new Date(l.date || l.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
            return (
              <View key={idx} style={styles.tableRowContainer}>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.rowCell, styles.boldText, { flex: 2 }]}>{l.testType}</Text>
                    <Text style={[styles.rowCell, { flex: 1.5 }]}>{dateStr}</Text>
                    <Text style={[styles.rowCell, { flex: 1.5, fontWeight: '900', color: '#db2777', textAlign: 'right' }]}>{l.result}</Text>
                  </View>
                  
                  {l.attachmentUrl && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 16, borderHeight: 1, borderColor: '#f3f4f6' }}>
                      <Image 
                        source={{ uri: l.attachmentUrl }} 
                        style={{ width: '100%', height: 180, borderRadius: 12, resizeMode: 'contain', backgroundColor: '#fff' }} 
                      />
                      <TouchableOpacity 
                        style={{ 
                          marginTop: 12, 
                          backgroundColor: '#db2777', 
                          padding: 12, 
                          borderRadius: 12, 
                          alignItems: 'center', 
                          flexDirection: 'row', 
                          justifyContent: 'center', 
                          gap: 6
                        }}
                        onPress={() => handleDownload(l)}
                      >
                        <Ionicons name="download-outline" size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Download Scan (PDF)</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}><Text style={styles.empty}>No labs or scans recorded.</Text></View>
      )}

      <Text style={styles.title}>Medication History</Text>
      {prescriptions && prescriptions.length > 0 ? (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2.2 }]}>Medication</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Dose</Text>
            <Text style={[styles.headerCell, { flex: 1.2 }]}>Freq</Text>
            <Text style={[styles.headerCell, { flex: 1.1 }]}>Status</Text>
            <View style={{ width: 20 }} />
          </View>

          {/* Table Rows */}
          {prescriptions.map((m: any, idx: number) => {
            const isExpanded = expandedMedIndex === idx;
            const dateStr = new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
            return (
              <View key={idx} style={[styles.tableRowContainer, isExpanded && styles.activeRow]}>
                <TouchableOpacity 
                  style={styles.tableRow} 
                  activeOpacity={0.7}
                  onPress={() => setExpandedMedIndex(isExpanded ? null : idx)}
                >
                  <Text style={[styles.rowCell, styles.boldText, { flex: 2.2 }]} numberOfLines={1}>{m.medication}</Text>
                  <Text style={[styles.rowCell, { flex: 1 }]}>{m.dosage || 'N/A'}</Text>
                  <Text style={[styles.rowCell, { flex: 1.2 }]} numberOfLines={1}>{m.frequency || 'N/A'}</Text>
                  <View style={{ flex: 1.1 }}>
                    <View style={[styles.statusTag, { backgroundColor: m.isActive ? '#ecfdf5' : '#f3f4f6', alignSelf: 'flex-start' }]}>
                      <Text style={[styles.statusText, { color: m.isActive ? '#059669' : '#6b7280' }]}>{m.isActive ? 'Active' : 'Ended'}</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={isExpanded ? "#db2777" : "#9ca3af"} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>
                          <Ionicons name="time-outline" size={12} color="#6b7280" /> {m.duration || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.detailsCol}>
                        <Text style={styles.detailLabel}>Prescribed On</Text>
                        <Text style={styles.detailValue}>{dateStr}</Text>
                      </View>
                    </View>

                    {m.notes && (
                      <View style={styles.notesSection}>
                        <Text style={styles.detailLabel}>Instructions / Notes</Text>
                        <Text style={styles.notesText}>"{m.notes}"</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
  tableContainer: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.01, shadowRadius: 10, elevation: 1 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerCell: { fontSize: 13, fontWeight: 'bold', color: '#4b5563' },
  tableRowContainer: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  activeRow: { backgroundColor: '#fffbfd' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  rowCell: { fontSize: 14, color: '#1f2937' },
  boldText: { fontWeight: 'bold', color: '#111827' },
  expandedDetails: { padding: 16, backgroundColor: '#fafafa', borderTopWidth: 1, borderTopColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsCol: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 2 },
  notesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  notesText: { fontSize: 13, color: '#4b5563', fontStyle: 'italic', marginTop: 2, lineHeight: 18 },
  recordedBySection: { marginTop: 10, alignItems: 'flex-end' },
  recordedByText: { fontSize: 11, color: '#6b7280' },
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
