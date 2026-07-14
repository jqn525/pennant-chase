// ── SVG icons ──

import { C } from "../game/constants.js";

export const BallIcon = ({ size = 18, color = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M6 5.5 C 9 9, 9 15, 6 18.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
    <path d="M18 5.5 C 15 9, 15 15, 18 18.5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
  </svg>
);

export const StarIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
  </svg>
);

export const CoinIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v10M9.5 9c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.9-2.5.9-2.5 1.9 1 1.7 2.5 1.7 2.5-.7 2.5-1.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const FansIcon = ({ size = 12, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.8" />
    <circle cx="16.5" cy="9.5" r="2.4" stroke={color} strokeWidth="1.8" />
    <path d="M3 20c0-3 2.2-5 5-5s5 2 5 5M13.5 20c.2-2.4 1.6-4 3.5-4s3 1.6 3.2 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const TrophyIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 14v4M8.5 20h7M10 18h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const ClockIcon = ({ size = 12, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3.5 2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PlayIcon = ({ size = 12, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const PauseIcon = ({ size = 12, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </svg>
);

// Bottom navigation icons
export const DiamondNavIcon = ({ size = 20, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="7.5" y="7.5" width="9" height="9" transform="rotate(45 12 12)" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1.4" fill={color} />
  </svg>
);

export const RosterNavIcon = ({ size = 20, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
    <path d="M3.5 19c.4-3.4 2.6-5.4 5.5-5.4s5.1 2 5.5 5.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="17" cy="9.5" r="2.4" stroke={color} strokeWidth="1.6" />
    <path d="M16 13.8c2.4.2 4 1.8 4.4 4.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ShopNavIcon = ({ size = 20, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10.5 12 3l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 21v-6h6v6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 8.5h8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const OfficeNavIcon = ({ size = 20, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="4" width="14" height="17" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10.5 21v-3h3v3" stroke={color} strokeWidth="1.5" />
  </svg>
);

export const DiceIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
    <circle cx="9" cy="9" r="1.4" fill={color} />
    <circle cx="15" cy="9" r="1.4" fill={color} />
    <circle cx="9" cy="15" r="1.4" fill={color} />
    <circle cx="15" cy="15" r="1.4" fill={color} />
    <circle cx="12" cy="12" r="1.4" fill={color} />
  </svg>
);

export const SoundOnIcon = ({ size = 12, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9z" fill={color} />
    <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const SoundOffIcon = ({ size = 12, color = C.creamDim }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9z" fill={color} />
    <path d="M16.5 9.5 21 14M21 9.5 16.5 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Stadium upgrade tracks
export const CarIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="3" y="13" width="18" height="5" rx="1.5" stroke={color} strokeWidth="1.8" />
    <circle cx="7.5" cy="18" r="1.8" fill={color} />
    <circle cx="16.5" cy="18" r="1.8" fill={color} />
  </svg>
);

export const SeatsIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 20v-3h18v3M6 17v-4h12v4M9 13V9h6v4" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const ConcessionIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 8h10l-1.4 12a1.5 1.5 0 0 1-1.5 1.3h-4.2a1.5 1.5 0 0 1-1.5-1.3z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7.8 12.5h8.4" stroke={color} strokeWidth="1.5" />
    <path d="M10 8 13.5 3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const LightsIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="4" width="14" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
    <circle cx="9" cy="7.5" r="1.1" fill={color} />
    <circle cx="15" cy="7.5" r="1.1" fill={color} />
    <path d="M12 11v9M8.5 20h7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Revenue tracks
export const ShirtIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 4 4 7l1.8 4L8 10v9h8v-9l2.2 1L20 7l-5-3a3 3 0 0 1-6 0z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const TvIcon = ({ size = 14, color = C.amber }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="8" width="17" height="12" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M8 8 12 4M16 8 12 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 12h6M7 15h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const GearIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill={color} d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.03 7.03 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.39 1.08.73 1.69.98l.38 2.65c.04.24.24.42.49.42h4c.25 0 .45-.18.49-.42l.38-2.65a7.03 7.03 0 0 0 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
  </svg>
);

// Save-file rows in Settings
export const SaveIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 3h10.5L20 7.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 3v5h7V3" stroke={color} strokeWidth="1.6" />
    <path d="M8 21v-7h8v7" stroke={color} strokeWidth="1.6" />
  </svg>
);

export const ImportIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v10M8 9.5l4 4 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 16.5v2a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const LockIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2" stroke={color} strokeWidth="1.9" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="1.9" />
    <circle cx="12" cy="15.5" r="1.4" fill={color} />
  </svg>
);

export const RestartIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 12a8 8 0 1 1-2.4-5.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 2.8v4.4h-4.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const RulebookIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M5 20a2 2 0 0 1 2-2h12" stroke={color} strokeWidth="1.8" />
    <path d="M10 7h6M10 10h6M10 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
