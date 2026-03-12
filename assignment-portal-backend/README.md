# Assignment Portal – Backend API

A RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)** that powers the Assignment Workflow Portal. It supports role-based authentication (teacher / student) and a full assignment lifecycle (Draft → Published → Completed).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| Security | Helmet, express-rate-limit |

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** a MongoDB Atlas URI

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd assignment-portal-backend
npm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | `mongodb://localhost:27017/assignment-portal` | MongoDB connection string |
| `JWT_SECRET` | *(change this!)* | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |

### 3. Seed the database

Creates 1 teacher + 2 student accounts:

```bash
npm run seed
```

| Role | Email | Password |
|---|---|---|
| Teacher | teacher@portal.com | Teacher@123 |
| Student | student1@portal.com | Student@123 |
| Student | student2@portal.com | Student@123 |

### 4. Run the server

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Authentication  — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT + role |
| GET | `/api/auth/me` | Any | Get logged-in user profile |

#### Register / Login request body
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Secret@123",
  "role": "teacher"
}
```

#### Login response
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "Alice", "email": "...", "role": "teacher" }
}
```

---

### Assignments — `/api/assignments`

#### Teacher Routes (role: teacher)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/assignments` | Create assignment (status: draft) |
| GET | `/api/assignments?status=&page=&limit=` | List own assignments with filter + pagination |
| GET | `/api/assignments/analytics` | Submission count per assignment |
| GET | `/api/assignments/:id` | Get single assignment |
| PATCH | `/api/assignments/:id` | Update assignment / advance status |
| DELETE | `/api/assignments/:id` | Delete (draft only) |

##### State Machine
```
Draft ──► Published ──► Completed
```
- **Draft**: editable, deletable
- **Published**: visible to students, cannot be deleted
- **Completed**: fully locked

##### PATCH body examples
```json
// Advance to published
{ "status": "published" }

// Edit a draft
{ "title": "New Title", "description": "...", "dueDate": "2026-04-01" }

// Mark completed
{ "status": "completed" }
```

#### Student Routes (role: student)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments/student/published?page=&limit=` | List published assignments (paginated) |

---

### Submissions — `/api`

#### Student Routes (role: student)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/assignments/:id/submit` | Submit answer (one per assignment) |
| GET | `/api/assignments/:id/my-submission` | View own submission |

##### Submit body
```json
{ "answer": "My answer text here" }
```

**Rules enforced:**
- Assignment must be `published`
- Cannot submit after the `dueDate`
- Cannot submit twice to the same assignment

#### Teacher Routes (role: teacher)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments/:id/submissions` | All submissions for an assignment |
| PATCH | `/api/submissions/:submissionId/review` | Mark a submission as reviewed |

---

## Project Structure

```
assignment-portal-backend/
├── controllers/
│   ├── authController.js        # register, login, getMe
│   ├── assignmentController.js  # CRUD + state machine + analytics
│   └── submissionController.js  # submit, view, review
├── middleware/
│   └── authMiddleware.js        # protect, teacherOnly, studentOnly
├── models/
│   ├── User.js                  # name, email, password (hashed), role
│   ├── Assignment.js            # title, description, dueDate, status
│   └── Submission.js            # assignment, student, answer, reviewed
├── routes/
│   ├── authRoutes.js
│   ├── assignmentRoutes.js
│   └── submissionRoutes.js
├── data/
│   └── seed.js                  # seed script
├── .env                         # environment variables (not committed)
├── server.js                    # app entry point
└── package.json
```

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- JWTs expire in 7 days
- **Helmet** sets secure HTTP headers
- **Rate limiting**: 20 requests / 15 min on `/api/auth`
- Role-based middleware on every protected route
- Server-side input validation on all endpoints

---

## Assumptions & Notes

1. A user can only be either a `teacher` or a `student` — no shared roles.
2. Students cannot see Draft or Completed assignments.
3. Submissions are immutable once created — no editing after submit.
4. Teachers can only manage assignments they personally created.
5. Due-date enforcement is server-side (submissions after `dueDate` are rejected).
6. The `data/seed.js` script **wipes all data** before re-seeding — do not run in production.
7. MongoDB Atlas URI can replace the default `localhost` URI in `.env`.

---

## Development Milestones

| # | Milestone | Commit Tag |
|---|---|---|
| 1 | Project setup + Mongoose models | `milestone-1` |
| 2 | JWT authentication (register + login) | `milestone-2` |
| 3 | Assignment CRUD with state machine | `milestone-3` |
| 4 | Student view + pagination | `milestone-4` |
| 5 | Submission workflow | `milestone-5` |
| 6 | Analytics, security hardening, README | `milestone-6` |
