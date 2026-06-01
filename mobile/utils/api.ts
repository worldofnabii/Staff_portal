import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In Expo development with an Android emulator, '10.0.2.2' maps to the host machine's localhost.
// If testing on a physical device, this must be the host's actual local Network IP (e.g. 192.168.1.x)
// For web browser testing, we use localhost directly.
const HOST = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://172.20.94.1:5000'; 

export const api = axios.create({
  baseURL: `${HOST}/api`,
});

console.log('API baseURL initialized:', api.defaults.baseURL);

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('patientToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
