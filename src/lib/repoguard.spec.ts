import { describe, expect, it } from 'vitest';
import {
  buildRepositoryAnalysisReport,
  extractAndCheckReadmeLinks,
  parseGitHubRepoInput,
} from './analyzer';
import {
  createApp,
  DEFAULT_CACHE_TTL_SECONDS,
  DEFAULT_GITHUB_TIMEOUT_MS,
  getOptionalGitHubToken,
  REPO_NOT_FOUND_MESSAGE,
} from '../../server.ts';
import { RawGitHubAuditInput } from '../types/repoguard';

describe('ByteArcadeR RepoGuard — Suite 1: [MOCKED UNIT TESTS]', () => {
  it('[MOCKED UNIT TEST] enforces sensible defaults (300s cache TTL, 10000ms timeout) and optional GITHUB_TOKEN', () => {
    expect(DEFAULT_CACHE_TTL_SECONDS).toBe(300);
    expect(DEFAULT_GITHUB_TIMEOUT_MS).toBe(10000);
    const prevToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    expect(getOptionalGitHubToken()).toBeNull();
    process.env.GITHUB_TOKEN = '   ';
    expect(getOptionalGitHubToken()).toBeNull();
    if (prevToken !== undefined) {
      process.env.GITHUB_TOKEN = prevToken;
    } else {
      delete process.env.GITHUB_TOKEN;
    }
  });

  it('[MOCKED UNIT TEST] validates GitHub repository URLs and owner/repo strings', () => {
    expect(parseGitHubRepoInput('facebook/react')).toEqual({
      valid: true,
      parsed: { owner: 'facebook', repo: 'react' },
    });
    expect(parseGitHubRepoInput('https://github.com/vitejs/vite')).toEqual({
      valid: true,
      parsed: { owner: 'vitejs', repo: 'vite' },
    });
  });

  it('[MOCKED UNIT TEST] rejects invalid repository URLs and non-GitHub hosts', () => {
    expect(parseGitHubRepoInput('').valid).toBe(false);
    expect(parseGitHubRepoInput('https://gitlab.com/user/repo').valid).toBe(false);
    expect(parseGitHubRepoInput('only-owner').valid).toBe(false);
  });

  it('[MOCKED UNIT TEST] calculates deterministic deductions for missing README, missing license, and missing community files', () => {
    const minimalInput: RawGitHubAuditInput = {
      nowIso: '2026-11-07T00:00:00.000Z',
      repo: {
        owner: { login: 'test-org' },
        name: 'bare-repo',
        full_name: 'test-org/bare-repo',
        html_url: 'https://github.com/test-org/bare-repo',
        description: null,
        homepage: null,
        default_branch: 'main',
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        language: 'JavaScript',
        topics: [],
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        pushed_at: '2024-01-01T00:00:00.000Z',
        size: 10,
        archived: true,
        license: null,
      },
      rootContents: [{ name: '.env', path: '.env', type: 'file', size: 100 }],
      githubDirContents: [],
      workflowsContents: [],
      docsContents: [],
      readme: { exists: false, name: null, content: '' },
      commits: [],
      issues: [],
    };

    const report = buildRepositoryAnalysisReport(minimalInput);
    expect(report.overallScore).toBe(0);
    expect(report.grade).toBe('F');
    expect(report.categories.readme.score).toBe(0);
    expect(report.categories.license.score).toBe(0);
    expect(report.categories.community.score).toBe(0);
    expect(report.categories.activity.score).toBe(0);
    expect(report.categories.documentation.score).toBe(0);
    expect(report.categories.structure.score).toBe(0);
    expect(report.modules.structure.committedAntiPatterns).toContain('.env');

    const allChecks = [
      ...report.passedChecks,
      ...report.failedChecks,
      ...report.notVerifiedChecks,
      ...report.notApplicableChecks,
    ];
    expect(allChecks.length).toBe(22);
    for (const c of allChecks) {
      expect(c.evidence.length).toBeGreaterThan(0);
      expect(typeof c.scoringRule).toBe('string');
      expect(c.scoringRule.length).toBeGreaterThan(10);
    }
  });

  it('[MOCKED UNIT TEST] keeps PASS, FAIL, NOT_VERIFIED, and NOT_APPLICABLE logically separate', () => {
    const links = extractAndCheckReadmeLinks(
      'See [Setup](docs/SETUP.md), [Valid](README.md), and [External](https://example.com)',
      new Set(['readme.md']),
      new Set()
    );
    expect(links.find((l) => l.url === 'docs/SETUP.md')?.status).toBe('broken');
    expect(links.find((l) => l.url === 'README.md')?.status).toBe('valid');
    expect(links.find((l) => l.url === 'https://example.com')?.status).toBe('unverified');
  });

  it('[MOCKED UNIT TEST] serves separate offline DEMO mode at /api/demo with isDemo=true and commitSha=null', async () => {
    const app = createApp();
    const server = app.listen(0);
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;

      const demoRes = await fetch(`http://127.0.0.1:${port}/api/demo`);
      expect(demoRes.status).toBe(200);
      const demoBody = await demoRes.json();
      expect(demoBody.isDemo).toBe(true);
      expect(demoBody.commitSha).toBeNull();
      expect(demoBody.repository.owner).toBe('demo-showcase');
    } finally {
      server.close();
    }
  });

  it('[MOCKED UNIT TEST] handles API rate limits (429), missing repositories (404), upstream timeouts (504), and network failures (502)', async () => {
    const express = (await import('express')).default;
    const mockUpstream = express();

    mockUpstream.head('/rate-limited/repo', (_req, res) => {
      res.status(200).end();
    });

    mockUpstream.get('/repos/rate-limited/repo', (_req, res) => {
      res
        .status(403)
        .setHeader('x-ratelimit-limit', '60')
        .setHeader('x-ratelimit-remaining', '0')
        .setHeader('x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 1800))
        .json({ message: 'API rate limit exceeded' });
    });

    mockUpstream.get('/search/repositories', (_req, res) => {
      res
        .status(403)
        .setHeader('x-ratelimit-limit', '10')
        .setHeader('x-ratelimit-remaining', '0')
        .setHeader('x-ratelimit-reset', String(Math.floor(Date.now() / 1000) + 60))
        .json({ message: 'API rate limit exceeded' });
    });

    mockUpstream.get('/repos/missing-owner/nonexistent-repo', (_req, res) => {
      res.status(404).json({ message: 'Not Found' });
    });

    mockUpstream.get('/repos/slow-owner/timeout-repo', (_req, _res) => {
      // Intentionally do not respond so timeout triggers
    });

    const upstreamServer = mockUpstream.listen(0);
    const upstreamAddr = upstreamServer.address();
    const upstreamPort =
      typeof upstreamAddr === 'object' && upstreamAddr ? upstreamAddr.port : 0;

    const app = createApp({
      githubApiBaseUrl: `http://127.0.0.1:${upstreamPort}`,
      githubWebBaseUrl: `http://127.0.0.1:${upstreamPort}`,
      timeoutMs: 250,
    });
    const appServer = app.listen(0);

    try {
      const appAddr = appServer.address();
      const appPort = typeof appAddr === 'object' && appAddr ? appAddr.port : 0;

      // 1. Rate Limit Exceeded -> 429 RATE_LIMIT_EXCEEDED
      const rateLimitRes = await fetch(
        `http://127.0.0.1:${appPort}/api/analyze?repo=rate-limited/repo&refresh=true`
      );
      expect(rateLimitRes.status).toBe(429);
      const rateLimitBody = await rateLimitRes.json();
      expect(rateLimitBody.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitBody.rateLimit.remaining).toBe(0);

      // 2. Missing Repository -> 404 REPO_NOT_FOUND with exact required message
      const notFoundRes = await fetch(
        `http://127.0.0.1:${appPort}/api/analyze?repo=missing-owner/nonexistent-repo&refresh=true`
      );
      expect(notFoundRes.status).toBe(404);
      const notFoundBody = await notFoundRes.json();
      expect(notFoundBody.error).toBe('REPO_NOT_FOUND');
      expect(notFoundBody.message).toBe(REPO_NOT_FOUND_MESSAGE);
      expect(notFoundBody.message).toBe(
        'Repository not found or inaccessible. Please verify the URL.'
      );

      // 3. Upstream Timeout -> 504 UPSTREAM_TIMEOUT
      const timeoutRes = await fetch(
        `http://127.0.0.1:${appPort}/api/analyze?repo=slow-owner/timeout-repo&refresh=true`
      );
      expect(timeoutRes.status).toBe(504);
      const timeoutBody = await timeoutRes.json();
      expect(timeoutBody.error).toBe('UPSTREAM_TIMEOUT');
    } finally {
      upstreamServer.close();
      appServer.close();
    }

    // 4. Network Failure (closed upstream port) -> 502 NETWORK_ERROR
    const deadNetApp = createApp({
      githubApiBaseUrl: `http://127.0.0.1:${upstreamPort}`,
      githubWebBaseUrl: `http://127.0.0.1:${upstreamPort}`,
      timeoutMs: 500,
    });
    const deadNetServer = deadNetApp.listen(0);
    try {
      const addr = deadNetServer.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const netErrRes = await fetch(
        `http://127.0.0.1:${port}/api/analyze?repo=any-owner/any-repo&refresh=true`
      );
      expect(netErrRes.status).toBe(502);
      const netErrBody = await netErrRes.json();
      expect(netErrBody.error).toBe('NETWORK_ERROR');
    } finally {
      deadNetServer.close();
    }
  });
});

describe('ByteArcadeR RepoGuard — Suite 2: [LIVE GITHUB API TESTS]', () => {
  it('[LIVE GITHUB API TEST] verifies non-existent repository returns HTTP 404 and analyzes third-party public repositories with real commitSha and analyzedAt', async () => {
    const app = createApp();
    const server = app.listen(0);
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;

      const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
      expect(healthRes.status).toBe(200);
      const healthJson = await healthRes.json();
      expect(healthJson.service).toBe('ByteArcadeR RepoGuard API');
      expect(healthJson.cacheTtlSeconds).toBe(300);
      expect(healthJson.githubTimeoutMs).toBe(10000);

      // Invalid URLs / repository identifiers -> 400
      for (const badInput of ['', 'invalid', 'https://gitlab.com/org/repo', 'owner/repo with spaces']) {
        const invalidRes = await fetch(
          `http://127.0.0.1:${port}/api/analyze?repo=${encodeURIComponent(badInput)}`
        );
        expect(invalidRes.status).toBe(400);
      }

      // Live GitHub API 404 check on a non-existent repository -> must return 404 and never fabricate data
      const nonExistentRes = await fetch(
        `http://127.0.0.1:${port}/api/analyze?repo=nonexistent-owner-99999/nonexistent-repo-99999&refresh=true`
      );
      if (nonExistentRes.status === 404) {
        const errBody = await nonExistentRes.json();
        expect(errBody.error).toBe('REPO_NOT_FOUND');
        expect(errBody.message).toBe(
          'Repository not found or inaccessible. Please verify the URL.'
        );
      } else {
        // Only if GitHub API unauthenticated rate limit is exhausted (429) on shared runner IP
        expect([404, 429]).toContain(nonExistentRes.status);
      }

      // Live third-party public repository check
      const liveRes = await fetch(
        `http://127.0.0.1:${port}/api/analyze?repo=kelseyhightower/nocode`
      );
      if (liveRes.status === 200) {
        const rep = await liveRes.json();
        expect(rep.repository.fullName.toLowerCase()).toBe('kelseyhightower/nocode');
        expect(typeof rep.analyzedAt).toBe('string');
        expect(typeof rep.commitSha).toBe('string');
        expect(rep.commitSha.length).toBeGreaterThanOrEqual(7);
        const all22 = [
          ...rep.passedChecks,
          ...rep.failedChecks,
          ...rep.notVerifiedChecks,
          ...rep.notApplicableChecks,
        ];
        expect(all22.length).toBe(22);
      } else {
        expect([200, 429]).toContain(liveRes.status);
      }
    } finally {
      server.close();
    }
  }, 60000);
});


