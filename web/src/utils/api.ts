"use client";

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://mammacare-api-live.loca.lt/api",
});

// Helper for Mock DB
const getMockDb = () => {
  if (typeof window === "undefined") return null;
  let dbStr = localStorage.getItem("MAMMA_CARE_MOCK_DB");
  if (!dbStr) {
    const defaultDb = {
      alerts: [
        {
          id: "alert-1",
          patientId: "PATIENT-001",
          patientName: "Elena Gilbert",
          emergencyContact: "+256-782-990-111",
          time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        }
      ],
      appointments: [
        {
          id: "appt-1",
          patientId: "PATIENT-001",
          patient: { name: "Elena Gilbert", phone: "+256-782-990-111" },
          date: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
          purpose: "High-Risk Antenatal Follow-up",
          status: "Scheduled"
        },
        {
          id: "appt-2",
          patientId: "PATIENT-002",
          patient: { name: "Sarah Connor", phone: "+256-772-440-222" },
          date: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
          purpose: "Regular Antenatal Checkup",
          status: "Scheduled"
        }
      ],
      patients: {
        "PATIENT-001": {
          _id: "PATIENT-001",
          name: "Elena Gilbert",
          email: "elena@mysticfalls.com",
          age: 24,
          nin: "CM990218821B",
          occupation: "Student",
          maritalStatus: "Single",
          education: "University",
          religion: "Christian",
          district: "Kampala",
          village: "Kololo",
          emergencyContact: "+256-782-990-111",
          nokName: "Alaric Saltzman",
          nokPhone: "+256-782-990-000",
          bloodGroup: "A-",
          edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150).toISOString()
        },
        "PATIENT-002": {
          _id: "PATIENT-002",
          name: "Sarah Connor",
          email: "sarah@example.com",
          age: 29,
          nin: "CM920310221B",
          occupation: "Businesswoman",
          maritalStatus: "Married",
          education: "Secondary",
          religion: "None",
          district: "Fort Portal",
          village: "Ridge",
          emergencyContact: "+256-772-440-222",
          nokName: "John Connor",
          nokPhone: "+256-772-440-000",
          bloodGroup: "O+",
          edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString()
        },
        "PATIENT-003": {
          _id: "PATIENT-003",
          name: "Lois Lane",
          email: "lois@dailyplanet.com",
          age: 27,
          nin: "CM940510331B",
          occupation: "Journalist",
          maritalStatus: "Married",
          education: "University",
          religion: "Christian",
          district: "Gulu",
          village: "Grace",
          emergencyContact: "+256-752-110-333",
          nokName: "Clark Kent",
          nokPhone: "+256-752-110-000",
          bloodGroup: "B+",
          edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString()
        }
      },
      vitals: {
        "PATIENT-001": [
          {
            id: "v-1",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            bloodPressure: "140/92",
            weight: 71,
            pulse: 82,
            gestationalAge: "20 weeks",
            complaints: "Mild headaches",
            recordedBy: { name: "Nurse Joy", role: "Nurse" }
          },
          {
            id: "v-2",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
            bloodPressure: "130/88",
            weight: 68.8,
            pulse: 80,
            gestationalAge: "16 weeks",
            complaints: "Tiredness",
            recordedBy: { name: "Nurse Joy", role: "Nurse" }
          }
        ],
        "PATIENT-002": [
          {
            id: "v-3",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            bloodPressure: "120/80",
            weight: 69.1,
            pulse: 78,
            gestationalAge: "23 weeks",
            complaints: "None",
            recordedBy: { name: "Nurse Joy", role: "Nurse" }
          }
        ]
      },
      medicalHistory: {
        "PATIENT-001": { gravida: 2, para: 1, abortions: 0, hivStatus: false, cardiacDisease: false, kidneyDisease: false, hypertension: true, asthma: false, diabetes: false, sickleCell: false },
        "PATIENT-002": { gravida: 1, para: 0, abortions: 0, hivStatus: false, cardiacDisease: false, kidneyDisease: false, hypertension: false, asthma: false, diabetes: false, sickleCell: false }
      },
      investigations: {
        "PATIENT-001": [],
        "PATIENT-002": [
          { id: "lab-1", testType: "Hemoglobin (Hb)", result: "11.5 g/dL", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() }
        ]
      },
      carePlan: {
        "PATIENT-001": { feedingOption: "Exclusive Breastfeeding", deliveryPlan: "MammaCare General Hospital SVD" },
        "PATIENT-002": { feedingOption: "Exclusive Breastfeeding", deliveryPlan: "Western Memorial Hospital SVD" }
      }
    };
    localStorage.setItem("MAMMA_CARE_MOCK_DB", JSON.stringify(defaultDb));
    return defaultDb;
  }
  return JSON.parse(dbStr);
};

const saveMockDb = (db: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("MAMMA_CARE_MOCK_DB", JSON.stringify(db));
  }
};

// Override axios methods to run local-first
api.get = async (url: string, config?: any): Promise<any> => {
  const db = getMockDb();
  if (!db) return { data: {} };

  if (url === "/hospital/alerts") {
    return { data: { alerts: db.alerts } };
  }
  if (url === "/hospital/patients") {
    return { data: { patients: Object.values(db.patients) } };
  }
  if (url === "/hospital/appointments") {
    return { data: { appointments: db.appointments } };
  }
  if (url.startsWith("/hospital/patient/")) {
    const id = url.split("/").pop() || "";
    const patient = db.patients[id] || db.patients["PATIENT-002"];
    return {
      data: {
        patient: patient,
        vitals: db.vitals[id] || [],
        medicalHistory: db.medicalHistory[id] || {},
        investigations: db.investigations[id] || [],
        carePlan: db.carePlan[id] || {}
      }
    };
  }
  
  return { data: {} };
};

api.post = async (url: string, data?: any, config?: any): Promise<any> => {
  const db = getMockDb();
  if (!db) return { data: {} };

  if (url === "/auth/login/staff") {
    const { email } = data || {};
    const role = email?.includes("nurse") ? "Nurse" : "Doctor";
    const name = role === "Nurse" ? "Nurse Joy" : "Dr. Jane Smith";
    return {
      data: {
        token: "mock-staff-token",
        user: { name, role }
      }
    };
  }

  if (url === "/auth/register/patient") {
    const newPatient = data || {};
    const id = newPatient._id;
    db.patients[id] = newPatient;
    saveMockDb(db);
    return { data: { success: true } };
  }

  if (url.startsWith("/hospital/alerts/") && url.endsWith("/clear")) {
    const parts = url.split("/");
    const id = parts[parts.length - 2];
    db.alerts = db.alerts.filter((a: any) => a.id !== id);
    saveMockDb(db);
    return { data: { success: true } };
  }

  if (url.includes("/history")) {
    const patientId = url.split("/")[3];
    db.medicalHistory[patientId] = data;
    saveMockDb(db);
    return { data: { success: true } };
  }

  if (url.includes("/visit")) {
    const patientId = url.split("/")[3];
    const newVisit = {
      id: `v-${Math.random()}`,
      createdAt: new Date().toISOString(),
      bloodPressure: data.bloodPressure,
      weight: data.weight,
      pulse: 80,
      gestationalAge: "24 weeks",
      complaints: data.complaints || "None",
      recordedBy: {
        name: typeof window !== "undefined" ? localStorage.getItem("staffName") || "Dr. Jane Smith" : "Dr. Jane Smith",
        role: typeof window !== "undefined" ? localStorage.getItem("staffRole") || "Doctor" : "Doctor"
      }
    };
    if (!db.vitals[patientId]) db.vitals[patientId] = [];
    db.vitals[patientId].unshift(newVisit);
    saveMockDb(db);
    return { data: { success: true } };
  }

  if (url.includes("/investigations")) {
    const patientId = url.split("/")[3];
    const newLab = {
      id: `lab-${Math.random()}`,
      testType: data.testType,
      result: data.result,
      date: new Date().toISOString(),
      attachmentUrl: data.attachmentUrl
    };
    if (!db.investigations[patientId]) db.investigations[patientId] = [];
    db.investigations[patientId].unshift(newLab);
    saveMockDb(db);
    return { data: { success: true } };
  }

  if (url.includes("/careplan")) {
    const patientId = url.split("/")[3];
    db.carePlan[patientId] = data;
    saveMockDb(db);
    return { data: { success: true } };
  }

  return { data: {} };
};
