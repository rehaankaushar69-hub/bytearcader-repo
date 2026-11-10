import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { RepoGuardLogoMark } from './Logo';

export type AppPage =
  | 'landing'
  | 'dashboard'
  | 'features'
  | 'docs'
  | 'contribute'
  | 'about'
  | 'privacy';

interface NavbarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onFocusAnalyzer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onFocusAnalyzer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: AppPage; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'features', label: 'Features' },
    { id: 'docs', label: 'Documentation' },
    { id: 'contribute', label: 'Contribute' },
    { id: 'about', label: 'About' },
  ];

  const handleNav = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800/80 no-print">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3 md:gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Title (Single element wordmark with custom Shield+Code SVG) */}
        <button
          type="button"
          onClick={() => handleNav('landing')}
          className="flex items-center gap-2.5 text-left text-sm sm:text-base font-bold tracking-tight text-slate-100 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400 rounded-md"
        >
          <RepoGuardLogoMark size={26} />
          <span>ByteArcadeR RepoGuard</span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          {navLinks.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 border-cyan-400'
                    : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onFocusAnalyzer();
            }}
            className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors rounded-lg whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            Analyze Repository
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-slate-800 bg-[#0B1120] px-6 py-4 space-y-2"
        >
          {navLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNav('privacy')}
            className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activePage === 'privacy'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
        </nav>
      )}
    </header>
  );
};
