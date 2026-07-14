// Lock the page scroll while a full-screen layer (modal, settings page) is open
import { useEffect } from "react";

export default function useLockBody() {
  useEffect(() => {
    // position:fixed is the lock iOS actually honors for touch scrolling;
    // remember the offset so closing the layer doesn't jump the page.
    const y = window.scrollY;
    const b = document.body.style;
    const prev = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width };
    b.position = "fixed";
    b.top = `-${y}px`;
    b.left = "0";
    b.right = "0";
    b.width = "100%";
    return () => {
      Object.assign(b, prev);
      window.scrollTo(0, y);
    };
  }, []);
}
