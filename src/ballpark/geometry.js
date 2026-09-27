// ── Ballpark geometry: field coordinates (feet) and the broadcast camera ──
// Field space: home plate at the origin, x toward the first-base side, d
// toward center field, h up. The camera sits high behind home plate.

import { LEAGUE } from "../game/constants.js";

export const VIEW_W = 180;
export const VIEW_H = 144;

const CAM_BACK = 140, CAM_H = 120, FOCAL = 160, AXIS_Y = 60;
const TILT = (20 * Math.PI) / 180;
const COS = Math.cos(TILT), SIN = Math.sin(TILT);

// Field point -> screen pixel [sx, sy, depth]
export function project(x, d, h = 0) {
  const Y = d + CAM_BACK, Z = h - CAM_H;
  const zc = Y * COS - Z * SIN;
  const yc = Y * SIN + Z * COS;
  return [VIEW_W / 2 + (FOCAL * x) / zc, AXIS_Y - (FOCAL * yc) / zc, zc];
}

// Screen pixel -> point on the ground (h = 0). Inverse of project().
export function unproject(sx, sy) {
  const u = (sx - VIEW_W / 2) / FOCAL;
  const v = (AXIS_Y - sy) / FOCAL;
  // Ray direction in camera space (right, up, forward=1) -> world
  const dy = COS + v * SIN;   // world d component
  const dz = -SIN + v * COS;  // world h component
  if (dz >= 0) return null;   // at or above the horizon
  const t = -CAM_H / dz;
  return [u * t, t * dy - CAM_BACK];
}

export const fenceAt = (deg) =>
  LEAGUE.fenceCenter - (LEAGUE.fenceCenter - LEAGUE.fenceCorner) * (Math.min(45, Math.abs(deg)) / 45);

// Polar (spray degrees, distance ft) -> field x, d
export const polar = (deg, dist) => {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r) * dist, Math.cos(r) * dist];
};
export const toPolar = (x, d) => [(Math.atan2(x, d) * 180) / Math.PI, Math.hypot(x, d)];

// Bases: index 0 = home, 1 = first, 2 = second, 3 = third, 4 = home again
export const BASES = [[0, 0], [63.6, 63.6], [0, 127.3], [-63.6, 63.6], [0, 0]];
export const MOUND = [0, 60.5];
export const WALL_H = 12;

// Defensive alignment (where each fielder waits)
export const POSITIONS = {
  P: [0, 58],
  C: [0, -6],
  "1B": polar(38, 100),
  "2B": polar(13, 145),
  SS: polar(-13, 145),
  "3B": polar(-38, 100),
  LF: polar(-28, 285),
  CF: polar(0, 315),
  RF: polar(28, 285),
};
export const FIELD_ORDER = ["P", "C", "1B", "2B", "SS", "3B", "LF", "CF", "RF"];
export const BATTER_SPOT = [-6, 1];
export const UMP_SPOT = [5, -13];
