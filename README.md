# MammaCare: Digital Maternity Care System 💓

MammaCare is a modernized digital maternity platform designed to replace traditional paper-based antenatal cards. It provides a multi-tenant, real-time bridge between expectant mothers and hospital staff.

## 🚀 The Stack
- **Backend**: Node.js / Express with **Prisma ORM** & **PostgreSQL**.
- **Web Portal**: **Next.js** for secure clinical management and SOS monitoring.
- **Mobile App**: **React Native / Expo** for patient access and emergency alerts.
- **Infrastructure**: Fully **Dockerized** with **localtunnel** integration for public testing.

---

## 🛠 Features & Live Simulation
The system is pre-configured with a **Scaled Multi-Tenant Simulation**:

1.  **Emergency Response Hub**: Real-time SOS alerts with audio-visual cues and pulse monitoring.
2.  **Identity Scan**: Webcam-based QR lookup to instantly identify patients and open their clinical profiles.
3.  **Medication Tracking**: Integrated prescription management allowing patients to log intake on mobile.
4.  **Multi-Tenant Architecture**: 3 distinct hospitals (General, Memorial, St. Mary's) with isolated data and staff roles.

---

## 🚦 Access & Live URLs

> [!IMPORTANT]
> **External Testing**: To enable connectivity from real mobile devices on 4G/LTE, use the following public tunnels:

- **Hospital Web Portal**: [https://mammacare-portal-live.loca.lt](https://mammacare-portal-live.loca.lt)
- **Backend API Gateway**: [https://mammacare-api-live.loca.lt](https://mammacare-api-live.loca.lt)
- **Local Dev (Internal)**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Test Credentials

### 🏥 Hospital Ecosystem
| Facility | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **MammaCare General** | **Doctor** | `doctor@hospital.com` | `password123` |
| **MammaCare General** | **Nurse** | `nurse@hospital.com` | `password123` |
| **Western Memorial** | **Doctor** | `alan@memorial.com` | `password123` |
| **St. Mary's Clinic** | **Nurse** | `sarah@stmarys.com` | `password123` |

### 🤰 Patients (Mobile App)
| Scenario | Case Study | Email | Password |
| :--- | :--- | :--- | :--- |
| **High-Risk Case** | **Elena Gilbert** | `elena@mysticfalls.com` | `password123` |
| **Normal Case** | **Sarah Connor** | `sarah@example.com` | `password123` |
| **G-Diabetes Case** | **Lois Lane** | `lois@dailyplanet.com` | `password123` |

---

## 📱 Mobile App (Local Setup)
To run the Mobile app specifically:
1. Navigate to the `mobile/` directory.
2. Ensure the backend tunnel is running (`npx localtunnel --port 5000`).
3. Run `npx expo start`.
4. Scan the QR code with **Expo Go**.

---

## 🔒 Security & Code Quality
MammaCare is audited for security using **Snyk**.
- Run `snyk code test` in the root for SAST checks.
- Run `snyk container test` on the Docker images for vulnerability scans.

---
*Created for Advanced Maternity Care Digitalization.*
