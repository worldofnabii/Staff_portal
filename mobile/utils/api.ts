import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo development with an Android emulator, '10.0.2.2' maps to the host machine's localhost.
// If testing on a physical device, this must be the host's actual local Network IP (e.g. 192.168.1.x)
const HOST = '10.218.252.1'; 

export const api = axios.create({
  baseURL: `http://${HOST}:5000/api`,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('patientToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
