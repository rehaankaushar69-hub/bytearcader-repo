# Changelog

All notable changes to **ByteArcadeR RepoGuard** (`bytearcader-repo`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-10

### Added
- **GitHub Repository Analyzer**: Full-stack Express + React integration with real GitHub REST API v3 endpoints, input validation, 10000ms timeouts, rate-limit tracking, and 300-second in-memory TTL caching.
- **Deterministic 100-Point Health Scoring Engine (`src/lib/analyzer.ts`)**: Weighted scoring across README Quality (25), License (15), Community Health (20), Repository Activity (20), Documentation (10), and Structure (10) with itemized deduction explanations.
- **Four Logical Check Verification States (`PASS`, `FAIL`, `NOT_VERIFIED`, `NOT_APPLICABLE`)**:
  - Documented `scoringRule` and concrete `evidence` array for all 22 checks.
  - Fair denominator adjustment (`applicableMaxScore`) when a verified README contains zero links (`docs-links` marked `NOT_APPLICABLE` instead of penalizing with `0/6`).
  - Zero points awarded for `NOT_VERIFIED` checks to prevent false positives.
- **Audit Provenance Metadata**: Every report embeds an ISO-8601 `analyzedAt` timestamp and the inspected Git `commitSha` (`repository.headCommitSha`) across the UI, printable report, and JSON export.
- **10 Specialized Audit Modules**:
  - README Quality Checker
  - License Detector (OSI-approved SPDX validation)
  - Contribution Guidelines Checker (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, Issue/PR templates)
  - Security Policy Checker (`SECURITY.md` and root anti-pattern detection)
  - GitHub Activity Analyzer (commit velocity, recency, open issues)
  - Repository Structure Analyzer (`.gitignore`, CI workflows, manifests, `src/` layout)
  - Broken Documentation Link Checker (relative repository tree verification & HTTP checks with retry + TTL cache)
  - Prioritized Improvement Recommendations
- **Interactive Dashboard & Reporting**: Recharts category and commit velocity visualizations, category filtering, downloadable JSON audit reports, and print-ready report styling.
- **7 Application Pages**: Landing Page, Repository Analysis Dashboard, Features Page, Documentation Page, Open Source Contribution Page, About ByteArcadeR AI, and Privacy Policy.
- **Open Source Governance & CI Suite**: `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/workflows/ci.yml`, Issue templates, Pull Request template, and automated test suites (`node:test` and `vitest`).

