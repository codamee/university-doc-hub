# Deployment & MongoDB Atlas Setup Guide

This guide details how to connect your **MongoDB Atlas** cluster and deploy the **IntelliDoc Hub** to the cloud (Render, Railway, Vercel, or AWS/VPS).

---

## 1. Connecting Your MongoDB Atlas Cluster

You provided this connection string:
```text
mongodb+srv://<db_username>:CfTBnW3l6NBmPx3y@cluster0.suv07aq.mongodb.net/?appName=Cluster0
```

Notice the placeholder `<db_username>` in the URI. Follow these 3 steps in MongoDB Atlas to connect:

### Step 1: Find or Create Your Database Username in Atlas
1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. In the left navigation menu under **Security**, click **Database Access**.
3. Look at your existing Database Users (e.g. `admin`, `naveen`, `cluster0user`, etc.).
   - *If you don't know the username or want a fresh one, click **Add New Database User**, choose **Password Authentication**, enter a username (e.g. `admin`) and set the password to `CfTBnW3l6NBmPx3y` with role **Read and write to any database**.*

### Step 2: Whitelist Ingress IP Access
1. In the left navigation menu under **Security**, click **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access From Anywhere** (`0.0.0.0/0`) or enter your server's static IP.
4. Click **Confirm**.

### Step 3: Update `backend/.env`
Open `backend/.env` and replace `<db_username>` with your actual username, plus add the database name:
```env
MONGODB_URI=mongodb+srv://YOUR_ACTUAL_USERNAME:CfTBnW3l6NBmPx3y@cluster0.suv07aq.mongodb.net/university_doc_hub?retryWrites=true&w=majority&appName=Cluster0
```

Restart the backend server (`npm start` or `node backend/src/server.js`). You will see:
```text
[DB] Connecting to MongoDB Atlas...
[DB] Connected to MongoDB Atlas successfully!
```
*All users, cases, uploaded document metadata, exceptions, and audit logs will automatically persist directly to your MongoDB Atlas cloud database.*

---

## 2. Deploying the Application

Because the Express backend is already configured to automatically serve the built React frontend (`frontend/dist`), **you can deploy the entire full-stack application as a single web service!**

### Option A: Deploy on Render.com (Recommended - Free & Fast)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Higher Education Intelligent Doc Hub"
   git push origin main
   ```
2. Log into [Render.com](https://render.com) and click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
   - **Name**: `university-doc-hub`
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm --prefix frontend install && npm --prefix frontend run build && npm --prefix backend install
     ```
   - **Start Command**:
     ```bash
     node backend/src/server.js
     ```
5. In **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (or leave default Render port) |
   | `JWT_SECRET` | `your_strong_random_jwt_secret_key` |
   | `MONGODB_URI` | `mongodb+srv://YOUR_USERNAME:CfTBnW3l6NBmPx3y@cluster0.suv07aq.mongodb.net/university_doc_hub?retryWrites=true&w=majority&appName=Cluster0` |
   | `GEMINI_API_KEY` | `your_gemini_api_key_from_google_ai_studio` |
   | `GEMINI_MODEL` | `gemini-3.6-flash` |
6. Click **Create Web Service**. Render will build the React bundle, start Express, and give you a live HTTPS link (e.g. `https://university-doc-hub.onrender.com`).

---

### Option B: Deploy on Railway.app

1. Go to [Railway.app](https://railway.app) and create a **New Project** &rarr; **Deploy from GitHub Repo**.
2. In Project Settings &rarr; **Variables**, paste:
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://YOUR_USERNAME:CfTBnW3l6NBmPx3y@cluster0.suv07aq.mongodb.net/university_doc_hub?retryWrites=true&w=majority&appName=Cluster0`
   - `GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio`
   - `GEMINI_MODEL=gemini-3.6-flash`
   - `JWT_SECRET=your_secret_key`
3. Set **Build Command**:
   ```bash
   npm run install:all && npm run build
   ```
4. Set **Start Command**:
   ```bash
   node backend/src/server.js
   ```
5. Railway will deploy and provide your production URL.

---

### Option C: Deploy on Any Linux VPS (Ubuntu / AWS EC2 / DigitalOcean)

1. Clone repository to `/var/www/university-doc-hub`.
2. Install dependencies & build frontend:
   ```bash
   npm run install:all
   npm run build
   ```
3. Setup `backend/.env` with your MongoDB Atlas URI and Gemini key.
4. Run using PM2 for process persistence:
   ```bash
   npm install -g pm2
   pm2 start backend/src/server.js --name "intelli-doc-hub"
   pm2 startup
   pm2 save
   ```
5. Point Nginx reverse proxy to `http://localhost:5000` with Let's Encrypt SSL.

---

## 3. Production Environment Checklist

Before sharing the live link with users, verify:
- [ ] MongoDB Atlas Database User created and `<db_username>` replaced in `.env`.
- [ ] MongoDB Atlas Network Access has `0.0.0.0/0` enabled.
- [ ] `GEMINI_API_KEY` is present in server environment variables (never client-side).
- [ ] `JWT_SECRET` is set to a secure unique string.
- [ ] Admin user registered or initialized.

