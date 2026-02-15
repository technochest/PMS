# Project Management System (PMS)

A comprehensive, feature-rich project management application built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

### 📊 Dashboard & Analytics
- Real-time project health monitoring
- Task completion metrics and trends
- Budget utilization tracking
- Visual charts and progress indicators

### 📅 Gantt Chart
- Interactive timeline visualization
- Day, week, and month view modes
- Task dependencies visualization
- Milestone markers

### 📋 Kanban Board
- Drag-and-drop task management
- Status columns (To Do, In Progress, Review, Done)
- Quick task creation
- Priority and assignee indicators

### ✅ Task Management
- Create, edit, and delete tasks
- Subtasks and dependencies
- Priority levels (Low, Medium, High, Critical)
- Time tracking (estimated vs actual hours)
- Progress tracking (0-100%)
- Task assignments

### 🎯 Milestones
- Define key project deliverables
- Track milestone completion
- Visual timeline
- Overdue alerts

### 👥 Resource Management
- Team member profiles
- Skills tracking
- Availability management
- Workload balancing
- Hourly rate tracking

### 💰 Budget Management
- Budget planning by category
- Expense tracking
- Variance analysis
- Category breakdown (Labor, Materials, Equipment, Software, Travel)

### 🗂️ Project Organization
- Multiple projects support
- Project status tracking
- Color-coded projects
- Progress overview

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Prisma + SQLite (easily switchable to PostgreSQL/MySQL)
- **Charts**: Recharts
- **Drag & Drop**: @hello-pangea/dnd
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project:
```bash
cd pms-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pms-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/
│   │   ├── budget/            # Budget management components
│   │   ├── dashboard/         # Dashboard and analytics
│   │   ├── gantt/             # Gantt chart components
│   │   ├── kanban/            # Kanban board components
│   │   ├── layout/            # Layout components (Sidebar)
│   │   ├── milestones/        # Milestone management
│   │   ├── project/           # Project view components
│   │   ├── resources/         # Resource management
│   │   ├── tasks/             # Task forms and details
│   │   └── ui/                # Reusable UI components
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       ├── store.ts           # Zustand store
│       ├── types.ts           # TypeScript types
│       └── utils.ts           # Utility functions
```

## Database Schema

The application uses a comprehensive database schema with the following models:

- **Project**: Main project entity with budget, dates, and status
- **Task**: Tasks with subtasks, dependencies, and assignments
- **Milestone**: Key deliverables with due dates
- **Resource**: Team members with skills and availability
- **BudgetItem**: Budget line items by category
- **TimeEntry**: Time tracking entries
- **Risk**: Risk management entries
- **Note**: Project notes

## Customization

### Switching Database

The project uses SQLite by default. To switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/pms"
```

3. Run migrations:
```bash
npx prisma migrate dev
```

### Adding New Features

The modular architecture makes it easy to add new features:

1. Create components in `src/components/`
2. Add types in `src/lib/types.ts`
3. Extend the store in `src/lib/store.ts`
4. Update the database schema if needed

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Roadmap

- [ ] User authentication
- [ ] Real-time collaboration
- [ ] File attachments
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Export to PDF/Excel
- [ ] API endpoints for external integrations
- [ ] Mobile responsive improvements
- [ ] Dark mode
