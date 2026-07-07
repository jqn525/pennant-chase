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

export const RulebookIcon = ({ size = 16, color = C.cream }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M5 20a2 2 0 0 1 2-2h12" stroke={color} strokeWidth="1.8" />
    <path d="M10 7h6M10 10h6M10 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
