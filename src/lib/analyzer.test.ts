import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRepositoryAnalysisReport,
  extractAndCheckReadmeLinks,
  parseGitHubRepoInput,
} from './analyzer';
import { RawGitHubAuditInput } from '../types/repoguard';

const ALL_22_CHECK_IDS = [
  'readme-exists',
  'readme-depth',
  'readme-structure',
  'readme-install',
  'readme-usage',
  'readme-references',
  'license-present',
  'license-spdx',
  'community-contributing',
  'community-security',
  'community-coc',
  'community-templates',
  'activity-status',
  'activity-recency',
  'activity-cadence',
  'activity-metadata',
  'docs-links',
  'docs-changelog',
  'structure-gitignore',
  'structure-ci',
  'structure-manifest',
  'structure-clean',
];

function createBaseInput(): RawGitHubAuditInput {
  const nowIso = '2026-11-07T00:00:00.000Z';
  return {
    nowIso,
    repo: {
      owner: { login: 'bytearcader-ai' },
      name: 'bytearcader-repo',
      full_name: 'bytearcader-ai/bytearcader-repo',
      html_url: 'https://github.com/bytearcader-ai/bytearcader-repo',
      description: 'Protect Your Code. Improve Your Repository. Deterministic GitHub analyzer.',
      homepage: 'https://github.com/bytearcader-ai/bytearcader-repo',
      default_branch: 'main',
      stargazers_count: 42,
      forks_count: 8,
      subscribers_count: 5,
      open_issues_count: 2,
      language: 'TypeScript',
      topics: ['github', 'security', 'analyzer'],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-11-06T00:00:00.000Z',
      pushed_at: '2026-11-06T00:00:00.000Z',
      size: 512,
      archived: false,
      disabled: false,
      visibility: 'public',
      license: {
        key: 'mit',
        name: 'MIT License',
        spdx_id: 'MIT',
        url: 'https://api.github.com/licenses/mit',
      },
    },
    rootContents: [
      { name: 'README.md', path: 'README.md', type: 'file', size: 2400 },
      { name: 'LICENSE', path: 'LICENSE', type: 'file', size: 1080 },
      { name: 'CONTRIBUTING.md', path: 'CONTRIBUTING.md', type: 'file', size: 1500 },
      { name: 'CODE_OF_CONDUCT.md', path: 'CODE_OF_CONDUCT.md', type: 'file', size: 1800 },
      { name: 'SECURITY.md', path: 'SECURITY.md', type: 'file', size: 1200 },
      { name: 'CHANGELOG.md', path: 'CHANGELOG.md', type: 'file', size: 900 },
      { name: '.gitignore', path: '.gitignore', type: 'file', size: 200 },
      { name: 'package.json', path: 'package.json', type: 'file', size: 800 },
      { name: 'src', path: 'src', type: 'dir' },
      { name: 'docs', path: 'docs', type: 'dir' },
      { name: '.github', path: '.github', type: 'dir' },
    ],
    githubDirContents: [
      { name: 'workflows', path: '.github/workflows', type: 'dir' },
      { name: 'ISSUE_TEMPLATE', path: '.github/ISSUE_TEMPLATE', type: 'dir' },
      { name: 'PULL_REQUEST_TEMPLATE.md', path: '.github/PULL_REQUEST_TEMPLATE.md', type: 'file' },
    ],
    workflowsContents: [{ name: 'ci.yml', path: '.github/workflows/ci.yml', type: 'file' }],
    docsContents: [{ name: 'ARCHITECTURE.md', path: 'docs/ARCHITECTURE.md', type: 'file' }],
    readme: {
      exists: true,
      name: 'README.md',
      content: `# ByteArcadeR RepoGuard

Protect Your Code. Improve Your Repository.

![Shield](docs/repoguard-shield.svg)

## Features
ByteArcadeR RepoGuard provides a deterministic 100-point repository health scoring engine across README quality, SPDX license compliance, community governance, activity velocity, documentation link integrity, and repository structure. Built for open-source maintainers and engineering teams who want transparent, reproducible audits without arbitrary code execution or opaque heuristics.

## Installation
Install dependencies and run the server:
\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage
Query the REST endpoint or use the interactive dashboard:
\`\`\`bash
curl http://localhost:3000/api/analyze?repo=bytearcader-ai/bytearcader-repo
\`\`\`

## Contributing & License
See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE) for full details. Also read [Architecture](docs/ARCHITECTURE.md).
`,
    },
    commits: Array.from({ length: 12 }).map((_, idx) => ({
      sha: `a1b2c3d4e5f600${idx}`,
      html_url: `https://github.com/bytearcader-ai/bytearcader-repo/commit/${idx}`,
      commit: {
        message: `feat: commit ${idx}`,
        author: { name: 'ByteArcadeR AI', date: '2026-11-05T00:00:00.000Z' },
      },
      author: { login: 'bytearcader-ai' },
    })),
    issues: [],
    rateLimit: {
      limit: 60,
      remaining: 58,
      resetAt: '2026-11-07T01:00:00.000Z',
      usedToken: false,
    },
  };
}

test('1. Valid GitHub repository URLs and owner/repo formats parse accurately', () => {
  const cases = [
    { input: 'facebook/react', owner: 'facebook', repo: 'react' },
    { input: 'https://github.com/vitejs/vite', owner: 'vitejs', repo: 'vite' },
    { input: 'https://github.com/expressjs/express.git', owner: 'expressjs', repo: 'express' },
    {
      input: 'http://www.github.com/bytearcader-ai/bytearcader-repo/tree/main',
      owner: 'bytearcader-ai',
      repo: 'bytearcader-repo',
    },
    { input: 'github.com/tailwindlabs/tailwindcss', owner: 'tailwindlabs', repo: 'tailwindcss' },
  ];

  for (const c of cases) {
    const res = parseGitHubRepoInput(c.input);
    assert.equal(res.valid, true, `Expected ${c.input} to be valid`);
    assert.equal(res.parsed?.owner, c.owner);
    assert.equal(res.parsed?.repo, c.repo);
  }
});

test('2. Invalid repository URLs are rejected with clear error messages', () => {
  const invalidInputs = [
    '',
    '   ',
    'just-one-segment',
    'https://gitlab.com/owner/repo',
    'https://bitbucket.org/owner/repo',
    'owner/repo with spaces',
    'https://github.com/..',
  ];

  for (const raw of invalidInputs) {
    const res = parseGitHubRepoInput(raw);
    assert.equal(res.valid, false, `Expected "${raw}" to be rejected`);
    assert.ok(res.error && res.error.length > 0);
  }
});

test('3. Exemplary repository verifies all 22 checks with PASS status, scoringRule, evidence arrays, commitSha, analyzedAt, and 100/100 score', () => {
  const input = createBaseInput();
  const report = buildRepositoryAnalysisReport(input);

  assert.equal(report.overallScore, 100);
  assert.equal(report.rawScore, 100);
  assert.equal(report.applicableMaxScore, 100);
  assert.equal(report.grade, 'A+');
  assert.equal(report.passedChecks.length, 22);
  assert.equal(report.failedChecks.length, 0);
  assert.equal(report.notVerifiedChecks.length, 0);
  assert.equal(report.notApplicableChecks.length, 0);
  assert.equal(report.commitSha, 'a1b2c3d4e5f6000');
  assert.equal(report.repository.headCommitSha, 'a1b2c3d4e5f6000');
  assert.equal(report.analyzedAt, '2026-11-07T00:00:00.000Z');

  const checkIds = report.passedChecks.map((c) => c.id);
  assert.deepEqual(checkIds, ALL_22_CHECK_IDS);

  for (const check of report.passedChecks) {
    assert.equal(check.status, 'PASS');
    assert.equal(check.passed, true);
    assert.ok(typeof check.scoringRule === 'string' && check.scoringRule.length > 10, `Expected documented scoringRule for ${check.id}`);
    assert.ok(Array.isArray(check.evidence) && check.evidence.length > 0, `Expected non-empty evidence for ${check.id}`);
  }
});

test('4. Missing README deducts 25 README points and 6 documentation link points with concrete FAIL evidence', () => {
  const input = createBaseInput();
  input.readme = { exists: false, name: null, content: '' };
  input.rootContents = input.rootContents.filter((f) => f.name !== 'README.md');

  const report = buildRepositoryAnalysisReport(input);
  assert.equal(report.categories.readme.score, 0);
  assert.equal(report.categories.documentation.score, 4); // CHANGELOG + docs still present (4 pts), link check loses 6 pts
  assert.equal(report.categories.documentation.applicableMaxScore, 10);
  assert.equal(report.overallScore, 69);

  for (const check of report.failedChecks) {
    assert.equal(check.status, 'FAIL');
    assert.equal(check.passed, false);
    assert.ok(typeof check.scoringRule === 'string' && check.scoringRule.length > 0);
    assert.ok(Array.isArray(check.evidence) && check.evidence.length > 0);
  }
});

test('5. Missing license deducts all 15 license points and flags broken LICENSE link in README (-3 pts)', () => {
  const input = createBaseInput();
  input.repo.license = null;
  input.rootContents = input.rootContents.filter((f) => f.name !== 'LICENSE');

  const report = buildRepositoryAnalysisReport(input);
  assert.equal(report.categories.license.score, 0);
  assert.equal(report.categories.documentation.score, 7); // -3 pts for broken [LICENSE](LICENSE) link in README
  assert.equal(report.overallScore, 82);
  const licenseDed = report.deductions.find((d) => d.id === 'deduct-license-present');
  assert.ok(licenseDed);
  assert.equal(licenseDed.pointsLost, 10);
});

test('6. Missing community health files deducts 20 community points and flags broken CONTRIBUTING link (-3 pts)', () => {
  const input = createBaseInput();
  input.rootContents = input.rootContents.filter(
    (f) => !['CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'].includes(f.name)
  );
  input.githubDirContents = [{ name: 'workflows', path: '.github/workflows', type: 'dir' }];

  const report = buildRepositoryAnalysisReport(input);
  assert.equal(report.categories.community.score, 0);
  assert.equal(report.categories.documentation.score, 7);
  assert.equal(report.overallScore, 77);
  assert.equal(report.categories.community.deductions.length, 4);
});

test('7. False-positive prevention: unverified external links, empty workflows dir, and deep missing relative paths are caught', () => {
  const rootPaths = new Set(['readme.md', 'license', 'src']);
  const subPaths = new Set(['docs/architecture.md']);
  const treePaths = new Set(['readme.md', 'license', 'src/index.ts', 'docs/architecture.md']);
  const md = `
Check out our [License](LICENSE), [Architecture](docs/ARCHITECTURE.md),
[Missing Deep File](src/nonexistent.ts), and [Unchecked External](https://example.org/docs).
`;
  const links = extractAndCheckReadmeLinks(md, rootPaths, subPaths, {}, treePaths);
  const broken = links.filter((l) => l.status === 'broken');
  const unverified = links.filter((l) => l.status === 'unverified');

  assert.equal(broken.length, 1);
  assert.equal(broken[0].url, 'src/nonexistent.ts');
  assert.equal(unverified.length, 1);
  assert.equal(unverified[0].url, 'https://example.org/docs');

  // Also verify that an empty .github/workflows directory (0 .yml files) fails structure-ci
  const input = createBaseInput();
  input.workflowsContents = [];
  const report = buildRepositoryAnalysisReport(input);
  const ciCheck = report.failedChecks.find((c) => c.id === 'structure-ci');
  assert.ok(ciCheck, 'Expected structure-ci to FAIL when .github/workflows has 0 workflow files');
  assert.equal(ciCheck.scoreAwarded, 0);
  assert.equal(ciCheck.status, 'FAIL');
});

test('8. NOT_VERIFIED checks never award points (0 pts awarded when endpoints cannot be verified)', () => {
  const input = createBaseInput();
  input.readme = { exists: false, name: null, content: '' };
  input.rootContents = [];
  input.githubDirContents = [];
  input.workflowsContents = [];
  input.commits = [];
  input.repo.license = null;
  input.verification = {
    rootContentsVerified: false,
    readmeVerified: false,
    commitsVerified: false,
    issuesVerified: false,
    githubDirVerified: false,
    workflowsVerified: false,
    docsDirVerified: false,
    externalLinksVerified: false,
    treeVerified: false,
  };

  const report = buildRepositoryAnalysisReport(input);

  // Every unverified check must have status === 'NOT_VERIFIED' and scoreAwarded === 0
  assert.ok(report.notVerifiedChecks.length >= 18);
  for (const chk of report.notVerifiedChecks) {
    assert.equal(chk.status, 'NOT_VERIFIED');
    assert.equal(chk.passed, false);
    assert.equal(chk.scoreAwarded, 0, `Check ${chk.id} must award 0 points when NOT_VERIFIED`);
    assert.ok(chk.evidence.length > 0);
  }
});

test('9. README with zero links marks docs-links as NOT_APPLICABLE, excludes 6 pts from applicableMaxScore (94 pts), and does not penalize the repository', () => {
  const input = createBaseInput();
  // Provide a comprehensive link-free README (>= 800 characters) that satisfies all 6 README checks
  input.readme = {
    exists: true,
    name: 'README.md',
    content: `# ByteArcadeR RepoGuard

Protect Your Code. Improve Your Repository.

## Overview
ByteArcadeR RepoGuard is a deterministic repository health analyzer that inspects twenty-two engineering, governance, documentation, and structure signals across public GitHub repositories without executing untrusted code. It provides transparent scoring rules and verifiable repository evidence for every single check, ensuring maintainers can audit their open-source repositories with full confidence and zero ambiguity.

## Architecture & Security
All repository inspections are performed strictly over read-only GitHub REST API v3 endpoints with configurable request timeouts, rate-limit header tracking, and in-memory TTL caching. Untrusted code from analyzed repositories is never cloned, built, or executed.

## Installation
Install dependencies and start the server locally:
\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage
Run the CLI or query the HTTP endpoint directly:
\`\`\`bash
curl http://localhost:3000/api/analyze?repo=bytearcader-ai/bytearcader-repo
\`\`\`

## Contributing & License
Please read CONTRIBUTING.md for pull request guidelines, CODE_OF_CONDUCT.md for community standards, SECURITY.md for vulnerability disclosure, and LICENSE for the MIT License terms.
`,
  };

  const report = buildRepositoryAnalysisReport(input);

  // docs-links must be in notApplicableChecks, NOT in passedChecks, failedChecks, or notVerifiedChecks
  assert.equal(report.notApplicableChecks.length, 1);
  assert.equal(report.notApplicableChecks[0].id, 'docs-links');
  assert.equal(report.notApplicableChecks[0].status, 'NOT_APPLICABLE');
  assert.equal(report.notApplicableChecks[0].scoreAwarded, 0);
  assert.equal(report.passedChecks.length, 21);
  assert.equal(report.failedChecks.length, 0);
  assert.equal(report.notVerifiedChecks.length, 0);
  assert.equal(report.deductions.length, 0);

  // Fair scoring: 94 raw points out of 94 applicable points normalizes to 100/100 (A+)
  assert.equal(report.rawScore, 94);
  assert.equal(report.applicableMaxScore, 94);
  assert.equal(report.overallScore, 100);
  assert.equal(report.grade, 'A+');
  assert.equal(report.categories.documentation.score, 4);
  assert.equal(report.categories.documentation.applicableMaxScore, 4);
  assert.equal(report.categories.documentation.percentage, 100);
});

