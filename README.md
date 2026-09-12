# Higher Education Intelligent Document Intake & Decision Hub

An AI-powered Intelligent Document Intake & Decision Hub built for Higher Education institutions. The system automates document collection, structured entity extraction, cross-document integrity validation, and reviewer decision support across academic lifecycles (Admissions, Transcripts, Syllabi, Assessments, Research Proposals, Degree Certificates, and Fee Invoices) with strict human-in-the-loop governance.

---

## Key Highlights

- **Actual User Registration & Authentication**: Full self-service registration and login with bcrypt password hashing and JWT token issuance across the 4 core university roles:
  - **Applicant**: Submit documents, track intake status, and review evaluations.
  - **Reviewer**: Verify records, run AI extractions, validate fields, and make case decisions.
  - **Supervisor**: Monitor ageing SLA queues ($<24\text{h}$, $24-48\text{h}$, $>48\text{h}$ overdue), reviewer workloads, and reassign cases.
  - **Compliance Admin**: Manage institutional user directory, RBAC policies, audit logs, and system thresholds.
- **Clean Organic Data Pipeline**: All fake/dummy cases, mock documents, and placeholder exceptions have been removed. Every record in the system originates from real user registration and document submissions.
- **Live Google Gemini 3.6 Flash Integration**: High-speed OCR and structured JSON entity extraction with field-level confidence ratings ($0-100\%$) and grounded case summaries with page-level citations.
- **Secure File Integrity Pipeline**: Multi-part upload with instant SHA-256 cryptographic hashing and SecOps ClamAV signature scanning (`CLEAN` / `QUARANTINED`).
- **Split-Screen Review Workspace**: High-resolution document canvas with zoom, multi-page controls, and bounding-box highlighting upon selecting extracted fields.
- **Exception Review Queues**: Dedicated queues for Missing Data, Conflicting Data, Low-Confidence Extractions ($<80\%$), Expired Documents, and Duplicate Submissions.
- **Immutable Audit Trail**: Append-only audit logger capturing user registrations, logins, uploads, AI executions, human overrides, approvals, and system settings updates.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Backend**: Node.js (v24), Express.js, JWT, Bcrypt.js, Multer, Crypto
- **Generative AI**: Google Generative Language API (`gemini-3.6-flash`)
- **Database**: MongoDB Atlas with local file-backed persistence fallback (`backend/data/database.json`)

---

## Getting Started

### Installation
```bash
npm run install:all
```

### Running the Application
Start both the backend server (Port 5000) and frontend dev server (Port 5173) with a single command:
```bash
npm run dev
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Accounts & Registration

- **Self-Registration**: Click **"Create Account"** on [http://localhost:5173/login](http://localhost:5173/login) to register as any role (**Applicant**, **Reviewer**, **Supervisor**, or **Compliance Admin**).
- **Default Master Admin**:
  - Email: `admin@university.edu`
  - Password: `password123`
  - Role: `Compliance Admin`