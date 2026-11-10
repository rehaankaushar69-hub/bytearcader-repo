import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Code2,
  FileCheck2,
  FolderTree,
  GitCommit,
  Link2Off,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { parseGitHubRepoInput } from '../lib/analyzer';
import { RepoGuardLogoMark } from './Logo';
import { AppPage } from './Navbar';

interface LandingPageProps {
  repoInput: string;
  setRepoInput: (val: string) => void;
  onAnalyze: (repoIdentifier: string) => void;
  onRunDemo: () => void;
  isLoading: boolean;
  error: string | null;
  onNavigate: (page: AppPage) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const SAMPLE_REPOS = [
  { label: 'vitejs/vite', description: 'Third-party public repo (Frontend tooling)' },
  { label: 'expressjs/express', description: 'Third-party public repo (Node.js framework)' },
  { label: 'facebook/react', description: 'Third-party public repo (UI library)' },
];

const SCORING_WEIGHTS = [
  {
    category: 'README Quality',
    points: 25,
    criteria: 'Root presence (5), character depth 800+ (5), section structure (4), installation guide (4), usage code blocks (4), governance/visual references (3).',
  },
  {
    category: 'Community Health',
    points: 20,
    criteria: 'CONTRIBUTING.md guidelines (6), SECURITY.md vulnerability policy (6), CODE_OF_CONDUCT.md standards (4), Issue & PR templates (4).',
  },
  {
    category: 'Repository Activity',
    points: 20,
    criteria: 'Unarchived maintenance state (5), recent push velocity within 30–365 days (8), commit history depth (4), repository description & topics (3).',
  },
  {
    category: 'License Compliance',
    points: 15,
    criteria: 'Root LICENSE file or GitHub license metadata present (10), recognized OSI-approved SPDX identifier such as MIT or Apache-2.0 (5).',
  },
  {
    category: 'Documentation & Links',
    points: 10,
    criteria: 'Zero broken relative paths or dead HTTP documentation links in README (6), CHANGELOG.md and docs/ directory or homepage coverage (4).',
  },
  {
    category: 'Repository Structure',
    points: 10,
    criteria: 'Root .gitignore hygiene (3), automated CI/CD workflow files (3), standard package manifest & modular src/ layout (2), zero committed .env/node_modules (2).',
  },
];

const TEN_MODULES = [
  {
    num: '01.',
    title: 'GitHub Repository Analyzer',
    summary: 'Connects directly to GitHub REST API v3 endpoints to inspect repository metadata, branch configurations, stars, forks, watchers, and root trees without executing untrusted code.',
    span: 'md:col-span-2',
    icon: Search,
  },
  {
    num: '02.',
    title: 'Deterministic Health Score (0–100)',
    summary: 'Computes an auditable 100-point score across six weighted categories with explicit line-item explanations for every point awarded or deducted.',
    span: 'md:col-span-1',
    icon: CheckCircle2,
  },
  {
    num: '03.',
    title: 'README Quality Checker',
    summary: 'Evaluates Markdown structure, character and word depth, fenced code blocks, installation instructions, usage examples, and visual documentation.',
    span: 'md:col-span-1',
    icon: BookOpen,
  },
  {
    num: '04.',
    title: 'License Detector',
    summary: 'Detects root LICENSE files and verifies SPDX identifiers against OSI-approved open-source licenses so downstream consumers understand legal rights.',
    span: 'md:col-span-1',
    icon: Scale,
  },
  {
    num: '05.',
    title: 'Contribution Guidelines Checker',
    summary: 'Audits root, .github/, and docs/ directories for CONTRIBUTING.md, CODE_OF_CONDUCT.md, Issue templates, and Pull Request templates.',
    span: 'md:col-span-1',
    icon: FileCheck2,
  },
  {
    num: '06.',
    title: 'Security Policy Checker',
    summary: 'Checks for SECURITY.md disclosure policies and scans root trees for accidentally committed .env files, private keys, or node_modules.',
    span: 'md:col-span-2',
    icon: ShieldAlert,
  },
  {
    num: '07.',
    title: 'GitHub Activity Analyzer',
    summary: 'Inspects recent commit velocity, days since last push, commit cadence across recent weeks, open issue queues, and archive status.',
    span: 'md:col-span-1',
    icon: GitCommit,
  },
  {
    num: '08.',
    title: 'Repository Structure Analyzer',
    summary: 'Verifies .gitignore hygiene, GitHub Actions CI workflows, package manifests (package.json, Cargo.toml, pyproject.toml), and modular source folders.',
    span: 'md:col-span-1',
    icon: FolderTree,
  },
  {
    num: '09.',
    title: 'Broken Documentation Link Checker',
    summary: 'Extracts relative file links and external HTTP/HTTPS links from README documentation and flags missing repository paths or unreachable targets.',
    span: 'md:col-span-1',
    icon: Link2Off,
  },
  {
    num: '10.',
    title: 'Improvement Recommendations',
    summary: 'Generates prioritized remediation checklists ordered by health score impact, complete with downloadable JSON and printable executive reports.',
    span: 'md:col-span-1',
    icon: Sparkles,
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  repoInput,
  setRepoInput,
  onAnalyze,
  onRunDemo,
  isLoading,
  error,
  onNavigate,
  inputRef,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = parseGitHubRepoInput(repoInput);
    if (!check.valid || !check.parsed) {
      setValidationError(check.error || 'Please enter a valid GitHub repository URL or owner/repo.');
      return;
    }
    setValidationError(null);
    onAnalyze(`${check.parsed.owner}/${check.parsed.repo}`);
  };

  const handleSelectSample = (sampleRepo: string) => {
    setValidationError(null);
    setRepoInput(sampleRepo);
    onAnalyze(sampleRepo);
  };

  const activeError = validationError || error;

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-10 md:pt-16 px-6">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-cyan-300/90 font-medium mb-4">
                <span>Developed by ByteArcadeR AI</span>
                <span aria-hidden="true">·</span>
                <span>Open Source Repository Intelligence</span>
                <span aria-hidden="true">·</span>
                <span>Read-Only Static Inspection</span>
              </div>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.12] mb-5"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Protect Your Code. Improve Your Repository.
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-[64ch]">
                ByteArcadeR RepoGuard audits any public GitHub repository against a transparent,
                deterministic 100-point engineering rubric. Evaluate README completeness, SPDX
                licensing, security disclosure policies, documentation links, and CI structure in
                seconds—without tokens or code execution.
              </p>
            </div>

            {/* Interactive Analyzer Form Card */}
            <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6">
              <form onSubmit={handleSubmit} noValidate aria-label="GitHub Repository Analyzer">
                <label
                  htmlFor="github-repo-input"
                  className="block text-sm font-medium text-slate-200 mb-2.5"
                >
                  GitHub Repository URL or <code className="text-cyan-300 font-mono">owner/repo</code>
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      ref={inputRef}
                      id="github-repo-input"
                      name="repo"
                      type="text"
                      value={repoInput}
                      onChange={(e) => {
                        setRepoInput(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="e.g. https://github.com/facebook/react or vitejs/vite"
                      className="w-full pl-10 pr-4 py-3 bg-[#0B1120] border border-slate-700/90 rounded-lg text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                      aria-invalid={Boolean(activeError)}
                      aria-describedby={activeError ? 'repo-input-error' : undefined}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{isLoading ? 'Analyzing Repository...' : 'Run Health Audit'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {activeError && (
                  <div
                    id="repo-input-error"
                    role="alert"
                    className="mt-3 flex items-start gap-2.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/70 rounded-lg px-3.5 py-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{activeError}</span>
                  </div>
                )}
              </form>

              {/* Quick Inspect Third-Party Public Presets + Separate DEMO Mode */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1">
                    Third-party public repos (live GitHub API):
                  </span>
                  {SAMPLE_REPOS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectSample(sample.label)}
                      title={sample.description}
                      className="px-3 py-1.5 text-xs font-mono text-slate-200 bg-[#0B1120] hover:bg-slate-800/90 hover:text-cyan-300 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={onRunDemo}
                  data-testid="landing-demo-mode-btn"
                  className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Offline Demo Mode (DEMO)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Deterministic Scoring Architecture Card */}
          <div className="lg:col-span-5 bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <RepoGuardLogoMark size={36} />
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      100-Point Audit Specification
                    </h2>
                    <p className="text-xs text-slate-400">
                      6 Categories · 22 Deterministic Checks
                    </p>
                  </div>
                </div>
                <span className="font-mono text-lg font-bold text-cyan-300 tabular-nums">
                  0–100
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {SCORING_WEIGHTS.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span>{item.category}</span>
                      <span className="font-mono text-cyan-300 tabular-nums">
                        {item.points} pts
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${(item.points / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Project Repository: bytearcader-repo</span>
              <button
                type="button"
                onClick={onRunDemo}
                className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Preview Offline Demo Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENT DETERMINISTIC SCORING SPECIFICATION */}
      <section className="px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs text-cyan-400 font-medium mb-2">
                Deterministic 100-Point Rubric
              </p>
              <h2
                className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Transparent Health Scoring Without Black-Box Heuristics
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              Every point is backed by a verifiable repository check. Every deduction includes
              an exact explanation and remediation steps.
            </p>
          </div>

          <div className="bg-[#11192E] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0D1526]">
                    <th className="py-3.5 px-5">Evaluation Category</th>
                    <th className="py-3.5 px-5 text-right">Max Weight</th>
                    <th className="py-3.5 px-5">Deterministic Verification Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {SCORING_WEIGHTS.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-white whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-cyan-300 font-semibold whitespace-nowrap">
                        {row.points} pts
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 text-xs md:text-sm leading-relaxed">
                        {row.criteria}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#0D1526] font-semibold text-white">
                    <td className="py-3.5 px-5">Total Repository Health Score</td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums text-cyan-300">
                      100 pts
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400 font-normal">
                      Computed strictly from real GitHub REST API payloads — zero fabricated metrics.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 10 FUNCTIONAL MODULES BENTO GRID */}
      <section className="px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs text-cyan-400 font-medium mb-2">
                Comprehensive Inspection Suite
              </p>
              <h2
                className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Ten Specialized Modules in One Unified Audit
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('features')}
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Explore full module specifications</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEN_MODULES.map((mod) => {
              const IconComponent = mod.icon;
              return (
                <div
                  key={mod.num}
                  className={`${mod.span} bg-[#11192E] border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-mono text-xs font-semibold text-cyan-400 tabular-nums">
                        {mod.num}
                      </span>
                      <IconComponent className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-white mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{mod.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE & OPEN SOURCE GOVERNANCE PROOF */}
      <section className="px-6">
        <div className="max-w-[1120px] mx-auto bg-[#11192E] border border-slate-800 rounded-xl p-8 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <RepoGuardLogoMark size={32} />
                <span className="text-xs font-medium text-cyan-300">
                  ByteArcadeR AI Open Source Initiative · Repository: bytearcader-repo
                </span>
              </div>
              <h2
                className="font-display text-2xl font-bold text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Built for Security-Conscious Maintainers and Contributors
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-[65ch]">
                ByteArcadeR RepoGuard operates strictly via read-only GitHub REST API inspection.
                It never clones or executes code from analyzed repositories, never exposes backend
                tokens to the browser, and ships under the permissive MIT License with full unit
                test coverage.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Zero Arbitrary Code Execution
                </span>
                <span aria-hidden="true">·</span>
                <span>Server-Side Proxy & Rate-Limit Caching</span>
                <span aria-hidden="true">·</span>
                <span>Exportable JSON & Printable Audit Reports</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSelectSample('vitejs/vite')}
                className="w-full px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded-lg transition-colors text-center whitespace-nowrap cursor-pointer"
              >
                Live Audit: vitejs/vite (Third-Party)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contribute')}
                className="w-full px-5 py-3 bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm rounded-lg transition-colors text-center whitespace-nowrap cursor-pointer"
              >
                View Contribution Guide
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
