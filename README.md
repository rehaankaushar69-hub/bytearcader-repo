# ByteArcadeR RepoGuard

**Protect Your Code. Improve Your Repository.**

Developed and maintained by **ByteArcadeR AI** · Repository: `bytearcader-repo`

![ByteArcadeR RepoGuard Architecture Overview](docs/repoguard-shield.svg)

**ByteArcadeR RepoGuard** is an open-source GitHub repository health, security governance, documentation, and structure analyzer. It audits public GitHub repositories via the official GitHub REST API against a transparent, deterministic 100-point rubric—explaining every point awarded and every deduction without executing untrusted repository code.

---

## Features (10 Core Functional Modules)

1. **GitHub Repository Analyzer**: Connects to GitHub REST API endpoints (`/repos/:owner/:repo`, `/contents`, `/readme`, `/commits`, `/issues`) with input validation, timeouts, rate-limit tracking, and in-memory TTL caching.
2. **Deterministic Repository Health Score (0–100)**: Evaluates repositories across six transparent categories and assigns a letter grade (`A+` to `F`) with an itemized deduction ledger.
3. **README Quality Checker**: Analyzes Markdown character/word depth, heading hierarchy, fenced code blocks, installation instructions, usage examples, and visual/governance references.
4. **License Detector**: Detects root `LICENSE` files and validates SPDX identifiers against OSI-approved open-source licenses (`MIT`, `Apache-2.0`, `GPL-3.0`, `BSD-3-Clause`, etc.).
5. **Contribution Guidelines Checker**: Audits root, `.github/`, and `docs/` directories for `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, Issue templates, and Pull Request templates.
6. **Security Policy Checker**: Verifies `SECURITY.md` vulnerability disclosure guidelines and checks the root directory for accidentally committed `.env` files, private keys, or `node_modules`.
7. **GitHub Activity Analyzer**: Evaluates archive status, days since last push, commit history cadence, open issue queues, and repository discoverability metadata.
8. **Repository Structure Analyzer**: Inspects `.gitignore` hygiene, GitHub Actions CI workflows (`.github/workflows`), package manifests (`package.json`, `Cargo.toml`, `pyproject.toml`), and modular source directories (`src/`, `lib/`).
9. **Broken Documentation Link Checker**: Extracts Markdown links outside fenced code blocks, validates relative repository paths against the live repository file tree, and checks external HTTP/HTTPS URLs.
10. **Improvement Recommendations & Report Exports**: Generates prioritized remediation steps ordered by point recovery impact, with one-click JSON report downloads and printable executive summaries.

---

## Deterministic 100-Point Health Scoring Rubric

| Category | Max Score | Verification Breakdown |
| :--- | :---: | :--- |
| **README Quality** | **25 pts** | Root file exists (5), character depth ≥ 800 (5), ≥ 3 section headings (4), installation guide (4), usage examples/code blocks (4), governance/visual references (3) |
| **License** | **15 pts** | License file or metadata present (10), OSI-approved SPDX identifier recognized (5) |
| **Community Health** | **20 pts** | `CONTRIBUTING.md` (6), `SECURITY.md` (6), `CODE_OF_CONDUCT.md` (4), Issue & PR templates (4) |
| **Repository Activity** | **20 pts** | Unarchived status (5), push recency ≤ 30 days (8), commit history depth ≥ 10 (4), description & topics (3) |
| **Documentation** | **10 pts** | Zero broken links in README (6), `CHANGELOG.md` and `docs/` or homepage present (4) |
| **Repository Structure** | **10 pts** | `.gitignore` present (3), automated CI workflow (3), package manifest & `src/` layout (2), clean root free of `.env`/`node_modules` (2) |
| **Total** | **100 pts** | Every deduction is explicitly documented in the audit report. |

### Four Distinct Check Verification States & Fair Normalization

Every one of the 22 rubric checks includes a documented `scoringRule`, concrete repository `evidence`, and one of four logically separate verification states:
- **`PASS`**: Verified against live repository evidence; awards full or partial rubric points.
- **`FAIL`**: Verified against live repository evidence and did not meet rubric criteria; creates an explicit deduction entry.
- **`NOT_VERIFIED`**: Could not be verified (e.g., transient API timeout or HTTP rate limit); awards `0` points and is never counted as a false positive.
- **`NOT_APPLICABLE`**: Genuinely does not apply to the repository (for example, `docs-links` when a verified README intentionally contains `0` links). Rather than penalizing a link-free README with `0/6`, the 6 points are excluded from `applicableMaxScore` (`94` applicable points) and `overallScore` is normalized fairly (`Math.round((rawScore / applicableMaxScore) * 100)`).

Every generated `AnalysisReport` also records an ISO-8601 `analyzedAt` audit timestamp and the exact Git `commitSha` (`repository.headCommitSha`) inspected.

---

## Architecture

ByteArcadeR RepoGuard uses a full-stack TypeScript architecture:

- **Frontend (`src/`)**: React 19, TypeScript, Tailwind CSS, Recharts, and Lucide React.
- **Core Analyzer Engine (`src/lib/analyzer.ts`)**: Pure, deterministic TypeScript functions for URL validation, Markdown link extraction, and 100-point rubric evaluation.
- **Backend Server (`server.ts`)**: Node.js + Express server mounting Vite middleware in development and serving static builds in production. Proxies requests to `https://api.github.com` with timeout guards (`AbortController`), rate-limit header extraction, and TTL caching.
- **Security Guarantee**: Analyzed repositories are inspected strictly via read-only REST API metadata. Repository code is never cloned or executed.

See [Architecture Documentation](docs/ARCHITECTURE.md) for detailed data-flow diagrams.

---

## Installation & Quick Start

### Prerequisites

- Node.js 20+ and npm

### Setup Commands

```bash
# 1. Clone the repository (use your authenticated GitHub account when publishing/forking)
git clone https://github.com/<your-github-username>/bytearcader-repo.git
cd bytearcader-repo

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the development server on http://localhost:3000
npm run dev
```

### Production Build & Automated Tests

```bash
# Typecheck the codebase
npm run lint

# Run automated unit tests (Vitest)
npm test

# Run Node native TypeScript test suite
npm run test:node

# Build client and server bundles for production
npm run build
```

---

## API Usage

### `GET /api/analyze`

Analyzes a public GitHub repository and returns a structured `AnalysisReport`.

```bash
curl -s "http://localhost:3000/api/analyze?repo=vitejs/vite"
```

Query Parameters:
- `repo` (required): GitHub repository URL (`https://github.com/owner/repo`) or `owner/repo` identifier.
- `refresh` (optional): Set `refresh=true` to bypass the server-side TTL cache.

### `GET /api/health`

Returns server health and cache status:

```bash
curl -s "http://localhost:3000/api/health"
```

---

## Screenshots & Interface Views

- **Landing Page**: Hero repository input with instant validation, quick-inspect presets, 100-point scoring matrix, and 10-module Bento showcase.
- **Repository Analysis Dashboard**: Displays repository metadata (owner, stars, forks, open issues, main language, last update), overall health score (0–100), Recharts category bar charts, commit velocity chart, itemized score deductions ledger, passed/failed check filters, 10-module deep-dive panels, downloadable JSON reports, and print layout.
- **Documentation & Governance Pages**: Dedicated views for Features, Technical Documentation, Open Source Contribution, About ByteArcadeR AI, and Privacy Policy.

---

## Contributing

Contributions from the open-source community are welcome! Please read our [Contribution Guidelines](CONTRIBUTING.md), [Code of Conduct](CODE_OF_CONDUCT.md), and [Security Policy](SECURITY.md) before submitting a pull request. See [Changelog](CHANGELOG.md) for release notes.

---

## License

Released under the [MIT License](LICENSE). Developed and maintained by **ByteArcadeR AI**.
