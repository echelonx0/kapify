# 🧾 Kapify Changelog

This document tracks key updates, new features, and fixes across Kapify releases.

---

## [2.7.8] - 2025-11-07

**Environment:** Production  
**Commit:** `7c24626`  
**Build Number:** 1

### ✨ Added

- Completed **invitation system integration** on the front end (emails pending and acceptance flow testing required).
- Initial scaffolding of **billing/credit system** into user settings.
- Integrated **credit system with Stripe**, tested successfully in test mode.
- Added **opportunities and applications navigation** to the funder sidenav.
- **Comma formatting** added to assets under management in user settings.

### 🐛 Fixed

- Minor UI fixes related to asset display formatting.

### 🧰 Internal

- Created `CREDIT_SYSTEM.md` documentation.
- Added `credit.service.ts` for handling credit-related logic.
- Added billing components: `billing-credits.component`, `purchase-credits-modal.component`, and `stripe.service.ts`.
- Refactored some services and removed `auth.service.ts` due to new credit system integration.
- Updated AI Assistant component scaffolding (`ai-assistant.component.html`).

---

## [2.7.7] - 2025-11-04

**Environment:** Production  
**Commit:** `47e3be3`  
**Build Number:** 2

### ✨ Added

- Introduced new **FundingApplication model** (`src/app/SMEs/applications/new-application/models/funding-application.model.ts`).

### 🐛 Fixed

- **Resolved recursive fetching errors** that prevented progress in the opportunity application process.
- Improved **stability of the application flow** by cleaning redundant recursive calls.

### 🧰 Internal

- Refactored application logic for clarity and maintainability.
- Updated related services and components to align with the new data model.

---

## [2.7.6] - 2025-11-04

**Environment:** Production  
**Commit:** `a8a6481`  
**Build Number:** 1

### ✨ Added

- Smart Suggestions component now supports **descriptive summaries**.
- Added **description field** to marketplace opportunities.
- Landing Header now **reacts dynamically** to user authentication state.
- Introduced centralized **VersionService** to manage version/build metadata.

### 🔧 Fixed

- **Removed data room** from founder side to simplify UX.
- Fixed **alignment of CTA buttons** in the header when user is authenticated.
- Fixed **display of requested amount** in application summaries.

### 🧰 Internal

- Added `src/app/landing/landing-header.component.html` for template separation.
- Linked commit metadata to `VersionService` for build traceability.

---

## 🧭 Roadmap

| Feature                                                                                                                        | Status         | Target Version |
| ------------------------------------------------------------------------------------------------------------------------------ | -------------- | -------------- |
| Fix the import flow broken by type update                                                                                      | 🚧 In Progress | 2.7.9          |
| Test and integrate the withdraw application feature                                                                            | 🚧 In Progress | 2.7.9          |
| Rearrange the founder management dashboard                                                                                     | 🚧 In Progress | 2.8.0          |
| Integrate the "Invite Teammates" feature                                                                                       | 🚧 In Progress | 2.8.0          |
| Complete testing of the email infrastructure                                                                                   | 🗓 Planned      | 2.8.1          |
| Enable direct upload of organization media assets (e.g., logo)                                                                 | 🗓 Planned      | 2.8.1          |
| Enable Credit system                                                                                                           | 🗓 Planned      | 2.8.1          |
| Balance sheet and Cashflow statement are not integrated in financial profile. The import template should have these fields too | 🗓 Planned      | 2.8.1          |

---

## 🏗 Versioning Policy

Kapify follows **Semantic Versioning (SemVer)**:
