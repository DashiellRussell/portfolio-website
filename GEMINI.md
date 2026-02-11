# GEMINI.md - Project Overview

This document provides an overview of the project, including its purpose, technologies used, and instructions for development, intended for instructional context for future interactions with Gemini CLI.

## 🌟 Project Overview

This project is a modern, interactive, and "Cyber-Minimalist" portfolio website designed to showcase work as a Mechatronics Engineer and Full-Stack Developer. It features a dynamic design with glassmorphism effects, a custom design system, and integration with GitHub for real-time blog updates.

**Key Features:**

*   **Cyber-Minimalist Aesthetic**: Clean, professional look with subtle cyber-inspired elements.
*   **Interactive Projects Carousel**: Horizontal scrollable carousel with hover effects.
*   **Dynamic Blog**: Automatically pulls content from GitHub repository READMEs into blog posts.
*   **Compact Experience Timeline**: Tab-based interface for work history.
*   **Responsive Design**: Optimized for mobile, tablet, and desktop devices.
*   **Secure Contact Form**: Server-side email sending with rate limiting and validation.

**Core Technologies:**

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4
*   **UI Library**: shadcn/ui (Radix UI based)
*   **Animations**: Framer Motion
*   **Integrations**: GitHub API, Nodemailer, React Hook Form + Zod, Next Themes

## 🚀 Building and Running

### Prerequisites

*   Node.js 18+
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/portfolio-website.git
    cd portfolio-website
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Copy the example environment file and add your actual credentials. For detailed instructions on setting up SMTP for the contact form, refer to the `README.md`.
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` with your SMTP credentials:
    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASS="your-app-password"
    EMAIL_TO=your-email@gmail.com
    EMAIL_FROM=your-email@gmail.com
    ```

### Development

To run the development server:
```bash
npm run dev
```
Open your browser to [http://localhost:3000](http://localhost:3000).

### Building and Starting Production

To build the project for production:
```bash
npm run build
```
To start the production server:
```bash
npm run start
```

### Linting

To lint the codebase:
```bash
npm run lint
```

## 📐 Development Conventions

*   **Language**: TypeScript is used throughout the project for type safety.
*   **Styling**: Tailwind CSS v4 is the primary styling framework, enhanced by `shadcn/ui` components for consistent UI elements.
*   **Component Structure**: Components are organized into `components/` with `sections/` for page-specific parts and `ui/` for reusable elements.
*   **Utility Functions**: General utility functions are located in `lib/`.
*   **Version Control**: Adherence to standard Git practices, with `.env.local` explicitly ignored to protect sensitive information.
*   **Linting**: ESLint is configured to maintain code quality and consistency.
