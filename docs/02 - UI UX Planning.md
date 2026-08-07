# UI/UX Planning

**Product:** Quote Generator Pro  
**Milestone:** 3 - UI/UX Planning  
**Status:** Milestone 3 complete - all screens approved  
**Source of truth:** [01 - Product Specification.md](./01%20-%20Product%20Specification.md)

Design before implementation. No application code in this milestone.

**Screen approval checklist**

- [x] Dashboard - **approved**
- [x] Customers - **approved**
- [x] Quotes - **approved**
- [x] Quote Builder - **approved**
- [x] Service Catalog - **approved**
- [x] Company Settings - **approved**
- [x] PDF Layout - **approved**

---

## Global app shell (shared)

Applies to all Version 1 screens unless a screen notes otherwise.

### Top header

| Element | Behavior |
|---------|----------|
| Company Logo | From Company Settings; name fallback if none |
| Company Name | From Company Settings |
| Global Search | Search customers and quotes (partial match); results dropdown |
| Notifications | Bell icon â€” **placeholder only** in v1 (non-functional or â€œComing soonâ€) |
| Settings shortcut | Gear â†’ Company Settings |
| Logged-in User | Name / avatar placeholder in demos; real user after auth |

### Left sidebar (permanent)

| Item | Notes |
|------|--------|
| Dashboard | Active highlight when on Dashboard |
| Customers | |
| Quotes | |
| Service Catalog | |
| Company Settings | |

- Active page clearly highlighted.  
- No future nav items visible in Version 1.  
- Archive is reached from Customers / Quotes screens (not a primary sidebar item in v1).

### Design language

Modern SaaS (Stripe / Linear / Notion / Vercel / Mercury inspired):

- Clean spacing, professional typography, rounded cards, soft shadows  
- Minimal color palette, consistent icons  
- Fast, subtle animations; high readability; accessible contrast  
- Premium, not flashy  

Desktop-first; tablet and mobile responsive via the **same** layout adapting (no separate mobile product design).

---

## 1. Dashboard

**Status:** Approved

### 1.1 Purpose

Operational home for office staff: what needs attention today + one-click access to common actions. Default landing page.

### 1.2 User goals

| Goal | How the Dashboard helps |
|------|-------------------------|
| Know what to work on next | Needs Attention + status metrics |
| Start a quote quickly | Primary CTA: New Quote |
| Jump to customers / quotes / catalog | Quick Actions + nav |
| See monthly progress | Spec metrics only â€” no analytics overload |
| Stay ready for growth | Modular widget regions for future modules |

### 1.3 Layout (desktop-first)

```text
â”Œâ”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [Logo] Company Name     [ðŸ” Search customers & quotesâ€¦    ]  (ðŸ””) (âš™) [User] â”‚
â”œâ”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                  â”‚                                                           â”‚
â”‚ â–¶ Dashboard      â”‚  Dashboard                                                â”‚
â”‚   Customers      â”‚  What needs attention Â· quick actions                     â”‚
â”‚   Quotes         â”‚                                                           â”‚
â”‚   Service Catalogâ”‚  Date: (Today) (Last 7 Days) [Last 30 Days] (This Month)â”‚
â”‚   Company Settingsâ”‚                                                          â”‚
â”‚                  â”‚  QUICK ACTIONS                                            â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”â”‚
â”‚                  â”‚  â”‚ â˜… New Quote  â”‚ â”‚ + Customerâ”‚ â”‚ Quotes â”‚ â”‚ Cust â”‚ â”‚Cat.â”‚â”‚
â”‚                  â”‚  â”‚  (PRIMARY)   â”‚ â”‚           â”‚ â”‚        â”‚ â”‚      â”‚ â”‚    â”‚â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”˜â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  STATUS CARDS (clickable â†’ Quotes filtered by status)     â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚                  â”‚  â”‚ â—† Draftâ”‚ â”‚ â—† Sent â”‚ â”‚ â—† Acc. â”‚ â”‚ â—† Rej. â”‚ â”‚ â—† Exp. â”‚  â”‚
â”‚                  â”‚  â”‚   12   â”‚ â”‚    8   â”‚ â”‚   24   â”‚ â”‚    3   â”‚ â”‚    5   â”‚  â”‚
â”‚                  â”‚  â”‚  gray  â”‚ â”‚  blue  â”‚ â”‚ green  â”‚ â”‚  red   â”‚ â”‚ orange â”‚  â”‚
â”‚                  â”‚  â”‚ icon   â”‚ â”‚ icon   â”‚ â”‚ icon   â”‚ â”‚ icon   â”‚ â”‚ icon   â”‚  â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                  â”‚   Count Â· Status name Â· small icon Â· color indicator      â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  METRICS (Product Spec only)                              â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚                  â”‚  â”‚Created â”‚â”‚ Sent   â”‚â”‚Acceptedâ”‚â”‚Accepted $â”‚â”‚Expiring 7d â”‚â”‚
â”‚                  â”‚  â”‚ month  â”‚â”‚ month  â”‚â”‚ month  â”‚â”‚  month   â”‚â”‚            â”‚â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  â”Œâ”€ Chart (modular) â”€â”€â”€â”€â”€â” â”Œâ”€ Needs Attention (modular)â”€â”â”‚
â”‚                  â”‚  â”‚ Quote Status Overview â”‚ â”‚ Drafts > 7 days      (~5)  â”‚â”‚
â”‚                  â”‚  â”‚                       â”‚ â”‚ â€¦ rows â€¦  [View all]       â”‚â”‚
â”‚                  â”‚  â”‚   simple donut/bar    â”‚ â”‚ Expiring soon        (~5)  â”‚â”‚
â”‚                  â”‚  â”‚   minimal colors      â”‚ â”‚ â€¦ rows â€¦  [View all]       â”‚â”‚
â”‚                  â”‚  â”‚                       â”‚ â”‚ Recently Sent        (~5)  â”‚â”‚
â”‚                  â”‚  â”‚                       â”‚ â”‚ â€¦ rows â€¦  [View all]       â”‚â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  â”Œâ”€ Future widget slot (reserved, empty in v1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚                  â”‚  â”‚ (revenue Â· reminders Â· performance Â· follow-ups)     â”‚â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                  â”‚                                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 1.4 Buttons / cards / lists

| Control | Notes |
|---------|--------|
| **New Quote** | Primary CTA (visually strongest) |
| New Customer, View Quotes, View Customers, Service Catalog | Secondary quick actions |
| Status cards | Count + name + icon + color; click â†’ Quotes filtered |
| Metrics | Spec-only; clickable where it deep-links (e.g. Expiring â†’ filtered Quotes) |
| Chart | One clean donut or bar; no excess effects |
| Needs Attention | Max ~5 rows each + View all |
| Notifications | Placeholder only |

### 1.5 Validation / empty / loading

- Metrics show `0` when empty; calm empty copy for empty attention lists  
- Skeleton loading; archived quotes excluded always  

### 1.6 Responsive

Same structure: sidebar collapses to icon rail or drawer; main stacks (actions â†’ cards â†’ metrics â†’ chart â†’ lists). No separate mobile product design.

### 1.7 Future compatibility

Main content uses **modular widget regions** so revenue, notifications content, reminders, employee performance, and follow-up tasks can drop into reserved slots later without redesigning the page chrome.

### 1.8 Design reasoning (post-revision)

Header + permanent sidebar establish a professional SaaS shell immediately. Primary **New Quote** CTA matches the JTBD. Status cards and Needs Attention stay operational. Reserved widget slot and notifications placeholder protect future growth without cluttering v1.

---

## 2. Customers

**Status:** Approved

### 2.1 Purpose

Find, create, edit, archive, and restore reusable customer records so office staff can start quotes without re-entering contact and service-address data. Not a full CRM.

### 2.2 User goals

| Goal | Support |
|------|---------|
| Find customers fast | Search + simple filters |
| Create/edit on a call | Slide-over form |
| Start quoting | New Quote from row/detail |
| Preserve history | Soft archive / restore only |
| Light context | Summary panel (not a CRM timeline) |

### 2.3 Layout & wireframes

**List columns (sortable where practical):** Customer Name Â· Company Â· Phone Â· Email Â· City/State Â· Total Quotes Â· Last Quote Date Â· Status (Active/Archived) Â· â‹®

**Search & filters:** Page search (name, company, phone, email, street) Â· Active/Archived toggle Â· Company Â· City Â· Recently Added Â· Recently Updated. Keep simple and fast.

```text
â”Œâ”€ Header: [Logo] Company  [ðŸ” Global searchâ€¦]  (ðŸ””) (âš™) [User] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”œâ”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚   Dashboard      â”‚  Customers                            [ + New Customer ]  â”‚
â”‚ â–¶ Customers      â”‚                                                           â”‚
â”‚   Quotes         â”‚  [ðŸ” Searchâ€¦                    ]                         â”‚
â”‚   Service Catalogâ”‚  ( Active â— ) ( Archived )                                â”‚
â”‚   Company Settingsâ”‚ Filters: Company [â–¾]  City [â–¾]  (Recent Added)(Updated) â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚                  â”‚  â”‚ Name â†•  Company â†•  Phone  Email  City/ST â†•           â”‚ â”‚
â”‚                  â”‚  â”‚ Quotes â†•  Last Quote â†•  Status â†•                 â‹®  â”‚ â”‚
â”‚                  â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚                  â”‚  â”‚ Jane Doe  â€”  214-â€¦  j@â€¦  Dallas, TX  3  Aug 1  Activeâ”‚ â”‚
â”‚                  â”‚  â”‚ John Smith Acme â€¦ â€¦  Plano, TX  5  Jul 28 Active   â”‚ â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                  â”‚  Clean table; pagination/lazy-load later if needed        â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  EMPTY STATE (zero customers):                            â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚                  â”‚  â”‚  Create your first customer                        â”‚   â”‚
â”‚                  â”‚  â”‚  [ + New Customer ]  (PRIMARY)                     â”‚   â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  Row â‹® : Open Â· Edit Â· New Quote Â· Archive | Restore      â”‚
â”‚                  â”‚  No permanent delete in normal UI                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Open customer â€” summary + edit (slide-over):**

```text
â”Œâ”€ list dimmed â”€â”¬â”€ Customer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ [ Ã— ] â”€â”
â”‚               â”‚  Jane Doe Â· CUST-000001 Â· Active                             â”‚
â”‚               â”‚  [ Edit ]  [ New Quote ]  [ Archive ]                        â”‚
â”‚               â”‚                                                              â”‚
â”‚               â”‚  SUMMARY (not a CRM timeline)                                â”‚
â”‚               â”‚  â”Œ Customer Information â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚               â”‚  â”‚ Phone Â· Email Â· Company Â· Service address               â”‚ â”‚
â”‚               â”‚  â”‚ Internal notes (employees only)                         â”‚ â”‚
â”‚               â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚               â”‚  â”Œ Totals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚               â”‚  â”‚ Total Quotes Â· Draft Â· Accepted Â· Last Activity         â”‚ â”‚
â”‚               â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚               â”‚  â”Œ Recent Quotes (few rows) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ [ View all ] â”€â”€â”€â” â”‚
â”‚               â”‚  â”‚ QUO-â€¦  Draft/Sent/â€¦  date  total                        â”‚ â”‚
â”‚               â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚               â”‚                                                              â”‚
â”‚               â”‚  CREATE / EDIT mode fields (* required, inline validation):  â”‚
â”‚               â”‚  First* Last* Phone* Company Email                           â”‚
â”‚               â”‚  Street* City* State* ZIP*  Internal Notes                   â”‚
â”‚               â”‚  [ Cancel ]  (unsaved warning)     [ Save Customer ] PRIMARY â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.4 Refinements locked

- Slide-over: required indicators, inline validation, Save, Cancel, unsaved warning  
- Empty state: â€œCreate your first customerâ€ + primary New Customer  
- Performance: keep list clean for large datasets; pagination/lazy-load later if needed  
- Design language: Project X SaaS system (spacing, cards, type, contrast, subtle motion)  
- Archived â†’ New Quote: restore required first  

### 2.5 Design reasoning

List columns emphasize quoting context (totals, last quote) without CRM bloat. Summary panel gives enough context to act. Soft archive and empty state keep the product professional and demo-ready.

---

## 3. Quotes

**Status:** Approved

### 3.1 Purpose

Browse, filter, search, and manage quotes. Receives Dashboard deep-links with filters applied. Opens Quote Builder for create/edit.

### 3.2 List columns (sortable where practical)

Quote ID Â· Customer Name Â· Job / Service Description Â· Status Â· Quote Date Â· Valid Until Â· Grand Total Â· Prepared By Â· â‹®

### 3.3 Search & filters

- Global / page search (Quote ID, customer, job description)  
- Status filter (All non-archived default; explicit Archived chip)  
- Customer filter  
- Date range filter (presets: Today, Last 7 Days, Last 30 Days, This Month)  
- Expiring Soon filter  
- **Prepared By** filter: reserved in UI layout for post-auth (hidden or disabled placeholder in v1 demos without auth â€” not a visible v1 feature list item, but layout leaves room so it can appear without redesign)

Active filters show as removable chips. Dashboard cards deep-link here (e.g. Draft â†’ `status=Draft`).

### 3.4 Status badges

Draft gray Â· Sent blue Â· Accepted green Â· Rejected red Â· Expired orange Â· Archived dark gray â€” high visibility, easy to scan.

### 3.5 Wireframe

```text
â”Œâ”€ Header: [Logo] Company  [ðŸ” Globalâ€¦]  (ðŸ””) (âš™) [User] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”œâ”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚   Dashboard      â”‚  Quotes                    [ â–¡ Select ]  [ + New Quote ]  â”‚
â”‚   Customers      â”‚                            bulk when selected (PRIMARY)   â”‚
â”‚ â–¶ Quotes         â”‚                                                           â”‚
â”‚   Service Catalogâ”‚  [ðŸ” Searchâ€¦]                                             â”‚
â”‚   Company Settingsâ”‚ Status: All Draft Sent Accepted Rejected Expired Archivedâ”‚
â”‚                  â”‚ Customer [â–¾]  Date [This Month â–¾]  [ Expiring soon ]      â”‚
â”‚                  â”‚ (Prepared By [â–¾] â€” reserved for auth)                     â”‚
â”‚                  â”‚ Chips: [ Draft Ã— ]                                        â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  When rows selected:                                      â”‚
â”‚                  â”‚  [ Archive ] [ Restore ]   Export = future (not shown)    â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚                  â”‚  â”‚â˜ IDâ†• Customerâ†• Job  Statusâ†• Dateâ†• Validâ†• Totalâ†• Byâ†•â‹®â”‚ â”‚
â”‚                  â”‚  â”‚â˜ QUO-â€¦ Janeâ€¦  ACâ€¦  [Sent] Aug5 Aug20 $4,250  Alex â‹® â”‚ â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  EMPTY: â€œNo quotes found.â€                                â”‚
â”‚                  â”‚  [ New Quote ] PRIMARY   [ View Customers ] secondary     â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  Row â‹®: Open Â· Edit Â· Duplicate Â· Generate PDF            â”‚
â”‚                  â”‚         Archive / Restore Â· no permanent delete           â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  Future (not in v1 UI): Email Â· SMS Â· Portal Â· E-sign Â·   â”‚
â”‚                  â”‚  Version History â€” reserved in action model only          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.6 Row actions

Open Â· Edit Â· Duplicate Â· Generate PDF Â· Archive / Restore. Soft archive only.

### 3.7 Bulk actions

Multi-select â†’ Archive Â· Restore. Export reserved for future (not shown in v1).

### 3.8 Performance & design

Lean table for large lists; pagination/virtual scroll later. Project X SaaS design system throughout.

### 3.9 Design reasoning

Columns and filters match office scanning + Dashboard deep-links. Bulk archive/restore supports cleanup without export complexity. Future actions stay out of the v1 chrome but the action pattern can extend later.

---

## 4. Quote Builder

**Status:** Approved

### 4.1 Purpose

Professional workspace to create/edit one quote end-to-end with minimal scrolling: customer gate, header, categorized line items, live totals, PDF preview/final, status-aware behavior.

### 4.2 Desktop layout (workspace)

- **Main:** customer, quote details, line items  
- **Sticky right summary:** subtotal, discount, tax, grand total, primary actions  

No single endless form â€” workspace regions.

```text
â”Œâ”€ Header shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”œâ”€ Sidebar â”€â”¬â”€ Builder workspace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚           â”‚ â† Quotes   QUO-000025  [Draft]   â— Unsaved | Saved 2:14 PM       â”‚
â”‚           â”‚                                                                  â”‚
â”‚           â”‚ â”Œâ”€ MAIN (scroll) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€ STICKY SUMMARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚           â”‚ â”‚                              â”‚                               â”‚ â”‚
â”‚           â”‚ â”‚ CUSTOMER GATE / SUMMARY      â”‚ Subtotal           $ â€¦        â”‚ â”‚
â”‚           â”‚ â”‚ (required before lines)      â”‚ Discount [ % | $ ] [ value ]  â”‚ â”‚
â”‚           â”‚ â”‚                              â”‚ Discount amount    âˆ’ $ â€¦      â”‚ â”‚
â”‚           â”‚ â”‚ HEADER                       â”‚ Tax rate %         [ â€¦ ]      â”‚ â”‚
â”‚           â”‚ â”‚ ID Â· Status Â· Dates Â· By     â”‚ Tax amount           $ â€¦      â”‚ â”‚
â”‚           â”‚ â”‚ Job Description *            â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚ â”‚
â”‚           â”‚ â”‚ â–¸ Additional Details         â”‚ Grand Total        $ â€¦        â”‚ â”‚
â”‚           â”‚ â”‚   Internal Notes             â”‚                               â”‚ â”‚
â”‚           â”‚ â”‚   Customer-Facing Message    â”‚ [ Save Draft ]                â”‚ â”‚
â”‚           â”‚ â”‚                              â”‚ [ Preview PDF ]               â”‚ â”‚
â”‚           â”‚ â”‚ LINE ITEMS                   â”‚ [ Final PDF / Mark Sent ]     â”‚ â”‚
â”‚           â”‚ â”‚ [+ Catalog] [+ Manual]       â”‚   (PRIMARY when valid)        â”‚ â”‚
â”‚           â”‚ â”‚ â–¾ Services / Materials / Laborâ”‚                              â”‚ â”‚
â”‚           â”‚ â”‚  rows: Desc Qty Unit Price   â”‚ â‹® Duplicate Â· Archive Â· â€¦     â”‚ â”‚
â”‚           â”‚ â”‚  Total Â· expand note Â· â‹®     â”‚                               â”‚ â”‚
â”‚           â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 4.3 Customer gate (approved)

Before line items: select existing or create new customer. Then compact summary: Name Â· Company Â· Phone Â· Email Â· Service address Â· **Change Customer**.

### 4.4 Quote header

Always visible: Quote ID Â· Status Â· Quote Date Â· Valid Until Â· Prepared By Â· Job / Service Description*  

Collapsed **Additional Details:** Internal Notes Â· Customer-Facing Message  

### 4.5 Line items

Categories: Services Â· Materials Â· Labor  

Per line: Description Â· Qty Â· Unit Â· Unit Price Â· Line Total Â· Internal Note (expand)  

Actions: Add manual Â· Add from Catalog Â· Duplicate item Â· Reorder Â· Remove Â· live calc  

### 4.6 Service Catalog picker

Searchable modal/slide-over inside Builder: search Â· filter by category Â· multi-select Â· add Â· edit fields after add. Never leave Builder.

### 4.7 Totals panel validation

Block: negative qty/prices Â· discount > subtotal Â· negative tax Â· negative grand total  

### 4.8 Save behavior (v1)

Save Draft (always available while editable) Â· Preview PDF Â· Final PDF / Mark Sent  

Show: saved confirmation Â· last saved time Â· unsaved indicator  

**No autosave in v1** unless later change request.

### 4.9 Final PDF / Sent

Validate customer Â· â‰¥1 line Â· Grand Total > 0 â†’ confirm (Sent + Sent Date + freeze company/customer history) â†’ generate PDF Â· set Sent Â· record Sent Date  

### 4.10 Status-aware UI

| Status | Behavior |
|--------|----------|
| Draft | Fully editable |
| Sent | Editable after warning |
| Accepted / Rejected | Read-only Â· Duplicate |
| Expired | Read-only Â· Reactivate or Duplicate |
| Archived | Read-only Â· Restore or Duplicate |

### 4.11 Responsive

Desktop sticky right panel Â· Tablet totals below but accessible Â· Mobile sticky bottom Grand Total (tap expands totals/actions). Same feature set.

### 4.12 Empty / error states

No customer Â· no lines Â· catalog no results Â· validation errors Â· failed save Â· failed PDF â€” each with clear cause + next step.

### 4.13 Design language

Project X SaaS workspace: hierarchy, minimal clutter, accessible contrast, subtle motion, premium.

---

## 5. Service Catalog

**Status:** Approved

### 5.1 Purpose

Reusable library of commonly quoted services to reduce typing and help office staff create professional quotes in under two minutes. **Not** an inventory system.

### 5.2 List columns (sortable where practical)

Service Name Â· Category Â· Unit Â· Default Price Â· Status (Active/Archived) Â· Last Updated Â· â‹®

### 5.3 Search & filters

Global/page search (partial match) Â· Category filter Â· Active/Archived toggle  

Categories (match Quote Builder): **Services Â· Materials Â· Labor**

### 5.4 Service fields

| Field | Requirement |
|-------|-------------|
| Service Name | Required |
| Category | Required |
| Default Unit Price | Required (â‰¥ 0) |
| Description | Optional |
| Unit of Measure | Optional |
| Created / Last Updated | Auto |

### 5.5 Wireframe â€” list

```text
â”Œâ”€ Header shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”œâ”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â–¶ Service Catalogâ”‚  Service Catalog                      [ + Create Service ]â”‚
â”‚                  â”‚  Reusable quote templates Â· not inventory  (Admin PRIMARY)â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  [ðŸ” Searchâ€¦]  Category [Allâ–¾]  ( Active â— )( Archived )  â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  â”Œ Nameâ†• Categoryâ†• Unit  Priceâ†• Statusâ†• Updatedâ†•     â‹® â” â”‚
â”‚                  â”‚  â”‚ Install ACâ€¦ Services ea $4,500 Active Aug 6         â”‚ â”‚
â”‚                  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  EMPTY: â€œNo catalog items found.â€  [ Create Service ]     â”‚
â”‚                  â”‚                                                           â”‚
â”‚                  â”‚  Admin â‹®: View Â· Edit Â· Duplicate Â· Archive/Restore       â”‚
â”‚                  â”‚  Staff: View/Search only Â· Use via Quote Builder picker   â”‚
â”‚                  â”‚  No permanent delete                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 5.6 Permissions

| Action | Office Staff | Admin |
|--------|--------------|-------|
| View / Search / Use | Yes | Yes |
| Create / Edit / Duplicate / Archive / Restore | No | Yes |

Only Admin modifies catalog items. Demo without auth: editable until roles exist.

### 5.7 Service picker (in Quote Builder)

Search Â· category filter Â· multi-select Â· preview before adding Â· all fields editable after add. Never leave Builder.

### 5.8 Future (not shown in v1)

Price books Â· inventory Â· supplier costs Â· SKUs Â· images Â· favorites Â· recently used Â· cost vs sell Â· taxable flags  

### 5.9 Design language

Project X SaaS system throughout.

---

## 6. Company Settings

**Status:** Approved

### 6.1 Purpose

Organize single-company branding and defaults in three uncluttered tabs. Changes may update previews where appropriate; **never** silently modify existing quotes.

### 6.2 Tabs

1. **Company Profile**
2. **Quote Defaults**
3. **PDF Defaults**

### 6.3 Company Profile

**Required:** Company Name · Phone · Email · Street · City · State · ZIP

**Optional:** Website · Company Logo

**Logo:** drag-and-drop · click to upload · preview · replace · remove · validate type/size (PNG/JPG/JPEG/WebP) · company-name fallback if none

### 6.4 Quote Defaults

Default Tax Rate · Validity (days) · Discount Type/Value · Prepared By Name

Helper: applies to **newly created quotes only**; existing quotes are never modified automatically.

### 6.5 PDF Defaults

Default Customer Message · Terms & Conditions · Footer Text — with **live character counts** on large fields.

### 6.6 Save behavior

Sticky **Save** · **Cancel Changes** · **Reset to Last Saved**

Show: unsaved indicator · last saved timestamp · success confirmation

### 6.7 Validation (inline, actionable)

Required fields · invalid email · invalid website · negative tax · invalid validity period — messages explain how to fix.

### 6.8 Permissions

Demo: editable · After auth: Admin edit · Staff view only

### 6.9 Impact clarity (UX)

| Impact | Behavior |
|--------|----------|
| Future quotes | Inherit latest defaults at creation |
| Existing drafts | Keep stored values unless user edits that quote |
| Sent quotes | Frozen; Settings changes do not alter them |

Previews (logo/header, optional PDF snippet) may update from Settings; issued documents do not.

### 6.10 Wireframe

```text
┌─ Header shell ───────────────────────────────────────────────────────────────┐
├─ Sidebar ─┬─ Company Settings ───────────────────────────────────────────────┤
│ ▶ Settings│  [ Profile ] [ Quote Defaults ] [ PDF Defaults ]                 │
│           │  ● Unsaved changes · Last saved 2:14 PM                          │
│           │                                                                  │
│           │  ┌─ Active tab card ───────────────────────────────────────────┐ │
│           │  │ Profile: required/optional fields + logo dropzone/preview   │ │
│           │  │ Quote Defaults: defaults + helper (new quotes only)         │ │
│           │  │ PDF Defaults: message/terms/footer + character counts       │ │
│           │  └─────────────────────────────────────────────────────────────┘ │
│           │                                                                  │
│           │  Impact: Future quotes · Drafts keep values · Sent frozen        │
│           │                                                                  │
│           │  Sticky: [ Cancel Changes ] [ Reset to Last Saved ] [ Save ]     │
│           │                                                    PRIMARY       │
│           │  Future (hidden): locations · currencies · templates · themes  │ │
└───────────┴──────────────────────────────────────────────────────────────────┘
```

### 6.11 Design & future

Project X SaaS system. Reserve (not shown): multiple locations/currencies/PDF templates · branding themes · email/SMS templates · regional settings

---

## 7. PDF Layout

**Status:** Approved

### 7.1 Purpose

Modern, professional customer quote document generated by premium business software. Prioritize **readability over decoration**. Clean, trustworthy, Project X design language — minimal color, no decorative graphics.

### 7.2 Company header

Include: Logo · Company Name · Address · Phone · Email · Website

**Quote ID** displayed **prominently in the upper-right** corner.

### 7.3 Quote information

Compact labeled section: Quote ID · Quote Date · Valid Until · Prepared By

### 7.4 Customer information

Snapshot only: Customer Name · Company (if any) · Phone · Email · Service Address

### 7.5 Quote table

Grouped under **Services · Materials · Labor** (omit empty groups).

Columns: Description · Quantity · Unit (only when applicable) · Unit Price · Line Total

Totals in a **clean summary box aligned right**; **Grand Total** has strongest emphasis.

### 7.6 Message, terms, footer

- Customer-facing message below totals (personalized tone)
- Terms & Conditions below message (readable size, adequate spacing)
- Footer below clean divider: Company Footer Text · Website · Page Number

### 7.7 Draft vs Final

| Mode | Watermark |
|------|-----------|
| Internal Preview | Subtle diagonal **DRAFT** — must not harm readability |
| Final Customer PDF | **Never** show a watermark |

### 7.8 Multi-page

- Page 1: full company branding
- Additional pages: compact header · page numbers · consistent margins
- Avoid awkward category splits across pages when practical

### 7.9 Accessibility

Selectable text · do not rasterize · sufficient contrast

### 7.10 Historical accuracy (Sent)

Freeze: company information · customer snapshot · quote contents · pricing · terms

Company Settings changes must not modify historical PDFs.

### 7.11 ASCII — Page 1 (Final)

```text
┌──────────────────────── US LETTER ──────────────────────────────────────────┐
│  ┌────┐  COMPANY NAME                              Quote ID: QUO-000025     │
│  │Logo│  Street, City, State ZIP                                            │
│  └────┘  Phone · Email · Website                                            │
│                                                                             │
│                           Q U O T E                                         │
│                                                                             │
│  Quote Date: …     Valid Until: …     Prepared By: …                        │
│  (compact labeled row)                                                      │
│                                                                             │
│  Service / Bill To                                                          │
│  Customer Name · Company                                                    │
│  Phone · Email · Service Address  (snapshot)                                │
│                                                                             │
│  Job / Service Description                                                  │
│                                                                             │
│  Services                                                                   │
│  Description · Qty · Unit* · Unit Price · Line Total                        │
│  Materials / Labor (same; omit if empty)                                    │
│  * Unit column only when applicable                                         │
│                                                                             │
│                         ┌─ Totals box (right) ─────────┐                    │
│                         │ Subtotal                     │                    │
│                         │ Discount                     │                    │
│                         │ Tax                          │                    │
│                         │ Grand Total  (strongest)     │                    │
│                         └──────────────────────────────┘                    │
│                                                                             │
│  Customer message (personalized)                                            │
│  Terms & Conditions                                                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Footer text · Website · Page 1 of N                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.12 ASCII — Continued page / Draft preview

```text
Continued: compact header · Quote ID · customer · page N of M · footer divider

Internal Preview only: subtle diagonal DRAFT watermark (readable underneath)
Final: no watermark
```

### 7.13 Builder integration

Preview PDF → Internal Preview · Final PDF / Mark Sent → validate → confirm (Sent + freeze) → Final PDF

### 7.14 Design reasoning

Upper-right Quote ID aids filing. Right-aligned totals box emphasizes money. Snapshot + freeze protect history. Subtle Draft watermark prevents accidental customer sends without reducing readability.

---

## Milestone 3 status

**UI/UX Planning is complete.** All screens approved:

- [x] Dashboard
- [x] Customers
- [x] Quotes
- [x] Quote Builder
- [x] Service Catalog
- [x] Company Settings
- [x] PDF Layout

**No application code** in this milestone.

### Next milestone (not started)

**Implementation milestones** — await explicit authorization.

Do not write application code until authorized. Design System: [03 - Design System.md](./03%20-%20Design%20System.md) (**Approved**).
