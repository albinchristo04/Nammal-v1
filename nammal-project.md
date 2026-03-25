# Nammal (നമ്മൾ) — Complete Project Document
> Free matrimony platform for the Kerala/South Indian community. Ad-supported, community-first, human-verified.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Philosophy](#2-core-philosophy)
3. [User Roles](#3-user-roles)
4. [Site Access Rules](#4-site-access-rules)
5. [Feature Requirements](#5-feature-requirements)
6. [Complete User Workflows](#6-complete-user-workflows)
7. [Admin Workflows](#7-admin-workflows)
8. [Database Schema](#8-database-schema)
9. [Tech Stack](#9-tech-stack)
10. [API Endpoints](#10-api-endpoints)
11. [Monetization Model](#11-monetization-model)
12. [Go-to-Market Roadmap](#12-go-to-market-roadmap)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Open Questions & Decisions](#14-open-questions--decisions)

---

## 1. Project Overview

**Product Name:** Nammal (നമ്മൾ — meaning "We / Us" in Malayalam)

**Tagline:** *Nammal koodeyundu* — We are together

**Type:** Free matrimony / matchmaking web + mobile platform

**Target Market:** Kerala community (initial), expanding to South Indian diaspora

**Revenue Model:** Ad-supported (Google AdSense, direct wedding vendor ads) + optional freemium features in Phase 3

**Key Differentiator:** Completely free to browse, connect, and chat — no paywalls on core features. Trust through mandatory manual profile verification before any profile goes live.

---

## 2. Core Philosophy

| Principle | Description |
|---|---|
| **Free first** | No user should pay to find a life partner. Ads fund the platform. |
| **Trust by default** | Every visible profile has been manually verified by Nammal admin. |
| **Consent-gated chat** | Chat only unlocks when both parties mutually accept interest. No cold messaging. |
| **Regional identity** | Malayalam UI option, local filters (district, community), cultural relevance. |
| **Safety for women** | Women control who can chat with them. Men cannot re-send interest for 30 days after a decline. |

---

## 3. User Roles

### 3.1 Visitor (unauthenticated)
- Can see landing page, about page, testimonials
- Cannot see any profiles
- Can register

### 3.2 Registered (unverified)
- Phone OTP confirmed
- Profile created and submitted
- Cannot browse, send interest, or chat
- Sees "Pending verification" dashboard state

### 3.3 Verified User
- Profile approved by admin
- Can browse all verified profiles of the opposite gender
- Can send interest
- Can accept/decline received interests
- Can chat with mutual matches only

### 3.4 Premium User (Phase 3)
- All verified user features
- Additional: see who viewed their profile, boost profile in search, priority in search results

### 3.5 Admin
- Access to internal admin dashboard
- Can approve or reject profiles
- Can suspend or permanently remove profiles
- Can view all reports
- Can manage ads and vendor partnerships

---

## 4. Site Access Rules

```
IF user is not logged in
  → Show landing page only
  → No profile data accessible

IF user is logged in but unverified
  → Show "pending review" screen
  → No access to browse, search, interest, or chat

IF user is logged in and verified
  → Full access: browse, search, send interest
  → Chat only unlocked per mutual match

IF user is suspended
  → Show suspension notice
  → All features locked
```

### 4.1 Interest Rules
- A user can send interest to any verified profile of the opposite gender
- The receiver has **7 days** to accept or decline; after 7 days the interest auto-expires
- If declined, the sender **cannot re-send interest to the same profile for 30 days**
- A user can have a maximum of **10 pending sent interests** at a time (Phase 1 limit to prevent spam)

### 4.2 Chat Rules
- Chat is only available between two users who have a **mutually accepted interest**
- Either party can block the other at any time, which ends the chat
- Blocked users cannot re-initiate contact

---

## 5. Feature Requirements

### 5.1 Registration & Onboarding

| # | Feature | Priority |
|---|---|---|
| R1 | Phone number entry | P0 |
| R2 | OTP verification via SMS | P0 |
| R3 | Profile form — basic details | P0 |
| R4 | Photo upload (min 1, max 5) | P0 |
| R5 | Profile submission to admin queue | P0 |
| R6 | Email notification on approval/rejection | P1 |
| R7 | Push notification on approval | P1 |

**Profile form fields (required):**
- Full name
- Date of birth
- Gender (Male / Female)
- Religion
- Community / Caste (optional but filterable)
- Mother tongue
- District (Kerala)
- Education level
- Occupation
- Annual income range
- Height
- Marital status (Never married / Divorced / Widowed)
- About me (free text, max 500 chars)
- Profile photo(s)

**Profile form fields (optional):**
- Horoscope details (star / rasi)
- Father's occupation
- Mother's occupation
- Number of siblings
- Own house / property
- Contact preference (family can contact / self only)

---

### 5.2 Browse & Search

| # | Feature | Priority |
|---|---|---|
| S1 | Browse verified profiles (opposite gender only by default) | P0 |
| S2 | Filter by age range | P0 |
| S3 | Filter by district | P0 |
| S4 | Filter by religion / community | P0 |
| S5 | Filter by education level | P1 |
| S6 | Filter by marital status | P1 |
| S7 | Filter by height range | P2 |
| S8 | Search by profile ID | P2 |
| S9 | Save profiles to shortlist | P2 |
| S10 | "Who viewed my profile" (Premium only, Phase 3) | P3 |

---

### 5.3 Interest System

| # | Feature | Priority |
|---|---|---|
| I1 | Send interest to a profile | P0 |
| I2 | Receive interest notification (push + in-app) | P0 |
| I3 | View received interests list | P0 |
| I4 | Accept interest | P0 |
| I5 | Decline interest | P0 |
| I6 | Auto-expire interest after 7 days | P0 |
| I7 | 30-day re-send block after decline | P0 |
| I8 | View sent interests list with status | P1 |
| I9 | Withdraw a sent interest (before response) | P1 |

---

### 5.4 Chat

| # | Feature | Priority |
|---|---|---|
| C1 | One-to-one messaging between matched users | P0 |
| C2 | Real-time message delivery (Socket.io) | P0 |
| C3 | Read receipts | P1 |
| C4 | Message notification (push + in-app) | P0 |
| C5 | Block user | P0 |
| C6 | Report user from chat | P0 |
| C7 | Message history persisted | P0 |
| C8 | Photo sharing in chat | P2 |

---

### 5.5 Notifications

| # | Trigger | Channel |
|---|---|---|
| N1 | Profile approved | SMS + push |
| N2 | Profile rejected | SMS + push |
| N3 | Interest received | Push + in-app |
| N4 | Interest accepted | Push + in-app |
| N5 | Interest declined | Push + in-app |
| N6 | Interest expired (no response) | Push + in-app |
| N7 | New chat message | Push + in-app |
| N8 | Profile viewed (Premium, Phase 3) | In-app |

---

### 5.6 Profile Management

| # | Feature | Priority |
|---|---|---|
| PM1 | Edit profile details (triggers re-verification for photo changes) | P0 |
| PM2 | Deactivate account (hides profile temporarily) | P1 |
| PM3 | Delete account (full data removal) | P1 |
| PM4 | Mark profile as "Match found" (removes from listings) | P2 |
| PM5 | Privacy setting: hide phone number from matches | P1 |

---

## 6. Complete User Workflows

### 6.1 New User Registration Flow

```
1. User visits nammal.in
   └─ Sees landing page (no profiles)
   └─ Clicks "Register"

2. Phone verification
   └─ Enters mobile number
   └─ Receives 6-digit OTP via SMS
   └─ Enters OTP → account created

3. Profile builder (multi-step form)
   └─ Step 1: Personal details (name, DOB, gender, religion)
   └─ Step 2: Location & education (district, qualification, job)
   └─ Step 3: Physical & family (height, marital status, family info)
   └─ Step 4: About me + horoscope (optional)
   └─ Step 5: Photo upload (at least 1 required)

4. Submission
   └─ Profile saved with status = "pending"
   └─ User sees: "Your profile is under review. We'll notify you within 24–48 hours."
   └─ Admin receives notification in dashboard queue

5. Admin review (see Section 7)
   ├─ Approved → status = "verified", user notified
   └─ Rejected → status = "rejected", reason sent to user, user can resubmit
```

---

### 6.2 Browsing & Sending Interest Flow

```
1. Verified user logs in
   └─ Sees home feed: recently joined profiles (opposite gender)

2. Browse / filter
   └─ Applies filters: age, district, religion, education
   └─ Sees profile cards: name, age, district, occupation, one photo

3. View full profile
   └─ Clicks on a profile card
   └─ Sees: all details, photos, about me
   └─ Cannot see phone number (hidden)

4. Send interest
   └─ Clicks "Send Interest" button
   └─ System checks:
      ├─ Is this same gender? → block
      ├─ Already sent interest to this person? → show status
      ├─ Declined this person in last 30 days? → show cooldown
      └─ At 10 pending interests already? → show limit warning
   └─ If all checks pass: interest created with status = "pending"
   └─ Receiver gets push notification: "Someone is interested in your profile"
```

---

### 6.3 Receiving & Responding to Interest Flow

```
1. User B gets notification
   └─ Opens app → goes to "Interests received" section

2. Views sender's profile
   └─ Sees User A's full verified profile
   └─ Has 7 days to respond

3. Decision
   ├─ ACCEPT
   │  └─ Interest status → "accepted"
   │  └─ Chat thread created between A and B
   │  └─ Both users notified: "You have a new match! Start chatting."
   │
   └─ DECLINE
      └─ Interest status → "declined"
      └─ User A notified: "Your interest was not accepted."
      └─ 30-day re-send block applied for A → B
      └─ No chat created

4. No response in 7 days
   └─ Interest auto-expires (cron job)
   └─ User A notified: "Your interest has expired."
   └─ No block applied for auto-expiry
```

---

### 6.4 Chat Flow

```
1. Chat unlocked after mutual interest acceptance
   └─ Chat thread appears in both users' inbox

2. Either user can start the conversation
   └─ Messages delivered in real-time (Socket.io)
   └─ Messages stored in DB
   └─ Push notification sent if recipient is offline

3. Optional: share contact details manually within chat
   └─ Nammal does not auto-share phone numbers

4. Blocking
   └─ Either user can block from chat
   └─ Blocked user sees no message delivery
   └─ Blocked user's chat thread is hidden

5. Reporting
   └─ User can report from chat with reason
   └─ Report goes to admin dashboard
   └─ Admin reviews and can suspend reported user
```

---

### 6.5 Account Management Flow

```
Edit profile
└─ User edits non-photo details → changes go live immediately
└─ User changes/adds photo → profile goes back to "pending" for re-verification

Deactivate
└─ Profile hidden from all searches and browse
└─ Existing chat threads preserved
└─ Can reactivate anytime

Delete account
└─ All profile data deleted (GDPR-style)
└─ Chat messages anonymised ("This user has deleted their account")
└─ Interests and match records deleted
└─ Phone number released for re-registration after 90 days

Mark as "Match found"
└─ Profile disappears from all listings
└─ Account stays active for chat with existing match
└─ Shown as success story (with permission) on landing page
```

---

## 7. Admin Workflows

### 7.1 Profile Verification Dashboard

**Queue view fields:** Profile ID, name, age, district, religion, submitted at, photo thumbnail

**Verification checklist (admin):**
- [ ] Photo is real (not a stock photo or celebrity image)
- [ ] Name looks genuine
- [ ] Age matches photo approximately
- [ ] No explicit or inappropriate content in photos
- [ ] No duplicate profile (check phone number uniqueness)
- [ ] Bio is not spam or promotional content

**Actions:**
- **Approve** → status = "verified", user notified
- **Reject** with reason:
  - Fake/unclear photo
  - Incomplete profile
  - Suspicious content
  - Duplicate account
  - Inappropriate bio

**Target SLA:** Review within 24 hours of submission

---

### 7.2 Report Handling Workflow

```
1. User submits report from profile or chat
   └─ Report logged with: reporter_id, reported_id, reason, screenshot (optional)

2. Admin reviews report
   └─ Views reported user's profile + chat history (if reported from chat)

3. Decision
   ├─ No action (report dismissed)
   ├─ Warning sent to reported user
   ├─ Temporary suspension (7 / 30 days)
   └─ Permanent ban + phone number blacklisted
```

---

### 7.3 Admin Dashboard Sections

| Section | Purpose |
|---|---|
| Verification queue | Approve / reject new profiles |
| User management | Search, view, suspend, ban users |
| Reports | Review and action user reports |
| Metrics | DAU, new registrations, match rate, ad impressions |
| Ad management | Manage direct vendor ad slots (Phase 3) |

---

## 8. Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| phone | VARCHAR(15) | Unique, hashed |
| status | ENUM | pending, verified, rejected, suspended, deleted |
| gender | ENUM | male, female |
| created_at | TIMESTAMP | |
| verified_at | TIMESTAMP | |
| last_active_at | TIMESTAMP | |

### profiles
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| full_name | VARCHAR(100) | |
| date_of_birth | DATE | |
| religion | VARCHAR(50) | |
| community | VARCHAR(50) | Optional |
| district | VARCHAR(50) | |
| education | VARCHAR(100) | |
| occupation | VARCHAR(100) | |
| income_range | VARCHAR(50) | |
| height_cm | INT | |
| marital_status | ENUM | never_married, divorced, widowed |
| about_me | TEXT | Max 500 chars |
| star | VARCHAR(50) | Horoscope — optional |
| rasi | VARCHAR(50) | Horoscope — optional |
| contact_preference | ENUM | self, family |
| is_deactivated | BOOLEAN | Default false |
| is_match_found | BOOLEAN | Default false |

### profile_photos
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| profile_id | UUID FK → profiles | |
| url | TEXT | Cloudinary URL |
| is_primary | BOOLEAN | |
| uploaded_at | TIMESTAMP | |

### interests
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| sender_id | UUID FK → users | |
| receiver_id | UUID FK → users | |
| status | ENUM | pending, accepted, declined, expired, withdrawn |
| sent_at | TIMESTAMP | |
| responded_at | TIMESTAMP | |
| expires_at | TIMESTAMP | sent_at + 7 days |

### chats
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| interest_id | UUID FK → interests | Only created on accepted interest |
| user_a_id | UUID FK → users | |
| user_b_id | UUID FK → users | |
| created_at | TIMESTAMP | |
| is_blocked | BOOLEAN | |
| blocked_by | UUID FK → users | Nullable |

### messages
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| chat_id | UUID FK → chats | |
| sender_id | UUID FK → users | |
| content | TEXT | |
| is_read | BOOLEAN | |
| sent_at | TIMESTAMP | |

### reports
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| reporter_id | UUID FK → users | |
| reported_id | UUID FK → users | |
| reason | ENUM | fake_profile, harassment, inappropriate_content, spam, other |
| details | TEXT | Optional |
| status | ENUM | pending, reviewed, actioned, dismissed |
| created_at | TIMESTAMP | |

### admin_actions
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| admin_id | UUID FK → users | |
| target_user_id | UUID FK → users | |
| action | ENUM | approved, rejected, suspended, banned, warned |
| reason | TEXT | |
| created_at | TIMESTAMP | |

### interest_cooldowns
| Column | Type | Notes |
|---|---|---|
| sender_id | UUID FK → users | Composite PK |
| receiver_id | UUID FK → users | Composite PK |
| cooldown_until | TIMESTAMP | sender_id cannot re-send until this time |

---

## 9. Tech Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| Web app | Next.js 14 (App Router) | SSR for SEO, PWA support |
| Mobile | React Native (Expo) | iOS + Android from one codebase |
| UI | Tailwind CSS | Fast, responsive, utility-first |
| State | Zustand | Lightweight, simple |
| Forms | React Hook Form + Zod | Validation + type safety |
| Chat UI | Custom component over Socket.io client | |

### Backend
| Layer | Technology | Reason |
|---|---|---|
| API server | Node.js + Express | Familiar, fast to build |
| Real-time | Socket.io | Chat + notifications |
| Auth | JWT (access + refresh tokens) | Stateless, scalable |
| ORM | Prisma | Type-safe DB access |
| Job queue | BullMQ + Redis | Interest expiry, notifications |
| File handling | Multer → Cloudinary | Photo upload pipeline |

### Database & Storage
| System | Use |
|---|---|
| PostgreSQL | Primary database (users, profiles, interests, messages) |
| Redis | Sessions, chat presence, job queue, rate limiting |
| Cloudinary | Profile photo storage + transformation |
| Elasticsearch | Advanced profile search (Phase 2) |

### Infrastructure
| Service | Use |
|---|---|
| Vercel | Next.js hosting (web) |
| AWS EC2 / Railway | Node.js API server |
| AWS RDS | Managed PostgreSQL |
| Firebase FCM | Push notifications (iOS + Android) |
| Twilio / MSG91 | SMS OTP delivery |
| Razorpay | Payment gateway for premium (Phase 3) |

### Admin Dashboard
- Built as a separate Next.js app (internal only)
- Protected by admin JWT role
- Deployed separately from the main app

---

## 10. API Endpoints

### Auth
```
POST   /api/auth/send-otp         Send OTP to phone number
POST   /api/auth/verify-otp       Verify OTP, create session
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/logout            Invalidate session
```

### Profile
```
POST   /api/profile                Create profile (after OTP)
GET    /api/profile/me             Get own profile
PUT    /api/profile/me             Update profile
DELETE /api/profile/me             Delete account
POST   /api/profile/me/photos      Upload photo
DELETE /api/profile/me/photos/:id  Delete photo
PUT    /api/profile/me/deactivate  Deactivate profile
PUT    /api/profile/me/match-found Mark as match found
```

### Browse & Search
```
GET    /api/profiles               Browse profiles (paginated, filtered)
GET    /api/profiles/:id           View a single profile
```

### Interests
```
POST   /api/interests              Send interest to a profile
GET    /api/interests/received     Get received interests
GET    /api/interests/sent         Get sent interests
PUT    /api/interests/:id/accept   Accept an interest
PUT    /api/interests/:id/decline  Decline an interest
DELETE /api/interests/:id          Withdraw a sent interest
```

### Chat
```
GET    /api/chats                  Get all chat threads
GET    /api/chats/:id/messages     Get messages in a chat (paginated)
POST   /api/chats/:id/block        Block a chat / user
POST   /api/chats/:id/report       Report a user from chat

WS     /ws/chat                    WebSocket for real-time messaging
```

### Admin (protected, admin role only)
```
GET    /api/admin/queue            Get pending verification profiles
PUT    /api/admin/users/:id/approve   Approve a profile
PUT    /api/admin/users/:id/reject    Reject a profile (with reason)
PUT    /api/admin/users/:id/suspend   Suspend a user
PUT    /api/admin/users/:id/ban       Permanently ban a user
GET    /api/admin/reports          Get pending reports
PUT    /api/admin/reports/:id      Action a report
GET    /api/admin/metrics          Dashboard metrics
```

---

## 11. Monetization Model

### Phase 1–2: Free only (build trust, grow users)
- No revenue expected
- Keep running costs low (under ₹5,000/month on shared infra)

### Phase 2–3: Ad revenue (10,000+ users)

| Ad type | Source | Expected CPM |
|---|---|---|
| Display ads (web) | Google AdSense | ₹30–80 |
| App ads | Google AdMob | ₹20–60 |
| Direct vendor slots | Local wedding vendors | ₹150–400 CPM |

**Target direct ad partners:**
- Wedding photographers (Kerala)
- Gold jewellers (Kalyan, Malabar Gold, local)
- Wedding planners
- Saree & textile shops
- Honeymoon travel packages
- Hall & venue bookings

### Phase 3: Freemium features (100,000+ users)

| Feature | Price |
|---|---|
| See who viewed your profile | ₹99/month |
| Boost profile (top of search for 7 days) | ₹149 |
| Premium badge | ₹299/month (bundle) |
| Priority interest (interest shown first) | ₹199/month |

**Revenue projection at scale:**

| Users | DAU (60%) | Ad revenue/month | Premium (5%) | Total/month |
|---|---|---|---|---|
| 10,000 | 6,000 | ₹18,000–48,000 | — | ~₹30,000 |
| 100,000 | 60,000 | ₹1.8L–4.8L | ₹1.5L | ~₹4–6L |
| 500,000 | 300,000 | ₹9L–24L | ₹7.5L | ~₹18–30L |

---

## 12. Go-to-Market Roadmap

### Phase 1 — Seed (Months 1–6)
**Goal:** 500–2,000 verified profiles, Kerala-focused

**Actions:**
- Build and launch MVP (web only, PWA)
- Target Kerala NRI WhatsApp groups, Facebook matrimony groups
- Onboard first 100 profiles manually (friends, family, community leaders)
- Tie up with local parish/mosque/temple notice boards
- Zero spend on ads — pure community growth

**Success metric:** 500 verified profiles, equal gender ratio

---

### Phase 2 — Grow (Months 7–12)
**Goal:** 10,000–50,000 users

**Actions:**
- Launch React Native app (iOS + Android)
- Add push notifications, Aadhaar-based verification option
- Enable Google AdSense
- Add Elasticsearch for better search
- First direct vendor ad deals (target 5 wedding photographers)
- Run Malayalam Facebook/Instagram ads (₹500/day budget)

**Success metric:** 10K verified users, ₹50K/month ad revenue

---

### Phase 3 — Scale (Months 13–24)
**Goal:** 100,000+ users

**Actions:**
- Launch freemium features (Razorpay integration)
- Horoscope matching feature
- AI-based profile recommendations
- Partner with major Kerala wedding vendors
- Regional language toggle (Malayalam / English)

**Success metric:** 1L users, ₹5L/month revenue

---

### Phase 4 — Expand (Month 25+)
**Goal:** South India expansion

**Actions:**
- Tamil Nadu, Karnataka, Andhra communities
- Language support: Tamil, Kannada, Telugu
- Diaspora focus: Gulf, UK, USA Kerala community groups

---

## 13. Non-Functional Requirements

### Performance
- Page load under 2 seconds on 4G (India network conditions)
- API response under 300ms for all listing endpoints
- Chat message delivery under 500ms (real-time)
- Support 10,000 concurrent users by Phase 2

### Security
- All passwords / OTPs hashed with bcrypt
- Phone numbers stored hashed (SHA-256 + salt)
- HTTPS enforced everywhere
- Rate limiting on OTP send: max 3 attempts per phone per hour
- JWT access tokens expire in 15 minutes; refresh tokens in 30 days
- All admin actions logged with timestamp and admin ID
- Profile photos stored on Cloudinary (not publicly guessable URLs)

### Privacy
- Phone numbers never shown to other users
- User can delete all their data at any time
- Chat messages deleted when account is deleted
- No data sold to third parties (ever)

### Accessibility
- WCAG 2.1 AA compliance for web
- Malayalam font rendering tested on Android (Noto Sans Malayalam)
- Screen reader support for profile cards

### Moderation
- Admin reviews every new profile before it goes live
- Auto-flag: profiles with no face visible in photo (Cloudinary face detection)
- Auto-flag: bio containing phone numbers or external links
- Report reviewed within 24 hours

---

## 14. Open Questions & Decisions

| # | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Should men be able to browse women's profiles before sending interest? | Yes / Blurred preview only | Blurred preview — safer for women |
| Q2 | Should families be able to register on behalf of someone? | Yes / No | Yes, with "registered by family" badge |
| Q3 | Horoscope matching — mandatory filter or optional? | Mandatory / Optional | Optional (Phase 2) |
| Q4 | Community / caste filter — include or exclude? | Include / Exclude | Include (optional filter) — market reality |
| Q5 | Same-gender profiles — support or not? | Support / Not in v1 | Not in v1 (complexity + market) |
| Q6 | Should chat be end-to-end encrypted? | Yes / No | Yes (Signal Protocol or similar, Phase 2) |
| Q7 | Admin team size — Phase 1? | 1 / 2–3 | 1 founder + 1 part-time moderator |
| Q8 | Domain: nammal.in or nammal.com? | .in / .com | nammal.in (regional credibility) |

---

## Appendix A — Profile Status State Machine

```
CREATED (phone verified, no profile)
    │
    ▼
PENDING (profile submitted, awaiting admin review)
    │
    ├──[Admin approves]──► VERIFIED (active, browsable)
    │                           │
    │                           ├──[User deactivates]──► DEACTIVATED (hidden)
    │                           │                             │
    │                           │                        [User reactivates]
    │                           │                             │
    │                           │◄────────────────────────────┘
    │                           │
    │                           ├──[User finds match]──► MATCH_FOUND (hidden)
    │                           │
    │                           ├──[Admin suspends]──► SUSPENDED (locked)
    │                           │
    │                           └──[User deletes / Admin bans]──► DELETED
    │
    └──[Admin rejects]──► REJECTED (can resubmit → back to PENDING)
```

---

## Appendix B — Interest Status State Machine

```
PENDING (interest sent, awaiting response)
    │
    ├──[Receiver accepts]──► ACCEPTED → Chat created
    │
    ├──[Receiver declines]──► DECLINED → 30-day cooldown applied
    │
    ├──[7 days no response]──► EXPIRED → No cooldown
    │
    └──[Sender withdraws]──► WITHDRAWN → No cooldown
```

---

*Document version: 1.0 — Created for Nammal project planning*
*Last updated: March 2026*
