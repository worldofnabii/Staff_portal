import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const HOST = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://172.20.94.1:5000'; 

export const api = axios.create({
  baseURL: `${HOST}/api`,
});

// Helper for Mock DB on Mobile
const getMockDb = async () => {
  let dbStr = await AsyncStorage.getItem("MAMMA_CARE_MOBILE_MOCK_DB");
  if (!dbStr) {
    const defaultDb = {
      patient: {
        id: "PATIENT-002",
        name: "Sarah Connor",
        email: "sarah@example.com",
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

// Override axios methods to run local-first
api.get = async (url: string, config?: any): Promise<any> => {
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

  return { data: {} };
};

api.post = async (url: string, data?: any, config?: any): Promise<any> => {
  const db = await getMockDb();

  if (url === "/auth/login/patient") {
    return {
      data: {
        token: "mock-patient-token",
        user: db.patient
      }
    };
  }

  if (url === "/patient/onboarding") {
    const lmpDate = new Date(data.lmp);
    db.patient.medicalHistory = { lmp: data.lmp };
    const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
    db.patient.edd = eddDate.toISOString();
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
};
