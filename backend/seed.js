const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('PostgreSQL connected for enhanced seeding');

  // Clear existing items
  await prisma.antenatalVisit.deleteMany({});
  await prisma.carePlan.deleteMany({});
  await prisma.preventativeCare.deleteMany({});
  await prisma.investigation.deleteMany({});
  await prisma.historicalPregnancy.deleteMany({});
  await prisma.medicalHistory.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.patient.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // --- SEED STAFF ---
  const doctor1 = await prisma.staff.create({
    data: { name: 'Dr. Jane Smith', email: 'doctor@hospital.com', password, role: 'Doctor' }
  });

  const doctor2 = await prisma.staff.create({
    data: { name: 'Dr. Alan Grant', email: 'agrant@hospital.com', password, role: 'Doctor' }
  });

  const nurse1 = await prisma.staff.create({
    data: { name: 'Nurse Joy', email: 'nurse@hospital.com', password, role: 'Nurse' }
  });

  // --- SEED PATIENTS ---
  const patientsData = [
    {
      id: 'PATIENT-12345',
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password,
      bloodGroup: 'O+',
      edd: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 120), // ~4 months from now
      emergencyContact: 'John Connor: 555-0199',
      nin: 'NIN12345678',
      age: 28,
      village: 'Ntinda',
      district: 'Kampala',
      occupation: 'Teacher',
      religion: 'Christian',
      education: 'University',
      maritalStatus: 'Married'
    },
    {
      id: 'PATIENT-67890',
      name: 'Elena Gilbert',
      email: 'elena@mysticfalls.com',
      password,
      bloodGroup: 'A-',
      edd: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30), // ~1 month from now
      emergencyContact: 'Stefan Salvatore: 555-0100',
      nin: 'NIN98765432',
      age: 24,
      village: 'Mystic Falls',
      district: 'Wakiso',
      occupation: 'Student',
      religion: 'None',
      education: 'High School',
      maritalStatus: 'Single'
    },
    {
      id: 'PATIENT-11223',
      name: 'Lois Lane',
      email: 'lois@dailyplanet.com',
      password,
      bloodGroup: 'B+',
      edd: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 60), // ~2 months from now
      emergencyContact: 'Clark Kent: 555-9999',
      nin: 'NIN11223344',
      age: 32,
      village: 'Metropolis',
      district: 'Mukono',
      occupation: 'Journalist',
      religion: 'Christian',
      education: 'Masters',
      maritalStatus: 'Married'
    }
  ];

  for (const p of patientsData) {
    await prisma.patient.create({ data: p });
  }

  // --- SEED COMPREHENSIVE MEDICAL HISTORIES ---
  const histories = [
    { patientId: 'PATIENT-12345', gravida: 2, para: 1, abortions: 0, hivStatus: false, hypertension: false, diabetes: false, sickleCell: false },
    { patientId: 'PATIENT-67890', gravida: 1, para: 0, abortions: 0, hivStatus: false, hypertension: true, diabetes: false, sickleCell: false },
    { patientId: 'PATIENT-11223', gravida: 3, para: 2, abortions: 0, hivStatus: false, hypertension: false, diabetes: true, sickleCell: false }
  ];

  for (const h of histories) {
    await prisma.medicalHistory.create({ data: h });
  }

  // --- SEED HISTORICAL PREGNANCIES ---
  await prisma.historicalPregnancy.create({
    data: { patientId: 'PATIENT-12345', year: '2022', gestation: '39 weeks', deliveryType: 'SVD', complications: 'None', childOutcome: 'Alive', weight: 3.2 }
  });
  await prisma.historicalPregnancy.create({
    data: { patientId: 'PATIENT-11223', year: '2020', gestation: '40 weeks', deliveryType: 'C-Section', complications: 'Fetal Distress', childOutcome: 'Alive', weight: 4.1 }
  });

  // --- SEED VITALS AND EXAMS (ANTENATAL VISITS) ---
  const visits = [
    // Sarah's History (Healthy Trend)
    { patientId: 'PATIENT-12345', recordedById: nurse1.id, bloodPressure: '110/70', weight: 62.5, fetalHeartRate: 142, bloodSugar: 5.4, docNotes: null },
    { patientId: 'PATIENT-12345', recordedById: doctor1.id, bloodPressure: '115/75', weight: 64.0, fetalHeartRate: 145, bloodSugar: 5.6, generalExam: 'Normal contour, fundal height 22cm', docNotes: 'Patient progress is excellent. Standard follow-up scheduled.' },
    
    // Elena's History (High Risk Simulation: Increasing BP - Preeclampsia)
    { patientId: 'PATIENT-67890', recordedById: nurse1.id, bloodPressure: '130/85', weight: 70.0, fetalHeartRate: 138, bloodSugar: 6.1, docNotes: null },
    { patientId: 'PATIENT-67890', recordedById: nurse1.id, bloodPressure: '140/95', weight: 71.5, fetalHeartRate: 140, bloodSugar: 6.3, docNotes: null },
    { patientId: 'PATIENT-67890', recordedById: doctor2.id, bloodPressure: '155/100', weight: 73.0, fetalHeartRate: 148, bloodSugar: 6.5, generalExam: 'Edema present in lower extremities. Hyperreflexia.', docNotes: 'Signs of severe Preeclampsia. Admitting for monitoring.' },

    // Lois's History (Gestational Diabetes tracking)
    { patientId: 'PATIENT-11223', recordedById: doctor1.id, bloodPressure: '120/80', weight: 80.0, fetalHeartRate: 150, bloodSugar: 8.9, generalExam: 'Fundal height 28cm. Mild polyhydramnios.', docNotes: 'Monitor blood glucose. Prescribing diet control.' }
  ];

  for (const v of visits) {
    const { docNotes, ...data } = v;
    await prisma.antenatalVisit.create({
      data: {
        ...data,
        doctorNotes: docNotes
      }
    });
  }

  // --- SEED INVESTIGATIONS (LABS) ---
  const labs = [
    { patientId: 'PATIENT-12345', recordedById: doctor1.id, testType: 'Complete Blood Count', category: 'Lab', result: 'Hb: 12.5 g/dL, WBC: 7.2, Plt: 210', attachmentUrl: '#' },
    { patientId: 'PATIENT-12345', recordedById: doctor1.id, testType: 'Glucose Tolerance Test', category: 'Lab', result: 'Fasting: 92 mg/dL, 1hr: 140 mg/dL', attachmentUrl: '#' },
    { patientId: 'PATIENT-12345', recordedById: doctor1.id, testType: 'Obstetric Ultrasound', category: 'Imaging', result: 'Single live fetus, cephalic, 22 weeks gestation.', attachmentUrl: '#' },
    { patientId: 'PATIENT-12345', recordedById: doctor1.id, testType: 'Urinalysis', category: 'Lab', result: 'Protein: Neg, Sugar: Neg, WBC: 0-2', attachmentUrl: '#' },
    { patientId: 'PATIENT-67890', recordedById: doctor2.id, testType: 'Urine Protein', category: 'Lab', result: '+++', attachmentUrl: '#' },
    { patientId: 'PATIENT-11223', recordedById: doctor1.id, testType: 'Oral Glucose Tolerance Test', category: 'Lab', result: '155 mg/dL (Elevated)', attachmentUrl: '#' }
  ];

  for (const l of labs) {
    await prisma.investigation.create({ data: l });
  }

  // --- SEED PREVENTATIVE CARE ---
  const prevents = [
    { patientId: 'PATIENT-12345', recordedById: nurse1.id, supplementType: 'Folic Acid / Iron' },
    { patientId: 'PATIENT-12345', recordedById: nurse1.id, supplementType: 'Tetanus Toxoid 1' }
  ];

  for (const p of prevents) {
    await prisma.preventativeCare.create({ data: p });
  }

  // --- SEED CARE PLANS ---
  await prisma.carePlan.create({
    data: { patientId: 'PATIENT-12345', feedingOption: 'Exclusive Breastfeeding', maternityWaitingHome: false, deliveryPlan: 'SVD prepared for ward B.' }
  });
  await prisma.carePlan.create({
    data: { patientId: 'PATIENT-67890', feedingOption: 'Formula', maternityWaitingHome: true, deliveryPlan: 'High risk induced delivery. NICU standby.' }
  });

  // --- SEED APPOINTMENTS ---
  const appointments = [
    { patientId: 'PATIENT-12345', date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7), purpose: 'Routine Antenatal Follow-up' },
    { patientId: 'PATIENT-12345', date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 21), purpose: 'Anatomy Scan' },
    { patientId: 'PATIENT-67890', date: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2), purpose: 'BP Monitoring' }
  ];

  for (const a of appointments) {
    await prisma.appointment.create({ data: a });
  }

  console.log('Database seeded with comprehensive realtime data across all v2.0 structures.');
  console.log('Test Doctor: doctor@hospital.com / password123');
  console.log('Test Patient 1 (Healthy Demo): sarah@example.com (PATIENT-12345)');
  console.log('Test Patient 2 (Pre-eclampsia Demo): elena@mysticfalls.com (PATIENT-67890)');
  console.log('Test Patient 3 (G-Diabetes Demo): lois@dailyplanet.com (PATIENT-11223)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
