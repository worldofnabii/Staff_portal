import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { api } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.post('/patient/onboarding', { lmp: date.toISOString() });
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Something went wrong saving your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={60} color="#db2777" />
        </View>
        <Text style={styles.title}>Welcome to MammaCare</Text>
        <Text style={styles.subtitle}>To personalize your journey, please tell us when your last menstrual period (LMP) started.</Text>

        <TouchableOpacity style={styles.dateSelector} onPress={() => setShow(true)}>
          <Ionicons name="time-outline" size={24} color="#db2777" />
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>

        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChange}
            maximumDate={new Date()}
          />
        )}

        <TouchableOpacity 
          style={[styles.button, loading && { opacity: 0.7 }]} 
          onPress={handleComplete} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Start My Journey'}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  content: { alignItems: 'center' },
  iconContainer: { width: 120, height: 120, backgroundColor: '#fdf2f8', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#db2777', textAlign: 'center', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  dateSelector: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', 
    borderRadius: 15, padding: 20, width: '100%', marginBottom: 40 
  },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginLeft: 15 },
  button: { 
    backgroundColor: '#db2777', padding: 20, borderRadius: 15, width: '100%', 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center' 
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});
