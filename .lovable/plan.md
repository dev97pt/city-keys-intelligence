

# Keys to the City (KTTC) — Phase 1 Plan

## Overview
Rebuild the existing HTML landing page into a premium dark-mode SaaS platform with authentication, onboarding, and a member dashboard featuring City Papers and Neighborhood Intel. Built with React + Vite + TypeScript + Tailwind + Lovable Cloud (Supabase).

---

## 1. Design System Setup
- Dark background (`#0a0a0a`), gold accent (`#e7c999`), white foreground
- Typography: **Cormorant Garamond** for display headings, **Geist Sans** for UI/body, **Geist Mono** for data
- Cards with subtle gold-tinted shadows, no solid borders
- Luxury ease motion: `cubic-bezier(0.2, 0, 0, 1)`, 300ms
- Custom scrollbar styling, no tooltips for basic icons

## 2. Landing Page (Public)
Rebuild the uploaded HTML with the KTTC design system:
- **Nav**: Fixed, blurred background, gold CTA button, mobile hamburger
- **Hero**: "From Arrival to Ownership" headline (Cormorant Garamond), founder quote card, stats row, two CTAs
- **Problem Section**: "You've Made the Move. Now What?" — Old Way / The Shift / The KTTC Way (rename from "Keys Way")
- **How It Works**: Three paths — Explorer (group trip), Builder (private trip), Consultancy (replaces Navigator)
- **Platform Features**: Grid showcasing City Papers, Webinars, Partner Directory, Community, Deal Calculator, Neighborhood Intel
- **About / Founder**: Brief founder section
- **Footer**: Links, social icons
- All amber/orange colors replaced with `#e7c999`

## 3. Authentication
- Supabase Auth with email/password signup and login
- Auth pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Protected routes for all `/dashboard/*` pages
- Session management with `onAuthStateChange`

## 4. Database Schema (Lovable Cloud)
Multi-country structure from day one:

**Core tables:**
- `countries` (id, name, slug, currency_code, is_active)
- `cities` (id, country_id, name, slug, description, price_per_m2_avg, lifestyle_score)
- `profiles` (id → auth.users, full_name, email, country_origin, relocation_stage, target_country_id, target_city_id)
- `user_roles` (id, user_id, role enum: admin/moderator/user)

**Content tables:**
- `city_papers` (id, country_id, city_id, title, content_markdown, pdf_url, premium_only)
- `neighborhood_stats` (id, city_id, name, avg_yield, safety_score, transport_score, investment_rating, price_per_m2, rental_yield, notes)

**Seed data:** Portugal (active) with Lisbon, Porto, Algarve. Spain, Mexico, Dubai, Brazil as inactive.

RLS policies on all tables. Security definer function for role checks.

## 5. Onboarding Flow (6-step modal)
After first signup, users complete:
1. **Welcome** — "Welcome to Keys to the City" intro
2. **Journey Stage** — Researching / Moving in 6-12 months / Already abroad / Buying soon → saves to `profiles.relocation_stage`
3. **Main Goal** — Buy property / Invest / Relocate lifestyle / Start a business
4. **Target Country** — Portugal (active), others shown as "Coming Soon"
5. **City Selection** — Dynamic based on country (Lisbon, Porto, Algarve) → saves to `profiles.target_city_id`
6. **Recommended Resources** — Personalized suggestions based on selections

## 6. Member Dashboard
Sidebar navigation (dark, collapsible) with:
- **Dashboard** — Welcome card, personalized based on onboarding data, quick links to resources
- **City Papers** — Filterable by country/city, card grid with title, city tag, and content/PDF viewer
- **Neighborhood Intel** — Data grid/table with columns: Name, Price/m², Rental Yield, Safety, Transport, Investment Rating. Filterable by city. Uses Geist Mono for numbers.
- Placeholder nav items for future phases: Webinars, Partner Directory, Community, Deal Calculators, Templates, Experiences

## 7. KTTC Branding Element
The "KTTC Way" typography treatment: **K** (Cormorant, large) **tt** (Geist, smaller, tight tracking) **C** (Cormorant, large) — used in the landing page section and dashboard branding.

