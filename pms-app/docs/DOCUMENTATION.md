# Project Management System (PMS) - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Quick Start](#quick-start)
5. [Architecture](#architecture)
6. [Features Documentation](#features-documentation)
7. [Configuration](#configuration)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Overview

The **Project Management System (PMS)** is a comprehensive, enterprise-ready project management application designed to help teams plan, track, and deliver projects efficiently. Built with modern web technologies, it provides real-time project visibility through interactive dashboards, Gantt charts, and Kanban boards.

### Key Highlights

- **All-in-One Solution**: Combines task management, resource planning, budget tracking, and milestone management
- **Interactive Visualizations**: Gantt charts, Kanban boards, and analytics dashboards
- **Modern Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Flexible Database**: SQLite by default, easily switchable to PostgreSQL/MySQL
- **Real-time State Management**: Zustand for efficient state handling
- **Drag-and-Drop**: Intuitive task management with @hello-pangea/dnd

---

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10+, macOS 10.15+, or Linux |
| **Node.js** | Version 18.0 or higher |
| **npm** | Version 9.0 or higher (included with Node.js) |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Disk Space** | 500 MB for application + dependencies |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |

### Development Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| npm/yarn | Latest | Package management |
| VS Code | Latest | Recommended IDE |
| Git | 2.30+ | Version control |

---

## Installation Guide

### Step 1: Clone or Navigate to Project

```bash
cd c:\Users\bjuna\Dropbox\Projects\SoftDev\00-AppDev\PMS\pms-app
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js (Framework)
- React & React DOM
- Prisma (Database ORM)
- Zustand (State Management)
- Tailwind CSS (Styling)
- Recharts (Charts)
- Lucide React (Icons)
- date-fns (Date utilities)

### Step 3: Set Up Environment

Create a `.env` file in the project root (if not exists):

```env
# Database
DATABASE_URL="file:./dev.db"

# Application
NODE_ENV=development
PORT=3001
```

### Step 4: Initialize Database

```bash
# Push the schema to the database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Step 5: Verify Installation

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Quick Start

### Using Launch Scripts (Recommended)

**Windows Command Prompt:**
```cmd
start.bat
```

**Windows PowerShell:**
```powershell
.\start.ps1
```

### Manual Start

```bash
cd pms-app
npm run dev
```

Or to specify a custom port:

```bash
cd pms-app
npx next dev -p 3001
```

### First Time Usage

1. Launch the application
2. Click **"Load Demo Data"** to see sample project data
3. Or click **"Create Project"** to start fresh
4. Explore different views using the sidebar navigation

---

## Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16 (App Router) │ React 19 │ TypeScript           │
│  Tailwind CSS │ Lucide Icons │ Recharts                    │
├─────────────────────────────────────────────────────────────┤
│                     State Management                        │
├─────────────────────────────────────────────────────────────┤
│  Zustand Store │ @hello-pangea/dnd (Drag & Drop)           │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM │ SQLite (Default) / PostgreSQL / MySQL        │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
pms-app/
├── docs/                      # Documentation
│   ├── DOCUMENTATION.md       # This file
│   └── API.md                 # API documentation
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles & Tailwind
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Main application page
│   ├── components/
│   │   ├── budget/            # Budget management
│   │   │   └── BudgetManagement.tsx
│   │   ├── dashboard/         # Analytics dashboard
│   │   │   └── Dashboard.tsx
│   │   ├── gantt/             # Gantt chart view
│   │   │   └── GanttChart.tsx
│   │   ├── kanban/            # Kanban board
│   │   │   └── KanbanBoard.tsx
│   │   ├── layout/            # Layout components
│   │   │   └── Sidebar.tsx
│   │   ├── milestones/        # Milestone tracking
│   │   │   └── MilestoneManagement.tsx
│   │   ├── project/           # Project overview
│   │   │   └── ProjectView.tsx
│   │   ├── resources/         # Resource management
│   │   │   └── ResourceManagement.tsx
│   │   ├── tasks/             # Task forms
│   │   │   └── TaskForm.tsx
│   │   └── ui/                # Reusable UI components
│   │       └── index.tsx
│   └── lib/
│       ├── prisma.ts          # Prisma client instance
│       ├── store.ts           # Zustand state store
│       ├── types.ts           # TypeScript definitions
│       └── utils.ts           # Utility functions
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind config
├── start.bat                  # Windows launcher
└── start.ps1                  # PowerShell launcher
```

### Data Models

The application uses these core data models:

| Model | Description |
|-------|-------------|
| **Project** | Main container with budget, dates, status |
| **Task** | Work items with subtasks & dependencies |
| **Milestone** | Key deliverables with due dates |
| **Resource** | Team members with skills & rates |
| **BudgetItem** | Budget entries by category |
| **TimeEntry** | Time tracking records |
| **Risk** | Risk management entries |
| **Note** | Project documentation |

---

## Features Documentation

### 📊 Dashboard

The dashboard provides at-a-glance project health metrics:

- **Project Status Overview**: Active, planning, on-hold, completed projects
- **Task Completion Rate**: Visual progress indicators
- **Budget Utilization**: Spent vs. allocated budget
- **Upcoming Milestones**: Next deadlines at a glance
- **Team Workload**: Resource utilization charts

### 📅 Gantt Chart

Interactive timeline visualization:

- **View Modes**: Day, Week, Month views
- **Task Bars**: Visual task duration representation
- **Dependencies**: Arrow connections between tasks
- **Milestones**: Diamond markers for key dates
- **Scrolling**: Navigate through project timeline

### 📋 Kanban Board

Drag-and-drop task management:

| Column | Status |
|--------|--------|
| To Do | Tasks not yet started |
| In Progress | Currently being worked on |
| Review | Ready for review/testing |
| Done | Completed tasks |

Features:
- Drag tasks between columns
- Quick status updates
- Priority indicators
- Assignee avatars

### ✅ Task Management

Comprehensive task handling:

- **Create/Edit Tasks**: Full form with all fields
- **Subtasks**: Break down large tasks
- **Dependencies**: Link related tasks
- **Time Tracking**: Estimated vs. actual hours
- **Progress**: 0-100% completion slider
- **Priority Levels**: Low, Medium, High, Critical

### 🎯 Milestones

Track key deliverables:

- Define major project milestones
- Set due dates
- Mark as complete
- View in timeline
- Overdue alerts

### 👥 Resources

Team management:

- **Profiles**: Name, email, role, department
- **Skills**: Track team capabilities
- **Availability**: Hours per week
- **Hourly Rate**: For budget calculations
- **Workload**: View current assignments

### 💰 Budget

Financial tracking:

| Category | Examples |
|----------|----------|
| Labor | Team salaries, contractors |
| Materials | Physical supplies |
| Equipment | Hardware, tools |
| Software | Licenses, subscriptions |
| Travel | Transportation, accommodation |
| Other | Miscellaneous expenses |

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |

### Database Configuration

**SQLite (Default):**
```prisma
datasource db {
  provider = "sqlite"
}
```

**PostgreSQL:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**MySQL:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Customizing Ports

Edit `.env`:
```env
PORT=3001
```

Or use command line:
```bash
npx next dev -p 3001
```

---

## Development Guide

### Adding New Components

1. Create component in `src/components/<category>/`
2. Import and use in parent components
3. Add types to `src/lib/types.ts` if needed
4. Update store in `src/lib/store.ts` for state

### Styling

Using Tailwind CSS utility classes:

```tsx
<div className="bg-white rounded-lg shadow-md p-4">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
</div>
```

### State Management

Using Zustand store:

```typescript
import { useProjectStore } from "@/lib/store";

// In component
const { projects, addProject, updateProject } = useProjectStore();
```

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run migrations:
```bash
npx prisma db push
npx prisma generate
```

---

## Troubleshooting

### Common Issues

#### "Port already in use"
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npx next dev -p 3001
```

#### "Unable to acquire lock"
Another Next.js instance is running. Stop it first:
```bash
Get-Process -Name node | Stop-Process -Force
```

#### "Prisma Client not generated"
```bash
npx prisma generate
```

#### "Database file not found"
```bash
npx prisma db push
```

### Log Locations

- **Next.js logs**: Terminal/console output
- **Browser logs**: Developer Tools (F12) → Console

---

## API Reference

### Store Actions

#### Projects
| Action | Parameters | Description |
|--------|------------|-------------|
| `addProject` | `CreateProjectInput` | Create new project |
| `updateProject` | `id, Partial<Project>` | Update project |
| `deleteProject` | `id` | Delete project |
| `selectProject` | `id` | Set active project |

#### Tasks
| Action | Parameters | Description |
|--------|------------|-------------|
| `addTask` | `CreateTaskInput` | Create new task |
| `updateTask` | `id, Partial<Task>` | Update task |
| `deleteTask` | `id` | Delete task |
| `moveTask` | `taskId, newStatus` | Change task status |

#### Milestones
| Action | Parameters | Description |
|--------|------------|-------------|
| `addMilestone` | `CreateMilestoneInput` | Create milestone |
| `updateMilestone` | `id, updates` | Update milestone |
| `deleteMilestone` | `id` | Delete milestone |

---

## Support

For issues or feature requests, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing documentation
3. Create an issue with detailed description

---

*Documentation last updated: January 2026*
