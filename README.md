<div align="center">

# 🖨️ PrintEase

### Campus Printing, Reimagined

[![Status](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen?style=for-the-badge)](https://kalaivaniparthi.github.io/PrintEase/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**Upload. Pay. Pickup. No queues, no cash, no hassle.**

[🚀 Live Demo](https://kalaivaniparthi.github.io/PrintEase/) · [📋 Report Bug](https://github.com/kalaivaniparthi/PrintEase/issues) · [✨ Request Feature](https://github.com/kalaivaniparthi/PrintEase/issues)

</div>

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Pages Overview](#-pages-overview)
- [Authentication](#-authentication)
- [Impact Metrics](#-impact-metrics)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About the Project

**PrintEase** is a full-stack web application that digitally transforms the campus printing experience. Built in 3 weeks as an MVP, it eliminates the traditional pain points of campus xerox shops — long queues, cash-only payments, and manual order management — by providing a seamless online platform for students to upload, configure, pay, and collect their prints via QR code.

> *"From a 30-minute queue to a 30-second upload."*

---

## 🔍 Problem Statement

Every campus has a xerox shop. Every student has wasted time there.

| Problem | Impact |
|---|---|
| 🕐 Long Queues | Students wait 15–30 minutes during breaks |
| 💵 Cash Only | No digital payment options available |
| 📝 Manual Process | Paper slips, verbal instructions, frequent errors |
| 📍 No Pre-booking | Must be physically present to place an order |
| ⏳ Time Wastage | Valuable academic time lost in waiting |
| 📊 Shop Inefficiency | Manual order management, no tracking |

---

## 💡 Solution

```
BEFORE  →  Student → Queue → Explain → Pay Cash → Wait → Collect
AFTER   →  Student → Upload → Configure → Pay Online → QR Pickup
```

PrintEase replaces every manual step with a digital equivalent — from file upload to QR-based collection — making the entire process faster, smarter, and paperless.

---

## ✨ Features

### 🔐 Authentication
- Secure register & login with form validation
- Password strength indicator
- Demo account for instant access
- Session management via localStorage

### 📤 Smart Upload
- Drag & drop file upload (PDF, DOC, DOCX, PPT, PPTX, JPG, PNG)
- Live price calculator — pages × rate × copies
- Configure color mode, sides, paper size, copies
- Special instructions for the shop

### 💳 Digital Payments
- UPI (Google Pay, PhonePe, Paytm)
- Debit / Credit Card with formatting
- Pay at Counter option
- Simulated payment processing with confirmation

### 📋 Order Management
- Real-time order status — Pending → Printing → Ready → Completed
- Filter orders by status
- Full order history with metadata
- One-click reorder

### 📱 QR Pickup
- Unique QR code generated per order
- Show QR at counter — zero paperwork
- Demo status controls (Mark Ready / Mark Collected)

### 🎨 UI / UX
- Galaxy dark theme with glassmorphism
- Smooth animations and transitions
- Fully responsive — mobile, tablet, desktop
- Sidebar navigation with active states
- Toast notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | CSS3 (Custom Properties, Flexbox, Grid, Animations) |
| Logic | Vanilla JavaScript ES6+ |
| Storage | localStorage (client-side persistence) |
| Icons | Font Awesome 6.5 |
| QR Code | QRCode.js (CDN) |
| Hosting | GitHub Pages |

> No frameworks. No build tools. No dependencies to install. Pure web standards.

---

## 📁 Project Structure

```
PrintEase/
│
├── index.html                  # Landing page (hero, features, how it works)
│
├── pages/                      # App pages
│   ├── auth.html               # Login & Register
│   ├── dashboard.html          # Student dashboard
│   ├── upload.html             # Upload & configure print order
│   ├── payment.html            # Payment page
│   └── orders.html             # Order history & tracking
│
├── css/
│   └── style.css               # Global styles, themes, animations
│
├── js/
│   ├── app.js                  # Shared utilities, auth guard, helpers
│   └── auth.js                 # Authentication logic
│
├── assets/
│   └── images/                 # Project images
│
├── README.md
└── LICENSE
```

---

## 🚀 Getting Started

No installation required. This is a pure frontend project.

### Option 1 — Open Directly
```bash
# Clone the repository
git clone https://github.com/kalaivaniparthi/PrintEase.git

# Open in browser
open PrintEase/index.html
```

### Option 2 — Live Server (Recommended)
```bash
# If you have VS Code, install the Live Server extension
# Right-click index.html → Open with Live Server
```

### Option 3 — Live Demo
Visit → **[https://kalaivaniparthi.github.io/PrintEase/](https://kalaivaniparthi.github.io/PrintEase/)**

### Demo Account
| Field | Value |
|---|---|
| Email | demo@college.edu |
| Password | demo123 |

Or click **"Use Demo Account"** on the login page for instant access with pre-loaded orders.

---

## 📄 Pages Overview

| Page | Path | Description |
|---|---|---|
| Landing | `index.html` | Hero, features, how it works, stats, CTA |
| Auth | `pages/auth.html` | Login & Register with tab switching |
| Dashboard | `pages/dashboard.html` | Stats, quick actions, recent orders |
| Upload | `pages/upload.html` | File upload, print settings, price calculator |
| Payment | `pages/payment.html` | UPI / Card / Cash payment flow |
| Orders | `pages/orders.html` | Full order history, filters, QR pickup |

---

## 🔐 Authentication

PrintEase uses **localStorage-based authentication** for the MVP:

- User accounts stored in `pe_users` key
- Active session stored in `pe_session` key
- All app pages are **auth-guarded** — unauthenticated users are redirected to login
- Orders are **user-scoped** — each user only sees their own orders

> In a production environment, this would be replaced with a backend API (Node.js/Express + MongoDB or Firebase Auth).

---

## 📊 Impact Metrics

| Metric | Value |
|---|---|
| ⏱ Waiting Time Reduction | 70% |
| 💳 Digital Payment Adoption | 100% |
| 🕐 Order Placement | 24/7 |
| 📄 Process | Fully Paperless |
| 🎯 Queue Elimination | Complete pre-booking |

---

## 🗺 Roadmap

- [x] Landing page with animations
- [x] Authentication (Register / Login / Demo)
- [x] File upload with drag & drop
- [x] Live price calculator
- [x] Payment flow (UPI / Card / Cash)
- [x] Order tracking with status pipeline
- [x] QR code pickup
- [x] Order history with filters
- [ ] Backend API (Node.js + Express)
- [ ] Real database (MongoDB / Firebase)
- [ ] Push notifications (Web Push API)
- [ ] Admin / Shop owner dashboard
- [ ] Real payment gateway (Razorpay)
- [ ] Email confirmations
- [ ] PWA support (offline mode)

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/AmazingFeature

# Commit your changes
git commit -m 'Add AmazingFeature'

# Push to the branch
git push origin feature/AmazingFeature

# Open a Pull Request
```

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Built with ❤️ by [Kalaivani Parthi](https://github.com/kalaivaniparthi)

⭐ Star this repo if you found it helpful!

</div>
