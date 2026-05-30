# LocalPulse 🌆

A real-time civic dashboard for Patna, Bihar — aggregating air quality, power outage, and water supply data from government sources into one clean, accessible interface.

**Live at: https://localpulse2.vercel.app**

## What it does

- **Air Quality Map** — Live AQI readings from 6 CPCB monitoring stations across Patna, colour-coded by severity (Good → Hazardous)
- **Power Outage Tracker** — Scrapes SBPDCL's scheduled outage page every 6 hours and displays active cuts
- **AQI Trend Chart** — 24-hour historical AQI trend per station
- **Alert Subscriptions** — Email alerts when AQI crosses your threshold or a power cut is scheduled in your ward
- **Water Issue Reporting** — Crowdsourced water supply issue reporting since no government API exists for this

## Tech Stack

- **Frontend** — Next.js 15, TypeScript, Tailwind CSS, Leaflet.js, Recharts
- **Backend** — Next.js API routes, Prisma ORM, PostgreSQL (Supabase)
- **Data Sources** — CPCB API (data.gov.in), SBPDCL website scraper, IMD weather alerts
- **Deployment** — Vercel

## Data Sources

| Data | Source | Method |
|------|--------|--------|
| Air Quality (AQI, PM2.5, PM10) | CPCB via data.gov.in | REST API |
| Power Outages | SBPDCL | Web scraper (Cheerio) |
| Weather Alerts | IMD | REST API |
| Water Issues | Community | Crowdsourced |

## Local Setup

```bash
git clone https://github.com/Srishty632/localpulse.git
cd localpulse
npm install
# Add your .env file with DATABASE_URL and CPCB_API_KEY
npx prisma generate
npm run dev
```

## Screenshots

## Screenshots

![Dashboard Overview](./public/screenshots/screenshot1.png)
![Map View](./public/screenshots/screenshot2.png)
![Alerts and Water Report](./public/screenshots/screenshot3.png)

## Why this exists

Patna residents have no single place to check air quality, power cut schedules, or water supply status. This project aggregates that data from 5+ government sources and makes it accessible in one dashboard.

---

Built with ❤️ for Patna by Srishty Vidyarthi
