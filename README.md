# ⚔️ The Fools Hunting Room — Full-Stack Global Web & Desktop Trading Platform

Welcome to **The Fools Hunting Room (`BJournal`)** — a professional, zero-knowledge encrypted trading journal, psychology tracker, live economic calendar, community chat, and analytics suite.

This repository has been upgraded to a **Full-Stack Hybrid Cloud Architecture** supporting **3 Deployment Modes**:
1. 🌐 **Global Online Web App**: Hosted on Render.com with MongoDB Atlas cloud database (`https://your-app.onrender.com`).
2. 💻 **Native Desktop Application**: Cross-platform Electron desktop app with installable `.exe` / `.dmg` packages (`desktop/`).
3. ⚡ **Local Hybrid Engine**: Offline-capable fallback storage (`data/db.json`) allowing immediate out-of-the-box operation without requiring local database daemons.

---

## 🏗️ Master Repository Structure

```
Journal1/
├── backend/                   # 🚀 Full-Stack Cloud Server (Express + MongoDB/Mongoose + Hybrid Engine)
│   ├── models/                # Database schemas & dual Mongo/Local Adapter (`dbAdapter.js`)
│   │   ├── User.js            # User account registry (superadmin, admin, customer)
│   │   ├── Vault.js           # Zero-knowledge AES-256-GCM encrypted journals
│   │   ├── ChatMessage.js     # Live hunting room community chat messages
│   │   └── ArenaSnapshot.js   # Public performance leaderboards & opt-in snapshots
│   ├── routes/                # REST API endpoints (/api/auth, /api/vault, /api/chat, /api/arena)
│   ├── data/                  # High-performance local JSON storage fallback (when MONGODB_URI is empty)
│   ├── newsFetcher.js         # Finnhub & ForexFactory economic news fetcher
│   ├── app.js                 # Unified entry point (serves API & built React frontend on single URL)
│   ├── package.json
│   └── .env.example
├── frontend/                  # 🎨 Modern React 19 + TypeScript + Tailwind CSS Vite Web Application
│   ├── src/                   # Source code (views, components, crypto vault engine, apiClient)
│   ├── public/                # Static assets, branding, and icons
│   ├── dist/                  # Compiled production singlefile HTML bundle
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── desktop/                   # 💻 Electron Desktop Application & Installer Setup
│   ├── main.js                # Main Electron process (dual cloud/local URL management, native menus)
│   ├── preload.js             # Secure IPC bridge (native file export, external links, health checks)
│   └── package.json           # Electron-builder configuration (.exe, .dmg, .deb generators)
├── BJournal-main/             # 🔄 Backward-compatible legacy synchronization directory
├── .gitignore                 # Enterprise security exclusions (.env, node_modules, installers)
└── README.md                  # Master documentation & deployment guide
```

---

## 🎯 Complete Guide: Web App to Global Online & Desktop App

Here is the exact step-by-step summary and workflow for taking this web application global and turning it into a desktop installer without needing a custom domain.

### 📌 The Big Picture (4 Parts)

* **PART 1: ONLINE DATABASE (MongoDB Atlas)** → Stores all user credentials, encrypted journals, and chats in the cloud 24/7.
* **PART 2: ONLINE BACKEND & HOSTING (Render.com)** → Handles API requests, authentication, and serves the web interface globally on a single free SSL URL (`https://your-app.onrender.com`).
* **PART 3: DESKTOP APP (Electron)** → Packages the application into an installer (`.exe` / `.dmg`) that users can run right from their computer desktop.
* **PART 4: CODE MANAGEMENT (GitHub)** → Stores and tracks code changes, enabling automated cloud deployments every time you push.

---

### 🌐 Part 1: Online Database (MongoDB Atlas)

**What It Is:** A cloud database accessible from anywhere on the internet.
**Why You Need It:** Without an online database, user accounts and journals exist only on one computer. An online database allows users to log in from any device or desktop app worldwide.

#### Exact Setup Steps:
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Click **"Build a Database"** and select the **FREE (M0)** tier.
3. Create a **Database User** by entering a secure username and password (e.g., `admin` / `MySecurePass123`).
4. Go to **Network Access**, click **Add IP Address**, and select **"Allow Access from Anywhere"** (`0.0.0.0/0`).
5. Go to **Database**, click **Connect** → **Drivers (Node.js)**, and copy your **Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/bjournal?retryWrites=true&w=majority
   ```
6. Paste this URL into your backend `.env` file or Render environment variables under `MONGODB_URI`.

---

### 🚀 Part 2: Online Backend & Single-URL Hosting (Render.com)

**What It Is:** A cloud server that runs your backend (`Express`) and serves your built frontend (`Vite`) on the internet 24/7.
**Why You Need It:** Your local server (`localhost:3001`) only runs when your computer is on. Render runs your app globally with free HTTPS certificate — **no domain purchase required**.

#### Exact Setup Steps:
1. Ensure your latest code is pushed to your GitHub repository on `main` (or your active branch).
2. Go to [render.com](https://render.com/) and sign up with your **GitHub account**.
3. Click **"New +"** → **"Web Service"** and connect your `Journal1` repository.
4. Configure the Web Service settings:
   * **Name:** `the-fools-hunting-room` (or any name you choose)
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `cd ../frontend && npm install && npm run build && cd ../backend && npm install`
   * **Start Command:** `node app.js`
5. Under **Environment Variables**, add:
   * `PORT` = `3001`
   * `MONGODB_URI` = `mongodb+srv://...` (your copied MongoDB Atlas URL)
   * `FINNHUB_API_KEY` = `your_finnhub_key` (optional for live news)
   * `GMAIL_USER` / `GMAIL_APP_PASSWORD` = `your_gmail` / `your_app_password` (optional for email reports)
6. Click **"Deploy Web Service"**. Within 2 minutes, Render will provide your global URL:
   ```
   https://the-fools-hunting-room.onrender.com
   ```
   Anyone can now open this URL from anywhere in the world to register, log in, and use the full app!

---

### 💻 Part 3: Desktop App with Setup Installer (Electron)

**What It Is:** Your application packaged as a native computer program (`.exe` for Windows, `.dmg` for macOS) with its own window, taskbar icon, and offline hybrid capabilities.
**How It Works:** When users launch the desktop app, it can connect directly to your online Render cloud URL (`https://your-app.onrender.com`) **OR** run a local offline engine if internet is unavailable!

#### Quick Start Commands (`desktop/`):

1. **Run Desktop App Locally (Development Mode):**
   ```bash
   cd desktop
   npm install
   npm start
   ```

2. **Connect Desktop App to Live Cloud Server:**
   Set the `ONLINE_URL` environment variable or edit `DEFAULT_ONLINE_URL` inside `desktop/main.js`:
   ```javascript
   const DEFAULT_ONLINE_URL = 'https://the-fools-hunting-room.onrender.com';
   ```

3. **Build Native Installers (`.exe` / `.dmg` / `.AppImage`):**
   ```bash
   cd desktop
   npm run build
   ```
   * **Windows:** Produces `desktop/dist-installers/The Fools Hunting Room Setup 1.0.0.exe`
   * **macOS:** Produces `desktop/dist-installers/The Fools Hunting Room-1.0.0.dmg`
   * **Linux:** Produces `desktop/dist-installers/The Fools Hunting Room-1.0.0.AppImage`

You can upload `The Fools Hunting Room Setup 1.0.0.exe` to Google Drive, Dropbox, or GitHub Releases and share the download link with your users!

---

### 📁 Part 4: Code Management with Git & GitHub

**What It Is:** A version control system to backup your code, track history, and trigger auto-deployments.

#### Quick Reference Commands:

```bash
# Check repository status
git status

# Stage all changes
git add .

# Save a snapshot commit with a descriptive message
git commit -m "Update full-stack cloud backend and Electron desktop configuration"

# Push your changes to GitHub (Render will automatically re-deploy!)
git push origin arena/019f7155-journal1
```

---

## 💡 Key Definitions

| Term | What It Means |
| :--- | :--- |
| **Full-Stack** | An application that includes both the user-facing interface (**Frontend**) and the server logic (**Backend/Database**). |
| **Frontend (`frontend/`)** | What users see and interact with (buttons, charts, journal tables, chat UI). Built with React and TypeScript. |
| **Backend (`backend/`)** | The brain of the app (`app.js`). Verifies passwords, fetches economic news, sends email reports, and talks to the database. |
| **Database (`MongoDB Atlas`)** | Persistent cloud storage where user accounts, encrypted trading notes, and chat messages are permanently stored. |
| **Hybrid Engine (`dbAdapter.js`)** | Our smart storage system that uses MongoDB Atlas when online, but automatically switches to local file storage (`data/db.json`) if offline. |
| **Zero-Knowledge Encryption** | Client-side AES-256-GCM encryption where journal contents are encrypted *before* leaving the browser. Not even server admins can read a customer's private trades! |
| **Electron (`desktop/`)** | A framework that wraps HTML/CSS/JavaScript web applications inside a native chromium desktop window with installer support. |
| **Environment Variables (`.env`)** | Secure, secret settings (like API keys, database URLs, and passwords) that are never committed to public source code. |
| **CORS (Cross-Origin Resource Sharing)** | Security rules that allow or block requests when the frontend and backend are hosted on different domains/ports. |

---

## 🛡️ Default Access & Roles

Our zero-knowledge authentication registry includes 3 roles:
1. **`superadmin`**: Hardcoded master creator account (`Saifullah Hanifi`). Full administrative access across the platform.
   * **Username:** `saifullah`
   * **Seed Password:** `S12345@#` *(Change immediately upon first login)*
2. **`admin`**: Can register new customer accounts, suspend accounts, and reset passwords, but **cannot** read encrypted customer trading journals.
3. **`customer`**: Regular trader account. Has exclusive access to their own zero-knowledge encrypted trading vault and community features.

---

## ✅ System Verification & Health Check

To test the backend locally:
```bash
node backend/app.js
```
Then visit `http://localhost:3001/api/health` to confirm database connectivity and service status:
```json
{
  "status": "ok",
  "database": "local-hybrid",
  "services": {
    "news": false,
    "email": false
  },
  "timestamp": "2026-07-17T18:36:17.820Z"
}
```

---

**🎉 You're all set!** Your project is structured, full-stack cloud-ready, and equipped with desktop setup installers.
