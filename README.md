<br/>
<div align="center">
  <img alt="StudyJam Icon" width="100" src="./public/favicon.ico" />
  <h1 align="center">StudyJam Management Platform</h1>
  <p align="center">
    <strong>A high-performance, gamified platform for managing students, tasks, and attendance.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.0+-black?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

***

## 🚀 What is this project?

The **StudyJam Management Platform** (built for TinkerHub) is a comprehensive portal designed to streamline learning programs. It provides an intuitive environment where students can track their progress, collaborate on tasks, and stay engaged through gamified elements. For administrators, it offers powerful tools to oversee the program, monitor attendance, and assign tasks.

## ✨ How is it useful?

StudyJam turns traditional learning management into an engaging, interactive experience for both organizers and learners.

*   **🎮 Gamified Learning (Impact System):** Students earn XP and build attendance streaks, keeping them motivated. Streaks reset dynamically on absences, and XP adjusts automatically based on attendance records.
*   **👨‍🎓 Student Dashboard:** A personalized space for learners to view their stats, current tasks, attendance history, and engage in mini-games like Wordle.
*   **🛠️ Powerful Admin Panel:** Organizers can seamlessly manage student data, track attendance across sessions, and oversee the entire cohort from a unified dashboard.
*   **📝 Task Management:** Create, assign, and review coding tasks without character limits, providing detailed feedback to students.
*   **🌓 Modern UI Experience:** Sleek, responsive design built with **shadcn/ui**, featuring robust dark/light mode support for extended reading and coding sessions.

***

## 💻 For Developers: How to Setup & Use

This project leverages the latest web technologies, including **Next.js 15+ (App Router)**, **React 19**, and **Tailwind CSS v4**, with **Supabase** serving as the robust backend for authentication and database management.

### Prerequisites

Ensure you have the following installed on your local development machine:
*   [Node.js](https://nodejs.org/en/) (v18.17.0 or higher)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
*   A [Supabase](https://supabase.com/) account and project.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/studyjam-app.git
cd studyjam-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root of the project. You can copy the structure from `.env.example` if it exists.
You will need to provide your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Additional environment variables (if any)
```

### 4. Database Setup

Ensure your Supabase project is configured with the necessary tables (Profiles, Tasks, Attendance, etc.). *Refer to the database schema or migrations folder if provided.* Note that Row Level Security (RLS) policies should be configured appropriately to protect user data.

### 5. Run the Development Server

Start the local Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The page will auto-update as you edit the source files.

***

## 📁 Project Structure Overview

```text
studyjam-app/
├── public/                 # Static assets (images, icons)
├── src/                    # Source code
│   ├── app/                # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── (dashboard)/    # Student portal routes
│   │   ├── admin/          # Administrator portal routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── globals.css     # Global Tailwind styles
│   ├── components/         # Reusable React components (UI primitives, Layout, etc.)
│   └── lib/                # Utility functions, Supabase client configuration
└── package.json            # Project metadata and dependencies
```

***

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
