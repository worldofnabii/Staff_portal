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

// --- AUTH ROUTES ---
app.post('/api/auth/register/patient', async (req, res) => {
  try {
    const { _id, name, email, password, bloodGroup, edd, emergencyContact, nin, age, village, parish, district, occupation, religion, education, maritalStatus, nokName, nokPhone, nokRelationship, nokAddress } = req.body;
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

    const token = jwt.sign({ _id: patient.id, role: 'Patient' }, process.env.JWT_SECRET);
    res.json({ token, user: { _id: patient.id, name: patient.name, email: patient.email } });
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

    const token = jwt.sign({ _id: patient.id, role: 'Patient' }, process.env.JWT_SECRET);
    const medicalHistory = await prisma.medicalHistory.findUnique({ where: { patientId: patient.id } });
    res.json({ token, user: { _id: patient.id, name: patient.name, email: patient.email, medicalHistory } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/staff', async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff) return res.status(400).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, staff.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ _id: staff.id, role: staff.role }, process.env.JWT_SECRET);
    res.json({ token, user: { _id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PATIENT ROUTES ---
app.get('/api/patient/me', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.user._id }
    });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    // omit password in response for safety
    const { password, ...patientWithoutPassword } = patient;

    const vitals = await prisma.antenatalVisit.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    const investigations = await prisma.investigation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id, date: { gte: new Date() } },
      orderBy: { date: 'asc' }
    });
    
    const preventativeCare = await prisma.preventativeCare.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    const carePlan = await prisma.carePlan.findUnique({
      where: { patientId: patient.id }
    });

    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId: patient.id }
    });
    
    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      investigations, 
      appointments, 
      preventativeCare, 
      carePlan,
      medicalHistory
    });
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

// --- HOSPITAL ROUTES ---
app.get('/api/hospital/patient/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const { password, ...patientWithoutPassword } = patient;

    const vitals = await prisma.antenatalVisit.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: {
        recordedBy: {
          select: { name: true, role: true }
        }
      }
    });

    const medicalHistory = await prisma.medicalHistory.findUnique({
      where: { patientId: patient.id }
    });

    const historicalPregnancies = await prisma.historicalPregnancy.findMany({
      where: { patientId: patient.id }
    });

    const investigations = await prisma.investigation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' }
    });

    const carePlan = await prisma.carePlan.findUnique({
      where: { patientId: patient.id }
    });
    
    res.json({ 
      patient: { ...patientWithoutPassword, _id: patient.id }, 
      vitals, 
      medicalHistory, 
      historicalPregnancies, 
      investigations, 
      carePlan 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospital/vitals', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { patientId, complaints, gestationalAge, complications, bloodPressure, weight, height, pulse, temp, bmi, muac, nutritionalStatus, generalExam, sfHeight, vaginalExam, fetalHeartRate, bloodSugar, doctorNotes } = req.body;
    
    if (req.user.role === 'Nurse' && (doctorNotes || generalExam || vaginalExam)) {
      return res.status(403).json({ message: 'Nurses cannot add doctor notes or physical/pelvic exams' });
    }

    const vitals = await prisma.antenatalVisit.create({
      data: {
        patientId,
        recordedById: req.user._id,
        complaints,
        gestationalAge,
        complications,
        bloodPressure,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        pulse: pulse ? parseInt(pulse) : null,
        temp: temp ? parseFloat(temp) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        muac: muac ? parseFloat(muac) : null,
        nutritionalStatus,
        fetalHeartRate: fetalHeartRate ? parseFloat(fetalHeartRate) : null,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        generalExam: req.user.role === 'Doctor' ? generalExam : null,
        sfHeight: sfHeight ? parseFloat(sfHeight) : null,
        vaginalExam: req.user.role === 'Doctor' ? vaginalExam : null,
        doctorNotes: req.user.role === 'Doctor' ? doctorNotes : null
      }
    });

    res.json({ message: 'Vitals saved successfully', vitals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hospital/alerts', authMiddleware, (req, res) => {
  if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ alerts: activeAlerts });
});

app.post('/api/hospital/alerts/:id/clear', authMiddleware, (req, res) => {
  if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') {
    return res.status(403).json({ message: 'Access denied' });
  }
  activeAlerts = activeAlerts.filter(a => a.id !== req.params.id);
  res.json({ message: 'Alert cleared' });
});

// --- NEW V2.0 ENDPOINTS ---

app.post('/api/patient/onboarding', authMiddleware, async (req, res) => {
  try {
    const { lmp } = req.body;
    if (!lmp) return res.status(400).json({ message: 'LMP is required' });

    const history = await prisma.medicalHistory.upsert({
      where: { patientId: req.user._id },
      update: { lmp: new Date(lmp) },
      create: { patientId: req.user._id, lmp: new Date(lmp) }
    });

    // Also update Patient EDD (LMP + 280 days)
    const edd = new Date(new Date(lmp).getTime() + 1000 * 60 * 60 * 24 * 280);
    await prisma.patient.update({
      where: { id: req.user._id },
      data: { edd }
    });

    res.json({ message: 'Onboarding complete', history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/hospital/patient/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor' && req.user.role !== 'Nurse') return res.status(403).json({ message: 'Denied' });
    const p = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ message: 'Patient updated', patient: p });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hospital/patient/:id/history', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ message: 'Only Doctors can update Medical History' });
    const history = await prisma.medicalHistory.upsert({
      where: { patientId: req.params.id },
      update: req.body,
      create: { patientId: req.params.id, ...req.body }
    });
    res.json({ message: 'Medical History saved', history });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hospital/patient/:id/investigations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ message: 'Only Doctors can add Labs' });
    const inv = await prisma.investigation.create({
      data: {
        patientId: req.params.id,
        recordedById: req.user._id,
        testType: req.body.testType,
        result: req.body.result
      }
    });
    res.json({ message: 'Lab recorded', investigation: inv });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hospital/patient/:id/careplan', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ message: 'Only Doctors can update Care Plans' });
    const plan = await prisma.carePlan.upsert({
      where: { patientId: req.params.id },
      update: req.body,
      create: { patientId: req.params.id, ...req.body }
    });
    res.json({ message: 'Care Plan saved', plan });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Pre-load some SOS alerts upon startup for real-time simulation
activeAlerts = [
  {
    id: 'SIM-1',
    patientId: 'PATIENT-67890',
    patientName: 'Elena Gilbert',
    emergencyContact: 'Stefan Salvatore: 555-0100',
    time: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
  },
  {
    id: 'SIM-2',
    patientId: 'PATIENT-44556',
    patientName: 'Mary Jane Watson',
    emergencyContact: 'Peter Parker: 555-0444',
    time: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
  }
];

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
