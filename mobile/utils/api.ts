import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo development with an Android emulator, '10.0.2.2' maps to the host machine's localhost.
// If testing on a physical device, this must be the host's actual local Network IP (e.g. 192.168.1.x)
// PUBLIC TUNNEL URL (Enables 4G/LTE connectivity for real devices)
const HOST = 'http://172.20.94.1:5000'; 

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
