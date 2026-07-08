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

export const RulebookIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M5 20a2 2 0 0 1 2-2h12" stroke={color} strokeWidth="1.8" />
    <path d="M10 7h6M10 10h6M10 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
