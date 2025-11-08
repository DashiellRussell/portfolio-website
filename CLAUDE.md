# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 portfolio website for Dashiell Russell (Mechatronics Engineering & Physics). It's a single-page application with multiple sections showcasing skills, projects, experience, and contact information. The site uses TypeScript, React 18, and Tailwind CSS 4 with shadcn/ui components.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### App Router Structure (Next.js 15)
- **Single-page layout**: `app/page.tsx` renders all sections in sequence
- **Root layout**: `app/layout.tsx` sets up fonts (Geist), theme provider (dark mode by default), and Vercel Analytics
- **API routes**: `app/api/contact/route.ts` handles contact form submissions via nodemailer

### Component Organization

**Page Sections** (`components/sections/`):
- All sections follow the pattern: `[name]-section.tsx`
- Sections are imported and rendered in order in `app/page.tsx`:
  1. HeroSection
  2. AboutSection
  3. SkillsSection
  4. ProjectsSection
  5. ExperienceSection
  6. TestimonialsSection
  7. ContactSection

**Layout Components** (`components/`):
- `navigation.tsx` - Main navigation bar
- `footer.tsx` - Site footer
- `theme-provider.tsx` - next-themes wrapper for dark/light mode
- `theme-toggle.tsx` - Theme switcher component

**UI Components** (`components/ui/`):
- shadcn/ui components (56+ components)
- Radix UI primitives with custom styling
- All use the "new-york" style variant
- Configured via `components.json`

### Styling System

- **Tailwind CSS 4** with PostCSS
- **CSS Variables**: Theme tokens defined in `app/globals.css` using OKLCH color space
- **Dark mode**: Implemented via `next-themes` with class-based switching
- **Animation**: Uses `tw-animate-css` package
- **Utility function**: `lib/utils.ts` exports `cn()` for className merging (clsx + tailwind-merge)

### Path Aliases

Configured in `tsconfig.json` and `components.json`:
```typescript
"@/*" -> "./*"           // Root-level imports
"@/components" -> "./components"
"@/lib" -> "./lib"
"@/hooks" -> "./hooks"
"@/components/ui" -> "./components/ui"
```

### Email Contact Form

The contact form in ContactSection submits to `/api/contact` which:
- Uses nodemailer for SMTP email delivery
- Requires environment variables (not committed to repo):
  - `SMTP_HOST`
  - `SMTP_PORT` (default: 587)
  - `SMTP_USER`
  - `SMTP_PASS`
  - `EMAIL_TO`
  - `EMAIL_FROM` (optional, defaults to SMTP_USER)
- Validates connection before sending
- Returns JSON responses with error handling

### Key Dependencies

- **Framework**: Next.js 15.2.4 (App Router)
- **UI Library**: Radix UI primitives + shadcn/ui
- **Styling**: Tailwind CSS 4, Framer Motion for animations
- **Forms**: react-hook-form + zod for validation
- **Icons**: lucide-react
- **Theme**: next-themes
- **Analytics**: @vercel/analytics

## Development Notes

### Adding New Sections
1. Create component in `components/sections/[name]-section.tsx`
2. Import and add to `app/page.tsx` in desired order
3. Sections should use semantic HTML (`<section id="...">`) for navigation anchors

### Adding UI Components
Use shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add [component-name]
```
This respects the configuration in `components.json` (new-york style, path aliases, etc.)

### Theme Customization
- Modify CSS variables in `app/globals.css` (both `:root` and `.dark` selectors)
- Use OKLCH color format for all theme colors
- The site defaults to dark theme (`defaultTheme="dark"` in layout.tsx)

### Type Safety
- Strict TypeScript configuration enabled
- Target ES6 with ESNext module system
- All files should be `.tsx` for components, `.ts` for utilities

### Git Workflow
- Main branch: `main`
- Development branch: `dev` (currently active)
- Commit style: lowercase prefixes (`feat:`, `fix:`, etc.)
