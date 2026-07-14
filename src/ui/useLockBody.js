// Lock the page scroll while a full-screen layer (modal, settings page) is open
import { useEffect } from "react";

export default function useLockBody() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}
