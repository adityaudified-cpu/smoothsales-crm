# SmoothSales.ai — Multi-Tenant Sales CRM Microservice

Production-grade, standalone SaaS CRM microservice for **SmoothSales.ai** sales teams, reps, pipeline management, automated distribution rules, commission ledger, and integrations.

## 🚀 Port & Domain
- **Local Dev**: `http://localhost:3001`
- **Production Target**: `app.smoothsales.ai`

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS & CSS custom variables design tokens
- **Components**: Radix UI & Shadcn UI
- **Tables**: TanStack React Table
- **Forms**: React Hook Form & Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## 🏛️ Microservice Architecture Links
- **Super Admin**: `NEXT_PUBLIC_ADMIN_URL` (`http://localhost:3002` / `admin.smoothsales.ai`)
- **Partner Hub**: `NEXT_PUBLIC_PARTNERS_URL` (`http://localhost:3003` / `partners.smoothsales.ai`)
- **Public Website**: `NEXT_PUBLIC_MARKETING_URL` (`http://localhost:3000` / `smoothsales.ai`)
