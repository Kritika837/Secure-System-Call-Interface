# User-Friendly System Call Interface for Enhanced Security

A professional, MERN-stack based web interface that safely wraps operating system calls. This project demonstrates strict security measures, role-based access control, rate limiting, and comprehensive audit logging.

## Features
- **User Authentication:** Login system with bcrypt password hashing.
- **Role-Based Access Control:** Dual roles (`Admin` and `User`). Only authorized users can execute commands, while only Admins can view audit logs.
- **Secure System Call Wrapper:** A JavaScript intermediate layer simulating OS system calls like `readFile`, `writeFile`, `listDir`, and process management (`processList`). Validates all inputs to prevent arbitrary command injection.
- **Intrusion Prevention:** High-security rate limiting using `express-rate-limit` to block brute-force attempts and excessive API usages.
- **Dual Logging System:** Every system call execution is logged to a local file (`backend/logs/log.txt`) and a MongoDB collection, capturing username, timestamp, call name, exact parameters, and success/failure status.
- **Beautiful User Interface:** A dynamic, fast React SPA built with Vite. Implements modern aesthetic principles like glassmorphism, responsive data tables, and micro-animations.

## Architecture

1. **Frontend (Vite/React):** Communicates securely to the backend using Axios with JWT bearer tokens.
2. **Backend (Node.js/Express):** Handles the API routing.
   - **Auth Layer:** Validates credentials against MongoDB and signs JWTs.
   - **Syscall Service:** Validates the requested operations and acts as the gatekeeper before running local `fs` or `child_process` instructions.
3. **Database (MongoDB):** Stores User credentials securely and stores an immutable audit ledger of System Logs.

## Prerequisites
- Node.js (v16+ recommended).
- A locally running instance of **MongoDB** (`mongodb://127.0.0.1:27017`).

## Installation Steps

1. **Clone/Download the Repository**
2. **Backend Setup:**
   ```bash
   cd project/backend
   npm install
   ```
3. **Frontend Setup:**
   ```bash
   cd project/frontend
   npm install
   ```

## How to Run

1. **Seed the Database (One-time only):**
   This creates a default Admin and User.
   ```bash
   cd project/backend
   npm run seed
   # Or: node seed.js
   ```

2. **Start the Backend:**
   ```bash
   cd project/backend
   node server.js
   # Running on http://localhost:5000
   ```

3. **Start the Frontend:**
   Open a new terminal.
   ```bash
   cd project/frontend
   npm run dev
   # Running usually on http://localhost:5173
   ```

4. **Access the App:**
   - Go to `http://localhost:5173`
   - Default Accounts:
     - Admin: Username `admin` / Password `adminpassword`
     - User: Username `user` / Password `userpassword`

## Security Explanation

### How Unauthorized Access is Prevented
1. **Authentication:** User passwords are not stored in plaintext; they are hashed with a 10-round `bcrypt` salt.
2. **Authorization (JWT & RBAC):** Session identity is maintained by a JSON Web Token (JWT) signed using a secret. The backend validates this token via middleware (`authMiddleware.js`) on every request. Admins receive elevated JWT payloads that unlock the audit trails.
3. **Rate Limiting:** IP-based throttling protects against bot-nets attempting to guess passwords or spam the OS with expensive process calls.
4. **Call Sandboxing / Whitelisting:** The wrapper (`syscallWrapper.js`) implements a strict whitelist. If a user tries to inject malicious payloads into `processList`, the backend relies on an isolated `exec` with predefined arguments, or relies on Node's native sandboxed `fs` methods instead of shelling out to dangerous `bash` or `cmd` prompts.

### Logging Demonstration
Every time the `Execute System Call` button is pressed:
- A timestamp is generated.
- The `logSystemCall` service writes asynchronously to `project/backend/logs/log.txt`.
- The database registers a new Document in the `SystemLog` collection.
- Admins can log into the UI and navigate to the "Audit Logs" vault to see the exact payload and whether the transaction was approved or blocked.

## Limitations & Future Improvements
- **Encryption for Data at Rest:** Currently logs are stored in plaintext in the DB and file. Implementing Field-Level Encryption using AES-256 for sensitive parameters could prevent a database breach from exposing system architecture details.
- **Audit Trail Analysis:** Exploring ELK stack (Elasticsearch, Logstash, Kibana) integrations or implementing a graph-visualization in React to highlight behavioral anomalies automatically.
- **Real-World Application Parity:** To act as a genuine replacement for tools like `sudo`, it would need to securely hook into lower-level kernel structures via native C++ addons (`N-API`) rather than utilizing Node Core abstractions.
