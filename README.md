# Econ With Thusitha — LMS

A production-ready Learning Management System for A/L Economics tuition, built on the MERN stack and deployable on Vercel.

## Stack
- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose), JWT (httpOnly cookies)
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, React Query, React Hook Form + Zod
- **Uploads:** Cloudinary (signed direct browser → Cloudinary)
- **Payments:** Bank transfer (slip upload) + PayHere
- **Hosting:** Vercel (two projects — `frontend/` and `backend/` from same repo)

## Production URLs

| Surface | URL |
|---|---|
| Frontend (apex + www) | https://econwiththusitha.com / https://www.econwiththusitha.com |
| Backend API | https://api.econwiththusitha.com |
| Health check | https://api.econwiththusitha.com/api/health |

## Quick Start (local dev)

```bash
# 1. Backend
cd backend
cp ../.env.example .env       # edit values; for dev, set CLIENT_URL=http://localhost:5173
npm install
npm run seed                  # creates teacher + sample classes + 10 students
npm run dev                   # runs on :5001

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                   # runs on :5173
```

Open http://localhost:5173.

## Default Accounts (after seed)
- **Teacher:** `teacher@econwiththusitha.com` / `teacher123`
- **Students:** `student1@test.lk` … `student10@test.lk` / `student123`

## Folders
```
backend/   Express API (deployed as Vercel serverless function)
frontend/  Vite React SPA (deployed as Vercel static site)
```
