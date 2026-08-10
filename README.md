🟣 TaskFlow — Team Task Management Platform

TaskFlow is a full-stack team task management application designed to help teams organize projects, assign tasks, and collaborate efficiently — with role-based access control, secure authentication, and a built-in AI assistant to help users work smarter.

🔗 **Live Demo:** [taskflowteams-yash9rajputs-projects.vercel.app](https://taskflowteams-yash9rajputs-projects.vercel.app/)


✨ Features

- **Role-Based Access Control** — Admin and Member roles with scoped permissions, ensuring users only see the projects and tasks they belong to
- **Secure Authentication** — JWT-based auth with support for both traditional email/password login and Google OAuth
- **Password Recovery** — Forgot/reset password flows powered by the Brevo email API
- **AI Chat Assistant** — Integrated AI-powered chat with markdown rendering, syntax highlighting, per-message actions, and a recent-chats sidebar scoped per user
- **Team Collaboration** — Project and task management with per-user data isolation for notes and shared workspaces
- **Responsive Design** — Fully mobile-responsive UI with an animated, split-screen login experience
- **Session Security** — sessionStorage-based auth architecture to prevent cross-tab session contamination


🛠️ Tech Stack

**Frontend:** React 18, deployed on Vercel
**Backend:** Node.js, Express, deployed on Render
**Database:** PostgreSQL (hosted on Neon)
**Auth:** JWT, Google OAuth
**Email:** Brevo API
**AI Integration:** Groq (LLaMA 3) for the in-app AI assistant


🏗️ Architecture

TaskFlow follows a decoupled client-server architecture:

- **Frontend (React)** communicates with the backend via REST APIs
- **Backend (Express)** handles business logic, authentication, and authorization
- **Database (PostgreSQL/Neon)** stores users, projects, tasks, and notes with strict per-user/per-team data scoping
- **AI Assistant** is powered by Groq's LLaMA 3 model for fast, free-tier-friendly inference


🚀 Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd taskflow

# Install dependencies (frontend & backend)
npm install

# Set up environment variables
# (see .env.example for required keys: DB connection, JWT secret, OAuth credentials, Brevo API key, Groq API key)

# Run the app
npm run dev
```


📌 Project Notes

TaskFlow started as a deployment assignment and evolved into a fully-featured production app — including migrating from SQLite to PostgreSQL, moving infrastructure across multiple providers (Railway → Vercel + Render + Neon), and iterating on real-world issues like OAuth schema conflicts and multi-tab session bugs.


📄 License

This project is open source and available under the [MIT License](LICENSE).
