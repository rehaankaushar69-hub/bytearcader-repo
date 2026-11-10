import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  Folder,
  GitFork,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { parseGitHubRepoInput } from '../lib/analyzer';
import { AnalysisReport, CategoryKey } from '../types/repoguard';
import { RepoGuardLogoMark } from './Logo';

const CATEGORY_CHART_MARGIN = { top: 4, right: 20, left: 10, bottom: 4 };
const COMMIT_CHART_MARGIN = { top: 4, right: 8, left: -20, bottom: 0 };
const X_AXIS_DOMAIN: [number, number] = [0, 100];
const AXIS_TICK_MUTED = { fill: '#94A3B8', fontSize: 11 };
const AXIS_TICK_LIGHT = { fill: '#E2E8F0', fontSize: 11 };
const TOOLTIP_CONTENT_STYLE: React.CSSProperties = {
  backgroundColor: '#0B1120',
  borderColor: '#334155',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#F8FAFC',
};
const HORIZONTAL_BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];
const VERTICAL_BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

const DashboardChartsPanel = React.memo<{ report: AnalysisReport }>(({ report }) => {
  const categoryChartData = useMemo(
    () =>
      report.categoryList.map((c) => ({
        key: c.key,
        name: c.label.replace('Repository ', ''),
        pct: c.percentage,
        score: c.score,
        max: c.maxScore,
        fill:
          c.percentage >= 85
            ? '#34D399'
            : c.percentage >= 60
            ? '#22D3EE'
            : '#FBBF24',
      })),
    [report.categoryList]
  );

  const commitData = useMemo(
    () => report.modules.activity.commitFrequencyByWeek,
    [report.modules.activity.commitFrequencyByWeek]
  );

  return (
    <div className="lg:col-span-5 bg-[#11192E] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
      <div>
        <h3 className="font-display text-base font-semibold text-white mb-1">
          Category Performance (% of Max Points)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Normalized score attainment across all 6 evaluation dimensions
        </p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryChartData}
              layout="vertical"
              margin={CATEGORY_CHART_MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
              <XAxis
                type="number"
                domain={X_AXIS_DOMAIN}
                tick={AXIS_TICK_MUTED}
                unit="%"
              />
              <YAxis
                dataKey="name"
                type="category"
                width={115}
                tick={AXIS_TICK_LIGHT}
              />
              <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
              <Bar dataKey="pct" isAnimationActive={false} radius={HORIZONTAL_BAR_RADIUS}>
                {categoryChartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <h3 className="font-display text-sm font-semibold text-white mb-1">
          Recent Commit Velocity (Sampled Commits)
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Last push {report.modules.activity.daysSinceLastPush} day(s) ago ·{' '}
          {report.modules.activity.recentCommitCount} recent commits inspected
        </p>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commitData} margin={COMMIT_CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK_MUTED} />
              <YAxis allowDecimals={false} tick={AXIS_TICK_MUTED} />
              <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
              <Bar
                dataKey="commits"
                fill="#38BDF8"
                isAnimationActive={false}
                radius={VERTICAL_BAR_RADIUS}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
DashboardChartsPanel.displayName = 'DashboardChartsPanel';

interface DashboardViewProps {
  report: AnalysisReport | null;
  repoInput: string;
  setRepoInput: (val: string) => void;
  onAnalyze: (repoIdentifier: string, refresh?: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

type DashboardTab =
  | 'all-checks'
  | 'passed'
  | 'failed'
  | 'not-verified'
  | 'not-applicable'
  | 'modules'
  | 'recommendations';

export const DashboardView: React.FC<DashboardViewProps> = ({
  report,
  repoInput,
  setRepoInput,
  onAnalyze,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('all-checks');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all');
  const [localError, setLocalError] = useState<string | null>(null);
  const [downloadConfirm, setDownloadConfirm] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = parseGitHubRepoInput(repoInput);
    if (!check.valid || !check.parsed) {
      setLocalError(check.error || 'Please enter a valid GitHub repository URL or owner/repo.');
      return;
    }
    setLocalError(null);
    onAnalyze(`${check.parsed.owner}/${check.parsed.repo}`);
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const fileName = `repoguard-${report.repository.owner}-${report.repository.name}-report.json`;
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadConfirm(true);
    setTimeout(() => setDownloadConfirm(false), 3000);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const combinedError = localError || error;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 65) return 'text-cyan-300';
    if (score >= 45) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      {/* Top Analyzer Workspace Bar */}
      <div className="bg-[#11192E] border border-slate-800 rounded-xl p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Repository Analysis Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect public GitHub repositories against the 100-point ByteArcadeR RepoGuard rubric
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            noValidate
            className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-2xl"
          >
            <div className="relative flex-1">
              <label htmlFor="dashboard-repo-input" className="sr-only">
                GitHub Repository URL or owner/repo
              </label>
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="dashboard-repo-input"
                type="text"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="owner/repo or https://github.com/owner/repo"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-slate-700 rounded-lg text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Repository'}
            </button>
          </form>
        </div>

        {combinedError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/70 rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-200">Repository Audit Error</p>
              <p>{combinedError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div
          aria-live="polite"
          className="bg-[#11192E] border border-slate-800 rounded-xl p-8 space-y-6 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-64 bg-slate-800 rounded" />
              <div className="h-4 w-96 bg-slate-800/70 rounded" />
            </div>
            <div className="h-14 w-28 bg-slate-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-20 bg-slate-800/60 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-slate-800/40 rounded-lg" />
        </div>
      )}

      {/* Empty State when no repository is loaded yet */}
      {!isLoading && !report && (
        <div className="bg-[#11192E] border border-slate-800 rounded-xl p-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="flex justify-center">
            <RepoGuardLogoMark size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold text-white">
              Ready to Inspect a GitHub Repository
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Enter any public GitHub URL or <code className="text-cyan-300 font-mono">owner/repo</code>{' '}
              above, or select one of the verified repositories below to generate a complete 10-module
              health report.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {[
              'bytearcader-ai/bytearcader-repo',
              'vitejs/vite',
              'expressjs/express',
              'facebook/react',
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setLocalError(null);
                  setRepoInput(sample);
                  onAnalyze(sample);
                }}
                className="px-3.5 py-2 text-xs font-mono text-slate-200 bg-[#0B1120] hover:bg-slate-800 hover:text-cyan-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Populated Report State */}
      {!isLoading && report && (
        <div className="space-y-8" data-testid="analysis-report-container">
          {/* Print Header (Visible when printing) */}
          <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              ByteArcadeR RepoGuard — Official Repository Audit Report
            </h1>
            <p className="text-sm text-slate-600">
              Developed by ByteArcadeR AI · Generated {new Date(report.analyzedAt).toUTCString()} · Commit SHA: {report.commitSha || 'N/A'}
            </p>
          </div>

          {/* 1. Primary Repository Overview & Overall Health Score */}
          <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                  <span>Owner: <strong className="text-slate-200 font-mono">{report.repository.owner}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Branch: <strong className="text-slate-200 font-mono">{report.repository.defaultBranch}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span data-testid="report-commit-sha" title={report.commitSha || undefined}>
                    Commit SHA: <strong className="text-cyan-300 font-mono">{report.commitSha ? report.commitSha.slice(0, 7) : 'N/A'}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span data-testid="report-analyzed-at">
                    Analyzed At: <strong className="text-slate-200 font-mono tabular-nums">{new Date(report.analyzedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    API Rate Limit: <strong className="text-slate-200 font-mono tabular-nums">{report.rateLimit.remaining}/{report.rateLimit.limit}</strong>
                  </span>
                  {report.cached && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-300">Cached Snapshot</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight font-mono break-all sm:break-normal">
                    {report.repository.fullName}
                  </h2>
                  <a
                    href={report.repository.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 font-medium no-print"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {report.repository.description || 'No repository description configured on GitHub.'}
                </p>

                {report.repository.topics.length > 0 && (
                  <div className="text-xs text-slate-400 pt-1">
                    Topics: {report.repository.topics.join(' · ')}
                  </div>
                )}
              </div>

              {/* Overall Health Score Display + Report Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0">
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <div className="flex items-baseline gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Overall Health Score</div>
                      <div className="text-xs font-medium text-slate-300 mt-0.5">
                        {report.statusLabel}
                      </div>
                    </div>
                    <div
                      data-testid="overall-health-score"
                      className={`font-mono text-4xl md:text-5xl font-bold tabular-nums ${getScoreColor(
                        report.overallScore
                      )}`}
                    >
                      {report.overallScore}
                      <span className="text-lg text-slate-500 font-normal">/100</span>
                    </div>
                    <div className="font-mono text-xl font-bold text-white border border-slate-700 bg-[#0B1120] px-3 py-1.5 rounded-lg tabular-nums">
                      {report.grade}
                    </div>
                  </div>
                  {report.applicableMaxScore < 100 && (
                    <div
                      data-testid="normalized-score-note"
                      className="text-[11px] font-mono text-cyan-300/90"
                    >
                      Normalized from {report.rawScore}/{report.applicableMaxScore} applicable pts (
                      {100 - report.applicableMaxScore} pts N/A)
                    </div>
                  )}
                </div>

                {/* Export / Print / Refresh Controls */}
                <div className="flex flex-wrap items-center gap-2.5 no-print">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-3.5 py-2 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{downloadConfirm ? 'JSON Report Downloaded' : 'Download JSON Report'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="px-3.5 py-2 text-xs font-medium bg-[#0B1120] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Print Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAnalyze(report.repository.fullName, true)}
                    className="px-3 py-2 text-xs font-medium bg-[#0B1120] hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    aria-label="Refresh repository analysis from GitHub"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Key Repository Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-6">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Stars</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">
                  {report.repository.stars.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <GitFork className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  <span>Forks</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">
                  {report.repository.forks.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                  <span>Open Issues</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">
                  {report.repository.openIssues.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Code2 className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span>Primary Language</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white truncate">
                  {report.repository.language || 'Multi / Docs'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>License</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white truncate">
                  {report.modules.license.spdxId || report.modules.license.name || 'Unlicensed'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Last Updated</span>
                </div>
                <div className="font-mono text-lg font-semibold text-white tabular-nums">
                  {new Date(report.repository.pushedAt || report.repository.updatedAt)
                    .toISOString()
                    .slice(0, 10)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Individual Category Scores & Recharts Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Score Breakdown Table & Progress Bars */}
            <div className="lg:col-span-7 bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-white">
                    Deterministic Score Breakdown by Category
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click any category to filter checks and deductions below
                  </p>
                </div>
                <span className="font-mono text-xs text-cyan-300 tabular-nums">
                  {report.passedChecks.length} Passed · {report.failedChecks.length} Failed ·{' '}
                  {(report.notVerifiedChecks || []).length} Not Verified ·{' '}
                  {(report.notApplicableChecks || []).length} N/A
                </span>
              </div>

              <div className="space-y-3.5">
                {report.categoryList.map((cat) => {
                  const isSelected = categoryFilter === cat.key;
                  const effectiveMax = cat.applicableMaxScore ?? cat.maxScore;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() =>
                        setCategoryFilter((prev) => (prev === cat.key ? 'all' : cat.key))
                      }
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/70'
                          : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-white">{cat.label}</span>
                        <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                          {effectiveMax < cat.maxScore
                            ? `${cat.score} / ${effectiveMax} applicable pts (${cat.percentage}%)`
                            : `${cat.score} / ${cat.maxScore} pts (${cat.percentage}%)`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all ${
                            cat.percentage >= 85
                              ? 'bg-emerald-400'
                              : cat.percentage >= 60
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">{cat.summary}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recharts Visualizations */}
            <DashboardChartsPanel report={report} />
          </div>

          {/* 3. Explicit Score Deductions Explanation Panel */}
          <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-white">
                  Score Deductions & Audit Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Every point deducted from the applicable maximum is itemized and explained below (N/A checks are never penalized)
                </p>
              </div>
              <div className="font-mono text-xs text-slate-300 tabular-nums">
                Total Deducted:{' '}
                <strong className="text-rose-400">
                  -{(report.applicableMaxScore ?? 100) - (report.rawScore ?? report.overallScore)} pts
                </strong>
                {report.applicableMaxScore < 100 && (
                  <span className="text-slate-400"> (from {report.applicableMaxScore} applicable pts)</span>
                )}
              </div>
            </div>

            {report.deductions.length === 0 ? (
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-lg p-4 flex items-center gap-3 text-sm text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>
                  Zero deductions! This repository achieved a full 100% score across all applicable
                  ByteArcadeR RepoGuard evaluation checks.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 bg-[#0B1120]">
                      <th className="py-3 px-4">Check Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Points Lost</th>
                      <th className="py-3 px-4">Deduction Explanation</th>
                      <th className="py-3 px-4">How to Recover Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {report.deductions.map((ded) => (
                      <tr key={ded.id} className="hover:bg-slate-800/20">
                        <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                          {ded.title}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          {ded.status === 'NOT_VERIFIED' ? (
                            <span className="text-amber-300 font-semibold">NOT VERIFIED</span>
                          ) : (
                            <span className="text-rose-400 font-semibold">FAIL</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300 capitalize whitespace-nowrap">
                          {ded.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-rose-400 tabular-nums whitespace-nowrap">
                          -{ded.pointsLost} / {ded.maxPoints} pts
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">{ded.reason}</td>
                        <td className="py-3 px-4 text-xs text-cyan-300">{ded.remediation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Interactive Inspection Tabs (Checks, Modules, Recommendations) */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3 no-print">
              <div
                role="tablist"
                aria-label="Audit Inspection Views"
                className="flex flex-wrap items-center gap-1.5 bg-[#11192E] p-1 rounded-lg border border-slate-800"
              >
                {[
                  {
                    id: 'all-checks' as DashboardTab,
                    label: `All Checks (${
                      report.passedChecks.length +
                      report.failedChecks.length +
                      (report.notVerifiedChecks || []).length +
                      (report.notApplicableChecks || []).length
                    })`,
                  },
                  {
                    id: 'passed' as DashboardTab,
                    label: `Passed (${report.passedChecks.length})`,
                  },
                  {
                    id: 'failed' as DashboardTab,
                    label: `Failed (${report.failedChecks.length})`,
                  },
                  {
                    id: 'not-verified' as DashboardTab,
                    label: `Not Verified (${(report.notVerifiedChecks || []).length})`,
                  },
                  {
                    id: 'not-applicable' as DashboardTab,
                    label: `Not Applicable (${(report.notApplicableChecks || []).length})`,
                  },
                  {
                    id: 'modules' as DashboardTab,
                    label: '10-Module Deep Dive',
                  },
                  {
                    id: 'recommendations' as DashboardTab,
                    label: `Recommendations (${report.recommendations.length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-cyan-400 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {categoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className="text-xs text-cyan-300 hover:text-cyan-200 cursor-pointer"
                >
                  Showing category: <strong>{categoryFilter}</strong> (Clear filter)
                </button>
              )}
            </div>

            {/* TAB: ALL / PASSED / FAILED / NOT VERIFIED / NOT APPLICABLE CHECKS */}
            {(activeTab === 'all-checks' ||
              activeTab === 'passed' ||
              activeTab === 'failed' ||
              activeTab === 'not-verified' ||
              activeTab === 'not-applicable') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ...report.passedChecks,
                  ...report.failedChecks,
                  ...(report.notVerifiedChecks || []),
                  ...(report.notApplicableChecks || []),
                ]
                  .filter((c) => {
                    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
                    if (activeTab === 'passed') return c.status === 'PASS';
                    if (activeTab === 'failed') return c.status === 'FAIL';
                    if (activeTab === 'not-verified') return c.status === 'NOT_VERIFIED';
                    if (activeTab === 'not-applicable') return c.status === 'NOT_APPLICABLE';
                    return true;
                  })
                  .map((check) => (
                    <div
                      key={check.id}
                      data-testid={`check-card-${check.id}`}
                      className="bg-[#11192E] border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {check.status === 'PASS' ? (
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-400 shrink-0"
                                aria-hidden="true"
                              />
                            ) : check.status === 'NOT_VERIFIED' ? (
                              <AlertTriangle
                                className="w-4 h-4 text-amber-400 shrink-0"
                                aria-hidden="true"
                              />
                            ) : check.status === 'NOT_APPLICABLE' ? (
                              <FileText
                                className="w-4 h-4 text-slate-400 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <XCircle
                                className="w-4 h-4 text-rose-400 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <h4 className="font-display text-sm font-semibold text-white">
                              {check.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                check.status === 'PASS'
                                  ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/70'
                                  : check.status === 'NOT_VERIFIED'
                                  ? 'text-amber-300 bg-amber-950/40 border-amber-800/70'
                                  : check.status === 'NOT_APPLICABLE'
                                  ? 'text-slate-300 bg-slate-800/70 border-slate-700'
                                  : 'text-rose-300 bg-rose-950/40 border-rose-800/70'
                              }`}
                            >
                              {check.status === 'NOT_VERIFIED'
                                ? 'NOT VERIFIED'
                                : check.status === 'NOT_APPLICABLE'
                                ? 'NOT APPLICABLE'
                                : check.status}
                            </span>
                            <span className="font-mono text-xs font-semibold tabular-nums text-cyan-300 whitespace-nowrap">
                              {check.status === 'NOT_APPLICABLE'
                                ? `N/A (${check.maxScore} pts excluded)`
                                : `${check.scoreAwarded}/${check.maxScore} pts`}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400">
                          {check.moduleName} · Category: {check.category}
                        </div>

                        {check.scoringRule && (
                          <div className="text-xs text-slate-400 bg-[#0B1120]/70 border border-slate-800/70 rounded px-2.5 py-1.5">
                            <strong className="text-slate-300">Scoring Rule: </strong>
                            {check.scoringRule}
                          </div>
                        )}

                        <p className="text-xs text-slate-300 leading-relaxed">{check.details}</p>

                        {check.evidence && check.evidence.length > 0 && (
                          <div className="bg-[#0B1120] border border-slate-800/90 rounded-lg p-3 space-y-1">
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Repository Evidence
                            </div>
                            <ul className="space-y-1 text-xs font-mono text-slate-300">
                              {check.evidence.map((ev, idx) => (
                                <li key={idx} className="break-words">
                                  • {ev}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {check.status !== 'PASS' &&
                        check.status !== 'NOT_APPLICABLE' &&
                        check.recommendation && (
                          <div className="pt-3 border-t border-slate-800/80 text-xs text-amber-300/90">
                            <strong className="text-amber-200">Action: </strong>
                            {check.recommendation}
                          </div>
                        )}
                    </div>
                  ))}
              </div>
            )}

            {/* TAB: 10-MODULE DEEP DIVE */}
            {activeTab === 'modules' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Module 3: README Quality Checker */}
                <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-white">
                      README Quality Checker
                    </h4>
                    <span className="font-mono text-xs text-cyan-300 tabular-nums">
                      {report.categories.readme.score}/{report.categories.readme.maxScore} pts
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs bg-[#0B1120] p-3.5 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-slate-400">Word Count</div>
                      <div className="font-mono text-sm font-semibold text-white tabular-nums mt-0.5">
                        {report.modules.readme.wordCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Headings</div>
                      <div className="font-mono text-sm font-semibold text-white tabular-nums mt-0.5">
                        {report.modules.readme.headingCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Code Blocks</div>
                      <div className="font-mono text-sm font-semibold text-white tabular-nums mt-0.5">
                        {report.modules.readme.codeBlockCount}
                      </div>
                    </div>
                  </div>
                  {report.modules.readme.excerpt && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-slate-200">Excerpt: </strong>
                      {report.modules.readme.excerpt}
                    </p>
                  )}
                  {report.modules.readme.headings.length > 0 && (
                    <div className="text-xs text-slate-400">
                      <strong className="text-slate-200">Detected Sections: </strong>
                      {report.modules.readme.headings.slice(0, 8).join(' · ')}
                    </div>
                  )}
                </div>

                {/* Module 4, 5, 6: License, Contribution Guidelines, & Security Policy */}
                <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-white">
                      License, Contribution & Security Governance
                    </h4>
                    <span className="font-mono text-xs text-cyan-300 tabular-nums">
                      {report.categories.license.score + report.categories.community.score}/35 pts
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-300">SPDX License Identifier</span>
                      <span className="font-mono text-white">
                        {report.modules.license.spdxId || 'Not Detected'} (
                        {report.modules.license.isOsiApproved ? 'OSI Approved' : 'Unverified'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-300">Contribution Guidelines (CONTRIBUTING.md)</span>
                      <span className="font-mono text-white">
                        {report.modules.community.contributingPath || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-300">Security Policy (SECURITY.md)</span>
                      <span className="font-mono text-white">
                        {report.modules.community.securityPolicyPath || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-800">
                      <span className="text-slate-300">Code of Conduct (CODE_OF_CONDUCT.md)</span>
                      <span className="font-mono text-white">
                        {report.modules.community.codeOfConductPath || 'Missing'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-300">Issue & Pull Request Templates</span>
                      <span className="font-mono text-white">
                        Issues: {report.modules.community.hasIssueTemplates ? 'Yes' : 'No'} · PR:{' '}
                        {report.modules.community.hasPullRequestTemplate ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Module 8: Repository Structure Analyzer */}
                <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-white">
                      Repository Structure Analyzer (Root Tree)
                    </h4>
                    <span className="font-mono text-xs text-cyan-300 tabular-nums">
                      {report.modules.structure.directoryCount} dirs ·{' '}
                      {report.modules.structure.fileCount} files
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto bg-[#0B1120] border border-slate-800 rounded-lg divide-y divide-slate-800/60 text-xs font-mono">
                    {report.modules.structure.rootEntries.map((entry) => (
                      <div
                        key={entry.path}
                        className="flex items-center justify-between px-3.5 py-2 text-slate-300"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {entry.type === 'dir' ? (
                            <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{entry.name}</span>
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {entry.type === 'dir'
                            ? 'dir'
                            : `${Math.max(1, Math.round(entry.size / 1024))} KB`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Module 9: Broken Documentation Link Checker */}
                <div className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-white">
                      Broken Documentation Link Checker
                    </h4>
                    <span className="font-mono text-xs text-cyan-300 tabular-nums">
                      {report.modules.documentationLinks.validCount} valid ·{' '}
                      {report.modules.documentationLinks.brokenCount} broken ·{' '}
                      {report.modules.documentationLinks.unverifiedCount} not verified
                    </span>
                  </div>
                  {report.modules.documentationLinks.links.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No external or relative Markdown links detected in README.
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto bg-[#0B1120] border border-slate-800 rounded-lg divide-y divide-slate-800/60 text-xs">
                      {report.modules.documentationLinks.links.map((lnk) => (
                        <div
                          key={lnk.url}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-200 truncate">{lnk.text}</div>
                            <div className="font-mono text-slate-400 truncate">{lnk.url}</div>
                            {lnk.reason && (
                              <div
                                className={`mt-0.5 ${
                                  lnk.status === 'broken' ? 'text-rose-400' : 'text-amber-300'
                                }`}
                              >
                                {lnk.reason}
                              </div>
                            )}
                          </div>
                          <span
                            className={`font-mono font-semibold shrink-0 ${
                              lnk.status === 'broken'
                                ? 'text-rose-400'
                                : lnk.status === 'unverified'
                                ? 'text-amber-300'
                                : 'text-emerald-400'
                            }`}
                          >
                            {lnk.status === 'unverified'
                              ? 'NOT VERIFIED'
                              : lnk.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Module 7: Recent Commits & Open Issues */}
                <div className="lg:col-span-2 bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-semibold text-white">
                      GitHub Activity: Recent Commits & Open Issues
                    </h4>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      Showing latest commits on {report.repository.defaultBranch}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300">Latest Commits</div>
                      <div className="bg-[#0B1120] border border-slate-800 rounded-lg divide-y divide-slate-800/70 text-xs">
                        {report.modules.activity.recentCommits.slice(0, 6).map((c) => (
                          <div key={c.sha} className="p-3 space-y-1">
                            <div className="flex items-center justify-between font-mono text-cyan-300">
                              <span>{c.sha}</span>
                              <span className="text-slate-400 tabular-nums">
                                {new Date(c.date).toISOString().slice(0, 10)}
                              </span>
                            </div>
                            <div className="text-slate-200 truncate">{c.message}</div>
                            <div className="text-slate-400">Author: {c.author}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300">
                        Recent Open Issues ({report.repository.openIssues} total)
                      </div>
                      {report.modules.activity.recentIssues.length === 0 ? (
                        <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-4 text-xs text-slate-400">
                          Zero open issues currently queued on this repository.
                        </div>
                      ) : (
                        <div className="bg-[#0B1120] border border-slate-800 rounded-lg divide-y divide-slate-800/70 text-xs">
                          {report.modules.activity.recentIssues.slice(0, 6).map((iss) => (
                            <div key={iss.number} className="p-3 space-y-1">
                              <div className="flex items-center justify-between font-mono text-amber-300">
                                <span>#{iss.number}</span>
                                <span className="text-slate-400 tabular-nums">
                                  {new Date(iss.createdAt).toISOString().slice(0, 10)}
                                </span>
                              </div>
                              <a
                                href={iss.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-200 hover:text-cyan-300 font-medium block truncate"
                              >
                                {iss.title}
                              </a>
                              <div className="text-slate-400">Opened by {iss.author}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: IMPROVEMENT RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                {report.recommendations.length === 0 ? (
                  <div className="bg-[#11192E] border border-slate-800 rounded-xl p-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="font-display text-base font-semibold text-white">
                      No Outstanding Recommendations
                    </h4>
                    <p className="text-xs text-slate-400">
                      This repository satisfies every check in the ByteArcadeR RepoGuard 100-point rubric.
                    </p>
                  </div>
                ) : (
                  report.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-[#11192E] border border-slate-800 rounded-xl p-6 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle
                            className={`w-4 h-4 shrink-0 ${
                              rec.priority === 'high'
                                ? 'text-rose-400'
                                : rec.priority === 'medium'
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          />
                          <h4 className="font-display text-base font-semibold text-white">
                            {rec.title}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums">
                          +{rec.impactPoints} pts recovery potential · Priority:{' '}
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300">{rec.description}</p>

                      <div className="bg-[#0B1120] border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                        <div className="text-xs font-semibold text-slate-200">
                          Recommended Action Steps ({rec.moduleName}):
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                          {rec.actionSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
