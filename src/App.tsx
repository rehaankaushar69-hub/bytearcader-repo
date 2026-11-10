/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AboutPage,
  ContributePage,
  DocumentationPage,
  FeaturesPage,
  PrivacyPage,
} from './components/ContentPages';
import { DashboardView } from './components/DashboardView';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { AppPage, Navbar } from './components/Navbar';
import { AnalysisReport } from './types/repoguard';

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>('landing');
  const [repoInput, setRepoInput] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const runAnalysis = async (repoIdentifier: string, refresh = false) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setActivePage('dashboard');

    try {
      const url = `/api/analyze?repo=${encodeURIComponent(repoIdentifier)}${
        refresh ? '&refresh=true' : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setReport(null);
        setError(data?.message || `Failed to analyze repository (${res.status}).`);
        return;
      }

      setReport(data as AnalysisReport);
    } catch {
      setReport(null);
      setError('Network error while contacting the ByteArcadeR RepoGuard analysis server.');
    } finally {
      setIsLoading(false);
    }
  };

  const runDemoMode = async () => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setActivePage('dashboard');

    try {
      const res = await fetch('/api/demo');
      const data = await res.json();
      if (!res.ok) {
        setError('Unable to load offline Demo Mode report.');
        return;
      }
      setReport(data as AnalysisReport);
    } catch {
      setError('Unable to load offline Demo Mode report.');
    } finally {
      setIsLoading(false);
    }
  };

  // Support optional ?repo=<owner/repo> or ?demo=1 query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRepo = params.get('repo');
    const demoParam = params.get('demo');
    if (queryRepo) {
      setRepoInput(queryRepo);
      runAnalysis(queryRepo);
    } else if (demoParam === '1') {
      runDemoMode();
    }
  }, []);

  const handleFocusAnalyzer = () => {
    if (activePage !== 'landing' && activePage !== 'dashboard') {
      setActivePage('dashboard');
      return;
    }
    if (activePage === 'landing' && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setActivePage('dashboard');
    }
  };

  const handleNavigate = (page: AppPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-slate-100">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onFocusAnalyzer={handleFocusAnalyzer}
      />

      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            repoInput={repoInput}
            setRepoInput={setRepoInput}
            onAnalyze={(repo) => runAnalysis(repo)}
            onRunDemo={runDemoMode}
            isLoading={isLoading}
            error={error}
            onNavigate={handleNavigate}
            inputRef={inputRef}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardView
            report={report}
            repoInput={repoInput}
            setRepoInput={setRepoInput}
            onAnalyze={(repo, refresh) => runAnalysis(repo, refresh)}
            onRunDemo={runDemoMode}
            isLoading={isLoading}
            error={error}
          />
        )}

        {activePage === 'features' && (
          <FeaturesPage
            onNavigate={handleNavigate}
            onInspectRepo={(repo) => {
              setRepoInput(repo);
              runAnalysis(repo);
            }}
            onRunDemo={runDemoMode}
          />
        )}

        {activePage === 'docs' && <DocumentationPage onNavigate={handleNavigate} />}

        {activePage === 'contribute' && (
          <ContributePage
            onNavigate={handleNavigate}
            onInspectRepo={(repo) => {
              setRepoInput(repo);
              runAnalysis(repo);
            }}
            onRunDemo={runDemoMode}
          />
        )}

        {activePage === 'about' && <AboutPage onNavigate={handleNavigate} />}

        {activePage === 'privacy' && <PrivacyPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
