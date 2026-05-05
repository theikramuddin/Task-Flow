# TaskFlow — Team Task Manager

MERN stack task management system with role-based access control.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access token) + httpOnly cookie (refresh token)
- **Deployment**: Railway

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend
```bash
cd server
cp .env.example .env
# Edit .env — set MONGO_URI and JWT secrets
npm install
npm run dev        # runs on port 5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev        # runs on port 5173, proxies /api to :5000
```

---

## API Reference

### Auth
| Method | Endpoint             | Access  | Description        |
|--------|---------------------|---------|--------------------|
| POST   | /api/auth/register  | Public  | Create account     |
| POST   | /api/auth/login     | Public  | Login              |
| POST   | /api/auth/refresh   | Cookie  | Refresh token      |
| POST   | /api/auth/logout    | Public  | Clear cookie       |
| GET    | /api/auth/me        | Private | Current user       |

### Projects
| Method | Endpoint                              | Access         |
|--------|--------------------------------------|----------------|
| GET    | /api/projects                         | Member+        |
| POST   | /api/projects                         | Any auth       |
| GET    | /api/projects/:id                     | Project member |
| PATCH  | /api/projects/:id                     | Project admin  |
| DELETE | /api/projects/:id                     | Project admin  |
| POST   | /api/projects/:id/members             | Project admin  |
| DELETE | /api/projects/:id/members/:userId     | Project admin  |

### Tasks
| Method | Endpoint                              | Access         |
|--------|--------------------------------------|----------------|
| GET    | /api/projects/:projectId/tasks        | Project member |
| POST   | /api/projects/:projectId/tasks        | Project member |
| GET    | /api/tasks/:id                        | Auth           |
| PATCH  | /api/tasks/:id                        | Project member |
| DELETE | /api/tasks/:id                        | Creator/Admin  |

### Dashboard
| Method | Endpoint         | Access  |
|--------|-----------------|---------|
| GET    | /api/dashboard   | Auth    |

---

## Role-Based Access

**Global roles** (stored on User):
- `admin` — can bypass all project-level checks
- `member` — default, needs project membership

**Project roles** (stored on ProjectMember):
- `admin` — manage members, update/delete project
- `member` — view project, create/update tasks

---

## Deploy to Railway

1. Push repo to GitHub
2. Create two Railway services: one for `server/`, one for `client/`
3. Add MongoDB plugin (or use Atlas — set MONGO_URI env var)
4. Set environment variables for the server service:
   - `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`
5. For client: set `VITE_API_URL` to your server's Railway URL
