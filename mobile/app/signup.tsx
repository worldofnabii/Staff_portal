import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Modal, 
  FlatList, 
  SafeAreaView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import CustomDatePicker from '../components/custom-date-picker';
import { api } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Hospital {
  id: string;
  name: string;
  address: string;
  licenseNumber?: string;
}

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [inputType, setInputType] = useState<'lmp' | 'edd'>('lmp');
  const [date, setDate] = useState(new Date());

  const handleSegmentChange = (type: 'lmp' | 'edd') => {
    setInputType(type);
    if (type === 'lmp') {
      setDate(new Date());
    } else {
      const future = new Date();
      future.setMonth(future.getMonth() + 9);
      setDate(future);
    }
  };

  useEffect(() => {
    const loadHospitals = async () => {
      setFetchingHospitals(true);
      try {
        const res = await api.get('/hospitals');
        if (res.data && res.data.hospitals) {
          setHospitals(res.data.hospitals);
          // Auto-select the first one by default if available
          if (res.data.hospitals.length > 0) {
            setSelectedHospital(res.data.hospitals[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load hospitals", err);
      } finally {
        setFetchingHospitals(false);
      }
    };
    loadHospitals();
  }, []);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !selectedHospital) {
      return showAlert("Required Fields", "Please enter your name, email, password, and select a hospital.");
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup/patient', {
        name,
        email,
        password,
        hospitalId: selectedHospital.id,
        emergencyContact: emergencyContact || undefined,
        lmp: inputType === 'lmp' ? date.toISOString() : undefined,
        edd: inputType === 'edd' ? date.toISOString() : undefined,
      });

      await AsyncStorage.setItem('patientToken', res.data.token);
      
      // Since they have entered LMP/EDD during signup, we can redirect directly to the dashboard
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      showAlert("Sign Up Failed", e.response?.data?.message || "Something went wrong during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#db2777" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={{ width: 24 }} /> {/* Balance back button */}
        </View>

        {/* Brand/Subtitle */}
        <View style={styles.brandContainer}>
          <Text style={styles.title}>MammaCare</Text>
          <Text style={styles.subtitle}>Register as a Patient</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Connor"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. sarah@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>Primary Hospital / Clinic *</Text>
          <TouchableOpacity 
            style={styles.pickerTrigger} 
            onPress={() => setModalVisible(true)}
            disabled={fetchingHospitals}
          >
            <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <View style={styles.pickerTextContainer}>
              {fetchingHospitals ? (
                <ActivityIndicator size="small" color="#db2777" />
              ) : (
                <Text style={selectedHospital ? styles.selectedText : styles.placeholderText}>
                  {selectedHospital ? selectedHospital.name : 'Select Your Care Facility'}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#db2777" />
          </TouchableOpacity>

          <Text style={styles.label}>Emergency Phone / Next of Kin Contact</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. +256-772-440-222"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Pregnancy Timeline *</Text>
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

          <Text style={styles.helperText}>
            {inputType === 'lmp' 
              ? "Select the first day of your Last Menstrual Period."
              : "Select your Estimated Due Date."}
          </Text>

          <CustomDatePicker
            value={date}
            onChange={(selectedDate) => setDate(selectedDate)}
            maximumDate={inputType === 'lmp' ? new Date() : new Date(Date.now() + 290 * 24 * 60 * 60 * 1000)}
            minimumDate={inputType === 'lmp' ? new Date(Date.now() - 290 * 24 * 60 * 60 * 1000) : new Date()}
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.signupBtn} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupBtnText}>Sign Up & Get Started</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/')}>
            <Text style={styles.loginLinkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Hospital Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Hospital</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {hospitals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hospitals available</Text>
              </View>
            ) : (
              <FlatList
                data={hospitals}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.hospitalItem,
                      selectedHospital?.id === item.id && styles.selectedHospitalItem
                    ]}
                    onPress={() => {
                      setSelectedHospital(item);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.hospitalInfo}>
                      <Text style={[
                        styles.hospitalName,
                        selectedHospital?.id === item.id && styles.selectedHospitalText
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.hospitalAddress}>{item.address}</Text>
                    </View>
                    {selectedHospital?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#db2777" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fdf2f8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#db2777',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  pickerTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    padding: 4,
    marginBottom: 10,
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
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 15,
    marginLeft: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 4,
  },
  signupBtn: {
    backgroundColor: '#db2777',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#db2777',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  loginLinkText: {
    color: '#db2777',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 25,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  selectedHospitalItem: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedHospitalText: {
    color: '#db2777',
    fontWeight: 'bold',
  },
  hospitalAddress: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 15,
  },
});
