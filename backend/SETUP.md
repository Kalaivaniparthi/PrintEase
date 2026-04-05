# PrintEase Backend — Setup Guide

## Prerequisites
- Node.js v18+ → https://nodejs.org
- MongoDB Atlas account (free) → https://mongodb.com/atlas
- Cloudinary account (free) → https://cloudinary.com
- Razorpay account (test mode) → https://razorpay.com

---

## Step 1 — MongoDB Atlas

1. Go to https://mongodb.com/atlas → Create free cluster
2. Click **Connect** → **Drivers** → copy the connection string
3. Replace `<username>` and `<password>` in the string
4. Paste into `.env` as `MONGO_URI`

---

## Step 2 — Cloudinary

1. Go to https://cloudinary.com → Dashboard
2. Copy **Cloud Name**, **API Key**, **API Secret**
3. Paste into `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step 3 — Razorpay

1. Go to https://razorpay.com → Sign up → Dashboard
2. Go to **Settings → API Keys** → Generate Test Key
3. Copy **Key ID** and **Key Secret**
4. Paste into `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
```

---

## Step 4 — Run the Backend

```bash
cd backend
npm install
npm run dev
```

Server starts at → http://localhost:5000

---

## Step 5 — Run the Frontend

Open `index.html` with **Live Server** in VS Code.
- Right-click `index.html` → Open with Live Server
- Frontend runs at → http://127.0.0.1:5500

Make sure `CLIENT_URL=http://127.0.0.1:5500` in `.env` matches.

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |
| POST | /api/upload | ✅ Student | Upload file to Cloudinary |
| GET | /api/orders | ✅ | Get orders (role-scoped) |
| POST | /api/orders | ✅ Student | Create new order |
| PATCH | /api/orders/:id/status | ✅ Staff/Admin | Update order status |
| POST | /api/payment/create-order | ✅ Student | Create Razorpay order |
| POST | /api/payment/verify | ✅ Student | Verify payment signature |
| POST | /api/payment/cash-confirm | ✅ Student | Confirm cash payment |

---

## Real-time Events (Socket.io)

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:user` | Client → Server | `email` |
| `order:updated` | Server → All clients | `{ orderId, status, order }` |

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@college.edu | demo123 |
| Staff | staff@printease.local | demo123 |
| Admin | owner@printease.local | demo123 |

Click **"Use Demo Account"** on the login page — it auto-registers if not found.
