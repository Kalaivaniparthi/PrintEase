# 🖨️ Printease — University Printing Service MVP

> **Simple, Academic, Efficient** — A frontend-only web app for managing print orders at a university xerox shop.

---

## 📌 Overview

Printease is a browser-based MVP for a campus printing service. Students and staff place print orders online, the owner manages and processes them, and delivery status is tracked in real time — all without a backend. Everything is stored in `localStorage`.

---

## 🚀 Getting Started

No installation, no build step, no server required.

1. Download or clone the project
2. Open `login.html` directly in any modern browser
3. Click **Sign up** to create an account, choose your role, and log in

> Works best in Chrome, Edge, or Firefox. Requires JavaScript enabled.

---

## 📁 Project Structure

```
PrintEase/
├── index.html               # Smart redirect based on session role
├── login.html               # Login page
├── signup.html              # Registration page
├── student-dashboard.html   # Student order & tracking UI
├── staff-dashboard.html     # Staff (teacher) priority order UI
├── owner-dashboard.html     # Owner management UI
├── css/
│   └── style.css            # All styles — design tokens, layout, dark mode
└── js/
    ├── auth.js              # Shared: session, storage helpers, badges, toast
    ├── login.js             # Login form logic
    ├── signup.js            # Signup form logic
    ├── student.js           # Student dashboard logic
    ├── staff.js             # Staff dashboard logic
    └── owner.js             # Owner dashboard logic
```

---

## 👥 Roles

### 👨‍🎓 Student
- Sign up and log in
- Place print orders with real-time price calculation
- Upload PDF — page count extracted automatically via **PDF.js**
- Choose B&W or Colour, single/double sides, copies, page size
- Select **Pickup** (free) or **Campus Delivery** (+₹30)
- For campus delivery: enter Block, Room No., Landmark, and Delivery Slot
- View order history with print and delivery status
- Cancel orders that are still **pending**
- All student orders have **Normal** priority

### 👩‍🏫 Staff / Teacher
- Same order form as student
- All staff orders are automatically tagged **⚡ High Priority**
- High-priority orders appear at the top of the owner's queue
- Red badge and row highlight on all their orders
- Priority banner shown on the order form as a reminder

### 🏛️ Owner
- View all orders from all users
- Orders sorted: **High priority first**, then by date
- Filter by priority, print status, delivery status
- Search by token or student name
- Update **print status** inline: `pending → processing → completed → ready`
- Update **delivery status** inline: `order placed → out for delivery → delivered`
- Stats cards: orders today, high-priority pending, normal pending, revenue, stock
- Edit pricing (B&W price, colour price, bulk discount threshold & %)
- Manage inventory (A4/A3 paper, B&W/colour toner levels)
- Export filtered orders as **CSV**

---

## 💰 Pricing Logic

| Option | Cost |
|--------|------|
| B&W print | ₹1.50 / page |
| Colour print | ₹10.00 / page |
| Double-sided | Effective pages = `ceil(pages / 2)` |
| Bulk discount | 10% off if `pages × copies > 50` |
| Campus delivery | +₹30 flat |
| Spiral binding | +₹10 |
| Stapled / No binding | Free |

**Formula:**
```
effectivePages = sides === 'double' ? ceil(pages / 2) : pages
subtotal       = effectivePages × copies × pricePerPage
subtotal       = subtotal × (1 − discount%)
total          = subtotal + deliveryFee + bindingFee
```

Price updates live on every input change — no page reload needed.

---

## 🪙 Token System

Every order gets a unique token on submission:

```
Format:  PRN-YYMMDD-XXXX
Example: PRN-250615-4821
```

Tokens are shown in order tables and toasts for easy reference.

---

## 📄 Order Object (localStorage)

```js
{
  id, token,
  studentId, studentName, role,
  priority,        // "high" (staff) | "normal" (student)
  fileName, pages, copies,
  colourMode,      // "bw" | "colour"
  sideMode,        // "single" | "double"
  pageSize,        // "A4" | "A3" | "Letter"
  binding,         // "none" | "stapled" | "spiral"
  bindingFee,
  subtotal, discount, deliveryFee, totalPrice,
  deliveryMethod,  // "pickup" | "campus"
  deliveryDetails: { block, roomNo, landmark },
  deliverySlot,
  printStatus,     // "pending" | "processing" | "completed" | "ready" | "cancelled"
  deliveryStatus,  // "not applicable" | "order placed" | "out for delivery" | "delivered"
  specialInstructions,
  createdAt
}
```

---

## 🗄️ localStorage Keys

| Key | Contents |
|-----|----------|
| `pe_users` | Array of registered user accounts |
| `pe_orders` | Array of all orders |
| `pe_settings` | Pricing config (bwPrice, colourPrice, bulkThreshold, bulkPercent) |
| `pe_inventory` | Stock levels (paperA4, paperA3, tonerBW, tonerColour) |
| `pe_session` | Current logged-in user (sessionStorage — clears on tab close) |
| `pe_dark` | Dark mode preference (`"true"` / `"false"`) |

---

## 🎨 UI / Design

- **Font:** Poppins (headings + UI), system-ui (body)
- **Colours:** Deep Blue `#1e3a8a`, Amber `#f59e0b`, Red `#dc2626`
- **Dark mode:** Toggle in topbar, persists across pages via `localStorage`
- **Responsive:** Sidebar collapses at 900px, stacks vertically at 700px
- **Icons:** Font Awesome 6
- **Badges:** colour-coded by status (yellow = pending, blue = processing, green = ready/delivered, red = priority)
- **Priority rows:** Red left border on high-priority orders in all tables

---

## 🔗 Page Flow

```
signup.html ──► login.html
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
   student-      staff-     owner-
  dashboard    dashboard   dashboard
```

`index.html` checks the session and redirects automatically to the correct dashboard.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (semantic) |
| Styles | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript ES Modules |
| PDF page count | [PDF.js 2.16.105](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js) |
| Icons | [Font Awesome 6.5](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css) |
| Fonts | Google Fonts — Poppins |
| Storage | `localStorage` + `sessionStorage` |
| Backend | None |

---

## ✅ Acceptance Criteria

- [x] Student can upload PDF, auto page count detected, order placed with token
- [x] Staff orders tagged High Priority, shown first in owner queue
- [x] Real-time price calculator with bulk discount, delivery fee, binding fee
- [x] Owner updates print status and delivery status inline
- [x] Campus delivery fields: Block, Room No., Landmark, Delivery Slot
- [x] Order cancellation only if `printStatus === 'pending'`
- [x] Dark mode persists across all pages
- [x] Fully responsive on desktop, tablet, and mobile
- [x] CSV export of filtered orders
- [x] No console errors on normal usage

---

## 📝 Notes

- This is a **frontend-only MVP** — data lives in the browser's `localStorage` and is shared only within the same browser on the same device.
- Opening the app in a different browser or device will not share orders — this is by design for a no-backend demo.
- To reset all data: open browser DevTools → Application → Local Storage → clear `pe_orders`, `pe_users`, etc.
- The session (who is logged in) uses `sessionStorage`, so it clears automatically when the browser tab is closed.
