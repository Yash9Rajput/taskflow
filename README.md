# TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Axios |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (access + refresh tokens) |
| Styling | CSS Modules |

## Project Structure

```
taskflow/
├── backend/
│   ├── db/database.js         # SQLite setup & seed data
│   ├── middleware/auth.js     # JWT verify + role guard
│   ├── routes/auth.js         # POST /login, /signup, /refresh
│   ├── routes/projects.js     # CRUD /projects
│   ├── routes/tasks.js        # CRUD /tasks
│   ├── routes/users.js        # GET/PATCH /users
│   ├── server.js              # Express app entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js      # Axios instance + interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/        # Navbar, TaskRow, ProjectCard, Modal, Forms
│   │   ├── pages/             # Login, Signup, Dashboard, Projects, Tasks, Team
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | demo123 |
| Member | member@demo.com | demo123 |

## API Reference

### Auth
| Method | Path | Body |
|---|---|---|
| POST | /api/auth/signup | `{name, email, password, role}` |
| POST | /api/auth/login | `{email, password}` |
| POST | /api/auth/refresh | `{refreshToken}` |

### Projects — Admin only for write
`GET /api/projects` · `POST /api/projects` · `PATCH /api/projects/:id` · `DELETE /api/projects/:id`

### Tasks — Admin for write, Assignee can update status
`GET /api/tasks[?projectId=]` · `POST /api/tasks` · `PATCH /api/tasks/:id` · `DELETE /api/tasks/:id`

### Users
`GET /api/users` · `PATCH /api/users/:id/role` (Admin only)
