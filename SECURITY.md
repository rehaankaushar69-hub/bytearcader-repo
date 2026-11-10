# Security Policy — ByteArcadeR RepoGuard

**Product**: ByteArcadeR RepoGuard (`bytearcader-repo`)  
**Maintainer**: ByteArcadeR AI

---

## Supported Versions

The following versions of ByteArcadeR RepoGuard receive active security updates:

| Version | Supported |
| :--- | :--- |
| `1.0.x` (`main`) | Yes |
| `< 1.0.0` | No |

---

## Security Architecture Principles

ByteArcadeR RepoGuard is designed with strict security boundaries:

1. **Zero Arbitrary Code Execution**: Analyzed GitHub repositories are never cloned, built, or executed. All checks operate strictly on JSON metadata and plain-text Markdown retrieved from GitHub's REST API.
2. **Input Sanitization & Host Whitelisting**: `parseGitHubRepoInput()` strictly validates that repository URLs belong to `github.com` and match valid `owner/repo` character patterns before making upstream requests.
3. **Server-Side Token Isolation**: Optional `GITHUB_TOKEN` credentials remain exclusively on the Node.js backend (`server.ts`) and are never transmitted to the browser.
4. **Bounded Upstream Requests**: All upstream `fetch` calls use `AbortController` timeouts (`GITHUB_TIMEOUT_MS`, default 10000ms) to prevent resource exhaustion.

---

## Reporting a Vulnerability

If you discover a security vulnerability in ByteArcadeR RepoGuard, please **do not open a public GitHub issue**.

Instead, please report it privately using one of the following methods:

1. **GitHub Private Vulnerability Reporting**: Navigate to the **Security** tab of the `bytearcader-repo` repository on GitHub and click **Report a vulnerability** to open a private security advisory.
2. **Include in Your Report**:
   - A clear description of the vulnerability and affected component (`server.ts`, `src/lib/analyzer.ts`, etc.).
   - Step-by-step reproduction instructions or a proof-of-concept request.
   - Potential impact and any suggested remediation.

We aim to acknowledge receipt of all vulnerability reports within 48 hours and provide a remediation timeline within 7 days.
