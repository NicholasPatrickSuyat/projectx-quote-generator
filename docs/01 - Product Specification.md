# Product Specification

**Product:** Quote Generator Pro  
**Project:** Project X  
**Document status:** Version 1 Approved — single source of truth; changes by explicit change request only  
**Primary reference:** Yes. All future development must align with this document.

---

## 1. Product Vision

Quote Generator Pro helps service businesses create professional, accurate customer quotes quickly while reducing manual work, improving consistency, and laying the foundation for future business automation.

---

## 2. Purpose

Quote Generator Pro is a professional quote generation system for service businesses.

Employees (office staff in Version 1) should be able to quickly create, manage, and deliver professional customer quotes.

---

## 3. MVP Philosophy

For Version 1, before adding any feature, ask:

> Does this help an office employee create and manage quotes faster?

If the answer is no, it belongs in a future version.

This product is intentionally a **Quote Generator**, not a full CRM. Every customer or quote field must support creating or managing quotes faster.

---

## 4. Target Business & Users

### 4.1 Industry focus (approved)

Industry-agnostic. Designed for general service businesses, including:

- HVAC
- Plumbing
- Electrical
- Roofing
- Landscaping
- Painting
- Cleaning
- Construction
- Handyman services

The same product should be demonstrable to many different businesses.

### 4.2 Primary users â€” Version 1 (approved)

| Role | Description | Status |
|------|-------------|--------|
| Office staff | Answers the phone and prepares estimates; primary day-to-day user | Approved â€” v1 focus |

**Future versions:** Field technicians and managers.

### 4.3 Tenancy (approved)

- **Version 1:** Single company per installation.
- **Future:** SaaS / multi-tenant only if the product is productized later.

### 4.4 Device priority (approved)

- **Desktop-first** for quote creation and management.
- UI must remain **responsive** so tablets and phones still work.

### 4.5 Job-to-be-done (approved)

Allow office staff to create, manage, and deliver professional customer quotes accurately in under two minutes, reducing repetitive work and improving consistency.

**Manage** includes: search quotes, edit quotes, duplicate quotes, re-send quotes, print quotes, and track quote status.

---

## 5. Goals

| ID | Goal | Status |
|----|------|--------|
| G1 | Enable office staff to create professional customer quotes in under two minutes | Approved |
| G2 | Enable office staff to manage quotes (search, edit, duplicate, re-send, print, track status) | Approved |
| G3 | Support reusable customer records so quotes do not require re-entering customer data | Approved |
| G4 | Produce presentation-ready quote output (e.g. PDF) | Planned (roadmap) |
| G5 | Lay foundation for future business automation | Vision |

---

## 6. Non-Goals

### 6.1 Not a full CRM (approved)

Do not expand into CRM features that do not directly speed up creating or managing quotes.

### 6.2 Not invoices, payments, scheduling, or job management (approved)

Version 1 is for **estimates and quotes only** â€” not invoices, payments, scheduling, or full job management.

### 6.3 Deferred to later implementation milestones (until specified)

- Authentication and user account management
- Database persistence (implementation)
- Full customer/quote module implementation
- PDF generation implementation
- Dashboard implementation
- Production deployment
- Field technician / manager workflows
- Multi-company / SaaS tenancy
- Residential / Commercial customer type (unless later needed for pricing, tax, templates, required fields, or reporting)
- Service / Preferred Date on quotes (future scheduling / job-management version)

---

## 7. Customer Information (approved)

### 7.1 Purpose

Customers are saved and reusable. Office staff can search for an existing customer and create a new quote without re-entering customer information.

Maintain the relationship between customers and quotes so the product can later show quote history, quote count, and quote statuses per customer.

### 7.2 Customer fields â€” Version 1

| Field | Requirement | Notes |
|-------|-------------|--------|
| Customer ID | Auto-generated | Unique ID, e.g. `CUST-000001` |
| First Name | Required | |
| Last Name | Required | |
| Phone Number | Required | |
| Service Address (Street) | Required | One service address in v1 |
| City | Required | |
| State | Required | |
| ZIP Code | Required | |
| Company Name | Optional | |
| Email Address | Optional | |
| Internal Notes | Optional | Employees only; **never** appear on the customer-facing quote |
| Created Date | Auto-generated | |
| Last Updated Date | Auto-generated | |
| Archived | System | Soft delete / archive flag |

### 7.3 Internal notes (approved)

Internal notes are for employees only. Examples:

- Gate code
- Dog in backyard
- Call before arriving
- Prefers afternoon appointments
- Existing customer since 2022

### 7.4 Customer search (approved)

Search by:

- First Name
- Last Name
- Company Name
- Phone Number
- Email Address
- Street Address

Search must support **partial matches** and return results quickly.

### 7.5 Archive / soft delete (approved)

- Use **soft delete (archive)**. Customers are not permanently deleted through normal application use if they have existing quotes.
- Archived customers are hidden from normal searches.
- Archived customers can be restored later.
- Historical quotes remain intact.

### 7.6 Version 1 limitations (approved)

- **One service address per customer** in Version 1.

### 7.7 Future version (customer)

- Multiple service addresses
- Billing address
- Secondary phone number
- Secondary contact

### 7.8 Residential vs Commercial (approved)

**Do not include** a Residential / Commercial type field in Version 1.

The app stays industry-neutral and focused on fast quoting. This field may be added later if it affects pricing, taxes, quote templates, required information, or reporting.

### 7.9 Notes clarity (approved)

The application must clearly distinguish:

- **Customer internal notes** â€” employee-only; never on PDF
- **Quote internal notes** â€” employee-only; never on PDF
- **Customer-facing quote notes / message** â€” appear on PDF

---

## 8. Quote Information (approved)

### 8.1 Purpose

Quotes are estimates prepared for a saved customer. Every quote must belong to a customer. Employees create and manage quotes (including search, edit, duplicate, re-send, print, and status tracking â€” detailed in later sections).

### 8.2 Quote header fields â€” Version 1

| Field | Requirement | Notes |
|-------|-------------|--------|
| Quote ID | Auto-generated | Unique; format `QUO-000001`; never reused |
| Created Date | Auto-generated | |
| Last Updated Date | Auto-generated | |
| Customer | Required | Must select existing or create new before continuing; no customer-less quotes |
| Quote Date | Required | Defaults to today; editable |
| Status | Required | Draft editable freely; other status edit rules in Statuses section |
| Job / Service Description | Required | Summary of work being quoted |
| Valid Until / Expiration Date | Optional | Defaults to Quote Date + 30 days; editable; default period later configurable in Company Settings |
| Prepared By | Optional | Simple name field for demo until auth; later linked to logged-in employee |
| Internal Notes | Optional | Employees only; never on PDF |
| Customer-Facing Notes / Message | Optional | Appears on PDF (warranties, payment terms, thank-you, exclusions, etc.) |
| Tax Rate | Quote-level | Percentage; applied after discount; overridable per quote; default later from Settings |
| Discount Type | Quote-level | Fixed dollar **or** percentage |
| Discount Value | Quote-level | Applied to subtotal before tax |

### 8.3 Customer requirement (approved)

Every quote must belong to a saved customer. User must either:

1. Select an existing customer, or  
2. Create a new customer before continuing with the quote  

Customer-less quotes are **not** allowed in Version 1.

### 8.4 Quote-level dates (approved)

| Date | Behavior |
|------|----------|
| Quote Date | Defaults to today; employee may edit |
| Valid Until | Optional; defaults to 30 days after Quote Date; editable; company default validity period later in Settings |
| Service / Preferred Date | **Not in v1** |

### 8.5 Quote-level tax and discount (approved)

Order of calculation (details finalized in Line Items section):

1. Subtotal (from line items)  
2. Discount (fixed $ or %) applied to subtotal  
3. Tax (percentage) applied **after** discount  

- Employee may change tax rate on an individual quote.  
- Default tax rate can eventually come from Company Settings.

### 8.6 Duplicate quote behavior (approved)

**Copy:** Customer, Job / Service Description, Line Items, Internal Notes, Customer-Facing Notes, Tax Rate, Discount Type and Value.

**Reset / generate:**

- New Quote ID  
- Status = Draft  
- Quote Date = today  
- Valid Until recalculated from default validity period  
- Created Date and Last Updated Date = now  
- Do **not** copy approval, rejection, sent, or payment history  

### 8.7 Historical customer snapshot (approved)

When a quote is created, preserve a historical snapshot of:

- Customer name  
- Company name  
- Contact information  
- Service address  

used at quote creation time. Editing the live customer record later must **not** change old quotes.

### 8.8 Quote ID rules (approved)

- Format: `QUO-000001`  
- Auto-generated and unique  
- Never reused, even if a quote is archived  

### 8.9 Editability (approved)

Edit rules are defined by status in [Section 10.6](#106-editing-rules-approved). Draft and Sent are editable (Sent with confirmation); Accepted, Rejected, and Expired are locked (Expired may reactivate to Draft); Archived is read-only.

### 8.10 Future (quote header)

- Prepared By linked to authenticated employee  
- Configurable default validity period in Company Settings  
- Configurable default tax rate in Company Settings  
- Service / Preferred Date (scheduling / job management)  

---

## 9. Quote Line Items and Calculations (approved)

### 9.1 Purpose

Line items make up the quoted work. Employees combine **reusable Service Catalog** templates with **manual custom lines**, reorder lines, and see totals update instantly. Version 1 prioritizes speed and ease of use.

### 9.2 Line item fields â€” Version 1

| Field | Requirement | Notes |
|-------|-------------|--------|
| Description | Required | May be populated from Service Catalog; still editable |
| Quantity | Required | Must be greater than zero; cannot be negative |
| Unit Price | Required | Cannot be negative; editable even when from catalog |
| Unit of Measure | Optional | Free-text (e.g. ea, hr, day, sqft, lf, ft, box, gallon) |
| Internal Line Item Notes | Optional | Employees only; never on PDF |
| Line Total | Auto-calculated | `Quantity Ã— Unit Price`; rounded to 2 decimals |
| Category | Required for display grouping | Services, Materials, or Labor â€” readability only; does not change math |
| Sort Order | System | Supports drag-and-drop reorder (up/down fallback OK) |

**Not in Version 1:** SKU / product codes; per-line discounts; taxable vs non-taxable flags.

### 9.3 Minimum line items (approved)

- Draft quotes may have **zero** line items.
- A quote **cannot** be marked **Sent** until it has **at least one** line item.

### 9.4 Units of measure (approved)

Optional free-text Unit field for industry flexibility.

### 9.5 Discounts and taxability (approved)

- **Quote-level discounts only** (fixed $ or %). No line-item discounts in v1.
- **All line items are taxable** in v1. Taxable/non-taxable per line is future.

### 9.6 Calculation order (approved)

```text
Line Total     = Quantity Ã— Unit Price
Subtotal       = Sum of all Line Totals
Discount Amount = Fixed $ OR Percentage of Subtotal
Taxable Amount = Subtotal âˆ’ Discount Amount
Tax Amount     = Taxable Amount Ã— (Tax Rate / 100)
Grand Total    = Taxable Amount + Tax Amount
```

### 9.7 Calculation business rules (approved)

| Rule | Detail |
|------|--------|
| Currency rounding | All currency values round to **two decimal places** |
| Discount cap | Discount cannot exceed Subtotal |
| Quantity | Cannot be negative; must be **greater than zero** |
| Unit Price | Cannot be negative |
| Tax Rate | Cannot be negative |
| Grand Total | Can never be negative |
| Live updates | Totals recalculate instantly as the employee edits |
| Empty lines | Empty line items must not be saved |
| Currency display | Always use company-configured currency (**USD** for the demo) |

### 9.8 Service Catalog (approved)

Version 1 includes a **simple reusable Service Catalog** (not inventory).

- Save common services (e.g. Install AC Unit, Furnace Replacement, Diagnostic Fee, Thermostat Installation, Water Heater Installation).
- Selecting a saved service populates **Description** and **Unit Price** on the quote line.
- Employee may still edit values before saving.
- Employees may also add **fully custom** line items at any time.

### 9.9 Line categories (approved)

Quotes clearly separate lines into:

- **Services**
- **Materials**
- **Labor**

Separation is for **readability only** and does **not** change calculation logic.

### 9.10 Line ordering (approved)

Support simple **drag-and-drop** reordering in Version 1. If complexity is high, **up/down buttons** are an acceptable fallback.

### 9.11 Quote Builder UX principle (approved)

Employees should build a professional quote with minimal typing by combining reusable service templates with manual line items.

### 9.12 Future (line items / catalog)

- Taxable vs non-taxable line items  
- Per-line discounts  
- SKU / product codes  
- Full inventory / stock tracking  

---

## 10. Quote Statuses and Workflow (approved)

### 10.1 Purpose

Every quote has exactly **one current status**. Statuses drive editing rules, search visibility, history timestamps, and (later) dashboard reporting. The workflow prioritizes **simplicity for office staff** while preserving accurate quote history.

### 10.2 Statuses â€” Version 1

| Status | Badge color (UI) |
|--------|------------------|
| Draft | Gray |
| Sent | Blue |
| Accepted | Green |
| Rejected | Red |
| Expired | Orange |
| Archived | Dark Gray |

No additional statuses in Version 1. Status is shown with **colored badges** throughout the app.

### 10.3 Allowed transitions (approved)

| From | Allowed next actions / statuses |
|------|----------------------------------|
| **Draft** | â†’ Sent; â†’ Archived |
| **Sent** | â†’ Draft (revisions before acceptance); â†’ Accepted; â†’ Rejected; â†’ Expired; â†’ Archived |
| **Accepted** | â†’ Archived; Duplicate (new Draft) |
| **Rejected** | â†’ Archived; Duplicate (new Draft) |
| **Expired** | â†’ Draft (reactivate by updating expiration); â†’ Archived; Duplicate (new Draft) |
| **Archived** | Restore to previous status; Duplicate (new Draft) |

### 10.4 Becoming Sent (approved)

A quote may become **Sent** by:

1. Manually changing the status, or  
2. Generating/downloading the final customer PDF after confirmation  

**Validation before Sent:**

- Customer exists  
- At least one line item exists  
- Quote total (Grand Total) is greater than zero  

### 10.5 Expiration (approved)

- Quotes **automatically** become **Expired** when **Valid Until** has passed.
- If Valid Until is empty, the quote **never** auto-expires.
- Employees may also **manually** mark a quote as Expired.

### 10.6 Editing rules (approved)

| Status | Edit rule |
|--------|-----------|
| **Draft** | Fully editable |
| **Sent** | Fully editable; if edited after send, confirm: *"This quote has already been sent to the customer. Continue editing?"*; updates Last Updated Date |
| **Accepted** | Locked; duplicate to create a new Draft |
| **Rejected** | Locked; duplicate to create a new Draft |
| **Expired** | Locked; may reactivate by changing expiration and moving back to Draft |
| **Archived** | Read-only; can restore or duplicate |

### 10.7 Accepted quotes (approved)

Accepted quotes **cannot** be edited or reopened. Employees must **duplicate** to create a new Draft.

### 10.8 Archive (approved)

- Soft archive only; no permanent delete via normal application use.
- Archived quotes are hidden from normal searches, can be restored, and preserve history.

### 10.9 Key timestamps (approved)

Version 1 stores (no full audit trail yet):

| Timestamp | Purpose |
|-----------|---------|
| Created Date | Quote created |
| Last Updated Date | Last content/status-relevant update |
| Sent Date | When moved to Sent |
| Accepted Date | When accepted |
| Rejected Date | When rejected |
| Expired Date | When expired (auto or manual) |
| Archived Date | When archived |

Full audit trail is a **future** version.

### 10.10 Dashboard linkage (approved)

Dashboard uses these statuses for reporting, filtering, and clickable metric deep-links. See [Section 11](#11-dashboard-approved).

### 10.11 Future (workflow)

- Full audit trail (who changed what)  
- Additional statuses only if business need is proven  

---

## 11. Dashboard (approved)

### 11.1 Purpose

The Dashboard is the **operational home page** for office staff. It quickly shows what needs attention today and provides one-click access to the most common actions.

It must load quickly, stay clean and uncluttered, and prioritize information that helps staff decide what to work on next. If a widget does not help create or manage quotes faster, it belongs in a future version.

### 11.2 Default landing page (approved)

Users always land on the **Dashboard** after login (or when opening the app once authentication exists).

### 11.3 Summary metrics â€” Version 1 (approved)

**Status totals (non-archived):**

- Total Draft Quotes  
- Total Sent Quotes  
- Total Accepted Quotes  
- Total Rejected Quotes  
- Total Expired Quotes  

**This month:**

- Quotes Created This Month  
- Quotes Sent This Month  
- Accepted Quotes This Month  
- Total Accepted Quote Value This Month  

**Attention:**

- Quotes Expiring Within 7 Days  

Advanced analytics are deferred.

### 11.4 Needs attention lists (approved)

- Draft quotes older than 7 days  
- Quotes expiring within 7 days  
- Recently Sent quotes awaiting customer response  

Reminders and notifications are future.

### 11.5 Quick actions (approved)

Always visible, one click:

- New Quote  
- New Customer  
- View All Quotes  
- View Customers  
- Service Catalog  

Every major section should be reachable within one click from the Dashboard.

### 11.6 Date filter presets (approved)

- Today  
- Last 7 Days  
- Last 30 Days  
- This Month  

No custom date picker in Version 1.

### 11.7 Chart (approved)

One simple chart: **Quote Status Overview** (bar or donut) showing counts for Draft, Sent, Accepted, Rejected, Expired. Rest of dashboard uses summary cards and action lists.

### 11.8 Archived quotes (approved)

- **Excluded** from all dashboard metrics and lists.  
- Available via a separate **Archive** page.

### 11.9 Clickable metric cards (approved)

Dashboard cards are clickable. Clicking a metric (e.g. Draft Quotes) opens the Quotes page **pre-filtered** to that status.

### 11.10 Future (dashboard)

- Revenue analytics, conversion rates, employee performance  
- Reminders, notifications, customer follow-up tracking  

---

## 12. Company Settings (approved)

### 12.1 Purpose

Company Settings store the single-company profile, quote defaults, and PDF default content. Settings support the Product Vision without becoming a complex configuration system. They must look and feel like modern SaaS software: clean, professional, consistent, responsive, accessible, with subtle interactions — no clutter.

### 12.2 Settings included — Version 1 (approved)

**Company Profile**

| Field | Requirement |
|-------|-------------|
| Company Name | Required |
| Logo | Optional |
| Phone Number | Required |
| Email Address | Required |
| Website | Optional |
| Street Address | Required |
| City | Required |
| State | Required |
| ZIP Code | Required |

**Quote Defaults**

| Field | Requirement | Demo default |
|-------|-------------|--------------|
| Default Tax Rate | Required | 0% |
| Default Quote Validity Period (days) | Required | 30 |
| Default Discount Type | Optional | None |
| Default Discount Value | Optional | 0 |
| Default Prepared By Name | Optional | (until authentication) |

**PDF Defaults**

| Field | Requirement |
|-------|-------------|
| Default Customer-Facing Message | Optional |
| Default Terms and Conditions | Optional |
| PDF Footer Text | Optional |

**Application Settings**

| Field | Requirement | Demo default |
|-------|-------------|--------------|
| Currency | Required | USD |

**Not in Version 1:** advanced billing, multiple templates, branch/location management, multi-company settings, configurable ID prefixes.

### 12.3 Placeholders (approved)

The application may use reasonable demo placeholders until the user configures the company profile.

### 12.4 Inheritance for new quotes (approved)

New quotes inherit:

- Default Tax Rate  
- Default Quote Validity Period  
- Default Discount Type / Value  
- Default Prepared By Name  
- Default Customer-Facing Message  
- Default Terms and Conditions  

Employees may override these on an individual quote where applicable.

**Changing Company Settings affects newly created quotes only.** It must not silently change existing quotes. Existing quote records preserve original company/quote data where historical accuracy requires it. Updating Settings must not retroactively change finalized historical documents without an explicit regeneration decision.

### 12.5 Logo upload (approved)

- Accept PNG, JPG, JPEG, WebP  
- Preview before saving  
- Show in application header where appropriate  
- Show on generated quote PDFs  
- Company-name fallback if no logo  
- Validate file type and size  
- Storage implementation deferred to database / file-storage planning  

### 12.6 Who can edit (approved)

- **Conceptually Admin-only.**  
- Before auth/roles (demo): Settings page may be editable.  
- After auth: Admins edit; regular office users may view relevant company info but cannot change protected settings.

### 12.7 Locations (approved)

One company profile and one primary business address only. No multiple locations, departments, or branches in v1.

### 12.8 ID prefixes (approved)

Fixed: `QUO-` and `CUST-`. Not configurable in MVP. Sequence numbers unique and never reused.

### 12.9 PDF-related content stored here (approved)

Company identity/contact, logo, Default Customer-Facing Message, Default Terms and Conditions, PDF Footer Text. Layout and placement are defined in the PDF section.

### 12.10 Settings UX (approved)

Modern SaaS-style layout with clear sections/tabs:

- Company Profile  
- Quote Defaults  
- PDF Defaults  

Forms include clear labels, helpful descriptions, inline validation, save confirmation, and unsaved-changes warning where appropriate.

### 12.11 Future (settings)

- Multiple locations / branches  
- Configurable ID prefixes  
- Multiple PDF templates  
- Advanced billing configuration  

---

## 13. PDF Output and Layout (approved)

### 13.1 Purpose

Generate professional, customer-ready quote PDFs that a business can send directly without extra editing. Design is modern SaaS-inspired: clean layout, strong typography, consistent spacing, minimal color, clear hierarchy, high readability, and branding that builds trust — not decorative clutter or outdated invoice styling.

### 13.2 Contents — include (approved)

**Company information:** Logo, Company Name, Phone, Email, Website, Business Address  

**Quote information:** Quote ID, Quote Date, Valid Until, Prepared By  

**Customer information (snapshot):** Customer Name, Company Name (if any), Phone, Email, Service Address  

**Job information:** Job / Service Description  

**Quote details:** Line items grouped by **Services**, **Materials**, **Labor**  

**Totals:** Subtotal, Discount, Tax, Grand Total  

**Additional:** Customer-Facing Message, Terms and Conditions, Company Footer  

**Not in Version 1:** Signatures, payment sections.

### 13.3 Never on PDF (approved)

- Customer / Quote / Line Item internal notes  
- Employee-only information  
- Archived status  
- System IDs  
- Created Date / Last Updated Date  
- Administrative or debugging information  

### 13.4 Paper size (approved)

US Letter **portrait**. A4 may be added later.

### 13.5 Line item columns (approved)

Description, Quantity, Unit (only if provided), Unit Price, Line Total.  
Hide the Unit column entirely if no line item uses a unit.

### 13.6 Category layout (approved)

Group line items under headings: Services, Materials, Labor.

### 13.7 Generation modes (approved)

| Mode | Rules |
|------|--------|
| **Internal Preview** | Available anytime; clearly marked **Draft** if Sent validation has not passed |
| **Final Customer PDF** | Requires customer exists, ≥ 1 line item, Grand Total > 0 |

### 13.8 Sent workflow (approved)

On Final Customer PDF:

1. Show confirmation  
2. If confirmed: generate PDF, set status to **Sent**, record **Sent Date**  

### 13.9 Multi-page (approved)

- **Page 1:** Full company branding and complete header  
- **Additional pages:** Compact header, page numbers, footer  
- Consistent spacing; avoid awkward line-item splits across pages where practical  
- Consistent margins  

### 13.10 Historical freeze at Sent (approved)

When a quote is marked **Sent**, freeze in the quote record:

- Company Name, Logo, Contact Information  
- Customer Snapshot  
- Quote Details and Pricing  
- Terms and Conditions  

Later Company Settings changes must not alter previously sent quotes.  
**Draft** quotes may continue using the latest Company Settings until Sent.

### 13.11 Technical / quality (approved)

- Selectable text (not image-only) for accessibility and copying  
- Currency always uses configured company currency  
- Professional enough to send to customers as-is  

### 13.12 Future (PDF)

- A4 paper size  
- Signatures / payment sections (only if product scope expands)  
- Multiple templates  

---

## 14. Permissions and User Roles (approved)

### 14.1 Roles — Version 1 (approved)

| Role | Description |
|------|-------------|
| **Admin** | Full access, including settings, catalog management, users, and status overrides |
| **Office Staff** | Day-to-day quoting and customer work; no settings/user/catalog modification |

No Manager role in Version 1. Field technicians remain future.

### 14.2 Authentication timing (approved)

| Phase | Auth |
|-------|------|
| Development and early demos | **No authentication required** |
| Production-ready | **Authentication required** |

Architecture must allow adding authentication **without major redesign**. Security is a production requirement; design with auth and RBAC in mind from the beginning even when demos skip login.

### 14.3 Office Staff permissions (approved)

**Can:**

- View Dashboard  
- Create / Edit / Archive / Restore / Search Customers  
- Create Quotes; Edit Draft; Edit Sent (with confirmation); Duplicate; Archive; Restore  
- Generate Draft (internal preview) PDFs and Final Customer PDFs  
- View, Search, and **Use** Service Catalog  

**Cannot:**

- Edit Company Settings  
- Manage Users  
- Modify Service Catalog  
- Delete historical records  
- Change protected system settings  

### 14.4 Admin permissions (approved)

Everything Office Staff can do, plus:

- Edit Company Settings (profile, quote defaults, PDF defaults, application settings)  
- Manage Service Catalog (create, edit, archive, restore)  
- Manage Users  
- Restore archived records  
- Override quote statuses when necessary  

### 14.5 Service Catalog permissions (approved)

| Action | Office Staff | Admin |
|--------|--------------|-------|
| View / Search / Use | Yes | Yes |
| Create / Edit / Archive / Restore | No | Yes |

Only Admin may modify the Service Catalog.

### 14.6 User fields (when auth exists) (approved)

| Field | Notes |
|-------|--------|
| Full Name | Required |
| Email Address | Required |
| Role | Admin or Office Staff |
| Active / Inactive | Soft deactivation |
| Profile Picture | Optional |
| Created Date | Auto |
| Last Updated Date | Auto |

Passwords must **never** be stored directly; auth implementation later determines credential handling.

### 14.7 User deactivation (approved)

Soft deactivation only — no permanent delete via normal UI. Inactive users cannot log in. Historical records stay associated with the original employee.

### 14.8 Prepared By after auth (approved)

- Auto-populate from logged-in user  
- Admins may optionally override  
- Office Staff should not normally change it  

### 14.9 Concurrency (approved)

Multiple office employees may use the app simultaneously. If two users edit the same quote: **last write wins** in Version 1. Edit locking / conflict detection is future.

### 14.10 Enforcement & UX (approved)

- Once auth exists, data-modifying actions record the responsible user  
- Permissions enforced on **frontend and backend**  
- UI **hides** features the user cannot access (does not merely disable them)  

### 14.11 Future (permissions)

- Manager role  
- Edit locking / conflict detection  
- Field technician permissions  
- SSO / advanced identity providers (as needed)  

---

## 15. Demo Scope and Version 1 Boundaries (approved)

### 15.1 Demo company (approved)

| Field | Value |
|-------|--------|
| Company Name | Project X Mechanical Services |
| Industry | General HVAC and Home Services |
| Location | Dallas, Texas (Demo) |
| Branding | Placeholder until a custom logo is uploaded |

### 15.2 Seed data (approved)

Realistic demo data so users can experience the app immediately:

| Data | Quantity / distribution |
|------|-------------------------|
| Customers | 10 |
| Service Catalog items | 15 common services |
| Quotes | 15 |
| Status mix | 4 Draft, 3 Sent, 4 Accepted, 2 Rejected, 2 Expired |

Reseed via development tools/scripts only — **no in-app reset** in Version 1.

### 15.3 Explicitly out of scope — Version 1 (approved)

- Multi-company / multi-tenant  
- CRM beyond quoting  
- Invoicing, payments  
- Scheduling, dispatching  
- Field technician mobile app  
- Inventory, purchase orders  
- Accounting integrations  
- Email / SMS automation  
- Customer portal  
- Electronic signatures  
- File attachments  
- AI features  
- Audit trail  
- Advanced reporting  
- Notifications  
- Edit locking  
- Multi-language support  
- Multiple company locations  
- Multiple PDF templates  

These belong in future versions and must pass Product Vision + MVP philosophy review before any implementation.

### 15.4 Version 1 success criteria (approved)

Version 1 is complete when an office employee can:

**Customers:** create, search, edit, archive, restore  

**Quotes:** create; add manual lines and catalog services; apply discount and tax; Draft PDF preview; Final PDF; manage statuses; duplicate  

**Dashboard:** view metrics and use quick actions  

**Settings:** configure Company Settings; upload logo; configure quote defaults and PDF defaults  

The app must feel polished, professional, responsive, and ready to demonstrate to businesses.

### 15.5 Browser support (approved)

Latest versions of Google Chrome, Microsoft Edge, Mozilla Firefox, and Safari.

### 15.6 Offline (approved)

Online-only. PWA / offline is future.

### 15.7 Product Specification status (approved)

**This Product Specification is Version 1 Approved.**

It is the **single source of truth** for implementation. Future changes require **explicit change requests** only.

### 15.8 Cross-cutting UX standard (approved)

Maintain a modern SaaS appearance on every screen. Prioritize speed, clarity, and ease of use for office staff. Target experience comparable to modern products such as Stripe, Linear, Notion, and Vercel: clean, minimal, professional, fast, consistent.

### 15.9 Post-spec process (approved)

**Milestone 3 — UI/UX Planning:** complete (all wireframes approved).

**Next:** Milestone 4 — Design System and Visual Style (before any application implementation).

**Update:** Milestone 4 is now **Approved**. Implementation still awaits explicit authorization.

Implement only after design system approval, one milestone at a time.

---

## 16. User Workflow

High-level intended flow:

```text
Open Dashboard (home)
  → Needs-attention / quick actions
  → Find or create customer
  → Create quote (inherits Company Settings defaults + customer snapshot)
  → Add line items (catalog + custom)
  → Internal Preview PDF and/or Final Customer PDF (confirm → Sent)
  → Track Accepted / Rejected / Expired
  → Archive or Duplicate as needed
```

Admins configure Company Settings, Service Catalog, and Users (when auth exists).

Authoritative detail: Sections 7–15.

---

## 17. Features

| ID | Feature | Description | Priority | Status |
|----|---------|-------------|----------|--------|
| F1 | Authentication | Login + RBAC; required for production; optional in early demos | High | Spec approved |
| F2 | Customer Module | Create, search, edit, archive, restore | High | Spec approved |
| F3 | Quote Module | Create/manage quotes, statuses, duplicate | High | Spec approved |
| F3a | Service Catalog | Admin-managed; Staff use | High | Spec approved |
| F4 | PDF Generator | Draft preview + Final customer PDF | High | Spec approved |
| F5 | Dashboard | Operational home | High | Spec approved |
| F6 | Company Settings | Profile, defaults, logo, PDF defaults | High | Spec approved |
| F7 | Archive | Soft archive / restore | High | Spec approved |
| F8 | User Management | Admin users (with auth) | High | Spec approved |
| F9 | Demo seed data | 10 customers, 15 catalog, 15 quotes | High | Spec approved |

---

## 18. Screens (implementation targets after UI/UX planning)

| Screen | Status |
|--------|--------|
| Dashboard | Spec approved — design next |
| Quotes list | Spec approved — design next |
| Quote Builder | Spec approved — design next |
| Customers list / form | Spec approved — design next |
| Service Catalog | Spec approved — design next |
| Archive | Spec approved — design next |
| Company Settings | Spec approved — design next |
| Users (Admin) | Spec approved — design with auth |
| PDF output / mockup | Spec approved — design next |
| Login | Spec approved — production |

---

## 19. Data Model Summary

Entities approved for Version 1: Customer, Quote (with snapshots + Sent freeze), Quote Line Item, Service Catalog Item, Company Settings, User.

No database connected yet. Schema implementation follows UI/UX planning and subsequent implementation milestones.

---

## 20. Business Rules

All BR-C*, BR-Q*, BR-LI*, BR-S*, BR-D*, BR-CS*, BR-PDF*, BR-P* rules in prior sections are **approved** for Version 1.

---

## 21. Integrations

| System | Purpose | Status |
|--------|---------|--------|
| None in Version 1 | — | Explicitly out of scope |

---

## 22. Non-Functional Requirements

| Area | Requirement | Status |
|------|-------------|--------|
| Multi-tenant | Single company per install | Approved |
| Devices | Desktop-first; responsive | Approved |
| Browsers | Latest Chrome, Edge, Firefox, Safari | Approved |
| Offline | Online-only | Approved |
| UX standard | Modern SaaS (Stripe/Linear/Notion/Vercel-class clarity) | Approved |
| Security | Auth + RBAC for production; demos may omit login | Approved |
| Authorization | Frontend + backend; hide unauthorized UI | Approved |
| Concurrency | Last write wins | Approved |
| PDF | Professional selectable text; Letter portrait | Approved |

---

## 23. Technical Context (Current Foundation)

Milestone 1 complete:

- Next.js (App Router), TypeScript, Tailwind CSS, ESLint  
- Scalable `src/` layout, `docs/`  
- Private GitHub: `projectx-quote-generator`  

See [project-structure.md](./project-structure.md).

---

## 24. Roadmap Alignment

- [x] Project Initialization  
- [x] Product Specification ← **Version 1 Approved**  
- [x] UI/UX Planning ← **Milestone 3 complete**  
- [x] Design System and Visual Style ← **Milestone 4 Approved**  
- [ ] Authentication (implementation — await authorization)  
- [ ] Database  
- [ ] Customer Module  
- [ ] Quote Module  
- [ ] PDF Generator  
- [ ] Dashboard  
- [ ] Deployment  

---

## 25. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-06 | Foundation + private GitHub repo | Clean baseline |
| 2026-08-06 | Spec is primary reference / V1 Approved | Prevent building without agreement |
| 2026-08-06 | Target users, customers, quotes, lines, statuses, dashboard, settings, PDF, permissions | Complete V1 product definition |
| 2026-08-06 | Demo: Project X Mechanical Services; seed 10/15/15 | Instant realistic demos |
| 2026-08-06 | Hard out-of-scope list + success criteria | Prevent feature creep |
| 2026-08-06 | Next milestone = UI/UX Planning, not code | Design before build |
| 2026-08-06 | UI/UX Planning complete; next = Design System | Visual tokens before application code |
| 2026-08-06 | Design System Approved (deep blue primary, Inter, standardized tables/motion) | Visual standard before implementation |

---

## 26. Next Steps

1. Design System is **Milestone 4 Approved**.  
2. Await explicit authorization before any implementation milestone.  
3. Implement one milestone at a time against the Product Spec, wireframes, and Design System.  
4. Any product, UX, or visual change requires an explicit change request to the relevant docs.  

---

## Spec progress checklist

- [x] Target business and users  
- [x] Customer information  
- [x] Quote information  
- [x] Quote line items and calculations  
- [x] Quote statuses and workflow  
- [x] Dashboard  
- [x] Company settings  
- [x] PDF output  
- [x] Permissions and admin access  
- [x] Demo data and limitations  
- [x] **Version 1 Product Specification — Approved**  
