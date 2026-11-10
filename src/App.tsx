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
  const [repoInput, setRepoInput] = useState<string>('bytearcader-ai/bytearcader-repo');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const runAnalysis = async (repoIdentifier: string, refresh = false) => {
    setIsLoading(true);
    setError(null);
    setActivePage('dashboard');

    try {
      const url = `/api/analyze?repo=${encodeURIComponent(repoIdentifier)}${
        refresh ? '&refresh=true' : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || `Failed to analyze repository (${res.status}).`);
        return;
      }

      setReport(data as AnalysisReport);
    } catch {
      setError('Network error while contacting the ByteArcadeR RepoGuard analysis server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-load initial self-audit report or ?repo= query param so the dashboard is immediately testable
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRepo = params.get('repo');
    const autostart = params.get('autostart');
    if (queryRepo) {
      setRepoInput(queryRepo);
      runAnalysis(queryRepo);
    } else if (autostart === '1') {
      runAnalysis('bytearcader-ai/bytearcader-repo');
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
          />
        )}

        {activePage === 'about' && <AboutPage onNavigate={handleNavigate} />}

        {activePage === 'privacy' && <PrivacyPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
