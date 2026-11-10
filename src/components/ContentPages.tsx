import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCheck2,
  FolderTree,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Link2Off,
  Lock,
  Scale,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { RepoGuardLogoMark } from './Logo';
import { AppPage } from './Navbar';

interface PageActionProps {
  onNavigate: (page: AppPage) => void;
  onInspectRepo?: (repo: string) => void;
}

export const FeaturesPage: React.FC<PageActionProps> = ({ onNavigate, onInspectRepo }) => {
  const modules = [
    {
      num: '01.',
      name: 'GitHub Repository Analyzer',
      weight: 'Core Engine',
      icon: Search,
      mechanism:
        'Connects via server-side proxy to GitHub REST API v3 (/repos/:owner/:repo, /contents, /readme, /commits, /issues) with strict URL validation, 10000ms request timeouts, and 300s in-memory TTL caching.',
      outcome:
        'Provides instant visibility into repository stars, forks, open issues, primary language, topics, and branch governance without requiring personal access tokens for public repositories.',
    },
    {
      num: '02.',
      name: 'Repository Health Score (0–100)',
      weight: '100 Points Total',
      icon: CheckCircle2,
      mechanism:
        'Aggregates six deterministic categories: README Quality (25), License (15), Community Health (20), Repository Activity (20), Documentation (10), and Structure (10).',
      outcome:
        'Replaces subjective guesswork with an auditable scorecard where every single point awarded or deducted is itemized and explained.',
    },
    {
      num: '03.',
      name: 'README Quality Checker',
      weight: '25 Points',
      icon: BookOpen,
      mechanism:
        'Parses root README content to measure character and word depth (800+ char threshold), Markdown heading hierarchy, fenced code blocks, installation instructions, usage examples, and visual/governance references.',
      outcome:
        'Ensures first-time visitors and contributors can install, run, and understand the project within minutes.',
    },
    {
      num: '04.',
      name: 'License Detector',
      weight: '15 Points',
      icon: Scale,
      mechanism:
        'Verifies both root LICENSE files and GitHub SPDX metadata against OSI-approved open-source licenses (MIT, Apache-2.0, GPL-3.0, BSD-3-Clause, MPL-2.0, ISC, etc.).',
      outcome:
        'Prevents legal ambiguity so external developers and organizations can safely adopt or contribute to the codebase.',
    },
    {
      num: '05.',
      name: 'Contribution Guidelines Checker',
      weight: '14 Points (Community)',
      icon: FileCheck2,
      mechanism:
        'Inspects root, .github/, and docs/ directories for CONTRIBUTING.md (6 pts), CODE_OF_CONDUCT.md (4 pts), Issue Templates, and Pull Request Templates (4 pts).',
      outcome:
        'Lowers friction for external open-source contributors and standardizes bug reports and pull requests.',
    },
    {
      num: '06.',
      name: 'Security Policy Checker',
      weight: '6 Points (Community) + Hygiene',
      icon: ShieldAlert,
      mechanism:
        'Checks for SECURITY.md vulnerability disclosure documentation and scans the root directory for accidentally committed .env files, private keys, or node_modules.',
      outcome:
        'Protects maintainers and users by establishing clear private reporting channels and preventing credential leaks.',
    },
    {
      num: '07.',
      name: 'GitHub Activity Analyzer',
      weight: '20 Points',
      icon: GitCommit,
      mechanism:
        'Evaluates archive/disabled status (5 pts), days since last push (8 pts), recent commit cadence (4 pts), and repository summary & topic discoverability (3 pts).',
      outcome:
        'Distinguishes actively maintained repositories from abandoned or unmaintained codebases.',
    },
    {
      num: '08.',
      name: 'Repository Structure Analyzer',
      weight: '10 Points',
      icon: FolderTree,
      mechanism:
        'Audits root directory contents for .gitignore (3 pts), automated CI/CD workflows under .github/workflows (3 pts), standard package manifests & modular src/ directories (2 pts), and clean root trees (2 pts).',
      outcome:
        'Verifies engineering discipline, continuous integration readiness, and clean repository layout.',
    },
    {
      num: '09.',
      name: 'Broken Documentation Link Checker',
      weight: '10 Points (Documentation)',
      icon: Link2Off,
      mechanism:
        'Extracts Markdown links outside fenced code blocks, resolves relative repository paths against the live repository directory tree, and performs bounded HTTP HEAD verification on external links.',
      outcome:
        'Catches dead links to moved files, missing docs, or broken URLs before users hit 404 errors.',
    },
    {
      num: '10.',
      name: 'Improvement Recommendations & Exports',
      weight: 'Actionable Output',
      icon: Sparkles,
      mechanism:
        'Ranks failed checks by priority and point recovery potential, and formats complete findings into downloadable JSON reports and print-ready audit sheets.',
      outcome:
        'Gives engineering teams a concrete roadmap to reach 100/100 open-source readiness.',
    },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-medium text-cyan-400">
          ByteArcadeR RepoGuard · Functional Architecture
        </p>
        <h1
          className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Ten Deterministic Modules Built for Open Source Excellence
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Every module in ByteArcadeR RepoGuard is engineered to inspect real GitHub repository
          state and translate findings into clear, deterministic engineering feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.num}
              className="bg-[#11192E] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-cyan-400 tabular-nums">
                    {m.num} {m.name}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">{m.weight}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5 text-cyan-300 shrink-0" />
                  <h2 className="font-display text-lg font-bold text-white">{m.name}</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">Mechanism: </strong>
                  {m.mechanism}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-cyan-300">Engineering Outcome: </strong>
                  {m.outcome}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#11192E] border border-slate-800 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-white">
            Test All 10 Modules Live on the Dashboard
          </h3>
          <p className="text-xs text-slate-300">
            Run a live audit on any public GitHub repository or inspect{' '}
            <code className="text-cyan-300 font-mono">bytearcader-ai/bytearcader-repo</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          {onInspectRepo && (
            <button
              type="button"
              onClick={() => onInspectRepo('bytearcader-ai/bytearcader-repo')}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Audit bytearcader-repo
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="px-5 py-2.5 bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Read Technical Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export const DocumentationPage: React.FC<PageActionProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1120px] mx-auto px-6 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-medium text-cyan-400">
          Developer Reference & API Guide
        </p>
        <h1
          className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          ByteArcadeR RepoGuard Documentation
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          Complete guide to installing, configuring, testing, and integrating ByteArcadeR RepoGuard
          (`bytearcader-repo`) in local or production environments.
        </p>
      </div>

      {/* 1. Installation & Local Setup */}
      <section className="bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-xl font-bold text-white">
            01. Installation & Local Development
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          ByteArcadeR RepoGuard uses a unified Node.js + Express backend with a React + TypeScript +
          Tailwind CSS frontend served on port 3000.
        </p>
        <pre className="bg-[#0B1120] border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`# 1. Clone your fork of bytearcader-repo
git clone https://github.com/<your-github-username>/bytearcader-repo.git
cd bytearcader-repo

# 2. Install dependencies
npm install

# 3. Copy environment template (optional GITHUB_TOKEN increases rate limit to 5,000/hr)
cp .env.example .env

# 4. Start full-stack development server on http://localhost:3000
npm run dev

# 5. Run automated unit & integration tests
npm test`}
        </pre>
      </section>

      {/* 2. REST API Endpoints */}
      <section className="bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-xl font-bold text-white">
            02. Server REST API Endpoints
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <code className="font-mono text-sm font-semibold text-cyan-300">
                GET /api/analyze?repo=&lt;owner/repo&gt;&amp;refresh=&lt;boolean&gt;
              </code>
              <span className="text-xs text-slate-400 font-mono">Also supports POST /api/analyze</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Validates the repository identifier, queries GitHub REST API endpoints for repository
              metadata, root directory tree, README content, license, recent commits, open issues,
              and community health files, and returns a deterministic <code className="text-cyan-300">AnalysisReport</code> JSON object.
            </p>
            <pre className="bg-[#11192E] border border-slate-800 rounded p-3 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -s "http://localhost:3000/api/analyze?repo=vitejs/vite" | jq '{
  fullName: .repository.fullName,
  overallScore: .overallScore,
  grade: .grade,
  deductionsCount: (.deductions | length)
}'`}
            </pre>
          </div>

          <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-5 space-y-2">
            <code className="font-mono text-sm font-semibold text-cyan-300">
              GET /api/health
            </code>
            <p className="text-xs text-slate-300">
              Returns service uptime status, version identifier, organization metadata (`ByteArcadeR AI`),
              and active cache entry count.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Scoring Matrix Specification */}
      <section className="bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <h2 className="font-display text-xl font-bold text-white">
          03. Deterministic Scoring Specification (100 Points)
        </h2>
        <p className="text-sm text-slate-300">
          Scores are calculated in <code className="text-cyan-300 font-mono">src/lib/analyzer.ts</code>{' '}
          using pure, unit-tested functions:
        </p>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-white">README Quality (25 pts):</strong> Root file present (5 pts),
            character length ≥ 800 (5 pts; 300–799 earns 2 pts), ≥ 3 Markdown section headings (4 pts;
            1–2 headings earns 2 pts), Installation/Setup instructions (4 pts), Usage examples/code
            blocks (4 pts), Visuals/badges or License/Contributing references (3 pts).
          </li>
          <li>
            <strong className="text-white">License (15 pts):</strong> Root LICENSE file or GitHub
            license object present (10 pts), OSI-approved standard SPDX identifier detected (5 pts).
          </li>
          <li>
            <strong className="text-white">Community Health (20 pts):</strong> CONTRIBUTING.md present
            (6 pts), SECURITY.md present (6 pts), CODE_OF_CONDUCT.md present (4 pts), Issue &amp; PR
            templates in <code className="font-mono">.github/</code> (4 pts; 2 pts for partial).
          </li>
          <li>
            <strong className="text-white">Repository Activity (20 pts):</strong> Repository unarchived
            and enabled (5 pts), last push recency ≤ 30 days (8 pts; ≤ 90d: 6 pts; ≤ 180d: 4 pts;
            ≤ 365d: 2 pts), ≥ 10 commits in sample (4 pts; 3–9 commits: 2 pts), description and
            discoverability topics configured (3 pts).
          </li>
          <li>
            <strong className="text-white">Documentation (10 pts):</strong> Zero broken links in
            README (6 pts; 1–2 broken links: 3 pts), CHANGELOG.md and docs/ directory or homepage
            present (4 pts; 2 pts for one).
          </li>
          <li>
            <strong className="text-white">Repository Structure (10 pts):</strong> Root{' '}
            <code className="font-mono">.gitignore</code> present (3 pts), automated CI workflow
            configuration (3 pts), package manifest or <code className="font-mono">src/</code>{' '}
            directory (2 pts), zero committed <code className="font-mono">.env</code> or{' '}
            <code className="font-mono">node_modules</code> in root (2 pts).
          </li>
        </ul>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onNavigate('contribute')}
          className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <span>View Open Source Contribution Guide</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ContributePage: React.FC<PageActionProps> = ({ onInspectRepo }) => {
  return (
    <div className="max-w-[1120px] mx-auto px-6 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-medium text-cyan-400">
          Open Source Governance · Repository: bytearcader-repo
        </p>
        <h1
          className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Contribute to ByteArcadeR RepoGuard
        </h1>
        <p className="text-base text-slate-300 leading-relaxed">
          ByteArcadeR RepoGuard is an open-source developer tool maintained by ByteArcadeR AI under
          the MIT License. We welcome pull requests, bug reports, scoring rubric enhancements, and
          documentation improvements from developers worldwide.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-3">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-base font-bold text-white">
            01. Fork &amp; Clone bytearcader-repo
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fork the <code className="text-cyan-300 font-mono">bytearcader-repo</code> repository under
            your authenticated GitHub account and create a feature branch from <code className="font-mono">main</code>.
          </p>
        </div>

        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-3">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-base font-bold text-white">
            02. Run Tests &amp; Type Checks
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Verify all changes with <code className="text-cyan-300 font-mono">npm run lint</code>,{' '}
            <code className="text-cyan-300 font-mono">npm test</code>, and{' '}
            <code className="text-cyan-300 font-mono">npm run build</code> before opening a pull request.
          </p>
        </div>

        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-3">
          <GitPullRequest className="w-5 h-5 text-cyan-400" />
          <h2 className="font-display text-base font-bold text-white">
            03. Submit a Pull Request
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Complete the Pull Request checklist in{' '}
            <code className="text-cyan-300 font-mono">.github/PULL_REQUEST_TEMPLATE.md</code> so
            automated GitHub Actions CI can validate your contribution.
          </p>
        </div>
      </div>

      {/* Included Open Source Governance Files */}
      <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4">
        <h2 className="font-display text-xl font-bold text-white">
          Repository Governance &amp; Community Files Included in bytearcader-repo
        </h2>
        <p className="text-xs text-slate-400">
          This project practices what it audits—every community health and CI file is included in
          the repository tree:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { path: 'README.md', desc: 'Architecture, setup, API & usage docs' },
            { path: 'LICENSE', desc: 'Standard MIT Open Source License' },
            { path: 'CONTRIBUTING.md', desc: 'Contributor workflow & coding standards' },
            { path: 'CODE_OF_CONDUCT.md', desc: 'Contributor Covenant v2.1 standards' },
            { path: 'SECURITY.md', desc: 'Vulnerability disclosure policy' },
            { path: 'CHANGELOG.md', desc: 'Release history following Keep a Changelog' },
            { path: '.github/workflows/ci.yml', desc: 'Automated lint, test & build pipeline' },
            { path: '.github/ISSUE_TEMPLATE/', desc: 'Structured bug & feature templates' },
            { path: '.github/PULL_REQUEST_TEMPLATE.md', desc: 'Standardized PR verification checklist' },
          ].map((file) => (
            <div
              key={file.path}
              className="bg-[#0B1120] border border-slate-800 rounded-lg p-3.5 space-y-1"
            >
              <div className="text-cyan-300 font-semibold">{file.path}</div>
              <div className="text-slate-400 font-sans">{file.desc}</div>
            </div>
          ))}
        </div>

        {onInspectRepo && (
          <div className="pt-4">
            <button
              type="button"
              onClick={() => onInspectRepo('bytearcader-ai/bytearcader-repo')}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Run Self-Audit on bytearcader-repo Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AboutPage: React.FC<PageActionProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1120px] mx-auto px-6 py-12 space-y-12">
      <div className="flex items-center gap-3">
        <RepoGuardLogoMark size={40} />
        <div>
          <p className="text-xs font-medium text-cyan-400">Organization Profile</p>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            About ByteArcadeR AI
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8 space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="font-display text-xl font-bold text-white">
            Engineering Transparent, Deterministic Developer Tools
          </h2>
          <p>
            <strong className="text-white">ByteArcadeR AI</strong> develops open-source engineering
            quality and security tooling designed to help software teams maintain resilient,
            well-documented, and contributor-friendly codebases.
          </p>
          <p>
            We built <strong className="text-cyan-300">ByteArcadeR RepoGuard</strong> (`bytearcader-repo`)
            around a core engineering principle: repository health scoring should be 100%
            deterministic, reproducible, and transparent. Instead of opaque scores or arbitrary
            heuristics, RepoGuard inspects verifiable repository artifacts—README structure, SPDX
            licensing, security disclosure policies, documentation links, and CI pipelines—and
            explains every single deduction.
          </p>
          <p>
            Every check performed by ByteArcadeR RepoGuard is read-only and static. Analyzed
            repositories are never cloned onto execution runners or executed, eliminating remote
            code execution risks during repository auditing.
          </p>
        </div>

        <div className="lg:col-span-4 bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-white">
            Product &amp; Governance Facts
          </h3>
          <div className="space-y-3 text-xs border-t border-slate-800 pt-3">
            <div>
              <div className="text-slate-400">Product Name</div>
              <div className="text-white font-semibold mt-0.5">ByteArcadeR RepoGuard</div>
            </div>
            <div>
              <div className="text-slate-400">Maintainer Organization</div>
              <div className="text-white font-semibold mt-0.5">ByteArcadeR AI</div>
            </div>
            <div>
              <div className="text-slate-400">Tagline</div>
              <div className="text-cyan-300 font-medium mt-0.5">
                Protect Your Code. Improve Your Repository.
              </div>
            </div>
            <div>
              <div className="text-slate-400">GitHub Repository Name</div>
              <div className="font-mono text-white mt-0.5">bytearcader-repo</div>
            </div>
            <div>
              <div className="text-slate-400">Open Source License</div>
              <div className="font-mono text-white mt-0.5">MIT License (OSI Approved)</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="w-full px-4 py-2.5 bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Read Security &amp; Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC<PageActionProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1120px] mx-auto px-6 py-12 space-y-10">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-400">
          ByteArcadeR AI · Data Handling &amp; Security Guarantees
        </p>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">
          Privacy Policy &amp; Security Architecture
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Effective Date: November 2026 · Applies to ByteArcadeR RepoGuard (`bytearcader-repo`)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <h2>1. Public GitHub Metadata Inspection Only</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ByteArcadeR RepoGuard inspects publicly accessible GitHub repository metadata, file
            trees, README documentation, commits, and open issues via the official GitHub REST API.
            We never request write permissions to your repositories.
          </p>
        </div>

        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <Lock className="w-4 h-4" />
            <h2>2. Zero Arbitrary Code Execution</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Analyzed repositories are never cloned, built, or executed. All checks operate strictly
            on static JSON metadata and plain-text Markdown content returned by GitHub’s REST API.
          </p>
        </div>

        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <Server className="w-4 h-4" />
            <h2>3. Server-Side Credential Isolation</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Optional <code className="font-mono text-cyan-300">GITHUB_TOKEN</code> environment
            variables used to increase API rate limits are stored and used strictly on the Node.js
            backend server and are never exposed in client-side bundles or browser network responses.
          </p>
        </div>

        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <FileCheck2 className="w-4 h-4" />
            <h2>4. Ephemeral In-Memory Caching</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To protect unauthenticated GitHub API rate limits, analysis results are cached in
            volatile server memory for 300 seconds (5 minutes) by default (configurable via{' '}
            <code className="font-mono text-cyan-300">CACHE_TTL_SECONDS</code>). No personal user
            analytics, cookies, or tracking pixels are used.
          </p>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="px-5 py-2.5 bg-[#11192E] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};
