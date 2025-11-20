# Dashiell Russell - Portfolio Website

A modern, interactive, and "Cyber-Minimalist" portfolio website built to showcase my work as a Mechatronics Engineer and Full-Stack Developer. This project features a dynamic design with glassmorphism effects, a custom design system, and integration with GitHub for real-time blog updates.

## 🚀 Tech Stack

### Core
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI based)

### Animations & Effects
- **Framer Motion**: For complex entrance animations, scroll reveals, and interactive elements.
- **Glassmorphism**: Custom utility classes for frosted glass effects.
- **CSS Gradients**: Dynamic background textures and text gradients.

### Features & Integrations
- **GitHub API**: Fetches pinned repositories and READMEs dynamically for the "Latest Insights" blog section.
- **React Markdown**: Renders GitHub README files directly within a modal.
- **Nodemailer**: Handles contact form submissions via SMTP (Gmail).
- **React Hook Form + Zod**: Robust form validation and error handling.
- **Next Themes**: Seamless light/dark mode switching with system preference detection.

## ✨ Key Features

- **Cyber-Minimalist Aesthetic**: A clean, professional look with subtle cyber-inspired elements (dot matrix backgrounds, neon accents in dark mode).
- **Interactive Projects Carousel**: A horizontal scrollable carousel showcasing featured projects with hover effects.
- **Dynamic Blog**: Automatically pulls content from your GitHub, turning repository READMEs into blog posts.
- **Compact Experience Timeline**: A tab-based interface to display work history without clutter.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices.
- **Secure Contact Form**: Server-side email sending with rate limiting and validation.

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/portfolio-website.git
   cd portfolio-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add your SMTP credentials for the contact form:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_TO=your-email@gmail.com
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the site.

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── api/              # API routes (contact form)
│   ├── projects/         # Dedicated projects page
│   ├── globals.css       # Global styles & Tailwind directives
│   ├── layout.tsx        # Root layout with ThemeProvider
│   └── page.tsx          # Homepage
├── components/           # React components
│   ├── sections/         # Page sections (Hero, Experience, Projects, etc.)
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── navigation.tsx    # Navbar component
│   ├── footer.tsx        # Footer component
│   └── blog-modal.tsx    # Modal for rendering GitHub READMEs
├── lib/                  # Utility functions
│   ├── utils.ts          # Tailwind class merger
│   ├── github.ts         # GitHub API fetcher
│   └── data.ts           # Static data for projects
└── public/               # Static assets (images, icons)
```

## 🎨 Customization

### Colors & Theme
The design system uses **OKLCH** colors defined in `app/globals.css`. You can easily tweak the `primary`, `secondary`, and `accent` variables to change the entire site's color scheme.

### Content
- **Projects**: Update `lib/data.ts` to add or modify projects.
- **Experience**: Update `components/sections/experience-section.tsx`.
- **GitHub**: The blog section automatically fetches from the GitHub user defined in `lib/github.ts`.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
