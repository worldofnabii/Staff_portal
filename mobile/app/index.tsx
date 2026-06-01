import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { api } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      const res = await api.post('/auth/login/patient', { email, password });
      await AsyncStorage.setItem('patientToken', res.data.token);
      
      const hasLMP = res.data.user.medicalHistory?.lmp;
      const hasEDD = res.data.user.edd;
      
      if (!hasLMP && !hasEDD) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (e: any) {
      Alert.alert("Login Failed", e.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoIcon}>💓</Text>
        </View>
        <Text style={styles.title}>MammaCare</Text>
        <Text style={styles.subtitle}>Digital Maternity Card</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
        </TouchableOpacity>
        <Text style={styles.hint}>Testing Account: sarah@example.com / password123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoPlaceholder: {
    width: 80, height: 80, backgroundColor: '#fdf2f8', 
    borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  logoIcon: { fontSize: 40 },
  title: { fontSize: 36, fontWeight: '900', color: '#db2777' },
  subtitle: { fontSize: 16, color: '#f472b6', fontWeight: 'bold' },
  formContainer: { paddingHorizontal: 30 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6',
    borderRadius: 15, padding: 18, fontSize: 16, marginBottom: 20
  },
  loginBtn: {
    backgroundColor: '#db2777', padding: 18, borderRadius: 15,
    alignItems: 'center', marginTop: 10, shadowColor: '#db2777', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  hint: { textAlign: 'center', color: '#9ca3af', marginTop: 20, fontSize: 12 }
});
