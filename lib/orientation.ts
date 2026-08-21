export async function enterTypingLayout() {
  if (typeof window === "undefined") return;
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900;
  if (!mobile) return;
  document.documentElement.classList.add("is-typing");
  try {
    const node = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (!document.fullscreenElement) {
      await (node.requestFullscreen?.() ?? node.webkitRequestFullscreen?.());
    }
  } catch {
    /* iOS often blocks fullscreen */
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    await orientation.lock?.("landscape");
  } catch {
    /* Safari has no orientation lock */
  }
}

export async function exitTypingLayout() {
  if (typeof window === "undefined") return;
  document.documentElement.classList.remove("is-typing");
  try {
    (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
  } catch {
    /* ignore */
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}
