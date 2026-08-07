# Product Specification

**Product:** Quote Generator Pro  
**Project:** Project X  
**Document status:** Draft — collaborative definition in progress  
**Primary reference:** Yes. All future development should align with this document.

---

## 1. Purpose

Quote Generator Pro is a professional quote generation system for service businesses such as HVAC, plumbing, roofing, electrical, and construction.

Employees should be able to quickly create professional customer quotes.

---

## 2. Goals

| ID | Goal | Status |
|----|------|--------|
| G1 | Enable staff to create professional customer quotes quickly | TBD — details pending |
| G2 | Support common service-business quoting workflows | TBD — details pending |
| G3 | Produce presentation-ready quote output (e.g. PDF) | Planned (roadmap) |

> Goals will be refined with the team before implementation milestones begin.

---

## 3. Non-Goals (Current)

The following are explicitly out of scope until this specification says otherwise:

- Authentication and user account management (planned later)
- Database persistence (planned later)
- Full customer/quote modules (planned later)
- PDF generation (planned later)
- Dashboard analytics (planned later)
- Production deployment (planned later)

---

## 4. Users & Roles

| Role | Description | Permissions | Status |
|------|-------------|-------------|--------|
| TBD | TBD | TBD | Awaiting definition |

**Open questions**

- Who uses the system day-to-day (field techs, office staff, owners)?
- Are there multiple permission levels?
- Is there an admin role?

---

## 5. User Workflow

High-level intended flow (to be confirmed):

```text
TBD → TBD → TBD → TBD
```

**Open questions**

- How does a quote start (new customer vs existing)?
- What steps are required before a quote can be sent/exported?
- Can quotes be edited, duplicated, or voided?
- What happens after a quote is accepted or rejected?

---

## 6. Features

| ID | Feature | Description | Priority | Status |
|----|---------|-------------|----------|--------|
| F1 | Authentication | User sign-in / access control | TBD | Not specified |
| F2 | Customer Module | Manage customer records | TBD | Not specified |
| F3 | Quote Module | Create and manage quotes | TBD | Not specified |
| F4 | PDF Generator | Export professional quote PDFs | TBD | Not specified |
| F5 | Dashboard | Overview / operational summary | TBD | Not specified |

> Feature details, acceptance criteria, and edge cases will be defined with the team before coding each module.

---

## 7. Screens

| Screen | Purpose | Primary actions | Status |
|--------|---------|-----------------|--------|
| TBD | TBD | TBD | Awaiting definition |

**Open questions**

- Which screens are required for MVP?
- Mobile vs desktop priority?
- Navigation structure?

---

## 8. Data Model (Database Fields)

No database is connected yet. Tables and fields will be defined here before any persistence work.

### 8.1 Entities (planned for definition)

| Entity | Purpose | Status |
|--------|---------|--------|
| User | TBD | Not defined |
| Customer | TBD | Not defined |
| Quote | TBD | Not defined |
| Quote Line Item | TBD | Not defined |
| Other | TBD | Not defined |

### 8.2 Field definitions

Each entity will document:

- Field name
- Type
- Required / optional
- Default value
- Validation rules
- Notes

**Status:** Awaiting collaborative definition.

---

## 9. Business Rules

| ID | Rule | Status |
|----|------|--------|
| BR1 | TBD | Awaiting definition |

Examples of rules to decide later:

- Quote numbering format
- Tax / discount handling
- Quote validity / expiration
- Editable vs locked quote states

---

## 10. Integrations

| System | Purpose | Status |
|--------|---------|--------|
| None yet | — | No integrations specified |

---

## 11. Non-Functional Requirements

| Area | Requirement | Status |
|------|-------------|--------|
| Performance | TBD | Not defined |
| Security | TBD | Not defined |
| Accessibility | TBD | Not defined |
| Browser support | TBD | Not defined |
| Multi-tenant / multi-company | TBD | Not defined |

---

## 12. Technical Context (Current Foundation)

Already established in Milestone 1:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- Scalable `src/` project structure
- Documentation under `docs/`

See also: [project-structure.md](./project-structure.md)

---

## 13. Roadmap Alignment

- [x] Project Initialization
- [ ] Product Specification ← **current focus**
- [ ] Authentication
- [ ] Database
- [ ] Customer Module
- [ ] Quote Module
- [ ] PDF Generator
- [ ] Dashboard
- [ ] Deployment

---

## 14. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-06 | Initialize foundation only (no auth/DB/features) | Establish clean, scalable baseline first |
| 2026-08-06 | Product Specification is the primary development reference | Prevent building without agreed requirements |
| 2026-08-06 | GitHub repo will be private: `projectx-quote-generator` | Protect in-progress commercial product |

---

## 15. Next Steps

1. Complete this Product Specification with the team (features, screens, fields, workflows).
2. Get explicit approval of the specification.
3. Only then begin the next implementation milestone.
