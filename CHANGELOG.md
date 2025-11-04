# 🧾 Kapify Changelog

This document tracks key updates, new features, and fixes across Kapify releases.

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

| Feature                                                        | Status         | Target Version |
| -------------------------------------------------------------- | -------------- | -------------- |
| Fix the import flow broken by type update                      | 🚧 In Progress | 2.7.7          |
| Test and integrate the withdraw application feature            | 🚧 In Progress | 2.7.7          |
| Rearrange the founder management dashboard                     | 🚧 In Progress | 2.8.0          |
| Integrate the "Invite Teammates" feature                       | 🗓 Planned      | 2.8.0          |
| Complete testing of the email infrastructure                   | 🗓 Planned      | 2.8.1          |
| Enable direct upload of organization media assets (e.g., logo) | 🗓 Planned      | 2.8.1          |

---

## 🏗 Versioning Policy

Kapify follows **Semantic Versioning (SemVer)**:
