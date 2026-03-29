# SafeCase 🛡️
**AI-Powered Nonprofit Client & Case Management Platform**

Built for [Opportunity Hack 2026](https://ohack.dev) · WiCS ASU Team

🔗 **Live Demo**: [20-k-hack.vercel.app](https://20-k-hack.vercel.app)

---

## What is SafeCase?

SafeCase is a lightweight, open-source case management platform built for nonprofits. It replaces spreadsheets and expensive enterprise tools ($50–150/user/month) with an AI-native platform deployable for under $30/month.

Built to serve organizations like NMTSA, Chandler CARE Center, ICM Food & Clothing Bank, and 6+ other OHack nonprofits — all of whom share the same core need: register clients, record services, and report outcomes.

---

## Features

### P0 — Core
- ✅ Google SSO + Role-Based Access (Admin / Staff)
- ✅ Client Registration with demographics
- ✅ Service / Visit Logging
- ✅ Client Profile View (EHR-style)
- ✅ Deployed with seed data (11 clients, 18+ services)

### P1 — Good to Have
- ✅ CSV Import / Export (Papa Parse)
- ✅ Reporting Dashboard (recharts)
- ✅ Scheduling / Calendar with in-app reminders
- ✅ Configurable Custom Fields (Admin)
- ✅ Audit Log + Real-time anomaly detection

### P2 — AI Features
- ✅ **Photo-to-Intake** — Snap a paper form, AI extracts all fields instantly
- ✅ **AI Follow-up Detection** — Case notes auto-generate follow-up reminders
- ✅ **AI Assistant Bot** — Natural language queries across all client data
- ✅ **Funder Report Generator** — One-click quarterly narrative reports
- ✅ **Document Uploads** — Attach files to client profiles
- ✅ **Multilingual Support** — Forms in any language auto-translated on upload
- ✅ **Mobile Responsive** — Works on phones and tablets

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google SSO) |
| AI | Anthropic Claude API (Vision + Text) |
| CSV | Papa Parse |
| Charts | Recharts |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Anthropic API key

### Setup

1. **Clone the repo**
```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/20-k-hack.git
cd 20-k-hack
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema
```sql
clients           -- Client demographics & contact info
service_entries   -- Visit & service logs
follow_ups        -- AI-generated follow-up reminders
appointments      -- Scheduled appointments
audit_logs        -- All access logged for compliance
alerts            -- Anomaly detection alerts
user_roles        -- Admin / Staff role assignments
custom_field_definitions  -- Configurable fields
custom_field_values       -- Client custom field data
```

---

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/2026-ASU-WiCS-Opportunity-Hack/20-k-hack)

---

## Team

Built by **WiCS ASU** for Opportunity Hack 2026

---

## License

MIT License — see [LICENSE](LICENSE)