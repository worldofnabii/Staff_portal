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
app.use(cors());

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Memory store for SOS alerts (Simulating real-time feeds)
let activeAlerts = [];

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

app.post('/api/auth/register/patient', authMiddleware, async (req, res) => {
  try {
    const { _id, name, email, password, bloodGroup, edd, emergencyContact, nin, age, village, parish, district, occupation, religion, education, maritalStatus, nokName, nokPhone, nokRelationship, nokAddress } = req.body;
    
    if (req.user.role === 'Patient') return res.status(403).json({ message: 'Patients cannot register other patients' });

    let patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id: _id }, { email }]
      }
    });

    if (patient) return res.status(400).json({ message: 'Patient already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    patient = await prisma.patient.create({
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
      where: { patientId: patient.id, isActive: true },
      include: {
        logs: {
          where: { takenAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
        }
      }
    });

    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      appointments, 
      prescriptions
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

// --- HOSPITAL ROUTES (DOCTOR/NURSE) ---
app.get('/api/hospital/patient/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ message: 'Access denied: Patient belongs to another hospital' });
    }

    const { password, ...patientWithoutPassword } = patient;

    const vitals = await prisma.antenatalVisit.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId },
      orderBy: { createdAt: 'desc' },
      include: { recordedBy: { select: { name: true, role: true } } }
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id, hospitalId: req.user.hospitalId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      prescriptions
    });
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
