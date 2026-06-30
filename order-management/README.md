# Order Management System

A full-stack order management application with a React dashboard, a Node.js/Express REST API, MongoDB for persistence, and a scheduled background job that automatically advances orders through a defined status lifecycle.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Scheduler Design](#scheduler-design)
- [API Documentation](#api-documentation)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Deployment (Render)](#deployment-render)
- [Scheduler Setup](#scheduler-setup)
- [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Dashboard   │──────▶ │   Express REST API       │
│   (Vite + React)    │        │   (Node.js)              │
└─────────────────────┘        └──────────┬───────────────┘
                                           │
                                ┌──────────▼───────────────┐
                                │   MongoDB (Mongoose)      │
                                │   - orders               │
                                │   - schedulerlogs        │
                                └──────────────────────────┘

Scheduler (one of):
  A) node-cron running inside the Express process (default, for dev/simple deploy)
  B) GitHub Actions cron calling POST /api/scheduler/run-status-update every 5 min
  C) Render Cron Job / Google Cloud Scheduler / AWS EventBridge (same HTTP call as B)
```

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Node.js, Express.js                               |
| Database   | MongoDB via Mongoose                              |
| Scheduler  | node-cron (internal) + optional external cron     |
| Frontend   | React 19, Vite                                    |
| Deployment | Render (render.yaml included)                     |

---

## Project Structure

```
order-management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js       # Status enums and AUTO_TRANSITIONS rules
│   │   │   └── db.js              # MongoDB connection
│   │   ├── models/
│   │   │   ├── Order.js           # Order schema with embedded status history
│   │   │   └── SchedulerLog.js    # Scheduler run log schema
│   │   ├── controllers/
│   │   │   ├── orderController.js
│   │   │   └── schedulerController.js
│   │   ├── routes/
│   │   │   ├── orderRoutes.js
│   │   │   └── schedulerRoutes.js
│   │   ├── services/
│   │   │   └── schedulerService.js  # Core transition logic
│   │   ├── jobs/
│   │   │   └── statusUpdateCron.js  # node-cron registration
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   └── verifySchedulerKey.js
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   └── generateOrderId.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Fetch wrapper for all API calls
│   │   ├── components/
│   │   │   ├── CreateOrderModal.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── OrdersTable.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── SchedulerLogsPanel.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── constants/orderStatus.js
│   │   ├── hooks/useOrders.js
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
├── .github/workflows/scheduler.yml   # Optional: GitHub Actions cron
├── render.yaml                        # Render deploy config
└── README.md
```

---

## Database Design

### Why MongoDB?

Orders are document-centric: each order carries its full status history as an embedded array. In a relational DB this would require a join on every read. MongoDB's document model lets us return an order with its complete history in a single read, which fits the access pattern of this dashboard well.

### Collections

#### `orders`

```js
{
  orderId: String,           // e.g. "ORD-20260630-7F3K9A" – server-generated, human-readable
  customerName: String,
  phoneNumber: String,
  productName: String,
  amount: Number,
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
  status: 'PLACED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  statusUpdatedAt: Date,     // when the current status was entered (scheduler timer starts here)
  idempotencyKey: String,    // optional, unique – prevents double-submit from client retries
  statusHistory: [           // embedded – avoids a join for the common "show history" case
    {
      status: String,
      changedAt: Date,
      changedBy: 'SYSTEM' | 'USER',
      note: String
    }
  ],
  createdTime: Date,         // auto-managed by Mongoose timestamps
  updatedTime: Date
}
```

**Indexes:**
- `orderId` – unique, for single-order lookups
- `status` – for filter queries
- `{ status: 1, createdTime: -1 }` – compound for the dashboard's main query (filter + sort)
- `idempotencyKey` – unique sparse, for duplicate prevention

#### `schedulerlogs`

```js
{
  runAt: Date,
  status: 'SUCCESS' | 'PARTIAL_FAILURE' | 'FAILURE',
  ordersScanned: Number,
  ordersUpdated: Number,
  transitions: [{ orderId, fromStatus, toStatus }],
  durationMs: Number,
  errorMessage: String | null,
  triggeredBy: 'CRON' | 'MANUAL',
  createdAt: Date,
  updatedAt: Date
}
```

### Status History Storage

Every status change—whether made by the scheduler (`changedBy: 'SYSTEM'`) or via the manual API (`changedBy: 'USER'`)—is **appended** to the embedded `statusHistory` array in the same atomic write as the status field update. This means the history is always consistent with the current status: there is no window where the status has changed but the history hasn't caught up.

### Duplicate Order Prevention

Two mechanisms work in layers:

1. **`orderId`** is generated server-side using a timestamp + cryptographic random suffix. Clients cannot supply an ID; therefore client-side ID collisions are impossible.
2. **`idempotencyKey`**: the frontend generates a random key when the "New Order" form opens and sends it with the request. The unique sparse index on this field means a second identical submission (network retry, double-click) returns the existing order rather than creating a duplicate. This is the same pattern used by payment processors.

---

## Scheduler Design

### Order Status Flow

```
PLACED ──(10 min)──▶ PROCESSING ──(20 min)──▶ READY_TO_SHIP
                                                      │
                                          (manual)    ▼
                                               SHIPPED ──▶ DELIVERED
                                                               │
                                               CANCELLED ◀────┘ (any point, manual)
```

### Race Condition Handling

The key concern is two scheduler runs overlapping (e.g. slow run + manual trigger). The scheduler uses **atomic conditional updates**:

```js
await Order.findOneAndUpdate(
  { _id: candidate._id, status: rule.from },  // ← status is part of the filter
  { $set: { status: rule.to, ... }, $push: { statusHistory: ... } }
)
```

Because `status: rule.from` is in the query predicate, the second concurrent runner will find `0` matching documents for an order already transitioned by the first runner. The update simply does nothing — no double-transition, no race condition. This is equivalent to SQL's `UPDATE orders SET status='PROCESSING' WHERE id=? AND status='PLACED'`.

### Scheduler Options

| Option | How it works | Best for |
|--------|-------------|----------|
| **node-cron (default)** | Runs inside the Node process every 5 min | Local dev, always-on deployments |
| **GitHub Actions** | `.github/workflows/scheduler.yml` calls the API via curl | Free-tier Render (sleeps), zero infra |
| **Render Cron Job** | Set up in Render dashboard to POST to `/api/scheduler/run-status-update` | Production on Render |
| **External (AWS/GCP)** | Any HTTP cron pointing at the same endpoint with the secret header | Cloud-native production |

Set `ENABLE_INTERNAL_CRON=false` to disable the in-process cron when using an external scheduler.

### Scheduler Security

The `POST /api/scheduler/run-status-update` endpoint requires the header:

```
x-scheduler-key: <SCHEDULER_SECRET_KEY>
```

This is a shared-secret pattern: simple, stateless, and appropriate for a machine-to-machine cron call. The secret should be ≥32 random characters and stored only in environment variables.

---

## API Documentation

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List orders (with filter, search, pagination) |
| `GET` | `/api/orders/:orderId` | Get a single order by orderId |
| `PATCH` | `/api/orders/:orderId` | Update order status or payment status |

#### GET /api/orders query params

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by order status |
| `search` | string | Search by orderId or customerName |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |

#### POST /api/orders body

```json
{
  "customerName": "Rahul Sharma",
  "phoneNumber": "9876543210",
  "productName": "Wireless Headphones",
  "amount": 2499,
  "paymentStatus": "PAID",
  "idempotencyKey": "client-generated-uuid"
}
```

### Scheduler

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/scheduler/run-status-update` | `x-scheduler-key` header | Trigger a scheduler run |
| `GET` | `/api/scheduler/logs` | None | Get scheduler run history |

---

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI and SCHEDULER_SECRET_KEY
npm install
npm run dev
# Server starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev
# Dashboard opens on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `SCHEDULER_SECRET_KEY` | **Yes** | Secret for the scheduler endpoint header |
| `FRONTEND_ORIGIN` | No | CORS origin for the frontend (default: `*`) |
| `ENABLE_INTERNAL_CRON` | No | Set to `false` to disable node-cron (use external scheduler) |
| `PLACED_TO_PROCESSING_MINUTES` | No | Override transition time (default: 10) |
| `PROCESSING_TO_READY_MINUTES` | No | Override transition time (default: 20) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | **Yes** | Backend API base URL |

---

## Deployment (Render)

A `render.yaml` is included at the repo root for one-click deployment on Render.

1. Push the repo to GitHub
2. In the Render dashboard: **New** → **Blueprint** → connect your repo
3. Set the secret environment variables (`MONGO_URI`, `SCHEDULER_SECRET_KEY`, `FRONTEND_ORIGIN`, `VITE_API_BASE_URL`) in the Render dashboard
4. Deploy

For MongoDB: use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier and set the connection string as `MONGO_URI`.

---

## Scheduler Setup

### Option A: Internal node-cron (default, zero config)

The scheduler runs automatically inside the backend process. No extra setup needed.

### Option B: GitHub Actions (recommended for free-tier Render)

1. Push repo to GitHub
2. In repo Settings → Secrets → Actions, add:
   - `BACKEND_URL`: your deployed backend URL (e.g. `https://your-app.onrender.com`)
   - `SCHEDULER_SECRET_KEY`: same value as in backend `.env`
3. The workflow in `.github/workflows/scheduler.yml` will run every 5 minutes
4. Set `ENABLE_INTERNAL_CRON=false` on the backend to avoid double-running

### Option C: Any external HTTP cron

Configure any cron service to call:

```
POST https://your-backend.com/api/scheduler/run-status-update
Headers:
  x-scheduler-key: <your-secret>
  Content-Type: application/json
Schedule: every 5 minutes
```

---

## Design Decisions

### Why embed status history in the order document?

The most frequent operation is "fetch orders for the dashboard." Embedding history avoids a join/lookup on every read. History is append-only (never updated in place), so document size grows predictably and stays well within MongoDB's 16MB document limit for any realistic order lifecycle.

### Why generate orderId server-side?

Client-supplied IDs open a surface for ID collision (two clients picking the same ID) and potential injection/enumeration attacks. Server-side generation with a timestamp + cryptographic random suffix guarantees uniqueness without a sequence lock or DB round-trip.

### Why a separate SchedulerLog collection (not embedded in orders)?

Scheduler logs are a cross-cutting concern — a single run affects many orders. Embedding logs in orders would require updating every touched document just to record the run, and would make "show me the last N scheduler runs" an expensive fan-out query. A separate collection keeps reads and writes for logs O(1) per run.

### How the system scales

- **Read scaling**: Add a read replica. The dashboard query (`status` + `createdTime` index) is read-heavy and replica-safe.
- **Write scaling**: The scheduler uses atomic `findOneAndUpdate` with the status in the filter — safe under MongoDB's document-level locking with no application-level coordination needed.
- **Scheduler scaling**: Moving to an external scheduler (GitHub Actions / Cloud Scheduler) decouples scheduling from the API process, so the API can scale horizontally without multiple in-process crons competing.
- **Pagination**: All list endpoints paginate (default 20, max 100) to prevent unbounded result sets.
#   O r d e r   M a n a g e m e n t   S y s t e m  
  
 