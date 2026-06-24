const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({
    include: {
      hospital: true,
      medicalHistory: true
    }
  });
  console.log("Registered Patients in Database:");
  patients.forEach(p => {
    console.log(`- ID: ${p.id}, Name: ${p.name}, Email: ${p.email}, Hospital: ${p.hospital.name} (ID: ${p.hospitalId})`);
  });
  
  const staff = await prisma.staff.findMany({
    include: {
      hospital: true
    }
  });
  console.log("\nRegistered Staff in Database:");
  staff.forEach(s => {
    console.log(`- Name: ${s.name}, Email: ${s.email}, Role: ${s.role}, Hospital: ${s.hospital.name} (ID: ${s.hospitalId})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
