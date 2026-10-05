# ⚡ ApexScout — Next-Gen AI Sports Talent Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?style=flat&logo=prisma)](https://prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI%20Agents-orange?style=flat&logo=google)](https://ai.google.dev/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Pose%20CV-purple?style=flat&logo=ultralytics)](https://ultralytics.com/)

**ApexScout** is a full-stack, AI-powered multi-sport talent scouting platform that discovers, rates, and validates grassroots athletic performance through automated video computer vision, Elo-weighted talent indexing, and generative scout report agents.

---

## 🌟 Key Features

- 🧠 **Google Gemini 2.5 AI Scout Reports**: Automatic generative synthesis of player strengths, developmental areas, and talent potential.
- 🎯 **Computer Vision Pose Analytics (YOLOv8)**: Microservice performing kinematic pose tracking, biomechanical release/kick angle analysis, and jump velocity measurement from match clips.
- 📊 **Dynamic Talent Index Engine**: Context-aware rating algorithms adjusting player ratings relative to opposition league difficulty (Cricket, Football, Basketball, Tennis).
- ⚡ **Modern Next.js & Tailwind Dashboard**: High-performance dashboard with glassmorphism, responsive analytics, real-time scout filtering, and video highlight playback.
- 🗄️ **PostgreSQL + Prisma ORM**: Enterprise data persistence and schema migrations.

---

## 🏗️ Architecture

```
ApexScout/
├── frontend/               # Next.js 15 + Tailwind CSS Dashboard (Port 3001)
│   └── src/app/            # App router, UI components, talent filters
├── cv-microservice/        # Python FastAPI + Ultralytics YOLOv8 Pose Estimation (Port 8000)
│   ├── main.py
│   └── requirements.txt
├── lib/
│   ├── agents/             # Gemini LLM AI Scout, Discovery, Verification & Matching Agents
│   ├── engines/            # Multi-sport Elo rating calculators (Cricket, Football, etc.)
│   └── video/              # Video ingestion pipeline
├── prisma/                 # Prisma ORM Schema & seed scripts
├── routes/                 # Express REST API routes (players, scout, agents, video)
└── server.js               # Node.js Express server (Port 3000)
```

---

## 🚀 Quick Start

### 1. Backend & AI API
```bash
npm install
npm run seed      # Seeds initial player & match database
npm start         # Runs Express API on http://localhost:3000
```

### 2. Frontend Dashboard
```bash
cd frontend
npm install
npm run dev       # Runs Next.js UI on http://localhost:3001
```

### 3. Computer Vision Microservice (Optional for CV analysis)
```bash
cd cv-microservice
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🔒 Environment Configuration

Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL="postgresql://user:password@localhost:5432/apexscout"
```

---

## 📄 License
MIT License. Built for empowering the next generation of athletes.
