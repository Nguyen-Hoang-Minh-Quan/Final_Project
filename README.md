# TCG Shop — Full-Stack Trading Card Game E-Commerce Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Deployed on Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=black)](https://final-project-1-ocsn.onrender.com)

A full-stack e-commerce web application built for authentic Pokémon & Trading Card Game (TCG) collectors. The platform features Role-Based Access Control (**Customer**, **Staff**, and **Admin**), real-time inventory management with audit logging, revenue analytics, and a dual-channel support system separating an **AI Card Assistant** from **Live Staff Support**.

**Live Demo:** [https://final-project-1-ocsn.onrender.com](https://final-project-1-ocsn.onrender.com)

---

## Key Features

### Customer Experience
- **Catalog & Filtering:** Browse by category (*Single Cards*, *Elite Trainer Box*, *Booster Box*, *Sleeves Cards*, *Pack*, *Other accessories*), filter by stock status, search by keyword, and sort by price.
- **Product Discovery:** Quick View modal, related product recommendations, Wishlist management, and interactive 5-star product reviews with staff replies.
- **Shopping Cart & Checkout:** Account-synced shopping cart, multi-address shipping book, and 3 payment options (**COD**, **Momo QR**, and **Bank Transfer VietQR**).
- **Order Tracking:** Visual order status timeline (*Placed Order → Confirmed → In Transit → Delivered / Cancelled*) and order cancellation with automatic stock restoration.
- **Authentication & Security:** JWT-based login/registration with password visibility toggles, strong password validation, and 6-digit email OTP password recovery.
- **Dual Floating Chat Widgets:**
  - **TCG AI Assistant:** Instant bilingual (English/Vietnamese) card price lookup, stock checks, rarity/budget filtering, best-seller queries, and store policy answers (works even without signing in).
  - **Live Staff Support:** Dedicated direct chat channel with TCG Shop Staff & Admin, isolated from AI bot conversations.

### Staff Portal
- **Order Fulfillment:** View ordered items (thumbnails, names, quantities, prices), customer account details, and update shipping statuses with automatic inventory sync.
- **Inventory & Blog Management:** Create/update products (with mandatory stock change reasons) and publish/edit TCG news articles.
- **Review Moderation:** View and reply directly to customer product reviews.
- **Live Chat Center:** Priority queue highlighting customers **`WAITING`** for a human reply, internal Staff/Admin messaging, and a dedicated read-only **`AI Log`** tab to inspect what a customer asked the AI Assistant.

### Admin Dashboard
- **Full Staff Capabilities** plus:
- **User & Role Management:** Promote or demote accounts between `Customer`, `Staff`, and `Admin`.
- **Revenue & Sales Analytics:** Interactive daily revenue growth chart (Recharts), total revenue, average order value, and dynamic **Top 5 Most Sold Products** ranked by delivered quantity.
- **System & Inventory Audit Logs:** Track every stock adjustment (`InventoryLogs`) and staff action (`StaffLogs`) with live account status indicators (including *Former Staff* labels).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, React Router v7, React Bootstrap 5, Heroicons (`react-icons/hi2`), Recharts, Axios, React Toastify |
| **Backend** | Node.js, Express 5, Sequelize ORM, JWT (`jsonwebtoken`), `bcryptjs`, Nodemailer |
| **Database** | PostgreSQL (hosted on **Neon Serverless Postgres**) |
| **Deployment** | Render (Frontend Static Site & Backend Web Service) |

---

## Project Structure

```text
TCG_Shop_Project/
├── backend/
│   ├── API/
│   │   ├── config/          # Neon PostgreSQL & Sequelize connection
│   │   ├── controllers/     # Business logic (auth, products, orders, chat, reviews, blogs, logs, addresses)
│   │   ├── middleware/      # JWT authentication & Admin/Staff RBAC guards
│   │   ├── models/          # Sequelize models (User, Product, Category, Rarity, Order, OrderItem, etc.)
│   │   └── routes/          # Express REST API route definitions
│   ├── package.json
│   └── server.js            # Entry point, model associations & DB sync
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/             # Axios client with automatic JWT interceptor
│   │   ├── components/
│   │   │   ├── AdminSide/   # AdminDashboard, AdminOrders, AdminProductList, AdminStats, AdminStaffLogs, AdminUserManagement
│   │   │   ├── StaffSide/   # StaffDashboard, StaffChat, StaffBlogManagement, StaffReviewList
│   │   │   ├── Customer/    # Home, Shop, ProductDetail, Cart, Checkout, OrderHistory, Wishlist, BlogList, Auth pages
│   │   │   └── Component/   # Header, Footer, Chatbot (AI & Live Support), ProtectedRoute
│   │   ├── styles/          # Custom TCG theme styles
│   │   └── App.js
│   └── package.json
└── README.md
```

---

## Database Schema Overview

The PostgreSQL database on Neon consists of the following tables:

- **`Users`**, **`Addresses`** — User profiles, RBAC roles (`Customer`, `Staff`, `Admin`), OTP reset tokens, and saved delivery addresses.
- **`Products`**, **`Categories`**, **`Rarities`** — Product catalog linked to normalized category and rarity lookup tables.
- **`Orders`**, **`OrderItems`** — Customer orders with transactional stock deduction/restoration.
- **`Reviews`**, **`Blogs`** — Product ratings/comments (with staff replies) and TCG news articles.
- **`InventoryLogs`**, **`StaffLogs`** — Audit trail of stock changes and staff activities.
- **`chat_rooms`**, **`chat_messages`** — Persistent chat rooms with channel-tagged (`staff` vs `ai`) JSONB metadata.

---

## Main API Endpoints

| Resource | Base Path | Highlights |
| :--- | :--- | :--- |
| **Auth & Users** | `/api/auth` | Register, login, profile update, OTP forgot/reset password, admin role management |
| **Products** | `/api/products` | CRUD products, categories, rarities, product reviews |
| **Orders** | `/api/orders` | Create order (transactional stock lock), user order history, admin orders, revenue stats, top products |
| **Chat & AI** | `/api/chat` | Access room, room messages, save message, admin room queue, `/api/chat/ai` smart lookup |
| **Reviews** | `/api/reviews` | List all reviews, staff reply, admin delete |
| **Blogs** | `/api/blogs` | List/read articles, staff/admin CRUD |
| **Addresses** | `/api/addresses` | Manage customer shipping addresses |
| **Logs** | `/api/logs` | Inventory change logs & staff activity logs |

---

## Getting Started (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Neon](https://neon.tech/) PostgreSQL database (or local PostgreSQL instance)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd TCG_Shop_Project
```

### 2. Configure & Run the Backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` with the following variables:
```env
PORT=5000
DATABASE_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the backend server:
```bash
npm run dev
# or for production mode:
npm start
```

### 3. Configure & Run the Frontend
```bash
cd ../frontend
npm install
npm start
```

> **Note:** To connect the frontend to your local backend instead of the deployed Render server, update `baseURL` in `frontend/src/api/axiosClient.js` to `http://localhost:5000/api`.

---

## Author

- **Nguyen Hoang Minh Quan**
- Email: `mquantcv@gmail.com`

---

## License

This project is created for educational and portfolio purposes.
