import { useEffect, useRef } from "react";
import { LEAGUE } from "../game/constants.js";
import "./BallparkScene.css";

const teamName = (city) => city?.nickname ?? city?.name ?? "Home";

function drawScene(app, g, width, height, Graphics) {
  const stage = app.stage;
  stage.removeChildren().forEach((child) => child.destroy());
  const art = new Graphics();

  art.rect(0, 0, width, height).fill(0x172238);
  art.rect(0, height * .18, width, height * .2).fill(0x8b4930);
  art.rect(0, height * .26, width, height * .18).fill(0x19271d);
  art.rect(0, height * .39, width, height * .15).fill(0x0b1710);

  for (let i = 0; i < 90; i++) {
    const x = (i * 47) % width;
    const y = height * .4 + ((i * 29) % Math.max(18, height * .1));
    art.circle(x, y, 1.2 + (i % 2)).fill(i % 5 === 0 ? 0xd09137 : i % 3 === 0 ? 0xd8c6a3 : 0x31513b);
  }

  art.poly([0, height, width / 2, height * .47, width, height]).fill(0x23522f);
  for (let i = 0; i < 7; i++) {
    const x0 = width * (i / 7);
    const x1 = width * ((i + 1) / 7);
    art.poly([x0, height, width / 2, height * .47, x1, height]).fill(i % 2 ? 0x285d35 : 0x1f4b2b);
  }

  const home = { x: width / 2, y: height * .9 };
  const second = { x: width / 2, y: height * .64 };
  const first = { x: width * .64, y: height * .76 };
  const third = { x: width * .36, y: height * .76 };
  art.poly([home.x, home.y, first.x, first.y, second.x, second.y, third.x, third.y]).fill(0x8a5a31);
  art.poly([home.x, home.y, first.x, first.y, second.x, second.y, third.x, third.y]).stroke({ color: 0xe8d8b9, width: 1, alpha: .65 });
  art.circle(width / 2, height * .7, 15).fill(0x9b6537);

  [first, second, third].forEach((p, i) => {
    const occupied = g?.bases?.[i] && !g.over;
    art.poly([p.x, p.y - 5, p.x + 5, p.y, p.x, p.y + 5, p.x - 5, p.y]).fill(occupied ? 0xe9a431 : 0xe9dfc9);
  });

  const players = [
    [width / 2, height * .68], [width * .38, height * .64], [width * .62, height * .64],
    [width * .3, height * .54], [width * .7, height * .54], [width / 2, height * .5],
  ];
  players.forEach(([x, y]) => {
    art.circle(x, y - 6, 3).fill(0xc58a4c);
    art.rect(x - 3, y - 3, 6, 9).fill(0xeee2c9);
    art.rect(x - 4, y + 6, 3, 7).fill(0x0c2819);
    art.rect(x + 1, y + 6, 3, 7).fill(0x0c2819);
  });

  const balls = g?.balls ?? [];
  balls.slice(-18).forEach((b, i) => {
    const rad = (b.spray * Math.PI) / 180;
    const reach = Math.min(1, b.dist / LEAGUE.fenceCenter) * height * .34;
    const x = home.x + Math.sin(rad) * reach;
    const y = home.y - Math.cos(rad) * reach;
    const color = b.t === "hr" ? 0xe9a431 : b.t === "hit" ? 0xf5edda : b.t === "err" ? 0xc6503f : 0x5b7965;
    art.circle(x, y, i === balls.slice(-18).length - 1 ? 4 : 2).fill({ color, alpha: i === balls.slice(-18).length - 1 ? 1 : .65 });
  });

  stage.addChild(art);
}

export default function BallparkScene({ g, city }) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const stateRef = useRef(g);
  stateRef.current = g;

  useEffect(() => {
    let disposed = false;
    const host = hostRef.current;
    let app;
    const boot = async () => {
      const { Application, Graphics } = await import("pixi.js");
      if (disposed) return;
      app = new Application();
      await app.init({ backgroundAlpha: 0, antialias: false, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2) });
      if (disposed) return app.destroy(true);
      appRef.current = app;
      app.__Graphics = Graphics;
      host.appendChild(app.canvas);
      const resize = () => {
        const width = Math.max(300, host.clientWidth);
        const height = Math.round(Math.min(460, Math.max(330, width * .9)));
        app.renderer.resize(width, height);
        drawScene(app, stateRef.current, width, height, Graphics);
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      app.__observer = observer;
    };
    boot();
    return () => {
      disposed = true;
      app?.__observer?.disconnect();
      if (appRef.current === app) appRef.current = null;
      app?.destroy(true, { children: true });
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    const host = hostRef.current;
    if (app && host) drawScene(app, g, app.renderer.width / app.renderer.resolution, app.renderer.height / app.renderer.resolution, app.__Graphics);
  }, [g?.inning, g?.half, g?.outs, g?.us, g?.them, g?.balls?.length, g?.bases]);

  const us = g?.us ?? 0;
  const them = g?.them ?? 0;
  return (
    <section className="ballpark-scene" aria-label="Live ballpark">
      <div ref={hostRef} className="ballpark-scene__canvas" aria-hidden="true" />
      <div className="ballpark-scene__lights ballpark-scene__lights--left" />
      <div className="ballpark-scene__lights ballpark-scene__lights--right" />
      <div className="ballpark-scorecard">
        <div><span>{teamName(city)}</span><strong>{us}</strong></div>
        <div><span>{g?.opp?.name ?? "Visitors"}</span><strong>{them}</strong></div>
        <aside>
          <b>{g ? `${g.half === "top" ? "Top" : "Bot"} ${g.inning}` : "Next game"}</b>
          <small>{g && !g.over ? `${g.outs} out${g.outs === 1 ? "" : "s"}` : g?.over ? "Final" : "Clubhouse ready"}</small>
        </aside>
      </div>
    </section>
  );
}
