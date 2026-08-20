# Resume AI — Intelligent Career Role Prediction & Learning Roadmaps ⚡

A modern, production-ready React + Vite frontend for **Resume AI**, featuring an interactive **3D WebGL Holographic AI Career Architect (Kirmada)** with **natural spoken English voice guidance**, live animated IT company environment, surgical skill-gap analysis, role fit prediction, and tailored 3-phase milestone execution roadmaps.

---

## ✨ Features

- **🌐 3D WebGL Holographic AI Character (Kirmada)**:
  - Built with `@react-three/fiber` & Three.js.
  - Interactive pointer parallax (tilts & tracks cursor in real time).
  - Audio-reactive 3D concentric energy rings that expand and accelerate when Kirmada speaks.
  - 3D projector pedestal emitting volumetric holographic light.
- **🎙️ Spoken English Voice Guidance**:
  - Natural English voice narration via the browser's Web Speech API.
  - Real-time frequency visualizer soundwave bars.
  - Dedicated **Voice ON / Mute** and **Replay Voice** audio toolbar.
- **🏢 Live Animated IT Company Background**:
  - Isometric cyber grid, flowing vertical fiber-optic laser data streams, and active datacenter rack telemetry (`RACK-ALPHA // SF-HQ`).
- **📄 Resume Intake & In-Memory Parsing**:
  - Drag-and-drop support for `.pdf` and `.docx` (<5MB).
  - Client-side validation with instant file reset.
  - Pre-loaded benchmark profile (*Alex Chen - Senior Full-Stack & AI Engineer*) for instant demo testing.
- **🎯 Predictive Role Matching**:
  - Multi-dimensional fit scores across 500+ tech career specializations with explainable AI justifications and salary telemetry.
- **🔍 Surgical Skill Gap Analysis**:
  - Tri-tier competency categorization (Green = Matched, Gold = Growth Gap, Red = Missing High Impact) with circular match percentage rings.
- **🗺️ Personalized 3-Phase Learning Roadmap**:
  - Time-sequenced curriculum (*Foundation ➔ Intermediate ➔ Advanced Capstone*).
  - External curated course links, weekly milestone checklists, and celebratory confetti completion.
- **🔒 Authentication & Session Management**:
  - JWT token storage in `localStorage` + React Context.
  - Central Axios instance targeting `http://localhost:8000` with automatic bearer token attachment.
  - Global 401 session expiry interceptor and instant demo login.

---

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS, Lucide React Icons
- **Animation**: Framer Motion
- **3D Graphics**: Three.js, `@react-three/fiber`
- **Voice Engine**: Web Speech API (`SpeechSynthesisUtterance`)
- **API Client**: Axios with global interceptors

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` or `yarn` or `pnpm`

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd resume-ai-frontend
npm install
```

### 3. Running Development Server
Start the local Vite dev server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Building for Production
To generate an optimized production build:
```bash
npm run build
```
The output will be placed in the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
resume-ai-frontend/
├── public/
│   ├── kirmada.jpg             # High-res Kirmada 3D Hologram asset
│   └── himawari.jpg
├── src/
│   ├── api/
│   │   ├── client.js           # Central Axios instance with JWT interceptor
│   │   ├── auth.js             # Authentication API calls
│   │   ├── resume.js           # Resume upload & analysis API calls
│   │   └── mockData.js         # Comprehensive realistic mock datasets
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── common/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── CircularProgress.jsx
│   │   │   ├── OrbitingSpinner.jsx
│   │   │   └── StateFallback.jsx
│   │   ├── guide/
│   │   │   ├── AIGuideCharacter.jsx     # Kirmada 3D & dialogue HUD
│   │   │   └── InteractiveGuidedFlow.jsx # 5-step guided option wizard
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── PageWrapper.jsx
│   │   ├── office/
│   │   │   └── LiveITCompanyBackground.jsx # Animated cyber office grid
│   │   └── three/
│   │       └── KirmadaHologram3D.jsx    # React Three Fiber 3D Scene
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   └── useAIVoice.js       # Web Speech API English voice hook
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── UploadResumePage.jsx
│   │   ├── ResultsPage.jsx
│   │   ├── SkillGapPage.jsx
│   │   ├── RoadmapPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 👥 Team Contribution Workflow

1. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```
3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request on GitHub.
