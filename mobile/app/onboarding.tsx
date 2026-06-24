import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import CustomDatePicker from '../components/custom-date-picker';
import { router } from 'expo-router';
import { api } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [inputType, setInputType] = useState<'lmp' | 'edd'>('lmp');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const payload = inputType === 'lmp' 
        ? { lmp: date.toISOString() } 
        : { edd: date.toISOString() };
      
      await api.post('/patient/onboarding', payload);
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Something went wrong saving your data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentChange = (type: 'lmp' | 'edd') => {
    setInputType(type);
    if (type === 'lmp') {
      // Set to today's date
      setDate(new Date());
    } else {
      // Set to 9 months in the future by default
      const future = new Date();
      future.setMonth(future.getMonth() + 9);
      setDate(future);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={60} color="#db2777" />
        </View>
        <Text style={styles.title}>Welcome to MammaCare</Text>
        
        {/* Input Toggle Segments */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentButton, inputType === 'lmp' && styles.segmentButtonActive]} 
            onPress={() => handleSegmentChange('lmp')}
          >
            <Text style={[styles.segmentText, inputType === 'lmp' && styles.segmentTextActive]}>LMP Date</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, inputType === 'edd' && styles.segmentButtonActive]} 
            onPress={() => handleSegmentChange('edd')}
          >
            <Text style={[styles.segmentText, inputType === 'edd' && styles.segmentTextActive]}>Due Date (EDD)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {inputType === 'lmp' 
            ? "To personalize your journey, please tell us when your last menstrual period (LMP) started."
            : "To personalize your journey, please tell us your Estimated Due Date (EDD)."}
        </Text>

        <CustomDatePicker
          value={date}
          onChange={(selectedDate) => setDate(selectedDate)}
          maximumDate={inputType === 'lmp' ? new Date() : new Date(Date.now() + 290 * 24 * 60 * 60 * 1000)}
          minimumDate={inputType === 'lmp' ? new Date(Date.now() - 290 * 24 * 60 * 60 * 1000) : new Date()}
        />

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
  iconContainer: { width: 120, height: 120, backgroundColor: '#fdf2f8', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 28, fontWeight: '900', color: '#db2777', textAlign: 'center', marginBottom: 25 },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  segmentTextActive: {
    color: '#db2777',
  },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 30, paddingHorizontal: 10 },
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
