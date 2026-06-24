import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

const HOST = Platform.OS === 'web' 
  ? 'http://localhost:5000' 
  : 'https://0819cbdf632f4420-102-89-84-48.serveousercontent.com'; 

export const api = axios.create({
  baseURL: `${HOST}/api`,
});

const networkClient = axios.create({
  baseURL: api.defaults.baseURL,
});

networkClient.interceptors.request.use(async (config) => {
  config.baseURL = api.defaults.baseURL;
  try {
    const token = await AsyncStorage.getItem("patientToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Failed to load token for network request", err);
  }
  return config;
});

networkClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
    const isPatientMe = error.config?.url?.includes('/patient/me');
    
    if (
      error.response && 
      (
        (((error.response.status === 400 && error.response.data?.message?.toLowerCase().includes("token")) ||
          error.response.status === 401 || 
          error.response.status === 403) && !isAuthRoute) ||
        (error.response.status === 404 && isPatientMe)
      )
    ) {
      console.log("Session invalid or patient not found on server. Clearing token and redirecting to Login...");
      try {
        await AsyncStorage.removeItem("patientToken");
      } catch (err) {
        console.error("Failed to remove token", err);
      }
      try {
        router.replace('/');
      } catch (err) {
        console.error("Failed to redirect to login screen", err);
      }
    }
    return Promise.reject(error);
  }
);

// Helper for Mock DB on Mobile
const getMockDb = async () => {
  let dbStr = await AsyncStorage.getItem("MAMMA_CARE_MOBILE_MOCK_DB");
  if (!dbStr) {
    const defaultDb = {
      patient: {
        id: "PATIENT-002",
        name: "Amara Adebayo",
        email: "amara@example.com",
        bloodGroup: "O+",
        edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
        medicalHistory: {
          lmp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
        }
      },
      vitals: [
        {
          id: "v-3",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          bloodPressure: "120/80",
          weight: 69.1,
          pulse: 78,
          gestationalAge: "23 weeks",
          doctorNotes: "All progressing well."
        }
      ],
      appointments: [
        {
          id: "appt-2",
          date: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
          purpose: "Regular Antenatal Checkup"
        }
      ],
      prescriptions: [
        {
          id: "p-1",
          medication: "Folic Acid",
          dosage: "5mg",
          frequency: "Once Daily",
          logs: []
        },
        {
          id: "p-2",
          medication: "Ferrous Sulfate",
          dosage: "200mg",
          frequency: "Once Daily",
          logs: []
        }
      ],
      investigations: [
        {
          id: "lab-1",
          testType: "Ultrasound Scan",
          result: "Normal, 24 weeks gestation",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          attachmentUrl: "https://images.unsplash.com/photo-1579684389782-64d84b5e901f?q=80&w=300"
        }
      ],
      notifications: [
        {
          id: "notif-1",
          title: "Welcome to MammaCare!",
          message: "Thank you for registering. We are here to support you throughout your pregnancy journey.",
          sentBy: "Nurse Joy (Nurse)",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        }
      ]
    };
    await AsyncStorage.setItem("MAMMA_CARE_MOBILE_MOCK_DB", JSON.stringify(defaultDb));
    return defaultDb;
  }
  return JSON.parse(dbStr);
};

const saveMockDb = async (db: any) => {
  await AsyncStorage.setItem("MAMMA_CARE_MOBILE_MOCK_DB", JSON.stringify(db));
};

const checkNetworkError = (error: any) => {
  if (!error.response) return true;
  if (error.code === 'ERR_NETWORK') return true;
  if (error.message?.includes('Network Error') || error.message?.includes('connection') || error.message?.includes('timeout')) return true;
  
  // Treat 502, 503, 504 (bad gateway, service unavailable, gateway timeout) or any tunnel error as a network error
  if (error.response.status === 502 || error.response.status === 503 || error.response.status === 504) return true;
  
  // If the response is HTML instead of JSON (which happens when hitting a dead tunnel provider like Serveo, Ngrok, or a cloudflare/proxy block page)
  const contentType = error.response.headers?.['content-type'] || '';
  if (contentType.includes('text/html') || (typeof error.response.data === 'string' && error.response.data.startsWith('<!DOCTYPE'))) return true;

  return false;
};

// Override axios methods to run local-first
api.get = async (url: string, config?: any): Promise<any> => {
  try {
    const response = await networkClient.get(url, config);
    
    // Optional replication of server data to local mock DB
    if (response.data) {
      const db = await getMockDb();
      if (url === "/patient/me") {
        db.patient = response.data.patient;
        db.vitals = response.data.vitals;
        db.appointments = response.data.appointments;
        db.prescriptions = response.data.prescriptions;
        db.investigations = response.data.investigations || [];
        await saveMockDb(db);
      } else if (url === "/patient/notifications") {
        db.notifications = response.data.notifications || [];
        await saveMockDb(db);
      }
    }
    return response;
  } catch (error: any) {
    if (url === "/hospitals") {
      console.log("Mobile Client: Failed to fetch hospitals. Using mock fallback list...");
      return {
        data: {
          hospitals: [
            { id: "a189bc4a-0a22-46b0-b8ed-0d6fb6d99f02", name: "MammaCare General Hospital", address: "123 Health Ave, Ikeja, Lagos" },
            { id: "c0543a16-2fba-4b28-8d3d-f865fcb74341", name: "Western Memorial Medical Center", address: "45 Ridge Rd, Wuse II, Abuja" },
            { id: "890f8a40-00d7-464d-b67a-a732ee0dc509", name: "St. Mary’s Maternity Clinic", address: "88 Grace St, Bodija, Ibadan" },
            { id: "e33848b1-19ff-4a03-9ae7-39f2098c6a53", name: "Hope Maternity Clinic", address: "10 Lakaka street" }
          ]
        }
      };
    }
    const isNetworkError = checkNetworkError(error);
    if (isNetworkError) {
      console.log("Mobile Client: Network unreachable. Running in local-first mock mode...");
      const db = await getMockDb();
      if (url === "/patient/me") {
        return {
          data: {
            patient: db.patient,
            vitals: db.vitals,
            appointments: db.appointments,
            prescriptions: db.prescriptions,
            investigations: db.investigations || []
          }
        };
      }
      if (url === "/patient/notifications") {
        return {
          data: {
            notifications: db.notifications || []
          }
        };
      }
      return { data: {} };
    }
    throw error;
  }
};

api.post = async (url: string, data?: any, config?: any): Promise<any> => {
  try {
    const response = await networkClient.post(url, data, config);
    
    // Optional replication of mutations to mock DB
    if (response.data) {
      const db = await getMockDb();
      if (url === "/auth/login/patient" || url === "/auth/signup/patient") {
        if (response.data.user) {
          db.patient = response.data.user;
          await saveMockDb(db);
        }
      } else if (url === "/patient/onboarding") {
        const { lmp, edd } = data || {};
        if (lmp) {
          const lmpDate = new Date(lmp);
          db.patient.medicalHistory = { lmp: lmp };
          const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
          db.patient.edd = eddDate.toISOString();
        } else if (edd) {
          const eddDate = new Date(edd);
          db.patient.edd = edd;
          const lmpDate = new Date(eddDate.getTime() - 280 * 24 * 60 * 60 * 1000);
          db.patient.medicalHistory = { lmp: lmpDate.toISOString() };
        }
        await saveMockDb(db);
      }
    }
    return response;
  } catch (error: any) {
    const isNetworkError = checkNetworkError(error);
    if (isNetworkError) {
      console.log("Mobile Client: Network unreachable for POST. Running in local-first mock mode...");
      const db = await getMockDb();

      if (url === "/auth/login/patient") {
        return {
          data: {
            token: "mock-patient-token",
            user: db.patient
          }
        };
      }

      if (url === "/auth/signup/patient") {
        const { name, email, hospitalId, emergencyContact, lmp, edd } = data || {};
        let calculatedEdd = null;
        let calculatedLmp = null;

        if (lmp) {
          const lmpDate = new Date(lmp);
          calculatedLmp = lmp;
          const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
          calculatedEdd = eddDate.toISOString();
        } else if (edd) {
          const eddDate = new Date(edd);
          calculatedEdd = edd;
          const lmpDate = new Date(eddDate.getTime() - 280 * 24 * 60 * 60 * 1000);
          calculatedLmp = lmpDate.toISOString();
        }

        const newPatient = {
          id: `PATIENT-${Math.floor(10000 + Math.random() * 90000)}`,
          name,
          email,
          hospitalId,
          emergencyContact,
          bloodGroup: null,
          edd: calculatedEdd,
          medicalHistory: calculatedLmp ? { lmp: calculatedLmp } : null
        };
        db.patient = newPatient;
        db.vitals = [];
        db.appointments = [];
        db.prescriptions = [];
        db.investigations = [];
        await saveMockDb(db);
        return {
          data: {
            token: "mock-patient-token",
            user: newPatient
          }
        };
      }

      if (url === "/patient/onboarding") {
        const { lmp, edd } = data || {};
        if (lmp) {
          const lmpDate = new Date(lmp);
          db.patient.medicalHistory = { lmp: lmp };
          const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
          db.patient.edd = eddDate.toISOString();
        } else if (edd) {
          const eddDate = new Date(edd);
          db.patient.edd = edd;
          const lmpDate = new Date(eddDate.getTime() - 280 * 24 * 60 * 60 * 1000);
          db.patient.medicalHistory = { lmp: lmpDate.toISOString() };
        }
        await saveMockDb(db);
        return { data: { success: true } };
      }

      if (url === "/patient/medication-log") {
        const { prescriptionId } = data || {};
        db.prescriptions = db.prescriptions.map((p: any) => {
          if (p.id === prescriptionId) {
            return {
              ...p,
              logs: [{ id: `log-${Math.random()}`, takenAt: new Date().toISOString() }]
            };
          }
          return p;
        });
        await saveMockDb(db);
        return { data: { success: true } };
      }

      if (url === "/patient/sos") {
        console.log("Mock SOS alert triggered successfully!");
        return { data: { success: true } };
      }

      return { data: {} };
    }
    throw error;
  }
};
