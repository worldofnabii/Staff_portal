"use client";

import axios from "axios";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://0819cbdf632f4420-102-89-84-48.serveousercontent.com/api";
};

export const api = axios.create({
  baseURL: getBaseURL(),
});

const networkClient = axios.create({
  baseURL: api.defaults.baseURL,
});

networkClient.interceptors.request.use((config) => {
  config.baseURL = getBaseURL();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("staffToken") || localStorage.getItem("patientToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

networkClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (
        error.response &&
        (
          ((error.response.status === 400 && error.response.data?.message?.toLowerCase().includes("token")) ||
           error.response.status === 401) &&
          !isAuthRoute
        )
      ) {
        console.log("Web Client: Session invalid or expired. Clearing tokens and redirecting to login...");
        localStorage.removeItem("staffToken");
        localStorage.removeItem("staffRole");
        localStorage.removeItem("staffName");
        localStorage.removeItem("patientToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Helper for Mock DB
const getMockDb = () => {
  if (typeof window === "undefined") return null;
  const dbStr = localStorage.getItem("MAMMA_CARE_MOCK_DB");
  if (!dbStr) {
    const defaultDb = {
      alerts: [
        {
          id: "alert-1",
          patientId: "PATIENT-001",
          patientName: "Chioma Nwachukwu",
          emergencyContact: "+234-803-990-1111",
          time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        }
      ],
      staff: [
        { id: "staff-1", name: "Dr. Jane Smith", email: "doctor@hospital.com", role: "Doctor", mustChangePassword: false },
        { id: "staff-2", name: "Nurse Joy", email: "nurse@hospital.com", role: "Nurse", mustChangePassword: false }
      ],
      appointments: [
        {
          id: "appt-1",
          patientId: "PATIENT-001",
          patient: { name: "Chioma Nwachukwu", phone: "+234-803-990-1111" },
          date: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
          purpose: "High-Risk Antenatal Follow-up",
          status: "Scheduled"
        },
        {
          id: "appt-2",
          patientId: "PATIENT-002",
          patient: { name: "Amara Adebayo", phone: "+234-805-440-2222" },
          date: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
          purpose: "Regular Antenatal Checkup",
          status: "Scheduled"
        }
      ],
      patients: {
        "PATIENT-001": {
          _id: "PATIENT-001",
          name: "Chioma Nwachukwu",
          email: "chioma@example.com",
          age: 24,
          nin: "CM990218821B",
          occupation: "Student",
          maritalStatus: "Single",
          education: "University",
          religion: "Christian",
          district: "Lagos",
          village: "Ikeja",
          emergencyContact: "+234-803-990-1111",
          nokName: "Obinna Nwachukwu",
          nokPhone: "+234-803-990-0000",
          bloodGroup: "A-",
          edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150).toISOString()
        },
        "PATIENT-002": {
          _id: "PATIENT-002",
          name: "Amara Adebayo",
          email: "amara@example.com",
          age: 29,
          nin: "CM920310221B",
          occupation: "Businesswoman",
          maritalStatus: "Married",
          education: "Secondary",
          religion: "None",
          district: "Abuja",
          village: "Wuse II",
          emergencyContact: "+234-805-440-2222",
          nokName: "Tunde Adebayo",
          nokPhone: "+234-805-440-0000",
          bloodGroup: "O+",
          edd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString()
        },
        "PATIENT-003": {
          _id: "PATIENT-003",
          name: "Fatima Bello",
          email: "fatima@example.com",
          age: 27,
          nin: "CM940510331B",
          occupation: "Journalist",
          maritalStatus: "Married",
          education: "University",
          religion: "Christian",
          district: "Oyo",
          village: "Bodija",
          emergencyContact: "+234-809-110-3333",
          nokName: "Ibrahim Bello",
          nokPhone: "+234-809-110-0000",
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
  try {
    const response = await networkClient.get(url, config);
    
    // Optional replication of server data to local mock DB
    if (typeof window !== "undefined" && response.data) {
      const db = getMockDb();
      if (db) {
        if (url === "/hospital/alerts") {
          db.alerts = response.data.alerts;
        } else if (url === "/hospital/patients") {
          response.data.patients.forEach((p: any) => {
            db.patients[p.id || p._id] = p;
          });
        } else if (url === "/hospital/appointments") {
          db.appointments = response.data.appointments;
        } else if (url.startsWith("/hospital/patient/")) {
          const id = url.split("/").pop() || "";
          db.patients[id] = response.data.patient;
          db.vitals[id] = response.data.vitals;
          db.medicalHistory[id] = response.data.medicalHistory;
          db.investigations[id] = response.data.investigations;
          // Sync appointment list
          db.appointments = db.appointments.filter((a: any) => a.patientId !== id).concat(response.data.appointments);
          // Sync notification list
          db.notifications = (db.notifications || []).filter((n: any) => n.patientId !== id).concat(response.data.notifications || []);
        }
        saveMockDb(db);
      }
    }
    
    return response;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('connection') || error.message?.includes('timeout');
    if (isNetworkError) {
      console.log("Web Client: Network unreachable. Running in local-first mock mode...");
      const db = getMockDb();
      if (!db) return { data: {} };

      if (url === "/hospital/alerts") {
        return { data: { alerts: db.alerts } };
      }
      if (url === "/hospital/patients") {
        return { data: { patients: Object.values(db.patients) } };
      }
      if (url === "/hospital/staff") {
        return { data: { staff: db.staff || [] } };
      }
      if (url === "/hospital/appointments") {
        return { data: { appointments: db.appointments } };
      }
      if (url === "/hospital/queue") {
        return { data: { queue: db.queue || [] } };
      }
      if (url.startsWith("/hospital/patient/")) {
        const id = url.split("/").pop() || "";
        const patient = db.patients[id] || db.patients["PATIENT-002"];
        const patientAppts = (db.appointments || []).filter((a: any) => a.patientId === id);
        const patientNotifs = (db.notifications || []).filter((n: any) => n.patientId === id);
        return {
          data: {
            patient: patient,
            vitals: db.vitals[id] || [],
            medicalHistory: db.medicalHistory[id] || {},
            investigations: db.investigations[id] || [],
            appointments: patientAppts,
            notifications: patientNotifs
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
    if (typeof window !== "undefined" && response.data) {
      const db = getMockDb();
      if (db) {
        if (url === "/auth/login/staff") {
          // No need to replicate login
        } else if (url === "/auth/register-hospital") {
          // No need
        } else if (url === "/hospital/staff") {
          const newStaff = {
            id: response.data.staff?.id || `staff-${Math.random()}`,
            name: data.name,
            email: data.email,
            role: data.role,
            mustChangePassword: true
          };
          if (!db.staff) db.staff = [];
          db.staff.push(newStaff);
        } else if (url === "/auth/register/patient") {
          const newPatient = data || {};
          const id = newPatient._id;
          db.patients[id] = newPatient;
        } else if (url === "/hospital/checkin") {
          const { patientId } = data || {};
          const patient = db.patients[patientId];
          if (patient) {
            if (!db.queue) db.queue = [];
            db.queue.push({
              id: response.data.queueItem?.id || `q-${Date.now()}`,
              patientId: patient._id,
              patientName: patient.name,
              checkinTime: new Date().toISOString(),
              status: "Vitals Pending"
            });
          }
        } else if (url.includes("/history")) {
          const patientId = url.split("/")[3];
          db.medicalHistory[patientId] = data;
        } else if (url.includes("/visit")) {
          const patientId = url.split("/")[3];
          const newVisit = {
            id: `v-${Math.random()}`,
            createdAt: new Date().toISOString(),
            bloodPressure: data.bloodPressure,
            weight: data.weight,
            pulse: 80,
            gestationalAge: "24 weeks",
            complaints: data.complaints || "None",
            recordedBy: { name: "Doctor/Nurse", role: "Staff" }
          };
          if (!db.vitals[patientId]) db.vitals[patientId] = [];
          db.vitals[patientId].unshift(newVisit);
          if (db.queue) {
            db.queue = db.queue.map((p: any) => p.patientId === patientId ? { ...p, status: "Doctor Pending" } : p);
          }
        } else if (url.includes("/investigations")) {
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
          if (db.queue) {
            db.queue = db.queue.map((p: any) => p.patientId === patientId ? { ...p, status: "Completed" } : p);
          }
        } else if (url.includes("/appointment")) {
          const patientId = url.split("/")[3];
          const newAppt = {
            id: response.data.appointment?.id || `appt-${Math.random()}`,
            patientId,
            patient: { 
              name: db.patients[patientId]?.name || "Patient", 
              phone: db.patients[patientId]?.emergencyContact || "" 
            },
            date: data.date,
            purpose: data.purpose,
            status: "Scheduled"
          };
          if (!db.appointments) db.appointments = [];
          db.appointments.push(newAppt);
        } else if (url.includes("/notification")) {
          const patientId = url.split("/")[3];
          const newNotification = {
            id: response.data.notification?.id || `notif-${Math.random()}`,
            patientId,
            title: data.title,
            message: data.message,
            sentBy: response.data.notification?.sentBy || "Staff",
            createdAt: response.data.notification?.createdAt || new Date().toISOString()
          };
          if (!db.notifications) db.notifications = [];
          db.notifications.unshift(newNotification);
        }
        saveMockDb(db);
      }
    }
    
    return response;
  } catch (error: any) {
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('connection') || error.message?.includes('timeout');
    if (isNetworkError) {
      console.log("Web Client: Network unreachable for POST. Running in local-first mock mode...");
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

      if (url === "/auth/register-hospital") {
        const { hospitalName, adminName } = data || {};
        return {
          data: {
            token: "mock-admin-token",
            user: {
              _id: "mock-admin-id",
              name: adminName || "Admin User",
              role: "Admin",
              hospitalId: "mock-hosp-id",
              hospitalName: hospitalName || "MammaCare Hospital"
            }
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

      if (url === "/hospital/staff") {
        const { name, email, role } = data || {};
        const newStaff = {
          id: `staff-${Math.random()}`,
          name,
          email,
          role,
          mustChangePassword: true
        };
        if (!db.staff) db.staff = [];
        db.staff.push(newStaff);
        saveMockDb(db);
        return { data: { success: true, staff: newStaff } };
      }

      if (url === "/hospital/checkin") {
        const { patientId } = data || {};
        const patient = db.patients[patientId] || Object.values(db.patients).find((p: any) => p._id === patientId);
        if (!patient) {
          throw { response: { data: { message: "Patient not found" } } };
        }
        if (!db.queue) db.queue = [];
        const exists = db.queue.some((p: any) => p.patientId === patientId);
        if (exists) {
          throw { response: { data: { message: "Patient already checked in today" } } };
        }
        const queueItem = {
          id: `q-${Date.now()}`,
          patientId: patient._id,
          patientName: patient.name,
          checkinTime: new Date().toISOString(),
          status: "Vitals Pending"
        };
        db.queue.push(queueItem);
        saveMockDb(db);
        return { data: { success: true, queueItem } };
      }

      if (url.startsWith("/hospital/queue/") && url.endsWith("/remove")) {
        const parts = url.split("/");
        const patientId = parts[parts.length - 2];
        if (db.queue) {
          db.queue = db.queue.filter((p: any) => p.patientId !== patientId);
          saveMockDb(db);
        }
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

        if (db.queue) {
          db.queue = db.queue.map((p: any) => {
            if (p.patientId === patientId) {
              return { ...p, status: "Doctor Pending" };
            }
            return p;
          });
        }
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

        if (db.queue) {
          db.queue = db.queue.map((p: any) => {
            if (p.patientId === patientId) {
              return { ...p, status: "Completed" };
            }
            return p;
          });
        }
        saveMockDb(db);
        return { data: { success: true } };
      }

      if (url.includes("/appointment")) {
        const patientId = url.split("/")[3];
        const newAppt = {
          id: `appt-${Math.random()}`,
          patientId,
          patient: { 
            name: db.patients[patientId]?.name || "Patient", 
            phone: db.patients[patientId]?.emergencyContact || "" 
          },
          date: data.date,
          purpose: data.purpose,
          status: "Scheduled"
        };
        if (!db.appointments) db.appointments = [];
        db.appointments.push(newAppt);
        saveMockDb(db);
        return { data: { success: true, appointment: newAppt } };
      }

      if (url.includes("/notification")) {
        const patientId = url.split("/")[3];
        const newNotification = {
          id: `notif-${Math.random()}`,
          patientId,
          title: data.title,
          message: data.message,
          sentBy: typeof window !== "undefined" ? `${localStorage.getItem("staffName") || "Staff"} (${localStorage.getItem("staffRole") || "Staff"})` : "Staff",
          createdAt: new Date().toISOString()
        };
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift(newNotification);
        saveMockDb(db);
        return { data: { success: true, notification: newNotification } };
      }

      return { data: {} };
    }
    throw error;
  }
};
