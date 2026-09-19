# CyberSentinel

An AI-powered cybersecurity assistant for students and everyday users.

## Stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Framer Motion (used in the Resume Privacy Scanner)
- **Backend**: Express + TypeScript (in `/server`) — see `server/README.md` for full details

## Getting started

This app has two parts that both need to run: the frontend (Vite dev
server) and the backend (Express API). The Website Scanner won't
return real results without the backend running.

**1. Backend:**
```bash
cd server
npm install
cp .env.example .env   # fill in whichever API keys you have — see below
npm run dev
```
Runs on `http://localhost:8787`.

**2. Frontend** (in a separate terminal, from the project root):
```bash
npm install
cp .env.example .env   # defaults already point at localhost:8787
npm run dev
```
Runs on `http://localhost:5173`.

### API keys

The Website Scanner integrates four real APIs — VirusTotal, URLScan.io,
WHOIS, and IP Geolocation. Every key is optional: without one, the
related check simply reports as "Unavailable" instead of the app
breaking. See `server/.env.example` for where to get each key and
`server/README.md` for exactly which check each one powers.

**Every API key lives in `server/.env` only.** The frontend never sees
a secret — it only ever calls our own backend at `VITE_API_BASE_URL`.

## Pages

| Route                     | Page                                                          |
| -------------------------- | -------------------------------------------------------------- |
| `/`                        | Landing page (hero, features, footer)                          |
| `/login`                   | Login                                                           |
| `/register`                | Register                                                        |
| `/forgot-password`         | Password reset request                                          |
| `/dashboard`                | Authenticated dashboard home                                    |
| `/dashboard/url-scanner`    | Website Scanner — full Security Report, backed by the real API layer |
| `/dashboard/email-scanner` | Email Phishing Analyzer — paste text/headers or upload a screenshot, get a risk score + AI explanation |
| `/dashboard/resume-scanner` | Resume Privacy Scanner — upload a PDF, detect PII, get a privacy score + AI review |
| `/dashboard/password-center` | Password Security Center — strength analysis, generators, and education, entirely client-side |
| `/dashboard/breach-checker` | Data Breach Checker — checks an email against Have I Been Pwned, with a transparent risk score and AI explanation |
| `/dashboard/security-score` | CyberSentinel Security Center — aggregates all other features into one Security Profile, score, and recommendations |
| `/dashboard/learning-hub` | Cybersecurity Learning Hub — lessons, quizzes, XP, levels, streaks, and achievements |
| `/dashboard/learning-hub/lessons/:id` | Individual lesson page — objectives, explanation, key terms, scenario, and quiz |
| `/threat-intelligence` | Threat Intelligence Dashboard — live NVD CVE data plus curated, sourced threat-awareness content |
| `/threat-intelligence/:id` | Individual threat/CVE detail page — verified info, AI explanation, and recommendations |
| `/analytics` | Security Analytics & Reporting Center — trends, comparisons, insights, and PDF report export |
| `/ai-security-coach` | AI Security Coach — conversational assistant grounded in your real CyberSentinel data, session-only memory |
| `/action-center` | Security Action Center — prioritized, deduplicated actions aggregated from every other feature, plus notifications |
| `/dashboard/settings` | Settings — notification preferences (the only settings area built so far) |
| `/dashboard/security-score` | Placeholder — tool not built yet                                 |
| `/dashboard/learning-hub`   | Placeholder — tool not built yet                                 |
| `/dashboard/settings`       | Placeholder — tool not built yet                                 |

## Folder structure

```
server/               Backend API — see server/README.md
  src/
    services/          One module per external API (or native check)
    controllers/        Orchestrates checks, caching, aggregation
    utils/               URL validation, timeout wrapper, score/report aggregation

src/                   Frontend
  components/          Reusable UI: Navbar, Sidebar, FeatureCard, Button,
                        Input, Card, LoadingSpinner, Modal, Footer, Logo,
                        ScanVisual, ScanLoader, ScanResultCard,
                        RiskScoreGauge, SecurityReportSummary,
                        ScannerInputPanel, Toast, etc.
  layouts/             MainLayout (public), AuthLayout (login/register),
                       DashboardLayout (sidebar + topbar shell)
  pages/               One file per route
  hooks/               useDarkMode, useDisclosure, useToast (app-wide toast system)
  utils/               cn() classname helper, validateUrl() URL validation
  services/            scanService.ts — calls the real backend and maps
                       its response into UI-ready data (icons, "Learn More" copy)
  assets/              Reserved for images/illustrations added later
```

## Design system

Tokens live in `tailwind.config.js`:

- **Palette** — deep navy base (`base`), electric-indigo primary accent,
  teal-mint secondary accent (a "verified/safe" signal), amber for caution.
- **Type** — Space Grotesk (display), Inter (body), JetBrains Mono (data/labels).
- **Signature motif** — a scan-line sweep + radar pulse rings, used in the
  hero (`ScanVisual`) and the scan loading state (`ScanLoader`).

## Testing

```bash
npm test
```

Runs the frontend's Vitest suite (`src/**/__tests__`) — URL validation,
category grouping, and component render/interaction tests for
`RiskScoreGauge` and `ScanResultCard`. See `server/README.md` for the
backend's test suite. This is a starting scaffold, not full coverage
— the highest-value untested surface right now is the scan pages
themselves (`WebsiteScannerPage`, `ScanHistoryPage`), which lean on
`fetch` and would need mocking to test meaningfully.

## Extending this foundation

- Each dashboard sidebar link already routes somewhere real
  (`ComingSoonPage`) — replace the `element` in `src/App.tsx` with the
  real tool page when it's built. Website Scanner is the first one done.
- To add a new backend check: write a `server/src/services/yourCheck.ts`
  returning a `ScanCheckResult`, wire it into the `Promise.all` in
  `server/src/controllers/scanController.ts`, then add an icon + "Learn
  More" entry for its `id` in `src/services/scanService.ts` on the frontend.
- `services/placeholderData.ts` is the single source of the static copy
  used across the landing page and dashboard; update content there.
- Auth forms (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`) have
  `handleSubmit` stubs with a comment marking where real auth calls go.
