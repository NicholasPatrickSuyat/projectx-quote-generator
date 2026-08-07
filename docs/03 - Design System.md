# Project X Design System

**Scope:** Visual standard for every Project X application  
**Product reference (Quote Generator Pro):** [01 - Product Specification.md](./01%20-%20Product%20Specification.md), [02 - UI UX Planning.md](./02%20-%20UI%20UX%20Planning.md)  
**Status:** Milestone 4 Approved  
**Milestone:** 4 — Design System and Visual Style  

This document is the visual source of truth for Project X products. It does not implement UI. Future changes require an explicit change request. **Do not begin application implementation until authorized.**

---

## 1. Brand Personality

Project X products feel like **premium business software**: calm, capable, and trustworthy.

| Trait | Meaning in the UI |
|-------|-------------------|
| Modern SaaS | Contemporary layout patterns, clear hierarchy, no legacy clutter |
| Professional | Suitable for office staff and customer-facing PDFs |
| Minimal | Only elements that help the task |
| Clean | Consistent spacing, alignment, and typography |
| Responsive | One design that adapts; no separate mobile product |
| Accessible | Readable contrast, keyboard-friendly patterns, selectable PDF text |
| Premium | Polished details without flashiness |

**Personality keywords:** confident, quiet, precise, helpful.

**Not in character:** playful mascots, loud gradients, neon glow, dense chrome, novelty illustrations.

---

## 2. Design Principles

1. **Function before decoration.**  
2. **Every screen should make the primary task obvious.**  
3. **Consistency is more important than creativity.**  
4. **Use color to communicate, not decorate.**  
5. **Reduce clicks whenever possible.**  
6. **Design for busy office staff.**  
7. **Every component should be reusable.**  
8. **Accessibility is a feature, not an afterthought.**

Supporting guidance:

- Clarity first — status, money, and next actions in seconds.  
- One system across Project X apps and screens.  
- Readability over decoration (especially tables and PDFs).  
- Future-ready without exposing unfinished features.

---

## 3. Color Palette

### 3.1 Approach

**Slate-based neutrals** carry most of the UI. Use color **sparingly** to emphasize **actions** and **statuses**.

- **Primary accent:** professional **deep blue**  
- **Teal:** reserved as a possible **future secondary accent** (not used as primary in V1)  
- **Status colors:** badges and semantic feedback only — not large decorative surfaces  

### 3.2 Neutrals (light theme — Version 1 default)

| Token | Value | Usage |
|-------|-------|--------|
| `color.bg.app` | `#F8FAFC` | App background |
| `color.bg.surface` | `#FFFFFF` | Cards, panels, tables |
| `color.bg.muted` | `#F1F5F9` | Subtle fills, selected rows (not zebra), muted chips |
| `color.border.default` | `#E2E8F0` | Dividers, card borders, inputs |
| `color.border.strong` | `#CBD5E1` | Emphasized borders |
| `color.text.primary` | `#0F172A` | Headings, primary body |
| `color.text.secondary` | `#475569` | Labels, secondary copy |
| `color.text.muted` | `#64748B` | Hints, timestamps, placeholders |
| `color.text.inverse` | `#FFFFFF` | Text on solid primary buttons |

### 3.3 Primary accent (deep blue — approved)

| Token | Value | Usage |
|-------|-------|--------|
| `color.primary.default` | `#1E3A8A` | Primary buttons, key links, focus emphasis |
| `color.primary.hover` | `#1D4ED8` | Hover |
| `color.primary.active` | `#1E40AF` | Pressed |
| `color.primary.subtle` | `#EFF6FF` | Soft selected backgrounds, active nav |

### 3.4 Future secondary accent (reserved)

| Token | Value | Usage |
|-------|-------|--------|
| `color.secondary.teal` | `#0F766E` (reserved) | **Not used as primary in V1.** Optional future secondary accent only after change request. |

### 3.5 Semantic colors

| Token | Value | Usage |
|-------|-------|--------|
| `color.success` | `#15803D` | Success toasts, positive confirmation |
| `color.warning` | `#C2410C` | Warnings (non-status) |
| `color.danger` | `#B91C1C` | Destructive actions, errors |
| `color.info` | `#1D4ED8` | Informational callouts |

### 3.6 Status badge colors (Product Spec mapping)

| Status | Tone | Fill / text |
|--------|------|-------------|
| Draft | Gray | BG `#F1F5F9` · text `#334155` |
| Sent | Blue | BG `#DBEAFE` · text `#1E40AF` |
| Accepted | Green | BG `#DCFCE7` · text `#166534` |
| Rejected | Red | BG `#FEE2E2` · text `#991B1B` |
| Expired | Orange | BG `#FFEDD5` · text `#9A3412` |
| Archived | Dark gray | BG `#E2E8F0` · text `#1E293B` |

### 3.7 Rules

- Neutrals dominate; accent and status color appear only where they communicate.  
- Do not use status colors for primary navigation or large backgrounds.  
- Do not use teal as the V1 primary.  
- Do not introduce purple-on-white default “AI theme” styling.  
- Dark mode: Section 19 (not V1 default).

---

## 4. Typography

### 4.1 Standard typeface

**Inter** is the standard UI typeface for Project X applications.

| Role | Face | Notes |
|------|------|--------|
| UI Sans | **Inter** | All product UI |
| Mono (optional) | System mono or Inter tabular | IDs (`QUO-`, `CUST-`) and money when helpful |

Do not mix additional display families into the product UI without a change request.

### 4.2 Type scale

| Token | Size / weight | Usage |
|-------|---------------|--------|
| `text.display` | 30–36px / semibold | Rare page heroes (avoid on dense tools) |
| `text.h1` | 24px / semibold | Page titles |
| `text.h2` | 18–20px / semibold | Section titles |
| `text.h3` | 16px / semibold | Card titles, panel headers |
| `text.body` | 14–16px / regular | Primary reading |
| `text.small` | 13px / regular | Secondary meta |
| `text.caption` | 12px / medium | Badges, table hints, timestamps |
| `text.label` | 13px / medium | Form labels |

### 4.3 Rules

- Line height ~1.4–1.6 for body; tighter for dense tables.  
- Money and IDs: tabular figures when available.  
- PDFs: same hierarchy with print-friendly spacing; selectable text.

---

## 5. Layout & Spacing

### 5.1 Spacing scale (4px base)

| Token | Value |
|-------|--------|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 24px |
| `space.6` | 32px |
| `space.7` | 48px |

### 5.2 Layout chrome

| Region | Guidance |
|--------|----------|
| App header | Logo, company name, search, notifications placeholder, settings, user |
| Sidebar | Permanent on desktop; V1 destinations only |
| Content | Comfortable width for lists; Builder with sticky summary rail |
| Cards / panels | `space.4`–`space.5` padding |

### 5.3 Radius & elevation (standardized)

Use **medium border radius** and **subtle shadows** consistently across reusable components.

| Token | Value | Usage |
|-------|-------|--------|
| `radius.md` | **10px** | **Standard** for buttons, inputs, badges, cards, modals, slide-overs, tables containers |
| `radius.full` | 9999px | Status pills only (optional) |
| `shadow.sm` | Soft, low | Cards, dropdowns, table surfaces |
| `shadow.md` | Soft, medium | Modals, sticky bars, slide-overs |

Do not invent per-component one-off radii or heavy multi-layer shadows.

### 5.4 Rules

- Align to a consistent grid.  
- Prefer whitespace over extra dividers.  
- Keep touch targets usable on adaptive layouts.

---

## 6. Buttons

### 6.1 Variants

| Variant | Use |
|---------|-----|
| **Primary** | One main action per view (New Quote, Save, Final PDF) — deep blue |
| **Secondary** | Supporting actions (Cancel, Preview PDF) |
| **Tertiary / ghost** | Low emphasis (Clear filters, View all) |
| **Destructive** | Archive / dangerous confirms — danger semantic, not primary blue |

### 6.2 Behavior

- Hover / focus / disabled required.  
- Loading: spinner; prevent double submit.  
- Hide unauthorized actions rather than showing disabled clutter.  
- `radius.md` + subtle press feedback (motion as feedback).

### 6.3 Hierarchy

- Prefer one primary button per focused region.  
- Primary task must be visually obvious (Design Principles).

---

## 7. Forms

### 7.1 Anatomy

Label (required `*`) → Control → Helper → Inline error  

Controls use `radius.md`, slate borders, clear focus ring (primary subtle / deep blue).

### 7.2 Patterns

- Text, textarea, select, date, money, percent  
- Slide-overs for create/edit  
- Settings tabs with sticky save  
- Unsaved changes warning  

### 7.3 Validation

- Inline, actionable  
- Focus first error on submit  
- Success confirmation + last saved time where specified  

### 7.4 Rules

- Placeholders are hints, not labels.  
- Never rely on color alone for errors.  
- Collapse rarely used fields when it reduces noise.

---

## 8. Tables

### 8.1 Standard table behavior (approved)

All data tables MUST include:

| Behavior | Requirement |
|----------|-------------|
| Sticky headers | Header remains visible while scrolling |
| Comfortable spacing | Readable row height; not cramped |
| Hover highlights | Clear row hover using muted slate fill (not zebra) |
| Sort indicators | Visible caret / direction on sortable columns |
| No zebra striping | Do **not** alternate row colors |

### 8.2 Structure

- Trailing `⋮` actions  
- Bulk select when specified (e.g. Quotes)  
- Row click opens detail/builder per screen  
- Truncate long text with tooltip  

### 8.3 Density

One comfortable density for V1.

### 8.4 Rules

- Empty and loading states mandatory.  
- Stay usable with large datasets; pagination/virtualization later if needed.

---

## 9. Cards

### 9.1 When to use

Dashboard metrics · summary panels · settings sections · empty-state containers  

### 9.2 When not to use

- Avoid nesting cards unnecessarily.  
- Prefer one table surface — not a card per row.

### 9.3 Style

Surface background · light border · **`shadow.sm`** · **`radius.md`** · clear title/value hierarchy  

---

## 10. Status Badges

### 10.1 Shape

Pill chip · caption weight · optional small icon · high visibility  

### 10.2 Colors

Section 3.6 mapping only for V1 quote statuses.

### 10.3 Rules

- Text label always present (not color alone).  
- Do not invent extra statuses in V1.  
- Metric cards may be clickable; the badge itself is not a separate control unless specified.

---

## 11. Navigation

### 11.1 App shell

| Element | Behavior |
|---------|----------|
| Left sidebar | Primary destinations; active state with primary subtle + semibold |
| Top header | Branding, search, notifications placeholder, settings, user |
| Back links | Builder → Quotes with unsaved guard |

### 11.2 Rules

- No “coming soon” nav clutter in V1.  
- Collapse to icon rail / drawer on smaller breakpoints.  
- Reduce clicks: primary destinations one click from shell / Dashboard.

---

## 12. Icons

### 12.1 Direction

One outline icon family app-wide (Lucide / Heroicons class).

### 12.2 Usage

Nav · metrics · empty states · row actions — clarify meaning, not decorate.

### 12.3 Rules

- 16–20px chrome; ~24–32px empty states.  
- Consistent stroke.  
- Icon-only controls need accessible names.

---

## 13. Motion & Animations

### 13.1 Intent

**Motion is user feedback, not decoration.**

Use motion to confirm:

- Something saved  
- A panel opened  
- A filter applied  
- A destructive confirm appeared  
- A toast arrived  

| Pattern | Guidance |
|---------|----------|
| Panel / modal open | Short fade/slide 150–250ms |
| Toast | Brief slide/fade |
| Button press | Subtle opacity/color feedback |
| Hover | Color / elevation only |

### 13.2 Rules

- No continuous decorative animation.  
- No bouncing, parallax, or gratuitous page transitions.  
- Respect `prefers-reduced-motion`.  
- Loading spinners are functional feedback only.

---

## 14. Responsive Design

### 14.1 Strategy

**Desktop-first**, same IA on tablet/mobile.

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Sidebar + tables + Builder sticky right totals |
| Tablet | Collapsible sidebar; totals accessible below if needed |
| Mobile | Drawer nav; card lists; sticky bottom Grand Total on Builder |

### 14.2 Rules

- Touch targets ≥ 44px where practical.  
- Do not hide primary CTAs — relocate them.  
- No separate mobile feature set.

---

## 15. Accessibility

Accessibility is a **feature**, not an afterthought.

- WCAG AA contrast targets for text and critical UI  
- Visible focus states  
- Keyboard access to nav, dialogs, menus, forms  
- Status always includes text, not color alone  
- PDFs: selectable text, sufficient contrast, no full-page rasterization  
- Meaningful empty/error copy  

---

## 16. Empty States

### 16.1 Goal

Empty states **encourage action**. They should never feel like a dead end.

### 16.2 Required pattern

1. Optional simple icon  
2. Clear title  
3. One short supporting sentence (what this area is for)  
4. **Primary CTA** (always present when the user can create/fix the gap)  
5. Optional secondary action  

### 16.3 Guidance

| Do | Don't |
|----|--------|
| Make the next step obvious | Leave only muted “No data” text |
| Use the same primary button style as the page CTA | Style empty CTAs as weak links only |
| Keep copy calm and professional | Blame the user or look like an error |
| Allow shell navigation to remain available | Trap the user in an empty panel |

### 16.4 Quote Generator examples

| Screen | Title | Primary CTA | Secondary |
|--------|-------|-------------|-----------|
| Customers | Create your first customer | New Customer | — |
| Quotes | No quotes found. | New Quote | View Customers |
| Service Catalog | No catalog items found. | Create Service | — |
| Dashboard attention lists | Short zero line (e.g. no stale drafts) | View all / related action when useful | — |

### 16.5 Filtered empty

When filters hide all rows: explain that filters are active + **Clear filters** (primary or secondary) in addition to any create CTA.

---

## 17. Loading States

| Context | Pattern |
|---------|---------|
| Page / table | Skeletons matching final layout |
| Button | Spinner; prevent double submit |
| PDF generation | Action progress; keep context |
| Soft refresh | Skeletons over blank flash |

Avoid layout shift when content arrives.

---

## 18. Error States

### 18.1 Levels

Field inline · form/banner · toast · rare page-level with retry  

### 18.2 Copy

What failed · why if known · what to do next  

### 18.3 Examples

Validation · failed save · failed PDF · no catalog search results (search empty, not hard error)

---

## 19. Future Dark Mode Guidelines

Not Version 1 default. When added later:

1. Invert slate neutrals; preserve status meaning (adjust luminance).  
2. Avoid pure black large areas.  
3. Prefer borders over heavy shadows.  
4. Deep blue primary may lighten slightly for contrast.  
5. Reserved teal secondary only if approved.  
6. PDFs may remain light for print.  
7. System preference only after explicit approval.  
8. No dark-by-default without change request.

---

## Document control

| Item | Value |
|------|--------|
| Applies to | All Project X applications |
| V1 theme | Light |
| Primary accent | Deep blue (`#1E3A8A` family) |
| Secondary accent | Teal reserved (future) |
| Typeface | Inter |
| Radius | Medium (`10px`) standardized |
| Shadows | Subtle only |
| Tables | Sticky header, hover, sort, no zebra |
| Status | **Milestone 4 Approved** |
| Change process | Explicit change request |
| Implementation | **Not started — await authorization** |

---

## Milestone 4 status

**Design System and Visual Style is approved and complete.**

Next step requires explicit approval: begin an implementation milestone (still not started here).
