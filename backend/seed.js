const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Scaling MammaCare with massive multi-tenant data...');

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // 1. CREATE HOSPITALS
  const hospitalsData = [
    { name: 'MammaCare General Hospital', address: '123 Health Ave, Kampala', licenseNumber: 'MOU-HQ-001' },
    { name: 'Western Memorial Medical Center', address: '45 Ridge Rd, Fort Portal', licenseNumber: 'MOU-WEST-002' },
    { name: 'St. Mary’s Maternity Clinic', address: '88 Grace St, Gulu', licenseNumber: 'MOU-NORTH-003' }
  ];

  const hospitals = [];
  for (const h of hospitalsData) {
    const created = await prisma.hospital.upsert({
      where: { licenseNumber: h.licenseNumber },
      update: h,
      create: h
    });
    hospitals.push(created);
  }

  // 2. CREATE STAFF (Admins, Doctors, Nurses)
  const staffData = [
    // HQ STAFF
    { name: 'Hospital Admin', email: 'admin@hospital.com', role: 'Admin', hospitalId: hospitals[0].id },
    { name: 'Dr. Jane Smith', email: 'doctor@hospital.com', role: 'Doctor', hospitalId: hospitals[0].id },
    { name: 'Nurse Joy', email: 'nurse@hospital.com', role: 'Nurse', hospitalId: hospitals[0].id },
    // MEMORIAL STAFF
    { name: 'Memorial Admin', email: 'admin@memorial.com', role: 'Admin', hospitalId: hospitals[1].id },
    { name: 'Dr. Alan Grant', email: 'alan@memorial.com', role: 'Doctor', hospitalId: hospitals[1].id },
    // ST MARYS STAFF
    { name: 'St Mary Admin', email: 'admin@stmarys.com', role: 'Admin', hospitalId: hospitals[2].id },
    { name: 'Nurse Sarah', email: 'sarah@stmarys.com', role: 'Nurse', hospitalId: hospitals[2].id }
  ];

  const staff = [];
  for (const s of staffData) {
    const created = await prisma.staff.upsert({
      where: { email: s.email },
      update: { ...s, password },
      create: { ...s, password }
    });
    staff.push(created);
  }

  // 3. CREATE PATIENTS (20+ diverse scenarios)
  const patientsToCreate = [
    { id: 'PATIENT-001', name: 'Elena Gilbert', email: 'elena@mysticfalls.com', hospitalId: hospitals[0].id, bloodGroup: 'A-' },
    { id: 'PATIENT-002', name: 'Sarah Connor', email: 'sarah@example.com', hospitalId: hospitals[0].id, bloodGroup: 'O+' },
    { id: 'PATIENT-003', name: 'Lois Lane', email: 'lois@dailyplanet.com', hospitalId: hospitals[0].id, bloodGroup: 'B+' },
    { id: 'PATIENT-004', name: 'Mary Jane', email: 'mj@oscorp.com', hospitalId: hospitals[1].id, bloodGroup: 'O-' },
    { id: 'PATIENT-005', name: 'Diana Prince', email: 'diana@themyscira.com', hospitalId: hospitals[2].id, bloodGroup: 'AB+' }
  ];

  // CLEAR OLD DATA FOR TEST PATIENTS (Forces onboarding screen to show up again)
  await prisma.medicalHistory.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.antenatalVisit.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.prescription.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.appointment.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.carePlan.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.investigation.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });
  await prisma.preventativeCare.deleteMany({ where: { patientId: { in: ['PATIENT-002', 'PATIENT-004'] } } });

  // Adding more generic scale
  for(let i=6; i<=25; i++) {
    const hIdx = i % 3;
    patientsToCreate.push({
      id: `PATIENT-${i.toString().padStart(3, '0')}`,
      name: `Patient Example ${i}`,
      email: `patient${i}@example.com`,
      hospitalId: hospitals[hIdx].id,
      bloodGroup: i % 2 === 0 ? 'O+' : 'A+'
    });
  }

  for (const p of patientsToCreate) {
    const isNew = p.id === 'PATIENT-002' || p.id === 'PATIENT-004'; // Sarah and MJ want fresh onboarding
    await prisma.patient.upsert({
      where: { email: p.email },
      update: { 
        ...p, 
        password, 
        edd: isNew ? null : new Date(Date.now() + 1000*60*60*24*150) 
      },
      create: { 
        ...p, 
        password, 
        edd: isNew ? null : new Date(Date.now() + 1000*60*60*24*150) 
      }
    });
  }

  // 4. CREATE PRESCRIPTIONS
  const meds = [
    { patientId: 'PATIENT-001', medication: 'Methyldopa (Aldomet)', dosage: '250mg', frequency: 'TID', duration: 'Until Delivery', notes: 'Maintain BP below 140/90' },
    { patientId: 'PATIENT-001', medication: 'Folic Acid', dosage: '5mg', frequency: 'Once Daily', duration: '90 days', notes: 'Standard supplement' },
    { patientId: 'PATIENT-002', medication: 'Folic Acid', dosage: '5mg', frequency: 'Once Daily', duration: '90 days', notes: 'Daily supplement' },
    { patientId: 'PATIENT-002', medication: 'Ferrous Sulfate', dosage: '200mg', frequency: 'Once Daily', duration: '6 months', notes: 'Take with orange juice' },
    { patientId: 'PATIENT-002', medication: 'Calcium Carbonate', dosage: '500mg', frequency: 'Twice Daily', duration: '30 days', notes: 'For bone health' },
    { patientId: 'PATIENT-003', medication: 'Metformin', dosage: '500mg', frequency: 'Twice Daily', duration: '30 days', notes: 'G-Diabetes management' },
    { patientId: 'PATIENT-005', medication: 'Iron Supplement', dosage: '200mg', frequency: 'Once Daily', duration: '6 months', notes: 'For mild anemia' }
  ];

  for (const m of meds) {
    const doc = staff.find(s => s.role === 'Doctor' && s.hospitalId === hospitals.find(h => h.patients?.some(p => p.id === m.patientId))?.id) || staff.find(s => s.role === 'Doctor');
    await prisma.prescription.create({
      data: {
        ...m,
        prescribedById: doc.id,
        hospitalId: doc.hospitalId
      }
    });
  }

  // 5. SEED VITALS HISTORY
  const visits = [
    { patientId: 'PATIENT-001', bloodPressure: '150/100', weight: 72.5, fetalHeartRate: 145, bloodSugar: 6.2, doctorNotes: 'Preeclampsia warning.' },
    { patientId: 'PATIENT-002', bloodPressure: '110/70', weight: 65.0, fetalHeartRate: 140, urineProtein: 'Nil', urineSugar: 'Nil', createdAt: new Date('2026-01-15T10:00:00Z') },
    { patientId: 'PATIENT-002', bloodPressure: '115/75', weight: 66.2, fetalHeartRate: 142, urineProtein: 'Trace', urineSugar: 'Nil', createdAt: new Date('2026-02-10T11:00:00Z') },
    { patientId: 'PATIENT-002', bloodPressure: '118/80', weight: 67.5, fetalHeartRate: 144, urineProtein: '1+', urineSugar: 'Nil', createdAt: new Date('2026-03-05T09:30:00Z') },
    { patientId: 'PATIENT-002', bloodPressure: '120/80', weight: 69.1, fetalHeartRate: 145, urineProtein: 'Nil', urineSugar: 'Trace', createdAt: new Date('2026-03-25T14:00:00Z') },
    { patientId: 'PATIENT-002', bloodPressure: '122/82', weight: 70.8, fetalHeartRate: 148, urineProtein: '1+', urineSugar: 'Nil', createdAt: new Date('2026-04-10T08:45:00Z') }
  ];

  for (const v of visits) {
    await prisma.antenatalVisit.create({
      data: {
        ...v,
        recordedById: staff[2].id, // Nurse Joy
        hospitalId: hospitals[0].id
      }
    });
  }

  // 6. SEED LABS & PLANS FOR SARAH
  await prisma.carePlan.create({
    data: {
      patientId: 'PATIENT-002',
      deliveryPlan: 'MammaCare General Hospital',
      feedingOption: 'Exclusive Breastfeeding',
      maternityWaitingHome: true,
      transportLogistics: 'Private Vehicle arranged'
    }
  });

  await prisma.investigation.createMany({
    data: [
      {
        patientId: 'PATIENT-002',
        testType: 'Hemoglobin (Hb)',
        category: 'Lab',
        result: '11.5 g/dL',
        recordedById: staff[2].id,
        hospitalId: hospitals[0].id,
        date: new Date('2026-03-25T14:00:00Z')
      },
      {
        patientId: 'PATIENT-002',
        testType: 'Malaria RDT',
        category: 'Lab',
        result: 'Negative',
        recordedById: staff[3].id,
        hospitalId: hospitals[1].id,
        date: new Date('2026-02-10T11:00:00Z')
      }
    ]
  });

  await prisma.preventativeCare.createMany({
    data: [
      {
        patientId: 'PATIENT-002',
        supplementType: 'Tetanus Toxoid (TT1)',
        recordedById: staff[2].id,
        hospitalId: hospitals[0].id,
        date: new Date('2026-01-15T10:00:00Z')
      },
      {
        patientId: 'PATIENT-002',
        supplementType: 'IPTp-SP (1st Dose)',
        recordedById: staff[2].id,
        hospitalId: hospitals[0].id,
        date: new Date('2026-03-25T14:00:00Z')
      }
    ]
  });

  // 7. SEED APPOINTMENTS FOR SARAH
  await prisma.appointment.create({
    data: {
      patientId: 'PATIENT-002',
      hospitalId: hospitals[0].id,
      date: new Date(Date.now() + 1000*60*60*24*7), // 7 days from now
      purpose: 'Regular Antenatal Checkup',
      status: 'Scheduled'
    }
  });

  console.log('System Scaled Successfully!');
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
