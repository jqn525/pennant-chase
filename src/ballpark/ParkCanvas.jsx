// ── The ballpark: a pixel-art night game drawn on a 180×144 canvas ──
// Every play the engine resolves arrives as a structured `play` (engine.js)
// through playsRef; choreo.js turns it into a timeline that this loop samples
// each frame. Between plays the scene idles off the live game state.

import { useEffect, useRef } from "react";
import Panel from "../ui/Panel.jsx";
import { ANIM, FR } from "../art/sprites/players.js";
import { drawFrame, frameAt } from "../art/sprite.js";
import { PARK, US_TEAM, teamColors, skinFor, swapFor, hashStr } from "../art/palette.js";
import { drawText, textWidth } from "../art/font.js";
import { VIEW_W, VIEW_H, project, POSITIONS, FIELD_ORDER, BASES, BATTER_SPOT, UMP_SPOT, polar } from "./geometry.js";
import { buildPark, drawAmbient, px } from "./scene.js";
import { buildPlay, ballAt, actorAt } from "./choreo.js";
import "./ParkCanvas.css";

const UMP_SWAP = { W: "#3a4a42" };
const FW_COLORS = [PARK.lamp, "#e9a431", "#c6503f", "#f5edda", "#4f78a8"];
const abbr = (s = "") => s.replace(/[^A-Za-z ]/g, "").slice(0, 3).toUpperCase() || "---";

export default function ParkCanvas({ g, speed, playsRef, teamName }) {
  const canvasRef = useRef(null);
  const live = useRef({});
  live.current = { g, speed, teamName };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (playsRef) playsRef.current.length = 0; // stale plays from while we were away
    const out = canvas.getContext("2d");
    const park = buildPark();
    const low = document.createElement("canvas");
    low.width = VIEW_W;
    low.height = VIEW_H;
    const ctx = low.getContext("2d");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const swaps = new Map();
    const swapOf = (team, home, skinSeed) => {
      const skin = skinFor(skinSeed);
      const key = `${team[0]}|${home ? 1 : 0}|${skin[0]}`;
      if (!swaps.has(key)) swaps.set(key, swapFor({ team, home, skin }));
      return [swaps.get(key), key];
    };

    let script = null;      // { tl, t0, play }
    let seenG = null;
    let jumbo = null;       // { text, from, until }
    let hypeUntil = 0, shakeUntil = 0;
    let sparks = [];        // firework particles
    let pendingFw = [];     // scheduled burst times
    let trail = [];
    let raf, last = performance.now();

    const burst = (now) => {
      const cx = 30 + Math.random() * (VIEW_W - 60), cy = 6 + Math.random() * 14;
      const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2, v = 14 + Math.random() * 10;
        sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: now, life: 700 + Math.random() * 400, color });
      }
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.max(VIEW_W, Math.round(r.width * dpr));
      canvas.height = Math.max(VIEW_H, Math.round(r.height * dpr));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      const { g: game, speed: spd, teamName: tn } = live.current;

      if (game !== seenG) { seenG = game; script = null; trail = []; }

      // Take the newest play; older ones queued during a hiccup are skipped
      const q = playsRef?.current;
      if (q && q.length) {
        const play = q[q.length - 1];
        q.length = 0;
        if (spd !== "max") {
          const tl = buildPlay(play, spd === 4 ? 4 : 1);
          script = reduced ? null : { tl, t0: now, play };
          trail = [];
          if (tl.jumbo) jumbo = { text: tl.jumbo, from: now + tl.contact, until: now + tl.contact + (spd === 4 ? 700 : 1500) };
          if (tl.hype && !reduced) hypeUntil = now + tl.contact + 1600;
          if (tl.fireworks != null && !reduced) {
            for (let i = 0; i < 4; i++) pendingFw.push(now + tl.fireworks + i * 260);
            shakeUntil = now + tl.contact + 250;
          }
        }
      }
      const t = script ? now - script.t0 : 0;
      const active = script && t <= script.tl.dur;

      // ── background ──
      ctx.save();
      if (now < shakeUntil) ctx.translate(Math.round(Math.random() * 2 - 1), Math.round(Math.random() * 2 - 1));
      ctx.drawImage(park.bg, 0, 0);
      drawAmbient(ctx, park, now);
      const hype = now < hypeUntil;
      const crowdV = reduced ? 0 : hype ? (Math.floor(now / 110) % 2 ? 2 : 0) : Math.floor(now / 650) % 2;
      ctx.drawImage(park.crowd[crowdV], 0, 0);

      // ── jumbotron ──
      const bx = 58, by = 2, bw = 64, bh = 16;
      ctx.fillStyle = PARK.boardFrame;
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = PARK.board;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = PARK.pole;
      ctx.fillRect(bx + 8, by + bh + 1, 1, 6);
      ctx.fillRect(bx + bw - 9, by + bh + 1, 1, 6);
      const center = (s, y, c) => drawText(ctx, s, bx + Math.floor((bw - textWidth(s)) / 2), y, c);
      if (jumbo && now >= jumbo.from && now < jumbo.until) {
        const blink = Math.floor((now - jumbo.from) / 140) % 2;
        center(jumbo.text, by + 5, blink ? PARK.boardText : PARK.lamp);
      } else if (game) {
        const us = `${abbr(tn)} ${game.us}`, them = `${abbr(game.opp?.name)} ${game.them}`;
        center(`${us} ${them}`, by + 2, PARK.boardText);
        center(game.over ? "FINAL" : `${game.half === "top" ? "TOP" : "BOT"} ${game.inning} ${game.outs} OUT`, by + 9, PARK.lamp);
      } else {
        center("PLAY BALL", by + 5, PARK.boardText);
      }

      // ── spray marks for this game ──
      const balls = game?.balls ?? [];
      const hideLast = active ? 1 : 0;
      for (let i = 0; i < balls.length - hideLast; i++) {
        const b = balls[i];
        const [x, d] = polar(b.spray, Math.min(b.dist, 440));
        const [sx, sy] = project(x, d);
        if (sy > 0 && sy < VIEW_H) px(ctx, sx, sy, PARK.mark[b.t] || PARK.mark.out);
      }

      // ── actors ──
      const sprites = [];
      if (game) {
        const weBat = active ? script.play.weBat : game.half === (game.home ? "bottom" : "top");
        const oppTeam = teamColors(game.opp?.name);
        const fieldTeam = weBat ? oppTeam : US_TEAM;
        const batTeam = weBat ? US_TEAM : oppTeam;
        const fieldHome = weBat ? !game.home : game.home;
        const fieldName = weBat ? game.opp?.name : tn;
        const tl = active ? script.tl : null;

        const add = (pos, frame, swapPair, flip = false) => {
          const [sx, sy] = project(pos[0], pos[1]);
          sprites.push({ sx, sy, frame, swap: swapPair[0], key: swapPair[1], flip });
        };
        const pick = (anim, ms, seed) => {
          if (anim === "catch") return FR.catch;
          if (anim === "throw") return FR.throw;
          return frameAt(ANIM[anim] || ANIM.idle, ms + (seed % 997));
        };

        // Fielders
        for (const pos of FIELD_ORDER) {
          const seed = hashStr(fieldName + pos);
          const sw = swapOf(fieldTeam, fieldHome, fieldName + pos);
          const a = tl && actorAt(tl.actors[pos], t);
          if (a && a.anim) { add(a.pos, pick(a.anim, t - a.since, seed), sw, a.dir < 0); continue; }
          const home = POSITIONS[pos];
          if (pos === "P") {
            const fr = tl && tl.pitchAt != null && t < tl.contact + 200 && script.tl.dur > 300
              ? frameAt(ANIM.windup, t) : (tl ? FR.ready : FR.set);
            add(home, fr, sw);
          } else if (pos === "C") add(home, FR.catcher, sw);
          else add(home, pick("idle", now, seed), sw);
        }

        // Batter and runners
        if (!game.over || active) {
          const play = active ? script.play : null;
          const batSw = swapOf(batTeam, !fieldHome, play ? play.batterId : `${game.half}${game.inning}${game.outs}`);
          const ba = tl && actorAt(tl.actors.batter, t);
          if (ba && ba.anim && (ba.moving || t > tl.contact + 60)) add(ba.pos, pick(ba.anim, t - ba.since, 7), batSw, ba.dir < 0);
          else if (tl?.batterAnim && t >= tl.batterAnim.at) add(BATTER_SPOT, frameAt(ANIM.swing, t - tl.batterAnim.at), batSw);
          else add(BATTER_SPOT, FR.stance, batSw);

          for (let b = 1; b <= 3; b++) {
            const id = play ? play.on?.[b - 1] : game.bases[b - 1]?.id;
            if (id == null) continue;
            const rs = swapOf(batTeam, !fieldHome, id);
            const ra = tl && actorAt(tl.actors[`r${b}`], t);
            if (ra && ra.anim) add(ra.pos, pick(ra.anim, t - ra.since, b), rs, ra.dir < 0);
            else add([BASES[b][0] - 4, BASES[b][1] + 2], pick("idle", now, b * 31), rs);
          }
        }
        add(UMP_SPOT, FR.ump, [UMP_SWAP, "ump"]);
      }

      sprites.sort((a, b) => a.sy - b.sy);
      ctx.fillStyle = "rgba(8,16,12,0.45)";
      for (const s of sprites) ctx.fillRect(Math.round(s.sx) - 3, Math.round(s.sy) - 1, 6, 2);
      for (const s of sprites) drawFrame(ctx, s.frame, s.swap, s.key, s.sx, s.sy + 1, s.flip);

      // ── ball ──
      if (active) {
        const b = ballAt(script.tl.ball, t);
        if (b) {
          const [gx, gy] = project(b[0], b[1], 0);
          const [sx, sy] = project(b[0], b[1], b[2]);
          if (gy < VIEW_H && gy > park.wallTop[Math.max(0, Math.min(VIEW_W - 1, Math.round(gx)))]) px(ctx, gx, gy, PARK.shadow);
          trail.push([sx, sy]);
          if (trail.length > 5) trail.shift();
          trail.slice(0, -1).forEach(([x, y], i) => { if (i % 2 === 0) px(ctx, x, y, "#c9bfa4"); });
          ctx.fillStyle = PARK.ball;
          const big = b[2] > 30 ? 2 : 1;
          ctx.fillRect(Math.round(sx), Math.round(sy) - big + 1, big, big);
        } else trail = [];
      }

      // ── fireworks ──
      pendingFw = pendingFw.filter((at) => (now >= at ? (burst(now), false) : true));
      sparks = sparks.filter((p) => now - p.born < p.life);
      for (const p of sparks) {
        p.vy += 30 * (dt / 1000);
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        const age = (now - p.born) / p.life;
        if (age > 0.7 && Math.floor(now / 60) % 2) continue;
        px(ctx, p.x, p.y, p.color);
      }
      ctx.restore();

      out.imageSmoothingEnabled = false;
      out.drawImage(low, 0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [playsRef]);

  return (
    <Panel title="FIELD VIEW">
      <canvas ref={canvasRef} className="park-canvas" role="img" aria-label="Animated ballpark: the live game in pixel art" />
      <div className="park-legend">
        {[["HR", PARK.mark.hr], ["HIT", PARK.mark.hit], ["ERROR", PARK.mark.err], ["OUT", "#4a6355"]].map(([label, color]) => (
          <span key={label}><i style={{ background: color }} />{label}</span>
        ))}
      </div>
    </Panel>
  );
}

