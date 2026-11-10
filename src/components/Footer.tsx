import React from 'react';
import { RepoGuardLogoMark } from './Logo';
import { AppPage } from './Navbar';

interface FooterProps {
  onNavigate: (page: AppPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#080D1A] text-slate-400 py-12 px-6 no-print">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <RepoGuardLogoMark size={24} />
            <span className="font-display font-bold text-slate-100 text-sm">
              ByteArcadeR RepoGuard
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Protect Your Code. Improve Your Repository. · Developed and maintained by ByteArcadeR AI.
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Repository: bytearcader-repo · Released under the MIT License
          </p>
        </div>

        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center gap-6 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate('features')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => onNavigate('docs')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Documentation
          </button>
          <button
            type="button"
            onClick={() => onNavigate('contribute')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Contribute
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            About ByteArcadeR AI
          </button>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
        </nav>
      </div>
    </footer>
  );
};
