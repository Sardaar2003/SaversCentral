# SaversCentral Portal - Sales & Billing Platform

Welcome to the **SaversCentral Portal**! This repository contains the complete codebase for a role-based sales management and payment gateway submission system.

The portal connects directly to the **Sublytics API gateway** to process card payments, aggregates logs, compiles statistics, and provides administration views for managing agents and squads.

---

## Repository Structure
This project is organized into two main applications and a local database folder:

* **[`/backend`](file:///e:/Mohanty_Project_08_06_2026/backend/README.md)**: Node.js/Express REST API. Connects to MongoDB, manages business logic, enforces role permissions, and integrates with the Sublytics gateway API.
* **[`/frontend`](file:///e:/Mohanty_Project_08_06_2026/frontend/README.md)**: Single-page application (SPA) client built with React 19 and Vite. Styled with vanilla CSS variables (Inter/Outfit typography, glassmorphism theme).
* **`/mongodb-data`**: Folder containing the local MongoDB database files.

---

## Role-Based Access Matrix

| Role | Submit Orders? | View Team Logs? | View Global Logs? | Create/Delete Teams? | Delete/Modify Users? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Yes | Yes | Yes | Yes | Yes |
| **Manager** | No | Yes | No | No | No |
| **Agent (User)** | Yes | No (Self only) | No | No | No |

---

## Seed Accounts for Testing
Use these pre-registered logins to inspect the layout for different roles:

* **Admin User**: Username: `admin` | Password: `admin123`
* **Manager User**: Username: `manager` | Password: `manager123`
* **Agent User**: Username: `user` | Password: `user123`

---

## Quick Start Guide

### Step 1: Start the MongoDB Server
Start your local MongoDB instance pointing to the data folder in this project:
```powershell
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "e:\Mohanty_Project_08_06_2026\mongodb-data" --port 27017
```
*(Alternatively, configure the remote `MONGO_URI` in `/backend/.env` to connect to an Atlas cluster.)*

### Step 2: Configure & Start the Backend API
1. Navigate to `/backend`.
2. Create and configure your `.env` file (see [Backend Configuration](file:///e:/Mohanty_Project_08_06_2026/backend/README.md#setup--environment-variables)).
3. Install dependencies and run in development mode:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The backend API will start on `http://localhost:5000`.

### Step 3: Start the React Frontend
1. Navigate to `/frontend`.
2. Install dependencies and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend dev server will launch at `http://localhost:3000`.
3. Open `http://localhost:3000` in your browser and sign in using the seed credentials above.
