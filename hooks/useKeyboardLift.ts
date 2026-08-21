"use client";

import { useEffect } from "react";

function applyViewport() {
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  const keyboard = Math.max(0, window.innerHeight - height - offsetTop);
  const root = document.documentElement;
  root.style.setProperty("--vvh", `${Math.round(height)}px`);
  root.style.setProperty("--vv-top", `${Math.round(offsetTop)}px`);
  root.style.setProperty("--kb", `${Math.round(keyboard)}px`);
  const open = keyboard > 70;
  root.classList.toggle("kb-open", open);
  if (open) window.scrollTo(0, 0);
}

export function useKeyboardLift(active: boolean) {
  useEffect(() => {
    if (!active) {
      document.documentElement.classList.remove("kb-open");
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.style.removeProperty("--vv-top");
      document.documentElement.style.removeProperty("--kb");
      return;
    }

    applyViewport();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", applyViewport);
    vv?.addEventListener("scroll", applyViewport);
    window.addEventListener("resize", applyViewport);
    return () => {
      vv?.removeEventListener("resize", applyViewport);
      vv?.removeEventListener("scroll", applyViewport);
      window.removeEventListener("resize", applyViewport);
      document.documentElement.classList.remove("kb-open");
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.style.removeProperty("--vv-top");
      document.documentElement.style.removeProperty("--kb");
    };
  }, [active]);
}
