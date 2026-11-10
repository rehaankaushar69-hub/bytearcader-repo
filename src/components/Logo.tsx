import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

/**
 * Original ByteArcadeR RepoGuard shield logo combining:
 * - Multi-layered faceted security shield
 * - Precision code brackets and slash (< / >)
 * - Blue (#2563EB) and Cyan (#06B6D4) technology gradient aesthetic
 */
export const RepoGuardLogoMark: React.FC<LogoMarkProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="repoguard-shield-grad" x1="4" y1="3" x2="36" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="repoguard-inner-grad" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#090D16" />
        </linearGradient>
        <linearGradient id="repoguard-code-grad" x1="12" y1="14" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Outer Security Shield */}
      <path
        d="M20 2.5L6 8.2V18.8C6 27.9 11.95 35.85 20 38.5C28.05 35.85 34 27.9 34 18.8V8.2L20 2.5Z"
        fill="url(#repoguard-shield-grad)"
      />

      {/* Inner Shield Core */}
      <path
        d="M20 5.3L8.5 10V18.6C8.5 26.3 13.4 33.1 20 35.5C26.6 33.1 31.5 26.3 31.5 18.6V10L20 5.3Z"
        fill="url(#repoguard-inner-grad)"
      />

      {/* Subtle Inner Technical Shield Facet */}
      <path
        d="M20 6.8L10 10.9V18.5C10 25.3 14.3 31.3 20 33.6V6.8Z"
        fill="#0EA5E9"
        fillOpacity="0.08"
      />

      {/* Left Code Bracket < */}
      <path
        d="M16.2 15.2L11.8 19.5L16.2 23.8"
        stroke="url(#repoguard-code-grad)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Code Bracket > */}
      <path
        d="M23.8 15.2L28.2 19.5L23.8 23.8"
        stroke="url(#repoguard-code-grad)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Forward Slash / */}
      <path
        d="M21.4 13.8L18.6 25.2"
        stroke="#22D3EE"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
};
