import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function EducationTab() {
  const tips = [
    { week: 'Week 12', title: 'Managing Morning Sickness', desc: 'Eat small, frequent meals and stay hydrated.' },
    { week: 'Week 20', title: 'The Anatomy Scan', desc: 'Your baby is now the size of a banana! Time for the mid-pregnancy ultrasound.' },
    { week: 'Week 28', title: 'Third Trimester Begins', desc: 'Monitor fetal kicks. You should feel at least 10 movements in 2 hours.' },
    { week: 'Week 36', title: 'Pack Your Hospital Bag', desc: 'Prepare documents, clothes for baby, and supplies for yourself.' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Educational Hub 📚</Text>
        <Text style={styles.subtitle}>Curated tips for a healthy pregnancy</Text>
      </View>

      <View style={styles.content}>
        {tips.map((tip, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.badge}><Text style={styles.badgeText}>{tip.week}</Text></View>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.desc}>{tip.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf2f8' },
  header: { padding: 30, paddingTop: 50, backgroundColor: '#fce7f3' },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#be185d' },
  subtitle: { fontSize: 16, color: '#db2777', marginTop: 5 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  badge: { backgroundColor: '#fbcfe8', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  badgeText: { color: '#be185d', fontWeight: 'bold', fontSize: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 5 },
  desc: { fontSize: 14, color: '#4b5563', lineHeight: 20 }
});
