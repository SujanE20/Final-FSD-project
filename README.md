# Flowcraft — Workflow Automation Builder

A JavaScript MERN application with separate React and Express applications:
`client/` and `server/`. Workflows are stored as node/edge graphs in MongoDB
and executed by the backend graph engine.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- MongoDB Community Server running locally, or a MongoDB Atlas URI

## Configure MongoDB and JWT

From the project root:

```powershell
Copy-Item server\.env.example server\.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Set the generated key as `JWT_SECRET` in `server\.env`. Keep this secret private
and do not commit the `.env` file. The template's MongoDB URI uses
`mongodb://127.0.0.1:27017/workflow_automation_builder`; change `MONGODB_URI`
to your Atlas URI if needed.

## Install

```powershell
Set-Location server
npm install
Set-Location ..\client
npm install
Set-Location ..
```

## Run both applications together

From the project root, after configuring `server\.env` and installing the
frontend/backend dependencies above, start both servers with one command:

```powershell
npm run dev
```

The root launcher starts both child applications and prints their output in the
same terminal. Press **Ctrl+C** to stop them.

## Run in separate terminals

Alternatively, open two PowerShell terminals at the project root.

**Terminal 1 — backend API:**

```powershell
Set-Location server
npm run dev
```

The API connects to MongoDB and starts at `http://localhost:5000`.
`GET http://localhost:5000/api/health` reports API/database health.

**Terminal 2 — React frontend:**

```powershell
Set-Location client
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Local `localhost` and
`127.0.0.1` origins are both supported for development.

## Application features

- Landing, registration, and sign-in pages.
- bcrypt password hashing, JWT sessions, protected routes, and account settings.
- Dashboard statistics, recent execution activity, and a seven-day execution chart
  populated from MongoDB data.
- Workflow list with create, edit, activate/pause, delete, and run actions.
- React Flow visual designer with trigger, condition, action, notification, and
  end nodes; drag/drop, edge connections, condition branches, node inspector,
  graph validation, save, zoom, and test-event execution.
- Graph execution supports branching, cycle/reachability checks, bounded runs,
  step logs, execution records, and in-app workflow notifications.
- Workflow actions: create/update task, change task status, update project
  progress for matching tasks, generate notification, and save execution log.
- Execution history and individual node-by-node execution details.
- In-app notifications with read/unread state and task management.
- User data is scoped by authenticated MongoDB `ObjectId` ownership.

### Simulated triggers

The designer supports Manual, Task Created, Task Completed, User Registered,
Payment Received, and Form Submitted trigger types. Use **Run workflow** to
simulate an event by supplying a JSON object in the designer's test-event panel.
The trigger type stored on the trigger node is sent with the run request.

### REST API

All endpoints below are relative to `/api`. Protected routes require
`Authorization: Bearer <JWT>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Register account |
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Get current account |
| PATCH | `/settings/profile` | Update name/email |
| GET | `/dashboard` | Statistics and recent execution data |
| GET, POST | `/workflows` | List/create owned workflows |
| GET, PUT, DELETE | `/workflows/:id` | Read/update/delete owned workflow |
| POST | `/workflows/validate` | Validate a graph |
| POST | `/workflows/:id/trigger` | Simulate trigger and run graph |
| GET | `/executions` | List execution history |
| GET | `/executions/:id` | Get execution details |
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/read-all` | Mark notifications read |
| PATCH | `/notifications/:id/read` | Mark one notification read |
| GET, POST | `/tasks` | List/create tasks |
| PATCH, DELETE | `/tasks/:id` | Update/delete an owned task |

## Validate

From the project root:

```powershell
npm run check
```

The root check runs backend syntax checks, workflow-engine unit tests, and a
production frontend build.

## Project layout

```text
client/  React, React Router, Axios, and React Flow application
server/  Express REST API, Mongoose models, auth, and execution services
```
