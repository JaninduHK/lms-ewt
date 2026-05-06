# Econ With Thusitha — LMS

A production-ready Learning Management System for A/L Economics tuition, built on the MERN stack.

## Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT (httpOnly cookies), Multer
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, React Query, React Hook Form + Zod
- **Payments:** Bank transfer (slip upload) + PayHere

## Quick Start

```bash
# 1. Copy env
cp .env.example backend/.env
# Fill in JWT secrets and (optionally) PayHere credentials

# 2. Backend
cd backend
npm install
npm run seed     # creates teacher@econwiththusitha.lk / teacher123 + sample classes + students
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 — backend on http://localhost:5000.

## Default Accounts (after seed)
- **Teacher:** `teacher@econwiththusitha.lk` / `teacher123`
- **Students:** `student1@test.lk` … `student10@test.lk` / `student123`

## Folders
```
backend/   Express API
frontend/  Vite React SPA
```
