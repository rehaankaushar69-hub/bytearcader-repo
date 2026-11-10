export type CategoryKey =
  | 'readme'
  | 'license'
  | 'community'
  | 'activity'
  | 'documentation'
  | 'structure';

export type CheckStatus = 'PASS' | 'FAIL' | 'NOT_VERIFIED' | 'NOT_APPLICABLE';

export interface ScoreDeduction {
  id: string;
  category: CategoryKey;
  title: string;
  status?: CheckStatus;
  pointsLost: number;
  maxPoints: number;
  reason: string;
  remediation: string;
}

export interface CheckItem {
  id: string;
  category: CategoryKey;
  moduleName: string;
  title: string;
  status: CheckStatus;
  passed: boolean;
  scoreAwarded: number;
  maxScore: number;
  scoringRule: string;
  details: string;
  evidence: string[];
  deductionReason?: string;
  recommendation?: string;
}

export interface CategoryScore {
  key: CategoryKey;
  label: string;
  score: number;
  maxScore: number;
  applicableMaxScore: number;
  percentage: number;
  summary: string;
  checks: CheckItem[];
  deductions: ScoreDeduction[];
}

export interface BrokenLinkResult {
  url: string;
  text: string;
  type: 'relative' | 'external' | 'anchor';
  status: 'valid' | 'broken' | 'unverified';
  statusCode?: number;
  reason?: string;
}

export interface ReadmeAnalysis {
  exists: boolean;
  fileName: string | null;
  charCount: number;
  wordCount: number;
  lineCount: number;
  headingCount: number;
  headings: string[];
  codeBlockCount: number;
  hasInstallationSection: boolean;
  hasUsageSection: boolean;
  hasLicenseSection: boolean;
  hasContributingSection: boolean;
  hasBadgesOrImages: boolean;
  excerpt: string;
}

export interface LicenseAnalysis {
  exists: boolean;
  name: string | null;
  spdxId: string | null;
  url: string | null;
  isOsiApproved: boolean;
  fileFound: string | null;
}

export interface CommunityHealthAnalysis {
  hasContributing: boolean;
  contributingPath: string | null;
  hasSecurityPolicy: boolean;
  securityPolicyPath: string | null;
  hasCodeOfConduct: boolean;
  codeOfConductPath: string | null;
  hasIssueTemplates: boolean;
  issueTemplatePaths?: string[];
  hasPullRequestTemplate: boolean;
  pullRequestTemplatePath?: string | null;
  hasSupportFile: boolean;
}

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface IssueSummary {
  number: number;
  title: string;
  state: string;
  createdAt: string;
  author: string;
  url: string;
  labels: string[];
}

export interface ActivityAnalysis {
  isArchived: boolean;
  isDisabled: boolean;
  lastPushedAt: string;
  daysSinceLastPush: number;
  recentCommitCount: number;
  recentCommits: CommitSummary[];
  openIssuesCount: number;
  recentIssues: IssueSummary[];
  commitFrequencyByWeek: { label: string; commits: number }[];
  hasDescription: boolean;
  topicsCount: number;
}

export interface StructureAnalysis {
  totalRootEntries: number;
  fileCount: number;
  directoryCount: number;
  hasGitignore: boolean;
  hasCiWorkflows: boolean;
  ciWorkflowFiles: string[];
  hasManifest: boolean;
  detectedManifests: string[];
  hasSourceDirectory: boolean;
  detectedSourceDirs: string[];
  hasTestDirectoryOrConfig: boolean;
  hasChangelog: boolean;
  changelogPath?: string | null;
  hasDocsDirectory: boolean;
  docsEvidence?: string | null;
  hasEnvExample: boolean;
  committedAntiPatterns: string[];
  rootEntries: {
    name: string;
    type: 'file' | 'dir';
    size: number;
    path: string;
  }[];
}

export interface RecommendationItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: CategoryKey;
  moduleName: string;
  title: string;
  impactPoints: number;
  description: string;
  actionSteps: string[];
}

export interface RepositoryMetadata {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  homepage: string | null;
  defaultBranch: string;
  headCommitSha: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  sizeKb: number;
  isArchived: boolean;
  visibility: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
  usedToken: boolean;
}

export interface EndpointVerificationFlags {
  rootContentsVerified?: boolean;
  readmeVerified?: boolean;
  commitsVerified?: boolean;
  issuesVerified?: boolean;
  githubDirVerified?: boolean;
  workflowsVerified?: boolean;
  docsDirVerified?: boolean;
  externalLinksVerified?: boolean;
  treeVerified?: boolean;
}

export interface AnalysisReport {
  analyzedAt: string;
  commitSha: string | null;
  cached: boolean;
  repository: RepositoryMetadata;
  overallScore: number;
  rawScore: number;
  applicableMaxScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  statusLabel: string;
  categories: Record<CategoryKey, CategoryScore>;
  categoryList: CategoryScore[];
  passedChecks: CheckItem[];
  failedChecks: CheckItem[];
  notVerifiedChecks: CheckItem[];
  notApplicableChecks: CheckItem[];
  deductions: ScoreDeduction[];
  recommendations: RecommendationItem[];
  modules: {
    readme: ReadmeAnalysis;
    license: LicenseAnalysis;
    community: CommunityHealthAnalysis;
    activity: ActivityAnalysis;
    structure: StructureAnalysis;
    documentationLinks: {
      totalChecked: number;
      validCount: number;
      brokenCount: number;
      unverifiedCount: number;
      links: BrokenLinkResult[];
    };
  };
  rateLimit: RateLimitInfo;
}

export interface RawGitHubAuditInput {
  nowIso?: string;
  headCommitSha?: string | null;
  repo: {
    owner: { login: string };
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    homepage: string | null;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
    subscribers_count?: number;
    watchers_count?: number;
    open_issues_count: number;
    language: string | null;
    topics?: string[];
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    archived: boolean;
    disabled?: boolean;
    visibility?: string;
    license?: {
      key: string;
      name: string;
      spdx_id: string | null;
      url: string | null;
    } | null;
  };
  rootContents: {
    name: string;
    path: string;
    type: 'file' | 'dir' | 'symlink' | 'submodule';
    size?: number;
  }[];
  githubDirContents: {
    name: string;
    path: string;
    type: 'file' | 'dir';
  }[];
  workflowsContents: {
    name: string;
    path: string;
    type: 'file' | 'dir';
  }[];
  docsContents: {
    name: string;
    path: string;
    type: 'file' | 'dir';
  }[];
  treePaths?: string[];
  treeTruncated?: boolean;
  readme: {
    exists: boolean;
    name: string | null;
    content: string;
  };
  commits: {
    sha: string;
    html_url: string;
    commit: {
      message: string;
      author: {
        name: string;
        date: string;
      };
    };
    author?: { login: string } | null;
  }[];
  issues: {
    number: number;
    title: string;
    state: string;
    created_at: string;
    html_url: string;
    user?: { login: string } | null;
    pull_request?: unknown;
    labels?: ({ name?: string } | string)[];
  }[];
  verifiedExternalLinks?: Record<
    string,
    { ok: boolean; unverified?: boolean; status?: number; reason?: string }
  >;
  verification?: EndpointVerificationFlags;
  rateLimit?: RateLimitInfo;
  cached?: boolean;
}
