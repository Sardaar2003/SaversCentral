# SaversCentral Portal - Backend API

The backend is built with **Node.js**, **Express**, and **MongoDB (Mongoose)**, providing a secure, JWT-authenticated REST API for managing users, squads, and processing orders through the Sublytics gateway.

---

## Technical Stack
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express
* **Database**: MongoDB (via Mongoose ODM)
* **Auth**: JSON Web Tokens (JWT) + bcryptjs
* **HTTP Client**: Axios (for payment gateway integration)

---

## Folder Structure
```
backend/
├── config/             # Database connection and config
├── controllers/        # Request handlers (auth, users, orders, products)
├── middleware/         # Auth verification and Role-Based Access Control (RBAC)
├── models/             # Mongoose schemas (User, Project, Product, Order, Team)
├── routes/             # Express routes mounting controllers
├── services/           # Gateway adapters (Sublytics API integration)
├── .env                # App environment configuration variables
├── server.js           # Server entrance and DB seeder configuration
└── package.json
```

---

## Setup & Environment Variables
Create a `.env` file in the root of the `/backend` folder with the following variables:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
JWT_SECRET=supersecure_token_secret_12891823_prod
SUBLYTICS_URL=https://redeo.sublytics.com/api/order/doAddProcess
SUBLYTICS_USER_ID=102
SUBLYTICS_PASSWORD=your_gateway_password
```

### Running the Backend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (uses `nodemon` for auto-reloading):
   ```bash
   npm run dev
   ```
   The API will listen at `http://localhost:5000/api`.

---

## API Endpoints

### 1. Authentication (`/api/auth`)
* `POST /login`: Log in and retrieve a JWT session token.
* `POST /register`: Create a new user account (the first registered user defaults to the `admin` role).
* `POST /forgot-password`: Lightweight password recovery and reset verification.

### 2. User & Team Management (`/api/users`)
*Requires Admin access (`protect`, `authorize('admin')`)*
* `GET /`: Retrieve all registered users.
* `DELETE /:id`: Safely delete a user account and clean up their assignments.
* `PATCH /:id/role`: Change user role (`admin` \| `manager` \| `user`).
* `PATCH /:id/status`: Toggle user status (`active` \| `inactive`).
* `GET /teams`: List all manager-led squads.
* `POST /teams`: Create a new team with an assigned manager.
* `PUT /teams/:id`: Add or remove agent members and update squad properties.
* `DELETE /teams/:id`: Dissolve a team.

### 3. Projects & Campaigns (`/api/projects`, `/api/products`)
* `GET /projects`: Retrieve list of project containers (e.g., *SC Project*).
* `GET /products`: Retrieve products associated with a project (e.g. *SaversCentralOnline.com*). Supports filter by `projectId` query.

### 4. Orders & History (`/api/orders`)
* `POST /`: Submit an order to the Sublytics gateway. Requires validation on input formats, customer phone length, and email format rules (blocks generic dummy formats).
* `GET /`: Retrieve submission history logs. Supports pagination, date range filters, project/product filters, and customer phone searches.
* `GET /stats`: Retrieve aggregated role-based dashboard statistics:
  * **Admin**: Global corporate metrics (Total sales revenue, success rate, total orders).
  * **Manager**: Squad-level statistics aggregated from all assigned agents.
  * **User (Agent)**: Personal sales stats.
* `GET /export`: Generate and stream a CSV spreadsheet of the filtered logs.

---

## Database Seed Configuration
On database startup, the server automatically scans the database to validate configuration:
1. Seeds or verifies the parent container **SC Project**.
2. Seeds or validates the default campaign products:
   - **SaversCentralOnline.com** (ID: 136, Offer: 4)
   - **HolidaySaversOnline.com** (ID: 137, Offer: 6)
   - **IDVaultUSA.com** (ID: 138, Offer: 86)
3. Prunes legacy, unlinked campaigns.
