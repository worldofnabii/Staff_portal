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
    await prisma.patient.upsert({
      where: { email: p.email },
      update: { ...p, password, edd: new Date(Date.now() + 1000*60*60*24*150) },
      create: { ...p, password, edd: new Date(Date.now() + 1000*60*60*24*150) }
    });
  }

  // 4. CREATE PRESCRIPTIONS
  const meds = [
    { patientId: 'PATIENT-001', medication: 'Methyldopa (Aldomet)', dosage: '250mg', frequency: 'TID', duration: 'Until Delivery', notes: 'Maintain BP below 140/90' },
    { patientId: 'PATIENT-001', medication: 'Folic Acid', dosage: '5mg', frequency: 'Once Daily', duration: '90 days', notes: 'Standard supplement' },
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
  await prisma.antenatalVisit.create({
    data: {
      patientId: 'PATIENT-001',
      recordedById: staff[2].id, // Nurse Joy
      hospitalId: hospitals[0].id,
      bloodPressure: '150/100',
      weight: 72.5,
      fetalHeartRate: 145,
      bloodSugar: 6.2,
      doctorNotes: 'Preeclampsia warning. Prescribed Methyldopa.'
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
