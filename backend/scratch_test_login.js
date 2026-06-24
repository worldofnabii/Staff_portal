async function test() {
  const credentials = [
    { email: 'admin@exam.com', password: 'Hope1234', role: 'Admin' },
    { email: 'doctor.hope@hospital.com', password: 'Welcome123', role: 'Doctor' },
    { email: 'nurse.hope@hospital.com', password: 'Welcome123', role: 'Nurse' }
  ];

  for (const cred of credentials) {
    try {
      console.log(`Trying to login as ${cred.role} (${cred.email})...`);
      const res = await fetch('http://localhost:5000/api/auth/login/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`Success! Logged in as ${data.user.name} (${data.user.role}) for ${data.user.hospitalName}`);
      } else {
        console.log(`FAILED for ${cred.role}:`, data.message || data.error);
      }
    } catch (err) {
      console.log(`FAILED for ${cred.role}:`, err.message);
    }
  }
}

test();
