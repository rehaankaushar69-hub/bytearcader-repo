# ByteArcadeR RepoGuard — Architecture Guide

**Product**: ByteArcadeR RepoGuard (`bytearcader-repo`)  
**Organization**: ByteArcadeR AI

---

## 1. System Overview

ByteArcadeR RepoGuard is structured into three cleanly separated layers:

1. **Pure Deterministic Analyzer (`src/lib/analyzer.ts`)**
   - Contains zero DOM or network dependencies so it can be unit-tested in milliseconds.
   - Implements `parseGitHubRepoInput()`, `analyzeReadmeContent()`, `extractAndCheckReadmeLinks()`, and `buildRepositoryAnalysisReport()`.
2. **Backend Proxy & Cache (`server.ts`)**
   - Express server handling `/api/analyze` and `/api/health`.
   - Fetches repository details, root tree, `.github/` tree, `.github/workflows` tree, `docs/` tree, `README`, recent commits, and open issues in parallel via `Promise.allSettled`.
   - Enforces `AbortController` timeouts (`GITHUB_TIMEOUT_MS`), extracts GitHub rate-limit headers, and caches reports in memory (`CACHE_TTL_SECONDS`).
3. **React + TypeScript Dashboard (`src/components/`)**
   - Renders the 7 application views, Recharts visualizations, deduction ledger, module deep-dives, JSON export, and print stylesheet.
