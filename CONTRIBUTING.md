# Contributing to ByteArcadeR RepoGuard

Thank you for your interest in contributing to **ByteArcadeR RepoGuard** (`bytearcader-repo`), developed and maintained by **ByteArcadeR AI**.

We welcome bug reports, new deterministic repository checks, documentation improvements, and UI accessibility enhancements.

---

## 1. Getting Started

1. Fork the `bytearcader-repo` repository using your authenticated GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/bytearcader-repo.git
   cd bytearcader-repo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a local `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

---

## 2. Development & Architecture Guidelines

- **Deterministic Scoring Only**: All health score calculations in `src/lib/analyzer.ts` must be 100% deterministic and reproducible. Every deduction must provide a clear human-readable `deductionReason` and `recommendation`.
- **Zero Code Execution**: Never execute, evaluate, or dynamically import code from analyzed repositories. All checks must operate strictly on static GitHub REST API responses.
- **No Frontend Secrets**: Never expose `GITHUB_TOKEN` or any API secret in client-side code.
- **Accessibility**: Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<form>`, labeled `<input>`) and maintain keyboard focus visibility.

---

## 3. Quality Gate & Testing

Before opening a Pull Request, ensure all checks pass locally:

```bash
# 1. TypeScript type checking
npm run lint

# 2. Automated test suites
npm test
npm run test:node

# 3. Production build verification
npm run build
```

---

## 4. Submitting a Pull Request

1. Create a descriptive branch (`feat/add-package-lock-check` or `fix/readme-link-parser`).
2. Commit your changes using clear, atomic commit messages following Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `ci:`).
3. Fill out all sections of `.github/PULL_REQUEST_TEMPLATE.md`.
4. Ensure the GitHub Actions CI workflow (`.github/workflows/ci.yml`) passes on your branch.

By contributing to `bytearcader-repo`, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
