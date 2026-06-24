const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({
  origin: '*', // Allow all in dev, but can be restricted later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Memory store for SOS alerts (Simulating real-time feeds)
let activeAlerts = [];

// Memory store for Today's Patient Queue
let checkedInPatients = [];

// --- MIDDLEWARES ---
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied: Requires Admin role' });
  }
  next();
};

// --- AUTH ROUTES ---

// HOSPITAL & ADMIN REGISTRATION
app.post('/api/auth/register-hospital', async (req, res) => {
  try {
    const { hospitalName, hospitalAddress, licenseNumber, adminName, adminEmail, adminPassword } = req.body;

    const existingHospital = await prisma.hospital.findUnique({ where: { licenseNumber } });
    if (existingHospital) return res.status(400).json({ message: 'Hospital with this license already exists' });

    const existingStaff = await prisma.staff.findUnique({ where: { email: adminEmail } });
    if (existingStaff) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalName,
          address: hospitalAddress,
          licenseNumber
        }
      });

      const admin = await tx.staff.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'Admin',
          hospitalId: hospital.id
        }
      });

      return { hospital, admin };
    });

    const token = jwt.sign(
      { _id: result.admin.id, role: 'Admin', hospitalId: result.hospital.id },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        _id: result.admin.id,
        name: result.admin.name,
        role: result.admin.role,
        hospitalId: result.hospital.id,
        hospitalName: result.hospital.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET PUBLIC HOSPITALS LIST
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        licenseNumber: true
      }
    });
    res.json({ hospitals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATIENT SELF-SIGNUP
app.post('/api/auth/signup/patient', async (req, res) => {
  try {
    const { name, email, password, hospitalId, emergencyContact, lmp, edd } = req.body;

    if (!name || !email || !password || !hospitalId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingPatient = await prisma.patient.findUnique({ where: { email } });
    if (existingPatient) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique Patient ID
    let patientId;
    let isUnique = false;
    while (!isUnique) {
      patientId = `PATIENT-${Math.floor(10000 + Math.random() * 90000)}`;
      const existingId = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!existingId) isUnique = true;
    }

    let lmpDate = lmp ? new Date(lmp) : null;
    let eddDate = edd ? new Date(edd) : null;

    if (lmpDate && !eddDate) {
      eddDate = new Date(lmpDate);
      eddDate.setDate(eddDate.getDate() + 280);
    } else if (eddDate && !lmpDate) {
      lmpDate = new Date(eddDate);
      lmpDate.setDate(lmpDate.getDate() - 280);
    }

    const patient = await prisma.patient.create({
      data: {
        id: patientId,
        name,
        email,
        password: hashedPassword,
        hospitalId,
        emergencyContact,
        edd: eddDate,
        ...(lmpDate ? {
          medicalHistory: {
            create: {
              lmp: lmpDate
            }
          }
        } : {})
      },
      include: {
        medicalHistory: true
      }
    });

    const token = jwt.sign(
      { _id: patient.id, role: 'Patient', hospitalId: patient.hospitalId },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      user: {
        _id: patient.id,
        name: patient.name,
        email: patient.email,
        hospitalId: patient.hospitalId,
        edd: patient.edd,
        medicalHistory: patient.medicalHistory,
        activeMedication: []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register/patient', authMiddleware, async (req, res) => {
  try {
    const { _id, name, email, password, bloodGroup, edd, emergencyContact, nin, age, village, parish, district, occupation, religion, education, maritalStatus, nokName, nokPhone, nokRelationship, nokAddress } = req.body;
    
    if (req.user.role === 'Patient') return res.status(403).json({ message: 'Patients cannot register other patients' });

    let existingPatient = await prisma.prisma?.patient?.findUnique ? await prisma.patient.findUnique({ where: { id: _id } }) : await prisma.patient.findFirst({ where: { id: _id } });
    if (!existingPatient && _id) {
      existingPatient = await prisma.patient.findFirst({ where: { id: _id } });
    }

    if (existingPatient) {
      // Update clinical and profile info for the existing patient, linking them to this hospital
      const updatedPatient = await prisma.patient.update({
        where: { id: existingPatient.id },
        data: {
          name,
          bloodGroup,
          hospitalId: req.user.hospitalId,
          edd: edd ? new Date(edd) : null,
          emergencyContact,
          nin,
          age: age ? parseInt(age) : null,
          village,
          parish,
          district,
          occupation,
          religion,
          education,
          maritalStatus,
          nokName,
          nokPhone,
          nokRelationship,
          nokAddress
        }
      });
      return res.json({ message: 'Patient profile linked and updated successfully', patient: { _id: updatedPatient.id, name: updatedPatient.name } });
    }

    // For new patients, check email uniqueness
    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: 'Email already registered with another account' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const patient = await prisma.patient.create({
      data: {
        id: _id,
        name,
        email,
        password: hashedPassword,
        bloodGroup,
        hospitalId: req.user.hospitalId,
        edd: edd ? new Date(edd) : null,
        emergencyContact,
        nin,
        age: age ? parseInt(age) : null,
        village,
        parish,
        district,
        occupation,
        religion,
        education,
        maritalStatus,
        nokName,
        nokPhone,
        nokRelationship,
        nokAddress
      }
    });

    res.json({ message: 'Patient registered successfully', patient: { _id: patient.id, name: patient.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/patient', async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) return res.status(400).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, patient.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ _id: patient.id, role: 'Patient', hospitalId: patient.hospitalId }, process.env.JWT_SECRET);
    const medicalHistory = await prisma.medicalHistory.findUnique({ where: { patientId: patient.id } });
    
    // Fetch active prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id, isActive: true },
      include: {
        logs: {
          where: { takenAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
        }
      }
    });

    res.json({ 
      token, 
      user: { 
        _id: patient.id, 
        name: patient.name, 
        email: patient.email, 
        hospitalId: patient.hospitalId, 
        edd: patient.edd,
        medicalHistory,
        activeMedication: prescriptions 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/staff', async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: { hospital: { select: { name: true } } }
    });
    if (!staff) return res.status(400).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ 
      _id: staff.id, 
      role: staff.role, 
      hospitalId: staff.hospitalId 
    }, process.env.JWT_SECRET);

    res.json({ 
      token, 
      user: { 
        _id: staff.id, 
        name: staff.name, 
        email: staff.email, 
        role: staff.role, 
        hospitalId: staff.hospitalId,
        hospitalName: staff.hospital?.name || "Unassigned Hospital",
        mustChangePassword: staff.mustChangePassword
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- STAFF MANAGEMENT (ADMIN) ---
app.get('/api/hospital/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { hospitalId: req.user.hospitalId },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true }
    });
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospital/staff', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const existing = await prisma.staff.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Welcome123', salt);

    const newStaff = await prisma.staff.create({
      data: {
        name,
        email,
        role,
        password: defaultPassword,
        hospitalId: req.user.hospitalId,
        mustChangePassword: true
      }
    });

    res.json({ message: 'Staff member added successfully', staff: { id: newStaff.id, email: newStaff.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PATIENT PROFILE & ME (MOBILE & WEB) ---
app.post('/api/patient/onboarding', authMiddleware, async (req, res) => {
  try {
    const { lmp, edd } = req.body;
    if (!lmp && !edd) return res.status(400).json({ message: 'LMP or EDD date is required' });

    let lmpDate = lmp ? new Date(lmp) : null;
    let eddDate = edd ? new Date(edd) : null;

    if (lmpDate && !eddDate) {
      eddDate = new Date(lmpDate);
      eddDate.setDate(eddDate.getDate() + 280); // Standard pregnancy duration (40 weeks)
    } else if (eddDate && !lmpDate) {
      lmpDate = new Date(eddDate);
      lmpDate.setDate(lmpDate.getDate() - 280);
    }

    await prisma.$transaction([
      prisma.patient.update({
        where: { id: req.user._id },
        data: { edd: eddDate }
      }),
      prisma.medicalHistory.upsert({
        where: { patientId: req.user._id },
        update: { lmp: lmpDate },
        create: { patientId: req.user._id, lmp: lmpDate }
      })
    ]);

    res.json({ message: 'Onboarding completed successfully', edd: eddDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/me', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.user._id }
    });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    const { password, ...patientWithoutPassword } = patient;

    const vitals = await prisma.antenatalVisit.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id, date: { gte: new Date() } },
      orderBy: { date: 'asc' }
    });
    
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        logs: {
          where: { takenAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const investigations = await prisma.investigation.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' }
    });

    const preventativeCare = await prisma.preventativeCare.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' }
    });

    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      appointments, 
      prescriptions,
      investigations,
      preventativeCare
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patient/medication-log', authMiddleware, async (req, res) => {
  try {
    const { prescriptionId, notes } = req.body;
    const log = await prisma.medicationLog.create({
      data: {
        patientId: req.user._id,
        prescriptionId,
        notes
      }
    });
    res.json({ message: 'Medication intake recorded', log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patient/sos', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.user._id } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const newAlert = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: patient.hospitalId,
      emergencyContact: patient.emergencyContact,
      time: new Date()
    };
    activeAlerts.unshift(newAlert);

    if (activeAlerts.length > 50) activeAlerts.pop();

    res.json({ message: 'SOS Alert triggered successfully', alert: newAlert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- HOSPITAL ROUTES (DOCTOR/NURSE/ADMIN) ---
app.get('/api/hospital/patients', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const patients = await prisma.patient.findMany({
      where: { hospitalId: req.user.hospitalId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        bloodGroup: true,
        edd: true,
        district: true,
        village: true,
      },
      orderBy: { name: 'asc' }
    });

    const mappedPatients = patients.map(p => ({
      ...p,
      _id: p.id
    }));

    res.json({ patients: mappedPatients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hospital/patient/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const isDifferentHospital = patient.hospitalId !== req.user.hospitalId;
    const { password, ...patientWithoutPassword } = patient;
    const isAdmin = req.user.role === 'Admin';

    const vitals = (isAdmin || isDifferentHospital) ? [] : await prisma.antenatalVisit.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId },
      orderBy: { createdAt: 'desc' },
      include: { recordedBy: { select: { name: true, role: true } } }
    });

    const prescriptions = (isAdmin || isDifferentHospital) ? [] : await prisma.prescription.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId },
      orderBy: { createdAt: 'desc' }
    });

    const medicalHistory = (isAdmin || isDifferentHospital) ? null : await prisma.medicalHistory.findUnique({
      where: { patientId: patient.id }
    });

    const investigations = (isAdmin || isDifferentHospital) ? [] : await prisma.investigation.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId },
      orderBy: { date: 'desc' }
    });

    const appointments = (isAdmin || isDifferentHospital) ? [] : await prisma.appointment.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId, date: { gte: new Date() } },
      orderBy: { date: 'asc' }
    });

    const notifications = (isAdmin || isDifferentHospital) ? [] : await prisma.notification.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      prescriptions,
      medicalHistory,
      investigations,
      appointments,
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PATIENT PROFILE (DOCTOR/NURSE)
app.post('/api/hospital/patient/:id/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied: Clinical staff only' });
    }

    const { name, bloodGroup, edd, emergencyContact, nin, age, village, parish, district, occupation, religion, education, maritalStatus, nokName, nokPhone, nokRelationship, nokAddress } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ message: 'Access denied: Patient belongs to another hospital' });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        name,
        bloodGroup,
        edd: edd ? new Date(edd) : null,
        emergencyContact,
        nin,
        age: age ? parseInt(age) : null,
        village,
        parish,
        district,
        occupation,
        religion,
        education,
        maritalStatus,
        nokName,
        nokPhone,
        nokRelationship,
        nokAddress
      }
    });

    res.json({ message: 'Patient profile updated successfully', patient: updatedPatient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospital/patient/:id/notification', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const staff = await prisma.staff.findUnique({ where: { id: req.user._id } });
    const sentBy = staff ? `${staff.name} (${staff.role})` : 'Staff';

    const notification = await prisma.notification.create({
      data: {
        patientId: req.params.id,
        title,
        message,
        sentBy
      }
    });

    res.json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { patientId: req.user._id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET TODAY'S INTAKE QUEUE
app.get('/api/hospital/queue', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const queue = checkedInPatients.filter(p => p.hospitalId === req.user.hospitalId);
    res.json({ queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATIENT CHECK-IN (LOG PRESENT)
app.post('/api/hospital/checkin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { patientId } = req.body;
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ message: 'Patient belongs to another hospital' });
    }

    const exists = checkedInPatients.some(p => p.patientId === patientId && p.hospitalId === req.user.hospitalId);
    if (exists) return res.status(400).json({ message: 'Patient already checked in today' });

    const queueItem = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: patient.name,
      hospitalId: patient.hospitalId,
      checkinTime: new Date(),
      status: 'Vitals Pending' // Vitals Pending, Doctor Pending, Completed
    };
    checkedInPatients.push(queueItem);

    res.json({ message: 'Patient checked in successfully', queueItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE PATIENT FROM QUEUE
app.post('/api/hospital/queue/:patientId/remove', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { patientId } = req.params;
    checkedInPatients = checkedInPatients.filter(
      p => !(p.patientId === patientId && p.hospitalId === req.user.hospitalId)
    );
    res.json({ message: 'Patient removed from queue successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOG CLINICAL VISIT (VITALS)
app.post('/api/hospital/patient/:id/visit', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { medicalHistory: true }
    });

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Calculate Gestational Age
    let gestationalAge = 'Not set';
    const lmp = patient.medicalHistory?.lmp || (patient.edd ? new Date(new Date(patient.edd).getTime() - 280 * 24 * 60 * 60 * 1000) : null);
    if (lmp) {
      const diffWeeks = Math.max(0, Math.floor((new Date().getTime() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24 * 7)));
      gestationalAge = `${diffWeeks} weeks`;
    }

    const visit = await prisma.antenatalVisit.create({
      data: {
        patientId: req.params.id,
        recordedById: req.user._id,
        hospitalId: req.user.hospitalId,
        complaints: req.body.complaints,
        gestationalAge,
        bloodPressure: req.body.bloodPressure,
        weight: req.body.weight ? parseFloat(req.body.weight) : null,
        pulse: req.body.pulse ? parseInt(req.body.pulse) : null,
        fetalHeartRate: req.body.fetalHeartRate ? parseFloat(req.body.fetalHeartRate) : null,
        bloodSugar: req.body.bloodSugar ? parseFloat(req.body.bloodSugar) : null,
        urineProtein: req.body.urineProtein,
        urineSugar: req.body.urineSugar,
        doctorNotes: req.body.doctorNotes,
        generalExam: req.body.generalExam
      }
    });

    // Update queue status
    const queueIndex = checkedInPatients.findIndex(p => p.patientId === req.params.id && p.hospitalId === req.user.hospitalId);
    if (queueIndex !== -1) {
      checkedInPatients[queueIndex].status = 'Doctor Pending';
    }

    res.json({ message: 'Visit logged successfully', visit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOG INVESTIGATION (SCAN/LAB) - DOCTOR ONLY
app.post('/api/hospital/patient/:id/investigations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({ message: 'Only Doctors can log scans and investigations' });
    }

    const investigation = await prisma.investigation.create({
      data: {
        patientId: req.params.id,
        recordedById: req.user._id,
        hospitalId: req.user.hospitalId,
        testType: req.body.testType,
        result: req.body.result,
        attachmentUrl: req.body.attachmentUrl
      }
    });

    // Update queue status
    const queueIndex = checkedInPatients.findIndex(p => p.patientId === req.params.id && p.hospitalId === req.user.hospitalId);
    if (queueIndex !== -1) {
      checkedInPatients[queueIndex].status = 'Completed';
    }

    res.json({ message: 'Scan logged successfully', investigation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE MEDICAL HISTORY - DOCTOR ONLY
app.post('/api/hospital/patient/:id/history', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({ message: 'Only Doctors can edit medical history' });
    }

    const history = await prisma.medicalHistory.upsert({
      where: { patientId: req.params.id },
      update: {
        gravida: req.body.gravida ? parseInt(req.body.gravida) : null,
        para: req.body.para ? parseInt(req.body.para) : null,
        abortions: req.body.abortions ? parseInt(req.body.abortions) : null,
        hivStatus: !!req.body.hivStatus,
        cardiacDisease: !!req.body.cardiacDisease,
        kidneyDisease: !!req.body.kidneyDisease,
        hypertension: !!req.body.hypertension,
        asthma: !!req.body.asthma,
        diabetes: !!req.body.diabetes,
        sickleCell: !!req.body.sickleCell
      },
      create: {
        patientId: req.params.id,
        gravida: req.body.gravida ? parseInt(req.body.gravida) : null,
        para: req.body.para ? parseInt(req.body.para) : null,
        abortions: req.body.abortions ? parseInt(req.body.abortions) : null,
        hivStatus: !!req.body.hivStatus,
        cardiacDisease: !!req.body.cardiacDisease,
        kidneyDisease: !!req.body.kidneyDisease,
        hypertension: !!req.body.hypertension,
        asthma: !!req.body.asthma,
        diabetes: !!req.body.diabetes,
        sickleCell: !!req.body.sickleCell
      }
    });

    res.json({ message: 'Medical history updated successfully', history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SCHEDULE APPOINTMENT
app.post('/api/hospital/patient/:id/appointment', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.params.id,
        hospitalId: req.user.hospitalId,
        date: new Date(req.body.date),
        purpose: req.body.purpose,
        status: 'Scheduled'
      }
    });

    res.json({ message: 'Appointment scheduled successfully', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospital/prescriptions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ message: 'Only Doctors can prescribe medication' });
    const { patientId, medication, dosage, frequency, duration, notes } = req.body;
    
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        medication,
        dosage,
        frequency,
        duration,
        notes,
        prescribedById: req.user._id,
        hospitalId: req.user.hospitalId
      }
    });
    res.json({ message: 'Prescription added successfully', prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hospital/appointments', authMiddleware, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: { 
        hospitalId: req.user.hospitalId,
        date: { gte: startOfToday } 
      },
      include: { 
        patient: { select: { name: true, phone: true } } 
      },
      orderBy: { date: 'asc' }
    });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hospital/alerts', authMiddleware, (req, res) => {
  if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const hospitalAlerts = activeAlerts.filter(a => a.hospitalId === req.user.hospitalId);
  res.json({ alerts: hospitalAlerts });
});

app.post('/api/hospital/alerts/:id/clear', authMiddleware, (req, res) => {
  if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const alertIndex = activeAlerts.findIndex(a => a.id === req.params.id && a.hospitalId === req.user.hospitalId);
  if (alertIndex !== -1) {
    activeAlerts.splice(alertIndex, 1);
    res.json({ message: 'Alert cleared' });
  } else {
    res.status(404).json({ message: 'Alert not found or access denied' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
