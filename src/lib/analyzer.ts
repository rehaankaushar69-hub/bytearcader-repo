import {
  AnalysisReport,
  ActivityAnalysis,
  BrokenLinkResult,
  CategoryKey,
  CategoryScore,
  CheckItem,
  CheckStatus,
  CommunityHealthAnalysis,
  LicenseAnalysis,
  RawGitHubAuditInput,
  ReadmeAnalysis,
  RecommendationItem,
  ScoreDeduction,
  StructureAnalysis,
} from '../types/repoguard';

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
}

const VALID_GITHUB_SEGMENT = /^[a-zA-Z0-9._-]+$/;

/**
 * Validates and parses a GitHub repository identifier.
 * Accepts:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubRepoInput(rawInput: string): {
  valid: boolean;
  parsed?: ParsedGitHubRepo;
  error?: string;
} {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a GitHub repository URL or owner/repo identifier.',
    };
  }

  // Reject whitespace or shell/query injection characters
  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      error: 'Repository identifier must not contain spaces.',
    };
  }

  let pathPart = trimmed;

  if (
    trimmed.includes('://') ||
    trimmed.startsWith('github.com/') ||
    trimmed.startsWith('www.github.com/')
  ) {
    let urlToParse = trimmed;
    if (!urlToParse.includes('://')) {
      urlToParse = `https://${urlToParse}`;
    }
    try {
      const parsedUrl = new URL(urlToParse);
      const host = parsedUrl.hostname.toLowerCase();
      if (host !== 'github.com' && host !== 'www.github.com') {
        return {
          valid: false,
          error: 'Only github.com repositories are supported.',
        };
      }
      pathPart = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format. Expected https://github.com/owner/repository.',
      };
    }
  } else if (trimmed.includes('.')) {
    const firstSlash = trimmed.indexOf('/');
    const firstSegment = firstSlash > -1 ? trimmed.slice(0, firstSlash) : trimmed;
    if (
      firstSegment.includes('.') &&
      firstSegment.toLowerCase() !== 'github.com' &&
      firstSegment.toLowerCase() !== 'www.github.com' &&
      trimmed.split('/').length > 2
    ) {
      return {
        valid: false,
        error: 'Only github.com repositories are supported.',
      };
    }
  }

  const segments = pathPart
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);

  if (segments.length < 2) {
    return {
      valid: false,
      error: 'Please specify both repository owner and name (e.g., facebook/react).',
    };
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, '');

  if (!owner || !repo) {
    return {
      valid: false,
      error: 'Both owner and repository name are required.',
    };
  }

  if (
    !VALID_GITHUB_SEGMENT.test(owner) ||
    !VALID_GITHUB_SEGMENT.test(repo) ||
    owner === '.' ||
    owner === '..' ||
    repo === '.' ||
    repo === '..'
  ) {
    return {
      valid: false,
      error: 'Repository owner or name contains invalid characters.',
    };
  }

  return {
    valid: true,
    parsed: { owner, repo },
  };
}

const OSI_APPROVED_SPDX = new Set([
  'MIT',
  'Apache-2.0',
  'GPL-2.0',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'LGPL-2.1',
  'LGPL-2.1-only',
  'LGPL-3.0',
  'LGPL-3.0-only',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MPL-2.0',
  'EPL-2.0',
  'AGPL-3.0',
  'AGPL-3.0-only',
  'Unlicense',
  'CC0-1.0',
  '0BSD',
  'Zlib',
  'Artistic-2.0',
  'BSL-1.0',
]);

export function analyzeReadmeContent(
  exists: boolean,
  fileName: string | null,
  content: string
): ReadmeAnalysis {
  if (!exists || !content.trim()) {
    return {
      exists: false,
      fileName: null,
      charCount: 0,
      wordCount: 0,
      lineCount: 0,
      headingCount: 0,
      headings: [],
      codeBlockCount: 0,
      hasInstallationSection: false,
      hasUsageSection: false,
      hasLicenseSection: false,
      hasContributingSection: false,
      hasBadgesOrImages: false,
      excerpt: '',
    };
  }

  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const words = normalized.trim().split(/\s+/).filter(Boolean);

  // Extract Markdown headings outside fenced code blocks
  const headings: string[] = [];
  let inCodeBlock = false;
  let codeFenceCount = 0;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      codeFenceCount++;
      continue;
    }
    if (!inCodeBlock) {
      const headingMatch = line.match(/^\s*#{1,6}\s+(.+)$/);
      if (headingMatch) {
        headings.push(headingMatch[1].trim());
      }
    }
  }

  // Also support Setext-style headings (=== or ---) if no ATX headings were used
  if (headings.length === 0) {
    for (let i = 1; i < lines.length; i++) {
      const prev = lines[i - 1].trim();
      const curr = lines[i].trim();
      if (prev.length > 0 && (/^={3,}$/.test(curr) || /^-{3,}$/.test(curr))) {
        headings.push(prev);
      }
    }
  }

  const codeBlockCount = Math.floor(codeFenceCount / 2);
  const lowerContent = normalized.toLowerCase();
  const headingsLower = headings.map((h) => h.toLowerCase()).join(' | ');

  const hasInstallationSection =
    /\b(install|installation|getting started|quick start|quickstart|setup|prerequisites|deployment|building|build)\b/i.test(
      headingsLower
    ) ||
    /\b(npm install|npm i\b|pnpm add|pnpm install|yarn add|yarn install|bun add|pip install|cargo add|cargo install|go get|go install|docker run|docker compose|git clone|brew install|apt-get install|composer require)\b/i.test(
      lowerContent
    );

  const hasUsageSection =
    /\b(usage|example|examples|how to use|quick start|quickstart|api|documentation|docs|guide|tutorial|cli|commands)\b/i.test(
      headingsLower
    ) || codeBlockCount >= 1;

  const hasLicenseSection =
    /\b(license|licensing|copyright)\b/i.test(headingsLower) ||
    /\b(mit license|apache license|apache-2\.0|gpl|bsd license|isc license|mpl-2\.0|licensed under)\b/i.test(
      lowerContent
    ) ||
    /\[[^\]]*license[^\]]*\]\([^)]*license[^)]*\)/i.test(normalized);

  const hasContributingSection =
    /\b(contributing|contribute|contributors|development|pull request|pr guidelines)\b/i.test(
      headingsLower
    ) || /contributing(\.md)?/i.test(lowerContent);

  const hasBadgesOrImages = /!\[[^\]]*\]\([^)]+\)|<img\s/i.test(normalized);

  // Clean plain-text excerpt
  const plainLines = lines
    .filter(
      (l) =>
        l.trim().length > 0 &&
        !l.trim().startsWith('#') &&
        !l.trim().startsWith('![') &&
        !l.trim().startsWith('[!') &&
        !l.trim().startsWith('```') &&
        !l.trim().startsWith('<')
    )
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();

  return {
    exists: true,
    fileName: fileName || 'README.md',
    charCount: normalized.length,
    wordCount: words.length,
    lineCount: lines.length,
    headingCount: headings.length,
    headings: headings.slice(0, 20),
    codeBlockCount,
    hasInstallationSection,
    hasUsageSection,
    hasLicenseSection,
    hasContributingSection,
    hasBadgesOrImages,
    excerpt: plainLines.slice(0, 240) + (plainLines.length > 240 ? '...' : ''),
  };
}

export function extractAndCheckReadmeLinks(
  readmeContent: string,
  rootPaths: Set<string>,
  knownSubPaths: Set<string>,
  verifiedExternalLinks: Record<
    string,
    { ok: boolean; unverified?: boolean; status?: number; reason?: string }
  > = {},
  treePaths?: Set<string>
): BrokenLinkResult[] {
  if (!readmeContent.trim()) {
    return [];
  }

  // Strip fenced code blocks before scanning links so example links inside code blocks aren't flagged
  const stripped = readmeContent.replace(/```[\s\S]*?```/g, '');
  const linkRegex = /(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  const results: BrokenLinkResult[] = [];
  const seenUrls = new Set<string>();

  // Extract valid heading anchors in README for #anchor verification (GitHub GFM slug rules)
  const headingSlugs = new Set<string>();
  for (const line of stripped.split('\n')) {
    const m = line.match(/^\s*#{1,6}\s+(.+)$/);
    if (m) {
      const cleaned = m[1]
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '');
      const gfmSlug = cleaned.replace(/ /g, '-');
      const collapsedSlug = cleaned.replace(/\s+/g, '-');
      if (gfmSlug) headingSlugs.add(`#${gfmSlug}`);
      if (collapsedSlug) headingSlugs.add(`#${collapsedSlug}`);
    }
  }

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(stripped)) !== null) {
    const text = match[1].trim() || 'Link';
    const rawUrl = match[2].trim();

    if (
      !rawUrl ||
      rawUrl.startsWith('mailto:') ||
      rawUrl.startsWith('tel:') ||
      rawUrl.startsWith('javascript:')
    ) {
      continue;
    }

    if (seenUrls.has(rawUrl)) {
      continue;
    }
    seenUrls.add(rawUrl);

    if (rawUrl.startsWith('#')) {
      const lowerAnchor = rawUrl.toLowerCase();
      if (headingSlugs.size > 0 && headingSlugs.has(lowerAnchor)) {
        results.push({
          url: rawUrl,
          text,
          type: 'anchor',
          status: 'valid',
        });
      } else if (headingSlugs.size > 0) {
        results.push({
          url: rawUrl,
          text,
          type: 'anchor',
          status: 'broken',
          reason: `Anchor "${rawUrl}" does not match any Markdown heading in README`,
        });
      } else {
        results.push({
          url: rawUrl,
          text,
          type: 'anchor',
          status: 'unverified',
          reason: 'No Markdown headings found to verify anchor target',
        });
      }
      continue;
    }

    if (/^https?:\/\//i.test(rawUrl)) {
      try {
        const parsed = new URL(rawUrl);
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
          results.push({
            url: rawUrl,
            text,
            type: 'external',
            status: 'broken',
            reason: 'Malformed hostname in documentation URL',
          });
          continue;
        }
      } catch {
        results.push({
          url: rawUrl,
          text,
          type: 'external',
          status: 'broken',
          reason: 'Malformed HTTP/HTTPS URL syntax',
        });
        continue;
      }

      const extStatus = verifiedExternalLinks[rawUrl];
      if (extStatus) {
        if (extStatus.unverified) {
          results.push({
            url: rawUrl,
            text,
            type: 'external',
            status: 'unverified',
            statusCode: extStatus.status,
            reason: extStatus.reason || 'External URL reachability could not be verified',
          });
        } else {
          results.push({
            url: rawUrl,
            text,
            type: 'external',
            status: extStatus.ok ? 'valid' : 'broken',
            statusCode: extStatus.status,
            reason: extStatus.reason,
          });
        }
      } else {
        // Never assume an uninspected external link is valid
        results.push({
          url: rawUrl,
          text,
          type: 'external',
          status: 'unverified',
          reason: 'External link was not verified via HTTP probe',
        });
      }
      continue;
    }

    // Relative link inside the repository
    const cleanRel = rawUrl
      .split('#')[0]
      .split('?')[0]
      .replace(/^\.?\//, '')
      .replace(/\/+$/, '');

    if (!cleanRel) {
      continue;
    }

    const cleanLower = cleanRel.toLowerCase();
    const topSegment = cleanLower.split('/')[0];

    // If full recursive Git tree paths are available, verify exact path existence
    if (treePaths && treePaths.size > 0) {
      const existsInTree =
        treePaths.has(cleanLower) ||
        Array.from(treePaths).some((p) => p.startsWith(`${cleanLower}/`));
      if (existsInTree) {
        results.push({
          url: rawUrl,
          text,
          type: 'relative',
          status: 'valid',
        });
      } else {
        results.push({
          url: rawUrl,
          text,
          type: 'relative',
          status: 'broken',
          reason: `Referenced path "${cleanRel}" was not found in repository Git tree`,
        });
      }
      continue;
    }

    // Fallback when recursive tree is not provided (e.g., unit test fixtures)
    if (!cleanLower.includes('/')) {
      if (rootPaths.has(cleanLower)) {
        results.push({
          url: rawUrl,
          text,
          type: 'relative',
          status: 'valid',
        });
      } else {
        results.push({
          url: rawUrl,
          text,
          type: 'relative',
          status: 'broken',
          reason: `Referenced root path "${cleanRel}" was not found in repository root`,
        });
      }
      continue;
    }

    // Nested relative path without full recursive tree
    const existsInKnownSub = knownSubPaths.has(cleanLower);
    if (existsInKnownSub) {
      results.push({
        url: rawUrl,
        text,
        type: 'relative',
        status: 'valid',
      });
    } else if (!rootPaths.has(topSegment)) {
      results.push({
        url: rawUrl,
        text,
        type: 'relative',
        status: 'broken',
        reason: `Referenced top-level directory "${topSegment}" does not exist in repository root`,
      });
    } else if (topSegment === '.github' || topSegment === 'docs') {
      results.push({
        url: rawUrl,
        text,
        type: 'relative',
        status: 'broken',
        reason: `Referenced file "${cleanRel}" was not found in ${topSegment}/ directory`,
      });
    } else {
      // Subdirectory exists in root, but its nested contents were not fetched
      results.push({
        url: rawUrl,
        text,
        type: 'relative',
        status: 'unverified',
        reason: `Subdirectory "${topSegment}/" exists, but nested path "${cleanRel}" could not be verified without recursive tree`,
      });
    }
  }

  return results.slice(0, 40);
}

export function computeLetterGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function computeStatusLabel(score: number): string {
  if (score >= 90) return 'Exemplary Open Source Readiness';
  if (score >= 75) return 'Production Ready — Minor Improvements Available';
  if (score >= 60) return 'Moderate Health — Missing Key Standards';
  if (score >= 45) return 'Needs Attention — Critical Gaps Detected';
  return 'At Risk — Foundational Repository Files Missing';
}

/**
 * Deterministic Repository Health Analyzer.
 * Evaluates all 22 checks across 10 modules and produces a 0-100 health score
 * backed by verifiable GitHub API evidence.
 * Keeps PASS, FAIL, NOT_VERIFIED, and NOT_APPLICABLE logically separate:
 * - NOT_VERIFIED checks award 0 points and record an unverified deduction.
 * - NOT_APPLICABLE checks are excluded from the applicable denominator without penalty.
 */
export function buildRepositoryAnalysisReport(input: RawGitHubAuditInput): AnalysisReport {
  const now = input.nowIso ? new Date(input.nowIso) : new Date();
  const rootEntries = input.rootContents || [];
  const githubEntries = input.githubDirContents || [];
  const workflowEntries = input.workflowsContents || [];
  const docsEntries = input.docsContents || [];
  const rawTreePaths = input.treePaths || [];

  const v = {
    rootContentsVerified: input.verification?.rootContentsVerified ?? true,
    readmeVerified: input.verification?.readmeVerified ?? true,
    commitsVerified: input.verification?.commitsVerified ?? true,
    issuesVerified: input.verification?.issuesVerified ?? true,
    githubDirVerified: input.verification?.githubDirVerified ?? true,
    workflowsVerified: input.verification?.workflowsVerified ?? true,
    docsDirVerified: input.verification?.docsDirVerified ?? true,
    externalLinksVerified: input.verification?.externalLinksVerified ?? true,
    treeVerified: input.verification?.treeVerified ?? rawTreePaths.length > 0,
  };

  const rootLowerMap = new Map<string, string>();
  for (const item of rootEntries) {
    rootLowerMap.set(item.name.toLowerCase(), item.path);
  }

  const githubLowerMap = new Map<string, string>();
  for (const item of githubEntries) {
    githubLowerMap.set(item.name.toLowerCase(), item.path);
  }

  const docsLowerMap = new Map<string, string>();
  for (const item of docsEntries) {
    docsLowerMap.set(item.name.toLowerCase(), item.path);
  }

  const treeLowerMap = new Map<string, string>();
  const treePathsSet = new Set<string>();
  for (const p of rawTreePaths) {
    const lower = p.toLowerCase();
    treeLowerMap.set(lower, p);
    treePathsSet.add(lower);
  }

  // 1. README Analysis
  const readmeAnalysis = analyzeReadmeContent(
    input.readme.exists,
    input.readme.name,
    input.readme.content
  );

  const normalizedReadme = (input.readme.content || '').replace(/\r\n/g, '\n');
  const installHeadingMatch = readmeAnalysis.headings.find((h) =>
    /\b(install|installation|getting started|quick start|quickstart|setup|prerequisites|deployment|building|build)\b/i.test(
      h
    )
  );
  const installCmdMatch = normalizedReadme.match(
    /\b(npm install|npm i\b|pnpm add|pnpm install|yarn add|yarn install|bun add|pip install|cargo add|cargo install|go get|go install|docker run|docker compose|git clone|brew install|apt-get install|composer require)\b/i
  );
  const usageHeadingMatch = readmeAnalysis.headings.find((h) =>
    /\b(usage|example|examples|how to use|quick start|quickstart|api|documentation|docs|guide|tutorial|cli|commands)\b/i.test(
      h
    )
  );
  const imageMatches = normalizedReadme.match(/!\[[^\]]*\]\([^)]+\)|<img\s/gi) || [];

  // 2. License Analysis
  const licenseFileKey = Array.from(rootLowerMap.keys()).find((k) =>
    /^(license|licence|copying)(\.(md|txt|rst))?$/i.test(k)
  );
  const treeLicenseFile =
    !licenseFileKey && rawTreePaths.length > 0
      ? rawTreePaths.find((p) => /^(license|licence|copying)(\.(md|txt|rst))?$/i.test(p)) || null
      : null;
  const resolvedLicenseFile = licenseFileKey
    ? rootLowerMap.get(licenseFileKey) || licenseFileKey
    : treeLicenseFile;

  const ghLicense = input.repo.license;
  const spdxId =
    ghLicense?.spdx_id && ghLicense.spdx_id !== 'NOASSERTION' ? ghLicense.spdx_id : null;
  const licenseExists = Boolean(ghLicense || resolvedLicenseFile);
  const isOsiApproved = Boolean(spdxId && OSI_APPROVED_SPDX.has(spdxId));

  const licenseAnalysis: LicenseAnalysis = {
    exists: licenseExists,
    name: ghLicense?.name || (resolvedLicenseFile ? 'Custom License File' : null),
    spdxId,
    url: ghLicense?.url || null,
    isOsiApproved,
    fileFound: resolvedLicenseFile || null,
  };

  // 3. Community Health Analysis
  const findCommunityFile = (pattern: RegExp): string | null => {
    for (const [lower, orig] of rootLowerMap.entries()) {
      if (pattern.test(lower)) return orig;
    }
    for (const [lower, orig] of githubLowerMap.entries()) {
      if (pattern.test(lower)) return orig;
    }
    for (const [lower, orig] of docsLowerMap.entries()) {
      if (pattern.test(lower)) return orig;
    }
    for (const [lower, orig] of treeLowerMap.entries()) {
      const base = lower.split('/').pop() || '';
      const dir = lower.includes('/') ? lower.slice(0, lower.lastIndexOf('/')) : '';
      if ((dir === '' || dir === '.github' || dir === 'docs') && pattern.test(base)) {
        return orig;
      }
    }
    return null;
  };

  const contributingPath = findCommunityFile(/^contributing(\.(md|txt|rst|adoc))?$/i);
  const securityPolicyPath = findCommunityFile(/^security(\.(md|txt|rst|adoc))?$/i);
  const codeOfConductPath = findCommunityFile(/^code_of_conduct(\.(md|txt|rst|adoc))?$/i);
  const supportPath = findCommunityFile(/^support(\.(md|txt|rst|adoc))?$/i);

  const issueTemplatePaths: string[] = [];
  for (const [lower, orig] of githubLowerMap.entries()) {
    if (lower.includes('issue_template')) {
      issueTemplatePaths.push(orig);
    }
  }
  for (const [lower, orig] of treeLowerMap.entries()) {
    if (
      (lower.startsWith('.github/issue_template/') ||
        lower === '.github/issue_template.md' ||
        lower === '.github/issue_template.yml' ||
        lower === '.github/issue_template.yaml') &&
      !issueTemplatePaths.includes(orig)
    ) {
      issueTemplatePaths.push(orig);
    }
  }

  let pullRequestTemplatePath: string | null = null;
  for (const [lower, orig] of githubLowerMap.entries()) {
    if (lower.startsWith('pull_request_template')) {
      pullRequestTemplatePath = orig;
      break;
    }
  }
  if (!pullRequestTemplatePath) {
    for (const [lower, orig] of rootLowerMap.entries()) {
      if (lower.startsWith('pull_request_template')) {
        pullRequestTemplatePath = orig;
        break;
      }
    }
  }
  if (!pullRequestTemplatePath) {
    for (const [lower, orig] of docsLowerMap.entries()) {
      if (lower.startsWith('pull_request_template')) {
        pullRequestTemplatePath = orig;
        break;
      }
    }
  }
  if (!pullRequestTemplatePath) {
    for (const [lower, orig] of treeLowerMap.entries()) {
      if (
        lower === '.github/pull_request_template.md' ||
        lower.startsWith('.github/pull_request_template/') ||
        lower === 'pull_request_template.md' ||
        lower === 'docs/pull_request_template.md'
      ) {
        pullRequestTemplatePath = orig;
        break;
      }
    }
  }

  const hasIssueTemplates = issueTemplatePaths.length > 0;
  const hasPullRequestTemplate = Boolean(pullRequestTemplatePath);

  const communityAnalysis: CommunityHealthAnalysis = {
    hasContributing: Boolean(contributingPath),
    contributingPath,
    hasSecurityPolicy: Boolean(securityPolicyPath),
    securityPolicyPath,
    hasCodeOfConduct: Boolean(codeOfConductPath),
    codeOfConductPath,
    hasIssueTemplates,
    issueTemplatePaths,
    hasPullRequestTemplate,
    pullRequestTemplatePath,
    hasSupportFile: Boolean(supportPath),
  };

  // 4. Activity Analysis
  const pushedIso = input.repo.pushed_at || input.repo.updated_at || '';
  const pushedDate = pushedIso ? new Date(pushedIso) : now;
  const diffMs = Math.max(0, now.getTime() - pushedDate.getTime());
  const daysSinceLastPush = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const recentCommits = (input.commits || []).slice(0, 15).map((c) => ({
    sha: (c.sha || '').slice(0, 7),
    message: (c.commit?.message || '').split('\n')[0].slice(0, 120),
    author: c.author?.login || c.commit?.author?.name || 'unknown',
    date: c.commit?.author?.date || input.repo.pushed_at,
    url: c.html_url || `${input.repo.html_url}/commit/${c.sha}`,
  }));

  const headCommitSha =
    input.headCommitSha ||
    (input.commits && input.commits.length > 0 && input.commits[0].sha
      ? input.commits[0].sha
      : null);

  const weekBuckets = [
    { label: '4w ago', commits: 0 },
    { label: '3w ago', commits: 0 },
    { label: '2w ago', commits: 0 },
    { label: 'This week', commits: 0 },
  ];
  for (const c of input.commits || []) {
    const cDate = new Date(c.commit?.author?.date || now.toISOString());
    const ageDays = Math.floor(
      Math.max(0, now.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (ageDays <= 7) weekBuckets[3].commits++;
    else if (ageDays <= 14) weekBuckets[2].commits++;
    else if (ageDays <= 21) weekBuckets[1].commits++;
    else weekBuckets[0].commits++;
  }

  const pureIssues = (input.issues || []).filter((i) => !i.pull_request);
  const recentIssues = pureIssues.slice(0, 10).map((iss) => ({
    number: iss.number,
    title: iss.title,
    state: iss.state,
    createdAt: iss.created_at,
    author: iss.user?.login || 'user',
    url: iss.html_url,
    labels: (iss.labels || [])
      .map((l) => (typeof l === 'string' ? l : l.name || ''))
      .filter(Boolean),
  }));

  const activityAnalysis: ActivityAnalysis = {
    isArchived: Boolean(input.repo.archived),
    isDisabled: Boolean(input.repo.disabled),
    lastPushedAt: input.repo.pushed_at || input.repo.updated_at,
    daysSinceLastPush,
    recentCommitCount: (input.commits || []).length,
    recentCommits,
    openIssuesCount: input.repo.open_issues_count ?? pureIssues.length,
    recentIssues,
    commitFrequencyByWeek: weekBuckets,
    hasDescription: Boolean(
      input.repo.description && input.repo.description.trim().length >= 10
    ),
    topicsCount: (input.repo.topics || []).length,
  };

  // 5. Structure Analysis
  const manifestPatterns = [
    'package.json',
    'cargo.toml',
    'pyproject.toml',
    'requirements.txt',
    'setup.py',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'composer.json',
    'gemfile',
    'makefile',
    'cmakelists.txt',
    'mix.exs',
    'deno.json',
    'deno.jsonc',
    'pubspec.yaml',
    'package.swift',
  ];
  const sourceDirPatterns = [
    'src',
    'lib',
    'app',
    'pkg',
    'cmd',
    'packages',
    'core',
    'server',
    'client',
    'components',
    'crates',
    'modules',
    'internal',
    'include',
    'bin',
  ];
  const testPatterns = [
    'test',
    'tests',
    '__tests__',
    'spec',
    'vitest.config.ts',
    'vitest.config.js',
    'jest.config.js',
    'jest.config.ts',
    'playwright.config.ts',
    'pytest.ini',
  ];
  const antiPatternFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'node_modules',
    '.ds_store',
    'id_rsa',
  ];

  const detectedManifests = rootEntries
    .filter((e) => manifestPatterns.includes(e.name.toLowerCase()))
    .map((e) => e.name);

  const detectedSourceDirs = rootEntries
    .filter((e) => e.type === 'dir' && sourceDirPatterns.includes(e.name.toLowerCase()))
    .map((e) => e.name);

  const hasTestDirectoryOrConfig =
    rootEntries.some((e) => testPatterns.includes(e.name.toLowerCase())) ||
    workflowEntries.some((w) => /test|ci|build|check/i.test(w.name)) ||
    rawTreePaths.some((p) => /\.(test|spec)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(p));

  const committedAntiPatterns = rootEntries
    .filter((e) => antiPatternFiles.includes(e.name.toLowerCase()))
    .map((e) => e.path || e.name);

  // Also check recursive tree for committed anti-patterns outside test/fixture/playground/example directories
  for (const p of rawTreePaths) {
    if (/(^|\/)(__tests__|test|tests|fixtures|playground|examples)\//i.test(p)) {
      continue;
    }
    const base = p.split('/').pop()?.toLowerCase() || '';
    if (
      (base === '.env' ||
        base === '.ds_store' ||
        base === 'id_rsa' ||
        p.startsWith('node_modules/')) &&
      !committedAntiPatterns.includes(p)
    ) {
      committedAntiPatterns.push(p);
    }
  }

  const ciWorkflowFiles: string[] = workflowEntries
    .filter((w) => /\.(yml|yaml)$/i.test(w.name))
    .map((w) => w.path);

  for (const p of rawTreePaths) {
    if (
      /^\.github\/workflows\/[^/]+\.(yml|yaml)$/i.test(p) &&
      !ciWorkflowFiles.includes(p)
    ) {
      ciWorkflowFiles.push(p);
    }
  }

  const rootCiFiles = [
    '.gitlab-ci.yml',
    '.travis.yml',
    'jenkinsfile',
    'azure-pipelines.yml',
    '.circleci',
  ]
    .filter((k) => rootLowerMap.has(k))
    .map((k) => rootLowerMap.get(k) || k);

  for (const f of rootCiFiles) {
    if (!ciWorkflowFiles.includes(f)) {
      ciWorkflowFiles.push(f);
    }
  }

  const hasCiWorkflows = ciWorkflowFiles.length > 0;

  let changelogPath: string | null = null;
  for (const [lower, orig] of rootLowerMap.entries()) {
    if (/^(changelog|history|releases|news)(\.(md|txt|rst))?$/i.test(lower)) {
      changelogPath = orig;
      break;
    }
  }
  if (!changelogPath) {
    for (const [lower, orig] of docsLowerMap.entries()) {
      if (/^(changelog|history|releases|news)(\.(md|txt|rst))?$/i.test(lower)) {
        changelogPath = orig;
        break;
      }
    }
  }
  if (!changelogPath) {
    for (const [lower, orig] of treeLowerMap.entries()) {
      const base = lower.split('/').pop() || '';
      if (/^(changelog|history|releases|news)(\.(md|txt|rst))?$/i.test(base)) {
        changelogPath = orig;
        break;
      }
    }
  }
  const hasChangelog = Boolean(changelogPath);

  const docsDirEntry =
    rootLowerMap.get('docs') ||
    rootLowerMap.get('documentation') ||
    rootLowerMap.get('website') ||
    null;
  const homepageUrl =
    input.repo.homepage && input.repo.homepage.trim() ? input.repo.homepage.trim() : null;
  const hasDocsDirectory = Boolean(docsDirEntry || homepageUrl);
  const docsEvidence =
    docsDirEntry && homepageUrl
      ? `${docsDirEntry}/ directory & homepage (${homepageUrl})`
      : docsDirEntry
      ? `${docsDirEntry}/ directory`
      : homepageUrl
      ? `Homepage (${homepageUrl})`
      : null;

  const structureAnalysis: StructureAnalysis = {
    totalRootEntries: rootEntries.length,
    fileCount: rootEntries.filter((e) => e.type === 'file').length,
    directoryCount: rootEntries.filter((e) => e.type === 'dir').length,
    hasGitignore: rootLowerMap.has('.gitignore') || treePathsSet.has('.gitignore'),
    hasCiWorkflows,
    ciWorkflowFiles,
    hasManifest: detectedManifests.length > 0,
    detectedManifests,
    hasSourceDirectory: detectedSourceDirs.length > 0,
    detectedSourceDirs,
    hasTestDirectoryOrConfig,
    hasChangelog,
    changelogPath,
    hasDocsDirectory,
    docsEvidence,
    hasEnvExample:
      rootLowerMap.has('.env.example') ||
      rootLowerMap.has('.env.sample') ||
      rootLowerMap.has('.env.template'),
    committedAntiPatterns,
    rootEntries: rootEntries.map((e) => ({
      name: e.name,
      type: e.type === 'dir' ? 'dir' : 'file',
      size: e.size || 0,
      path: e.path,
    })),
  };

  // 6. Broken Documentation Link Checker
  const rootPathsSet = new Set<string>(Array.from(rootLowerMap.keys()));
  const knownSubPathsSet = new Set<string>([
    ...Array.from(githubLowerMap.values()).map((val) => val.toLowerCase()),
    ...Array.from(docsLowerMap.values()).map((val) => val.toLowerCase()),
    ...workflowEntries.map((w) => w.path.toLowerCase()),
  ]);

  const brokenLinksList = extractAndCheckReadmeLinks(
    input.readme.content || '',
    rootPathsSet,
    knownSubPathsSet,
    input.verifiedExternalLinks || {},
    treePathsSet.size > 0 ? treePathsSet : undefined
  );
  const brokenLinks = brokenLinksList.filter((l) => l.status === 'broken');
  const validLinks = brokenLinksList.filter((l) => l.status === 'valid');
  const unverifiedLinks = brokenLinksList.filter((l) => l.status === 'unverified');

  // ============================================================================
  // DETERMINISTIC HEALTH SCORING (0 - 100 POINTS ACROSS 22 VERIFIABLE CHECKS)
  // ============================================================================
  const checks: CheckItem[] = [];
  const deductions: ScoreDeduction[] = [];
  const recommendations: RecommendationItem[] = [];

  const addCheck = (
    item: Omit<CheckItem, 'passed'> & { passed?: boolean },
    actionSteps?: string[],
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    // Never award raw points for NOT_VERIFIED or NOT_APPLICABLE checks
    const effectiveScore =
      item.status === 'NOT_VERIFIED' || item.status === 'NOT_APPLICABLE'
        ? 0
        : item.scoreAwarded;
    const finalized: CheckItem = {
      ...item,
      scoreAwarded: effectiveScore,
      passed: item.status === 'PASS',
      evidence:
        item.evidence && item.evidence.length > 0
          ? item.evidence
          : [item.details],
    };
    checks.push(finalized);

    // NOT_APPLICABLE checks are excluded from applicableMaxScore and do NOT generate penalties/deductions
    if (finalized.status === 'NOT_APPLICABLE') {
      return;
    }

    const lost = finalized.maxScore - finalized.scoreAwarded;
    if (lost > 0) {
      const defaultUnverifiedReason = `Check could not be verified from GitHub API data; 0/${finalized.maxScore} points awarded (-${lost} pts).`;
      deductions.push({
        id: `deduct-${finalized.id}`,
        category: finalized.category,
        title: finalized.title,
        status: finalized.status,
        pointsLost: lost,
        maxPoints: finalized.maxScore,
        reason:
          finalized.status === 'NOT_VERIFIED'
            ? finalized.deductionReason || defaultUnverifiedReason
            : finalized.deductionReason || finalized.details,
        remediation:
          finalized.recommendation || 'Address this check to recover points.',
      });
      if (finalized.recommendation) {
        recommendations.push({
          id: `rec-${finalized.id}`,
          priority: lost >= 5 ? 'high' : priority,
          category: finalized.category,
          moduleName: finalized.moduleName,
          title: finalized.title,
          impactPoints: lost,
          description: finalized.recommendation,
          actionSteps: actionSteps || [finalized.recommendation],
        });
      }
    }
  };

  // --- CATEGORY 1: README QUALITY (25 POINTS — 6 CHECKS) ---
  // Check 1: readme-exists (5 pts)
  addCheck(
    {
      id: 'readme-exists',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'Root README File Present',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : readmeAnalysis.exists
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !v.readmeVerified ? 0 : readmeAnalysis.exists ? 5 : 0,
      maxScore: 5,
      scoringRule:
        'Awards 5/5 pts if a non-empty root README file is verified via GET /repos/:owner/:repo/readme; 0/5 pts if missing or unverified.',
      details: !v.readmeVerified
        ? 'README endpoint could not be verified due to an upstream GitHub API error or timeout.'
        : readmeAnalysis.exists
        ? `Found ${readmeAnalysis.fileName} (${readmeAnalysis.wordCount} words, ${readmeAnalysis.charCount} chars).`
        : 'No README file found in the repository root.',
      evidence: !v.readmeVerified
        ? ['GET /repos/:owner/:repo/readme failed or timed out — status: NOT VERIFIED (0 pts awarded).']
        : readmeAnalysis.exists
        ? [
            `GET /repos/${input.repo.full_name}/readme -> ${readmeAnalysis.fileName}`,
            `Verified size: ${readmeAnalysis.charCount} characters, ${readmeAnalysis.wordCount} words, ${readmeAnalysis.lineCount} lines`,
          ]
        : [`GET /repos/${input.repo.full_name}/readme returned HTTP 404 (no root README file present)`],
      deductionReason: !v.readmeVerified
        ? 'README presence could not be verified from GitHub API (-5 pts).'
        : 'Missing root README.md file (-5 pts).',
      recommendation:
        'Create a comprehensive README.md in the repository root explaining project purpose, setup, and usage.',
    },
    [
      'Create a README.md file in the root directory.',
      'Include a clear project title, summary, and value proposition.',
    ],
    'high'
  );

  // Check 2: readme-depth (5 pts)
  const lengthScore = !v.readmeVerified
    ? 0
    : readmeAnalysis.charCount >= 800
    ? 5
    : readmeAnalysis.charCount >= 300
    ? 2
    : 0;
  addCheck(
    {
      id: 'readme-depth',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'README Depth & Completeness',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : lengthScore === 5
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: lengthScore,
      maxScore: 5,
      scoringRule:
        'Awards 5/5 pts for >= 800 characters, 2/5 pts for 300–799 characters, and 0/5 pts for < 300 characters.',
      details: !v.readmeVerified
        ? 'Cannot verify README depth because README retrieval failed.'
        : readmeAnalysis.exists
        ? `README contains ${readmeAnalysis.charCount} characters (${readmeAnalysis.wordCount} words). Threshold for full score is 800+ characters.`
        : 'Cannot evaluate depth because no README file exists in the repository.',
      evidence: !v.readmeVerified
        ? ['README content unverified; 0 points awarded.']
        : readmeAnalysis.exists
        ? [
            `Measured length: ${readmeAnalysis.charCount} characters, ${readmeAnalysis.wordCount} words, ${readmeAnalysis.lineCount} lines`,
            `Rubric threshold: >= 800 chars (5/5 pts), 300–799 chars (2/5 pts), < 300 chars (0/5 pts)`,
          ]
        : ['README file is absent (0 characters, 0 words).'],
      deductionReason: !v.readmeVerified
        ? 'README depth could not be verified (-5 pts).'
        : lengthScore === 2
        ? `README is brief (${readmeAnalysis.charCount} chars < 800 chars recommended) (-3 pts).`
        : 'README is missing or under 300 characters (-5 pts).',
      recommendation:
        'Expand README documentation to at least 800 characters covering architecture, setup, and examples.',
    },
    [
      'Expand project overview and architecture notes.',
      'Document configuration environment variables and CLI/API commands.',
    ]
  );

  // Check 3: readme-structure (4 pts)
  const headingScore = !v.readmeVerified
    ? 0
    : readmeAnalysis.headingCount >= 3
    ? 4
    : readmeAnalysis.headingCount >= 1
    ? 2
    : 0;
  addCheck(
    {
      id: 'readme-structure',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'Structured Markdown Sections',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : headingScore === 4
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: headingScore,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts for >= 3 Markdown headings outside fenced code blocks, 2/4 pts for 1–2 headings, and 0/4 pts for 0 headings.',
      details: !v.readmeVerified
        ? 'Cannot verify Markdown headings because README retrieval failed.'
        : `Detected ${readmeAnalysis.headingCount} Markdown section heading(s).`,
      evidence: !v.readmeVerified
        ? ['README content unverified; 0 points awarded.']
        : readmeAnalysis.headingCount > 0
        ? [
            `Heading count: ${readmeAnalysis.headingCount} (full score requires >= 3 headings)`,
            `Sample headings: ${readmeAnalysis.headings
              .slice(0, 6)
              .map((h) => `"${h}"`)
              .join(', ')}`,
          ]
        : ['0 Markdown headings (#..######) detected in README content.'],
      deductionReason: !v.readmeVerified
        ? 'README section structure could not be verified (-4 pts).'
        : headingScore === 2
        ? `Only ${readmeAnalysis.headingCount} section heading(s) found; at least 3 structured headings recommended (-2 pts).`
        : 'No Markdown section headings (# / ##) detected in README (-4 pts).',
      recommendation:
        'Organize README content with clear ## Markdown headings for Features, Installation, Usage, and License.',
    },
    ['Add ## Features, ## Installation, ## Usage, and ## Contributing sections to README.md.']
  );

  // Check 4: readme-install (4 pts)
  addCheck(
    {
      id: 'readme-install',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'Installation & Setup Instructions',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : readmeAnalysis.hasInstallationSection
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !v.readmeVerified ? 0 : readmeAnalysis.hasInstallationSection ? 4 : 0,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts if README contains an installation/setup/getting-started heading or standard package manager/clone commands; 0/4 pts otherwise.',
      details: !v.readmeVerified
        ? 'Cannot verify installation instructions because README retrieval failed.'
        : readmeAnalysis.hasInstallationSection
        ? 'Installation / Getting Started instructions detected in README.'
        : 'No installation heading or package setup commands detected in README.',
      evidence: !v.readmeVerified
        ? ['README content unverified; 0 points awarded.']
        : readmeAnalysis.hasInstallationSection
        ? [
            installHeadingMatch
              ? `Matched setup heading: "${installHeadingMatch}"`
              : 'No explicit setup heading, but setup commands found in body',
            installCmdMatch
              ? `Detected setup command token: "${installCmdMatch[0]}"`
              : 'Setup instructions present in section body',
          ]
        : [
            'Scanned README headings for install/setup/getting-started/build keywords: none matched',
            'Scanned README body for package manager or clone commands: none matched',
          ],
      deductionReason: !v.readmeVerified
        ? 'README installation section could not be verified (-4 pts).'
        : 'README lacks an Installation / Getting Started section or package install commands (-4 pts).',
      recommendation:
        'Add a dedicated "## Installation" or "## Getting Started" section with step-by-step commands.',
    },
    [
      'Add a "## Installation" heading in README.md.',
      'Provide exact clone, dependency install, and startup commands.',
    ]
  );

  // Check 5: readme-usage (4 pts)
  addCheck(
    {
      id: 'readme-usage',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'Usage Examples & Code Blocks',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : readmeAnalysis.hasUsageSection
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !v.readmeVerified ? 0 : readmeAnalysis.hasUsageSection ? 4 : 0,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts if README includes a usage/examples/API/CLI section or at least 1 fenced code block (```); 0/4 pts otherwise.',
      details: !v.readmeVerified
        ? 'Cannot verify usage examples because README retrieval failed.'
        : readmeAnalysis.hasUsageSection
        ? `Usage guide detected with ${readmeAnalysis.codeBlockCount} fenced code block(s).`
        : 'No usage section or fenced code blocks detected in README.',
      evidence: !v.readmeVerified
        ? ['README content unverified; 0 points awarded.']
        : readmeAnalysis.hasUsageSection
        ? [
            usageHeadingMatch
              ? `Matched usage/documentation heading: "${usageHeadingMatch}"`
              : 'Usage demonstrated via fenced code blocks',
            `Fenced code blocks (\`\`\`): ${readmeAnalysis.codeBlockCount}`,
          ]
        : [
            'No usage/examples/API/CLI heading found in README',
            `Fenced code blocks (\`\`\`): ${readmeAnalysis.codeBlockCount}`,
          ],
      deductionReason: !v.readmeVerified
        ? 'README usage section could not be verified (-4 pts).'
        : 'README lacks usage documentation or code examples (-4 pts).',
      recommendation:
        'Include a "## Usage" section with fenced Markdown code blocks demonstrating real workflows.',
    },
    ['Add fenced code blocks (```bash or ```ts) showing how to run or import the project.']
  );

  // Check 6: readme-references (3 pts)
  const refSignals: string[] = [];
  if (readmeAnalysis.hasLicenseSection) refSignals.push('License section/reference');
  if (readmeAnalysis.hasContributingSection) refSignals.push('Contributing section/reference');
  if (readmeAnalysis.hasBadgesOrImages) {
    refSignals.push(`${imageMatches.length} badge(s)/image(s)`);
  }
  const refScore = !v.readmeVerified
    ? 0
    : refSignals.length >= 2
    ? 3
    : refSignals.length === 1
    ? 1
    : 0;
  addCheck(
    {
      id: 'readme-references',
      category: 'readme',
      moduleName: 'README Quality Checker',
      title: 'Visuals, Badges, & Governance References',
      status: !v.readmeVerified
        ? 'NOT_VERIFIED'
        : refScore === 3
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: refScore,
      maxScore: 3,
      scoringRule:
        'Evaluates 3 signals in README (License reference, Contributing reference, and badges/images): awards 3/3 pts for >= 2 signals, 1/3 pt for 1 signal, and 0/3 pts for 0 signals.',
      details: !v.readmeVerified
        ? 'Cannot verify README references because README retrieval failed.'
        : refScore === 3
        ? `README includes governance references and/or visual assets (${refSignals.join(', ')}).`
        : refScore === 1
        ? `Partial coverage: found ${refSignals.join(', ')}, but missing complete governance/visual references.`
        : 'README lacks screenshots/badges and does not reference licensing or contribution guidelines.',
      evidence: !v.readmeVerified
        ? ['README content unverified; 0 points awarded.']
        : [
            `License reference in README: ${readmeAnalysis.hasLicenseSection ? 'Yes' : 'No'}`,
            `Contributing reference in README: ${readmeAnalysis.hasContributingSection ? 'Yes' : 'No'}`,
            `Embedded images/badges in README: ${imageMatches.length}`,
          ],
      deductionReason: !v.readmeVerified
        ? 'README governance and visual references could not be verified (-3 pts).'
        : refScore === 1
        ? `Only 1 of 3 governance/visual signals found in README (${refSignals.join(', ')}) (-2 pts).`
        : 'No screenshots/badges or License/Contributing references found in README (-3 pts).',
      recommendation:
        'Add architecture diagrams/badges and explicit links to LICENSE and CONTRIBUTING.md in your README.',
    },
    [
      'Link to LICENSE and CONTRIBUTING.md at the bottom of README.md.',
      'Include a screenshot, status badge, or architecture diagram.',
    ]
  );

  // --- CATEGORY 2: LICENSE (15 POINTS — 2 CHECKS) ---
  const licenseSourceVerified = Boolean(input.repo.license) || v.rootContentsVerified;
  // Check 7: license-present (10 pts)
  addCheck(
    {
      id: 'license-present',
      category: 'license',
      moduleName: 'License Detector',
      title: 'Repository License Present',
      status: !licenseSourceVerified
        ? 'NOT_VERIFIED'
        : licenseAnalysis.exists
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !licenseSourceVerified ? 0 : licenseAnalysis.exists ? 10 : 0,
      maxScore: 10,
      scoringRule:
        'Awards 10/10 pts if GitHub API repo.license is populated or a root LICENSE/COPYING file exists; 0/10 pts otherwise.',
      details: !licenseSourceVerified
        ? 'License presence could not be verified because repository root listing failed.'
        : licenseAnalysis.exists
        ? `Detected license: ${licenseAnalysis.name}${
            licenseAnalysis.fileFound ? ` (${licenseAnalysis.fileFound})` : ''
          }.`
        : 'No LICENSE file or GitHub license metadata found.',
      evidence: !licenseSourceVerified
        ? ['repo.license is null and GET /contents failed; 0 points awarded.']
        : licenseAnalysis.exists
        ? [
            `GitHub API repo.license: ${
              ghLicense
                ? `${ghLicense.name} (key: ${ghLicense.key}, spdx_id: ${ghLicense.spdx_id})`
                : 'null'
            }`,
            `Repository license file: ${
              licenseAnalysis.fileFound || 'detected via GitHub license API'
            }`,
          ]
        : [
            'GitHub API repo.license = null',
            'Root directory scan: no LICENSE, LICENCE, or COPYING file found',
          ],
      deductionReason: !licenseSourceVerified
        ? 'Repository license could not be verified (-10 pts).'
        : 'Repository has no LICENSE file; unlicensed code is legally restricted from open-source reuse (-10 pts).',
      recommendation:
        'Add a root LICENSE file (such as the MIT or Apache-2.0 license) so developers know their legal rights.',
    },
    [
      'Create a LICENSE file in the root directory.',
      'Use a standard open-source license template such as MIT or Apache-2.0.',
    ],
    'high'
  );

  // Check 8: license-spdx (5 pts)
  addCheck(
    {
      id: 'license-spdx',
      category: 'license',
      moduleName: 'License Detector',
      title: 'Standard SPDX / OSI-Approved License',
      status: !licenseSourceVerified
        ? 'NOT_VERIFIED'
        : licenseAnalysis.isOsiApproved
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !licenseSourceVerified ? 0 : licenseAnalysis.isOsiApproved ? 5 : 0,
      maxScore: 5,
      scoringRule:
        'Awards 5/5 pts if GitHub API repo.license.spdx_id matches a recognized OSI-approved SPDX identifier (e.g., MIT, Apache-2.0, GPL-3.0, BSD-3-Clause); 0/5 pts if custom/NOASSERTION or missing.',
      details: !licenseSourceVerified
        ? 'SPDX compliance could not be verified.'
        : licenseAnalysis.isOsiApproved
        ? `Recognized OSI-approved SPDX identifier: ${licenseAnalysis.spdxId}.`
        : licenseAnalysis.exists
        ? `License SPDX identifier (${ghLicense?.spdx_id || 'NOASSERTION'}) is custom or unrecognized by GitHub.`
        : 'No license present to verify SPDX compliance.',
      evidence: !licenseSourceVerified
        ? ['License metadata unverified; 0 points awarded.']
        : [
            `GitHub API repo.license.spdx_id = "${ghLicense?.spdx_id || 'null'}"`,
            `OSI-approved SPDX match: ${
              licenseAnalysis.isOsiApproved ? `Yes (${licenseAnalysis.spdxId})` : 'No'
            }`,
          ],
      deductionReason: !licenseSourceVerified
        ? 'SPDX license identifier could not be verified (-5 pts).'
        : licenseAnalysis.exists
        ? 'License file uses custom or modified text that prevents automatic SPDX identification (-5 pts).'
        : 'No standard SPDX open-source license detected (-5 pts).',
      recommendation:
        'Use an unmodified OSI-approved license text (e.g., MIT, Apache-2.0, BSD-3-Clause) so GitHub detects the SPDX ID.',
    },
    [
      'Ensure the LICENSE file matches the exact standard SPDX license template without custom header alterations.',
    ]
  );

  // --- CATEGORY 3: COMMUNITY HEALTH (20 POINTS — 4 CHECKS) ---
  const communitySourcesVerified = v.rootContentsVerified && v.githubDirVerified;

  // Check 9: community-contributing (6 pts)
  const contribVerified = communityAnalysis.hasContributing || communitySourcesVerified;
  addCheck(
    {
      id: 'community-contributing',
      category: 'community',
      moduleName: 'Contribution Guidelines Checker',
      title: 'Contribution Guidelines (CONTRIBUTING.md)',
      status: !contribVerified
        ? 'NOT_VERIFIED'
        : communityAnalysis.hasContributing
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !contribVerified ? 0 : communityAnalysis.hasContributing ? 6 : 0,
      maxScore: 6,
      scoringRule:
        'Awards 6/6 pts if CONTRIBUTING(.md|.txt|.rst|.adoc) is present in /, .github/, or docs/; 0/6 pts otherwise.',
      details: !contribVerified
        ? 'Contribution guidelines could not be verified because directory listings failed.'
        : communityAnalysis.hasContributing
        ? `Found contribution guidelines at ${communityAnalysis.contributingPath}.`
        : 'No CONTRIBUTING.md found in root, .github/, or docs/.',
      evidence: !contribVerified
        ? ['Root or .github directory listing failed; 0 points awarded.']
        : communityAnalysis.hasContributing
        ? [`Verified file path in repository tree: ${communityAnalysis.contributingPath}`]
        : [
            'Checked /, .github/, and docs/ directories: no CONTRIBUTING(.md|.txt|.rst|.adoc) file found',
          ],
      deductionReason: !contribVerified
        ? 'CONTRIBUTING.md could not be verified (-6 pts).'
        : 'Missing CONTRIBUTING.md guidelines for external contributors (-6 pts).',
      recommendation:
        'Add a CONTRIBUTING.md file detailing branch naming, test requirements, and pull request workflows.',
    },
    [
      'Create CONTRIBUTING.md in the root or .github/ directory.',
      'Document local development setup, linting/testing commands, and PR conventions.',
    ],
    'high'
  );

  // Check 10: community-security (6 pts)
  const securityVerified = communityAnalysis.hasSecurityPolicy || communitySourcesVerified;
  addCheck(
    {
      id: 'community-security',
      category: 'community',
      moduleName: 'Security Policy Checker',
      title: 'Vulnerability Disclosure Policy (SECURITY.md)',
      status: !securityVerified
        ? 'NOT_VERIFIED'
        : communityAnalysis.hasSecurityPolicy
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !securityVerified ? 0 : communityAnalysis.hasSecurityPolicy ? 6 : 0,
      maxScore: 6,
      scoringRule:
        'Awards 6/6 pts if SECURITY(.md|.txt|.rst|.adoc) is present in /, .github/, or docs/; 0/6 pts otherwise.',
      details: !securityVerified
        ? 'Security policy could not be verified because directory listings failed.'
        : communityAnalysis.hasSecurityPolicy
        ? `Found security policy at ${communityAnalysis.securityPolicyPath}.`
        : 'No SECURITY.md found in root, .github/, or docs/.',
      evidence: !securityVerified
        ? ['Root or .github directory listing failed; 0 points awarded.']
        : communityAnalysis.hasSecurityPolicy
        ? [`Verified file path in repository tree: ${communityAnalysis.securityPolicyPath}`]
        : [
            'Checked /, .github/, and docs/ directories: no SECURITY(.md|.txt|.rst|.adoc) file found',
          ],
      deductionReason: !securityVerified
        ? 'SECURITY.md could not be verified (-6 pts).'
        : 'Missing SECURITY.md vulnerability reporting policy (-6 pts).',
      recommendation:
        'Add a SECURITY.md file defining supported versions and private vulnerability reporting channels.',
    },
    [
      'Create SECURITY.md in the root or .github/ directory.',
      'Specify how security researchers should privately report vulnerabilities instead of opening public issues.',
    ],
    'high'
  );

  // Check 11: community-coc (4 pts)
  const cocVerified = communityAnalysis.hasCodeOfConduct || communitySourcesVerified;
  addCheck(
    {
      id: 'community-coc',
      category: 'community',
      moduleName: 'Contribution Guidelines Checker',
      title: 'Code of Conduct (CODE_OF_CONDUCT.md)',
      status: !cocVerified
        ? 'NOT_VERIFIED'
        : communityAnalysis.hasCodeOfConduct
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !cocVerified ? 0 : communityAnalysis.hasCodeOfConduct ? 4 : 0,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts if CODE_OF_CONDUCT(.md|.txt|.rst|.adoc) is present in /, .github/, or docs/; 0/4 pts otherwise.',
      details: !cocVerified
        ? 'Code of Conduct could not be verified because directory listings failed.'
        : communityAnalysis.hasCodeOfConduct
        ? `Found Code of Conduct at ${communityAnalysis.codeOfConductPath}.`
        : 'No CODE_OF_CONDUCT.md found in root, .github/, or docs/.',
      evidence: !cocVerified
        ? ['Root or .github directory listing failed; 0 points awarded.']
        : communityAnalysis.hasCodeOfConduct
        ? [`Verified file path in repository tree: ${communityAnalysis.codeOfConductPath}`]
        : [
            'Checked /, .github/, and docs/ directories: no CODE_OF_CONDUCT(.md|.txt|.rst|.adoc) file found',
          ],
      deductionReason: !cocVerified
        ? 'CODE_OF_CONDUCT.md could not be verified (-4 pts).'
        : 'Missing CODE_OF_CONDUCT.md community standards file (-4 pts).',
      recommendation:
        'Adopt the Contributor Covenant in CODE_OF_CONDUCT.md to establish welcoming community standards.',
    },
    ['Add CODE_OF_CONDUCT.md using the Contributor Covenant v2.1 template.']
  );

  // Check 12: community-templates (4 pts)
  const hasAnyTemplates =
    communityAnalysis.hasIssueTemplates || communityAnalysis.hasPullRequestTemplate;
  const templatesVerified = hasAnyTemplates || communitySourcesVerified;
  const templateScore = !templatesVerified
    ? 0
    : communityAnalysis.hasIssueTemplates && communityAnalysis.hasPullRequestTemplate
    ? 4
    : hasAnyTemplates
    ? 2
    : 0;
  addCheck(
    {
      id: 'community-templates',
      category: 'community',
      moduleName: 'Contribution Guidelines Checker',
      title: 'Issue & Pull Request Templates',
      status: !templatesVerified
        ? 'NOT_VERIFIED'
        : templateScore === 4
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: templateScore,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts when both Issue templates and a Pull Request template exist, 2/4 pts when only one exists, and 0/4 pts when neither exists.',
      details: !templatesVerified
        ? 'Issue and PR templates could not be verified because .github/ directory listing failed.'
        : templateScore === 4
        ? 'Both Issue templates and Pull Request template are configured.'
        : templateScore === 2
        ? 'Partial template coverage (either Issue template or PR template is present, not both).'
        : 'No Issue templates or Pull Request templates detected in .github/ or root.',
      evidence: !templatesVerified
        ? ['.github directory listing failed; 0 points awarded.']
        : [
            `Issue template(s): ${
              communityAnalysis.hasIssueTemplates
                ? issueTemplatePaths.slice(0, 4).join(', ')
                : 'none found'
            }`,
            `Pull Request template: ${
              communityAnalysis.hasPullRequestTemplate
                ? pullRequestTemplatePath
                : 'none found'
            }`,
          ],
      deductionReason: !templatesVerified
        ? 'Issue & PR templates could not be verified (-4 pts).'
        : templateScore === 2
        ? `Missing ${
            communityAnalysis.hasIssueTemplates
              ? 'Pull Request template (.github/PULL_REQUEST_TEMPLATE.md)'
              : 'Issue templates (.github/ISSUE_TEMPLATE)'
          } (-2 pts).`
        : 'Missing both .github/ISSUE_TEMPLATE and .github/PULL_REQUEST_TEMPLATE.md (-4 pts).',
      recommendation:
        'Add structured Issue Templates and a Pull Request Template under .github/ to standardize submissions.',
    },
    [
      'Create .github/ISSUE_TEMPLATE/bug_report.md and feature_request.md.',
      'Create .github/PULL_REQUEST_TEMPLATE.md with a verification checklist.',
    ]
  );

  // --- CATEGORY 4: REPOSITORY ACTIVITY (20 POINTS — 4 CHECKS) ---
  // Check 13: activity-status (5 pts)
  const activeStatus = !activityAnalysis.isArchived && !activityAnalysis.isDisabled;
  addCheck(
    {
      id: 'activity-status',
      category: 'activity',
      moduleName: 'GitHub Activity Analyzer',
      title: 'Active Maintenance Status',
      status: activeStatus ? 'PASS' : 'FAIL',
      scoreAwarded: activeStatus ? 5 : 0,
      maxScore: 5,
      scoringRule:
        'Awards 5/5 pts if repo.archived is false and repo.disabled is false; 0/5 pts if archived or disabled.',
      details: activeStatus
        ? 'Repository is active and open for contributions.'
        : 'Repository is marked as archived or disabled on GitHub.',
      evidence: [
        `GitHub API repo.archived = ${Boolean(input.repo.archived)}`,
        `GitHub API repo.disabled = ${Boolean(input.repo.disabled)}`,
        `GitHub API repo.visibility = "${input.repo.visibility || 'public'}"`,
      ],
      deductionReason: 'Repository is archived or disabled (-5 pts).',
      recommendation:
        'Unarchive the repository or direct users to an actively maintained fork.',
    },
    ['Ensure the repository is actively maintained or clearly document successor packages.']
  );

  // Check 14: activity-recency (8 pts)
  const hasPushTimestamp = Boolean(input.repo.pushed_at || input.repo.updated_at);
  let recencyScore = 0;
  if (hasPushTimestamp) {
    if (daysSinceLastPush <= 30) recencyScore = 8;
    else if (daysSinceLastPush <= 90) recencyScore = 6;
    else if (daysSinceLastPush <= 180) recencyScore = 4;
    else if (daysSinceLastPush <= 365) recencyScore = 2;
  }

  addCheck(
    {
      id: 'activity-recency',
      category: 'activity',
      moduleName: 'GitHub Activity Analyzer',
      title: 'Recent Commit Velocity',
      status: !hasPushTimestamp
        ? 'NOT_VERIFIED'
        : recencyScore === 8
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: recencyScore,
      maxScore: 8,
      scoringRule:
        'Awards 8/8 pts for push within <= 30 days, 6/8 pts for <= 90 days, 4/8 pts for <= 180 days, 2/8 pts for <= 365 days, and 0/8 pts for > 365 days.',
      details: !hasPushTimestamp
        ? 'Repository push timestamp was not provided by GitHub API.'
        : `Last push recorded ${daysSinceLastPush} day(s) ago (${new Date(
            activityAnalysis.lastPushedAt
          )
            .toISOString()
            .slice(0, 10)}).`,
      evidence: !hasPushTimestamp
        ? ['repo.pushed_at is missing; 0 points awarded.']
        : [
            `GitHub API repo.pushed_at = "${input.repo.pushed_at || input.repo.updated_at}"`,
            `Calculated age: ${daysSinceLastPush} day(s) prior to ${now
              .toISOString()
              .slice(0, 10)} (<=30d = 8/8 pts, <=90d = 6/8 pts, <=180d = 4/8 pts, <=365d = 2/8 pts)`,
          ],
      deductionReason: !hasPushTimestamp
        ? 'Push recency could not be verified (-8 pts).'
        : `Last repository push was ${daysSinceLastPush} days ago (> 30 days threshold) (-${
            8 - recencyScore
          } pts).`,
      recommendation:
        'Maintain regular dependency updates, bug fixes, and commit activity at least monthly.',
    },
    ['Review open pull requests and keep dependencies updated regularly.']
  );

  // Check 15: activity-cadence (4 pts)
  const commitCadenceScore = !v.commitsVerified
    ? 0
    : activityAnalysis.recentCommitCount >= 10
    ? 4
    : activityAnalysis.recentCommitCount >= 3
    ? 2
    : 0;
  addCheck(
    {
      id: 'activity-cadence',
      category: 'activity',
      moduleName: 'GitHub Activity Analyzer',
      title: 'Commit History Depth',
      status: !v.commitsVerified
        ? 'NOT_VERIFIED'
        : commitCadenceScore === 4
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: commitCadenceScore,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts for >= 10 commits on the default branch, 2/4 pts for 3–9 commits, and 0/4 pts for < 3 commits.',
      details: !v.commitsVerified
        ? 'Commit history could not be verified because /commits endpoint failed or timed out.'
        : `Analyzed ${activityAnalysis.recentCommitCount} recent commit(s) on default branch (${
            input.repo.default_branch || 'main'
          }).`,
      evidence: !v.commitsVerified
        ? ['GET /repos/:owner/:repo/commits?per_page=15 failed or timed out; 0 points awarded.']
        : recentCommits.length > 0
        ? [
            `GET /repos/${input.repo.full_name}/commits?per_page=15 returned ${activityAnalysis.recentCommitCount} commit(s)`,
            `Latest commit: ${recentCommits[0].sha} on ${new Date(recentCommits[0].date)
              .toISOString()
              .slice(0, 10)} ("${recentCommits[0].message.slice(0, 60)}")`,
          ]
        : [`GET /repos/${input.repo.full_name}/commits returned 0 commits`],
      deductionReason: !v.commitsVerified
        ? 'Commit history depth could not be verified (-4 pts).'
        : `Fewer than 10 commits (${activityAnalysis.recentCommitCount}) found in recent history (-${
            4 - commitCadenceScore
          } pts).`,
      recommendation:
        'Build a consistent atomic commit history rather than single monolithic code dumps.',
    },
    ['Use atomic, descriptive commits following Conventional Commits standards.']
  );

  // Check 16: activity-metadata (3 pts)
  const metadataHygienePass =
    activityAnalysis.hasDescription && activityAnalysis.topicsCount > 0;
  const metadataHygieneScore =
    activityAnalysis.hasDescription && activityAnalysis.topicsCount > 0
      ? 3
      : activityAnalysis.hasDescription || activityAnalysis.topicsCount > 0
      ? 2
      : 0;
  addCheck(
    {
      id: 'activity-metadata',
      category: 'activity',
      moduleName: 'GitHub Activity Analyzer',
      title: 'Repository Description & Discoverability Topics',
      status: metadataHygienePass ? 'PASS' : 'FAIL',
      scoreAwarded: metadataHygieneScore,
      maxScore: 3,
      scoringRule:
        'Awards 3/3 pts if both repo.description (>= 10 chars) and repo.topics (>= 1 topic) are configured, 2/3 pts if only one is configured, and 0/3 pts if neither is configured.',
      details: `Description: ${
        activityAnalysis.hasDescription ? 'Present' : 'Missing'
      } · Topics: ${activityAnalysis.topicsCount} configured.`,
      evidence: [
        `GitHub API repo.description: ${
          input.repo.description
            ? `"${input.repo.description.slice(0, 90)}${
                input.repo.description.length > 90 ? '...' : ''
              }" (${input.repo.description.trim().length} chars)`
            : 'null'
        }`,
        `GitHub API repo.topics (${activityAnalysis.topicsCount}): [${
          (input.repo.topics || []).join(', ') || 'none'
        }]`,
      ],
      deductionReason:
        !activityAnalysis.hasDescription && activityAnalysis.topicsCount === 0
          ? 'Repository is missing both a summary description and GitHub topics (-3 pts).'
          : !activityAnalysis.hasDescription
          ? 'Repository has topics but is missing a summary description (-1 pt).'
          : 'Repository has a description but no GitHub discoverability topics configured (-1 pt).',
      recommendation:
        'Configure a clear repository description and at least 3–5 topic tags in GitHub repository settings.',
    },
    [
      'Add a concise repository description and relevant topic keywords in the GitHub About sidebar.',
    ]
  );

  // --- CATEGORY 5: DOCUMENTATION & LINK INTEGRITY (10 POINTS — 2 CHECKS) ---
  // Check 17: docs-links (6 pts)
  // Requirement 1 & 2: If README exists and has 0 links, mark as NOT_APPLICABLE and do not penalize with 0/6!
  let linkStatus: CheckStatus = 'FAIL';
  let linkScore = 0;

  if (!v.readmeVerified || !v.externalLinksVerified) {
    linkStatus = 'NOT_VERIFIED';
    linkScore = 0;
  } else if (!readmeAnalysis.exists) {
    linkStatus = 'FAIL';
    linkScore = 0;
  } else if (brokenLinksList.length === 0) {
    // README exists and has 0 links -> NOT_APPLICABLE (excluded from applicableMaxScore without penalty)
    linkStatus = 'NOT_APPLICABLE';
    linkScore = 0;
  } else if (brokenLinks.length === 0 && unverifiedLinks.length === 0) {
    linkStatus = 'PASS';
    linkScore = 6;
  } else if (brokenLinks.length === 0 && validLinks.length === 0 && unverifiedLinks.length > 0) {
    linkStatus = 'NOT_VERIFIED';
    linkScore = 0;
  } else if (brokenLinks.length === 0 && unverifiedLinks.length > 0) {
    linkStatus = 'FAIL';
    linkScore = Math.min(
      5,
      Math.max(1, Math.floor((validLinks.length / brokenLinksList.length) * 6))
    );
  } else if (brokenLinks.length <= 2 && validLinks.length > 0) {
    linkStatus = 'FAIL';
    linkScore = 3;
  } else {
    linkStatus = 'FAIL';
    linkScore = 0;
  }

  addCheck(
    {
      id: 'docs-links',
      category: 'documentation',
      moduleName: 'Broken Documentation Link Checker',
      title: 'Documentation Link Integrity',
      status: linkStatus,
      scoreAwarded: linkScore,
      maxScore: 6,
      scoringRule:
        'Awards 6/6 pts when all README links resolve validly, 3/6 pts when 1–2 broken links exist alongside valid links, and 0/6 pts when >= 3 links are broken or README is missing. Marked NOT_APPLICABLE (no penalty) if a valid README contains 0 links.',
      details: !v.readmeVerified || !v.externalLinksVerified
        ? 'Documentation links could not be verified.'
        : !readmeAnalysis.exists
        ? 'No README present to verify documentation links.'
        : brokenLinksList.length === 0
        ? 'README contains 0 Markdown links; broken link check is not applicable (excluded from denominator without penalty).'
        : brokenLinks.length === 0 && unverifiedLinks.length === 0
        ? `Verified all ${validLinks.length} documentation link(s) with 0 broken targets.`
        : brokenLinks.length === 0 && unverifiedLinks.length > 0
        ? `Verified ${validLinks.length} valid link(s), but ${unverifiedLinks.length} link(s) could not be verified.`
        : `Detected ${brokenLinks.length} broken link(s) out of ${brokenLinksList.length} inspected (${validLinks.length} valid, ${unverifiedLinks.length} unverified).`,
      evidence: !readmeAnalysis.exists
        ? ['No README content available to extract links.']
        : brokenLinksList.length === 0
        ? [
            `Scanned ${readmeAnalysis.fileName} (${readmeAnalysis.charCount} chars): 0 Markdown links present — status: NOT_APPLICABLE (excluded from applicable max score without penalty).`,
          ]
        : [
            `Total links extracted: ${brokenLinksList.length} (${validLinks.length} valid, ${brokenLinks.length} broken, ${unverifiedLinks.length} unverified)`,
            ...(validLinks.length > 0
              ? [
                  `Verified valid sample: ${validLinks
                    .slice(0, 4)
                    .map((l) => `${l.url}${l.statusCode ? ` [HTTP ${l.statusCode}]` : ''}`)
                    .join(', ')}`,
                ]
              : []),
            ...(brokenLinks.length > 0
              ? [
                  `Confirmed broken: ${brokenLinks
                    .slice(0, 4)
                    .map((b) => `${b.url} (${b.reason || 'broken'})`)
                    .join(', ')}`,
                ]
              : []),
            ...(unverifiedLinks.length > 0
              ? [
                  `Unverified links (no points awarded): ${unverifiedLinks
                    .slice(0, 3)
                    .map((u) => `${u.url} (${u.reason || 'unverified'})`)
                    .join(', ')}`,
                ]
              : []),
          ],
      deductionReason: !readmeAnalysis.exists
        ? 'Cannot verify links because README is missing (-6 pts).'
        : brokenLinks.length > 0
        ? `Found ${brokenLinks.length} broken documentation link(s) in README (${brokenLinks
            .map((b) => b.url)
            .slice(0, 3)
            .join(', ')}) (-${6 - linkScore} pts).`
        : `${unverifiedLinks.length} documentation link(s) could not be verified (-${
            6 - linkScore
          } pts).`,
      recommendation:
        'Ensure README includes valid documentation links and fix or remove any dead relative paths or unreachable external URLs.',
    },
    brokenLinks.length > 0
      ? brokenLinks.map(
          (b) => `Fix broken link "${b.text}" pointing to ${b.url} (${b.reason || 'unreachable'}).`
        )
      : ['Ensure all documentation links resolve to existing repository files or live HTTPS URLs.'],
    brokenLinks.length > 0 ? 'high' : 'medium'
  );

  // Check 18: docs-changelog (4 pts)
  const docsChangelogVerified =
    v.rootContentsVerified ||
    structureAnalysis.hasChangelog ||
    structureAnalysis.hasDocsDirectory;
  const docsExtrasScore = !docsChangelogVerified
    ? 0
    : structureAnalysis.hasChangelog && structureAnalysis.hasDocsDirectory
    ? 4
    : structureAnalysis.hasChangelog || structureAnalysis.hasDocsDirectory
    ? 2
    : 0;
  addCheck(
    {
      id: 'docs-changelog',
      category: 'documentation',
      moduleName: 'Broken Documentation Link Checker',
      title: 'Changelog & Extended Documentation',
      status: !docsChangelogVerified
        ? 'NOT_VERIFIED'
        : docsExtrasScore === 4
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: docsExtrasScore,
      maxScore: 4,
      scoringRule:
        'Awards 4/4 pts when both a CHANGELOG/releases file and a docs/ directory (or repo.homepage URL) exist, 2/4 pts when only one exists, and 0/4 pts when neither exists.',
      details: !docsChangelogVerified
        ? 'Changelog and documentation directory could not be verified.'
        : `CHANGELOG: ${
            structureAnalysis.hasChangelog ? changelogPath : 'Missing'
          } · Docs/Homepage: ${
            structureAnalysis.hasDocsDirectory ? docsEvidence : 'Missing'
          }.`,
      evidence: !docsChangelogVerified
        ? ['Root directory listing failed; 0 points awarded.']
        : [
            `Changelog file: ${structureAnalysis.hasChangelog ? changelogPath : 'not found'}`,
            `Extended docs / homepage: ${
              structureAnalysis.hasDocsDirectory ? docsEvidence : 'none configured'
            }`,
          ],
      deductionReason: !docsChangelogVerified
        ? 'Changelog and extended documentation could not be verified (-4 pts).'
        : docsExtrasScore === 2
        ? `Missing ${
            structureAnalysis.hasChangelog
              ? 'dedicated docs/ directory or repository homepage URL'
              : 'CHANGELOG.md / release history file'
          } (-2 pts).`
        : 'Neither CHANGELOG.md nor a docs/ directory / homepage URL is present (-4 pts).',
      recommendation:
        'Maintain a CHANGELOG.md file and provide a docs/ directory or documentation website link.',
    },
    [
      'Create CHANGELOG.md following Keep a Changelog and Semantic Versioning.',
      'Add a docs/ folder or configure the repository homepage URL.',
    ]
  );

  // --- CATEGORY 6: REPOSITORY STRUCTURE (10 POINTS — 4 CHECKS) ---
  // Check 19: structure-gitignore (3 pts)
  const gitignoreEntry = rootEntries.find((e) => e.name.toLowerCase() === '.gitignore');
  const gitignoreVerified = v.rootContentsVerified || structureAnalysis.hasGitignore;
  addCheck(
    {
      id: 'structure-gitignore',
      category: 'structure',
      moduleName: 'Repository Structure Analyzer',
      title: 'Version Control Hygiene (.gitignore)',
      status: !gitignoreVerified
        ? 'NOT_VERIFIED'
        : structureAnalysis.hasGitignore
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !gitignoreVerified ? 0 : structureAnalysis.hasGitignore ? 3 : 0,
      maxScore: 3,
      scoringRule:
        'Awards 3/3 pts if a root .gitignore file is verified in the repository tree; 0/3 pts otherwise.',
      details: !gitignoreVerified
        ? '.gitignore presence could not be verified because root listing failed.'
        : structureAnalysis.hasGitignore
        ? '.gitignore file present in repository root.'
        : 'No .gitignore file found in repository root.',
      evidence: !gitignoreVerified
        ? ['Root contents endpoint failed; 0 points awarded.']
        : structureAnalysis.hasGitignore
        ? [
            `Verified root file: ${gitignoreEntry?.path || '.gitignore'}${
              gitignoreEntry?.size ? ` (${gitignoreEntry.size} bytes)` : ''
            }`,
          ]
        : ['Scanned repository root entries: no .gitignore file present'],
      deductionReason: !gitignoreVerified
        ? '.gitignore presence could not be verified (-3 pts).'
        : 'Missing .gitignore file in root directory (-3 pts).',
      recommendation:
        'Add a language-appropriate .gitignore file to prevent committing build artifacts and secrets.',
    },
    ['Add a .gitignore file excluding node_modules/, dist/, .env, and OS metadata files.']
  );

  // Check 20: structure-ci (3 pts)
  const ciVerified =
    structureAnalysis.hasCiWorkflows ||
    (v.rootContentsVerified && v.githubDirVerified && v.workflowsVerified);
  addCheck(
    {
      id: 'structure-ci',
      category: 'structure',
      moduleName: 'Repository Structure Analyzer',
      title: 'Automated CI/CD Workflows',
      status: !ciVerified
        ? 'NOT_VERIFIED'
        : structureAnalysis.hasCiWorkflows
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !ciVerified ? 0 : structureAnalysis.hasCiWorkflows ? 3 : 0,
      maxScore: 3,
      scoringRule:
        'Awards 3/3 pts when >= 1 CI pipeline file (.github/workflows/*.yml, .gitlab-ci.yml, .travis.yml, Jenkinsfile, .circleci) is verified; 0/3 pts otherwise.',
      details: !ciVerified
        ? 'CI workflow configuration could not be verified.'
        : structureAnalysis.hasCiWorkflows
        ? `Detected ${
            structureAnalysis.ciWorkflowFiles.length
          } CI workflow file(s): ${structureAnalysis.ciWorkflowFiles.slice(0, 4).join(', ')}.`
        : 'No GitHub Actions workflow files (.github/workflows/*.yml) or root CI configuration found.',
      evidence: !ciVerified
        ? ['Workflows directory endpoint failed; 0 points awarded.']
        : structureAnalysis.hasCiWorkflows
        ? [
            `Verified CI workflow file(s) (${
              structureAnalysis.ciWorkflowFiles.length
            }): ${structureAnalysis.ciWorkflowFiles.slice(0, 5).join(', ')}`,
          ]
        : [
            'Inspected .github/workflows/ and root CI config files (.gitlab-ci.yml, .travis.yml, Jenkinsfile): 0 workflow files found',
          ],
      deductionReason: !ciVerified
        ? 'CI/CD workflows could not be verified (-3 pts).'
        : 'No automated CI/CD workflow configuration files detected (-3 pts).',
      recommendation:
        'Add a GitHub Actions workflow (.github/workflows/ci.yml) to run build, lint, and tests on every PR.',
    },
    ['Create .github/workflows/ci.yml running automated linting, typechecking, and unit tests.']
  );

  // Check 21: structure-manifest (2 pts)
  const manifestVerified =
    v.rootContentsVerified ||
    structureAnalysis.hasManifest ||
    structureAnalysis.hasSourceDirectory;
  const manifestScore = !manifestVerified
    ? 0
    : structureAnalysis.hasManifest && structureAnalysis.hasSourceDirectory
    ? 2
    : structureAnalysis.hasManifest || structureAnalysis.hasSourceDirectory
    ? 1
    : 0;
  addCheck(
    {
      id: 'structure-manifest',
      category: 'structure',
      moduleName: 'Repository Structure Analyzer',
      title: 'Standard Project Manifest & Modular Layout',
      status: !manifestVerified
        ? 'NOT_VERIFIED'
        : manifestScore === 2
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: manifestScore,
      maxScore: 2,
      scoringRule:
        'Awards 2/2 pts when both a dependency/build manifest and a modular source directory (e.g., src/, lib/, packages/, app/) exist, 1/2 pt when only one exists, and 0/2 pts when neither exists.',
      details: !manifestVerified
        ? 'Project manifest and directory layout could not be verified.'
        : manifestScore === 2
        ? `Manifests: [${structureAnalysis.detectedManifests.join(
            ', '
          )}] · Source dirs: [${structureAnalysis.detectedSourceDirs.join(', ')}].`
        : manifestScore === 1
        ? `Partial structure: Manifests [${
            structureAnalysis.detectedManifests.join(', ') || 'none'
          }] · Source dirs [${structureAnalysis.detectedSourceDirs.join(', ') || 'none'}].`
        : 'No recognized build/package manifest or modular source directory found in root.',
      evidence: !manifestVerified
        ? ['Root directory listing failed; 0 points awarded.']
        : [
            `Detected build/dependency manifests: ${
              structureAnalysis.detectedManifests.join(', ') || 'none'
            }`,
            `Detected modular source directories: ${
              structureAnalysis.detectedSourceDirs.join(', ') || 'none'
            }`,
          ],
      deductionReason: !manifestVerified
        ? 'Project manifest and source layout could not be verified (-2 pts).'
        : manifestScore === 1
        ? `Missing ${
            structureAnalysis.hasManifest
              ? 'modular source directory (e.g., src/, lib/, packages/, app/)'
              : 'root dependency/build manifest (e.g., package.json, Cargo.toml, pyproject.toml, go.mod)'
          } (-1 pt).`
        : 'Missing both a standard package manifest and a modular source directory (-2 pts).',
      recommendation:
        'Include a declarative dependency manifest and organize source code under a dedicated directory such as src/ or lib/.',
    },
    [
      'Organize application code into modular directories (e.g., src/) and declare dependencies in a root manifest.',
    ]
  );

  // Check 22: structure-clean (2 pts)
  const cleanVerified = v.rootContentsVerified && rootEntries.length > 0;
  const cleanRootPass = cleanVerified && structureAnalysis.committedAntiPatterns.length === 0;
  addCheck(
    {
      id: 'structure-clean',
      category: 'structure',
      moduleName: 'Repository Structure Analyzer',
      title: 'Secret & Artifact Exclusion Check',
      status: !cleanVerified
        ? 'NOT_VERIFIED'
        : cleanRootPass
        ? 'PASS'
        : 'FAIL',
      scoreAwarded: !cleanVerified ? 0 : cleanRootPass ? 2 : 0,
      maxScore: 2,
      scoringRule:
        'Awards 2/2 pts when a verified non-empty repository tree contains 0 committed secret/artifact files (.env, node_modules, .DS_Store, id_rsa); 0/2 pts if anti-patterns exist or tree is unverified.',
      details: !cleanVerified
        ? 'Repository file tree could not be verified (root listing empty or unavailable).'
        : cleanRootPass
        ? `Scanned ${rootEntries.length} root entries${
            rawTreePaths.length > 0 ? ` and ${rawTreePaths.length} git tree paths` : ''
          }: 0 committed .env files, node_modules, or secret keys detected.`
        : `Committed anti-patterns detected: ${structureAnalysis.committedAntiPatterns.join(
            ', '
          )}.`,
      evidence: !cleanVerified
        ? ['Root contents empty or unverified; 0 points awarded.']
        : cleanRootPass
        ? [
            `Inspected ${rootEntries.length} root entries${
              rawTreePaths.length > 0
                ? ` and ${rawTreePaths.length} recursive tree entries`
                : ''
            }`,
            'Confirmed 0 occurrences of .env, .env.local, .env.production, node_modules, .DS_Store, or id_rsa',
          ]
        : [
            `Flagged committed anti-pattern path(s): ${structureAnalysis.committedAntiPatterns.join(
              ', '
            )}`,
          ],
      deductionReason: !cleanVerified
        ? 'Secret & artifact exclusion check could not be verified (-2 pts).'
        : `Repository contains committed environment or artifact files (${structureAnalysis.committedAntiPatterns.join(
            ', '
          )}) (-2 pts).`,
      recommendation:
        'Remove committed .env or node_modules from git tracking and provide a safe .env.example template instead.',
    },
    [
      'Run git rm --cached on any committed .env or node_modules files.',
      'Provide a sanitized .env.example file with placeholder keys.',
    ],
    'high'
  );

  // Assemble Category Summaries with transparent NOT_APPLICABLE denominator adjustment
  const categoryDefinitions: { key: CategoryKey; label: string; maxScore: number }[] = [
    { key: 'readme', label: 'README Quality', maxScore: 25 },
    { key: 'license', label: 'License', maxScore: 15 },
    { key: 'community', label: 'Community Health', maxScore: 20 },
    { key: 'activity', label: 'Repository Activity', maxScore: 20 },
    { key: 'documentation', label: 'Documentation', maxScore: 10 },
    { key: 'structure', label: 'Repository Structure', maxScore: 10 },
  ];

  const categories = {} as Record<CategoryKey, CategoryScore>;
  const categoryList: CategoryScore[] = [];
  let rawScore = 0;
  let applicableMaxScore = 0;

  for (const def of categoryDefinitions) {
    const catChecks = checks.filter((c) => c.category === def.key);
    const catDeductions = deductions.filter((d) => d.category === def.key);
    const score = catChecks.reduce((acc, item) => acc + item.scoreAwarded, 0);
    const catApplicableMax = catChecks
      .filter((c) => c.status !== 'NOT_APPLICABLE')
      .reduce((acc, item) => acc + item.maxScore, 0);

    rawScore += score;
    applicableMaxScore += catApplicableMax;

    const percentage =
      catApplicableMax > 0 ? Math.round((score / catApplicableMax) * 100) : 100;
    const unverifiedCount = catChecks.filter((c) => c.status === 'NOT_VERIFIED').length;
    const notApplicableCount = catChecks.filter((c) => c.status === 'NOT_APPLICABLE').length;
    const naPoints = def.maxScore - catApplicableMax;

    let summary = '';
    if (notApplicableCount > 0) {
      summary =
        catDeductions.length === 0
          ? `All applicable checks passed (${score}/${catApplicableMax} applicable pts · ${naPoints} pts N/A excluded without penalty).`
          : `${score}/${catApplicableMax} applicable pts (${naPoints} pts N/A excluded) — ${
              catDeductions.length
            } deduction(s) totaling -${catApplicableMax - score} pts.`;
    } else if (catDeductions.length === 0) {
      summary = `All ${catChecks.length} checks verified & passed (${score}/${def.maxScore} pts).`;
    } else {
      summary = `${score}/${def.maxScore} pts — ${catDeductions.length} deduction(s) totaling -${
        def.maxScore - score
      } pts${unverifiedCount > 0 ? ` (${unverifiedCount} not verified)` : ''}.`;
    }

    const catObj: CategoryScore = {
      key: def.key,
      label: def.label,
      score,
      maxScore: def.maxScore,
      applicableMaxScore: catApplicableMax,
      percentage,
      summary,
      checks: catChecks,
      deductions: catDeductions,
    };
    categories[def.key] = catObj;
    categoryList.push(catObj);
  }

  // Normalize overallScore out of applicableMaxScore so NOT_APPLICABLE checks never penalize the repository
  const overallScore =
    applicableMaxScore > 0 ? Math.round((rawScore / applicableMaxScore) * 100) : 0;

  // Sort recommendations by priority and point impact
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.impactPoints - a.impactPoints;
  });

  return {
    analyzedAt: now.toISOString(),
    commitSha: headCommitSha,
    cached: Boolean(input.cached),
    repository: {
      owner: input.repo.owner.login,
      name: input.repo.name,
      fullName: input.repo.full_name,
      htmlUrl: input.repo.html_url,
      description: input.repo.description,
      homepage: input.repo.homepage,
      defaultBranch: input.repo.default_branch || 'main',
      headCommitSha,
      stars: input.repo.stargazers_count || 0,
      forks: input.repo.forks_count || 0,
      watchers: input.repo.subscribers_count ?? input.repo.watchers_count ?? 0,
      openIssues: input.repo.open_issues_count || 0,
      language: input.repo.language,
      topics: input.repo.topics || [],
      createdAt: input.repo.created_at,
      updatedAt: input.repo.updated_at,
      pushedAt: input.repo.pushed_at,
      sizeKb: input.repo.size || 0,
      isArchived: Boolean(input.repo.archived),
      visibility: input.repo.visibility || 'public',
    },
    overallScore,
    rawScore,
    applicableMaxScore,
    grade: computeLetterGrade(overallScore),
    statusLabel: computeStatusLabel(overallScore),
    categories,
    categoryList,
    passedChecks: checks.filter((c) => c.status === 'PASS'),
    failedChecks: checks.filter((c) => c.status === 'FAIL'),
    notVerifiedChecks: checks.filter((c) => c.status === 'NOT_VERIFIED'),
    notApplicableChecks: checks.filter((c) => c.status === 'NOT_APPLICABLE'),
    deductions,
    recommendations,
    modules: {
      readme: readmeAnalysis,
      license: licenseAnalysis,
      community: communityAnalysis,
      activity: activityAnalysis,
      structure: structureAnalysis,
      documentationLinks: {
        totalChecked: brokenLinksList.length,
        validCount: validLinks.length,
        brokenCount: brokenLinks.length,
        unverifiedCount: unverifiedLinks.length,
        links: brokenLinksList,
      },
    },
    rateLimit: input.rateLimit || {
      limit: 60,
      remaining: 59,
      resetAt: new Date(now.getTime() + 3600 * 1000).toISOString(),
      usedToken: false,
    },
  };
}
