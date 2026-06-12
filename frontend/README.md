# SaversCentral Portal - Frontend Client

This is a responsive, single-page application (SPA) client interface built with **React** and **Vite**. It features role-based dashboards, a multi-tier order submission wizard, aligned history logs, and administrative control panels.

---

## Technical Stack
* **Framework**: React 19 (ES Modules)
* **Build System**: Vite
* **Routing**: React Router DOM (v7)
* **Styling**: Vanilla CSS (CSS Custom Properties)
* **Icons**: React Icons (Feather Icons pack - `react-icons/fi`)

---

## Folder Structure
```
frontend/
├── public/             # Static public assets (favicon, images, etc.)
├── src/
│   ├── components/     # Reusable layout elements (Navbar, ProtectedRoute)
│   ├── config/         # Global API configuration (Axios base configuration)
│   ├── context/        # React Context stores (AuthContext, ToastContext)
│   ├── pages/          # Full page views:
│   │   ├── Dashboard.jsx        # Role-based stats panels (Admin / Manager / Agent)
│   │   ├── SubmitOrder.jsx      # Two-step sales submission wizard
│   │   ├── OrderHistory.jsx     # Aligned 5-column filter log and audit modals
│   │   ├── UserManagement.jsx   # Admin management of user logins & roles
│   │   ├── AdminDashboard.jsx   # Squad builder and project/product toggles
│   │   ├── Login.jsx            # Sign in interface
│   │   ├── Register.jsx         # Sign up interface
│   │   └── ForgotPassword.jsx   # Password reset screen
│   ├── App.jsx         # Application routes configuration
│   ├── index.css       # Global stylesheet (typography, colors, premium glass themes)
│   └── main.jsx        # App entrance script
├── index.html          # HTML Entry and Page Meta tags
├── vite.config.js
└── package.json
```

---

## Key Features

### 1. Role-Based Navigation & Dashboards
* **Admin**: Global corporate metrics panel, full user list controls (delete, enable/disable), squad configuration (promote managers, assign agents), and full audit history with API JSON log viewers.
* **Manager**: Squad dashboard (aggregating KPIs of team members), team logs list, and CSV log exporter. Managers are blocked from submitting sales.
* **Agent (User)**: Sales submission form wizard, personal performance stats dashboard, and self-service logs.

### 2. Multi-Tier Submit Order Wizard (`/submit`)
Allows agents to submit sales records to Sublytics safely:
* **Step 1 (Project Selection)**: Renders a premium grid of project container cards. Clicking a card selects it and advances to the form.
* **Step 2 (Product & Form details)**: Renders a dropdown select for Campaign Products linked to the project, loading campaign details (monthly fees, trial costs, IDs). Dynamic forms are rendered below.
* **"Back to Projects"** navigation lets users reset the wizard.

### 3. Aligned History Logs (`/history`)
* Renders transaction cards with clear indicators for Gateway Approval or Decline.
* Integrates a **5-column responsive filter grid** aligning Project, Product, Start Date, End Date, and Customer Phone Search inline.
* Displays a detailed **API Audit Logs Modal** containing JSON raw payloads and responses received from the Sublytics API gateway.

---

## Setup & Running Guide

### 1. Installation
Install project dependencies in the `/frontend` folder:
```bash
npm install
```

### 2. Run Locally (Development mode)
Start the Vite local server (HMR enabled):
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Build for Production
Compile optimized assets into the `/dist` directory (automatically hosted by the backend in production mode):
```bash
npm run build
```
This builds:
* `dist/index.html` (Entrypoint)
* `dist/assets/` (Minified JS and compiled CSS styling)
