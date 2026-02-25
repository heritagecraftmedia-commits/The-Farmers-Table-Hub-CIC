# The Farmers Table Hub CIC

A community-led social enterprise platform dedicated to supporting local food producers, artisans, and fostering community through radio and digital directories.

## 🌟 Core Features

- **Artisan Directory & Makers Hub**: A curated list of local producers and makers.
- **AI-Powered Lead Discovery**: Ethical AI agents that help the founder discover and qualify local artisans without intrusive scraping.
- **What's On Noticeboard**: A community event calendar with automated fetching from public sources.
- **Maker Stories**: A living heritage section featuring interviews with local artisans about their craft and tools.
- **Founder Dashboard**: Role-based management for listings, staff, radio operations, and a development roadmap.
- **Fog Mode**: A specialized "Fog Day Survival Guide" for the founder to manage high-stress or low-energy days.
- **Community Radio**: Integration with Live365 for monitoring broadcasts and schedules.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Animations**: Framer Motion (motion/react)
- **Icons**: Lucide React
- **AI**: Google Gemini API (via @google/genai)
- **Backend (Planned)**: Supabase (Auth, Database, Storage)
- **Automation (Planned)**: Make.com for event fetching

## 📜 Ethical Guidelines

This project is built on strict ethical principles:
1. **Human-in-the-Loop**: AI drafts content, but humans approve and send.
2. **No Intrusive Scraping**: We only use public APIs and search grounding.
3. **GDPR Compliance**: No attendee data is collected for events; we link to organizers.
4. **Ethical Monetisation**: Free listings are permanent; no "pay-to-rank" schemes.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Gemini API Key (for discovery features)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and add your keys.
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🗺️ Roadmap

- [ ] **Step 7**: Ethical Monetisation (Supporter badges, featured spots)
- [ ] **Step 8**: Events & Markets Automation (Make.com + Supabase)
- [ ] **Step 9**: Maker Stories expansion
- [ ] **Step 10**: Visitor AI (Librarian search)

## ⚖️ License

This project is developed for The Farmers Table Hub CIC. All rights reserved.
