import { useSyncExternalStore } from "react";

/*
  Tells the nav whether it is floating over something dark (the door) or light
  (the white gallery), so it can switch its glass style. null = page default.
*/
export type StageTone = "dark" | "light" | null;

let tone: StageTone = null;
const listeners = new Set<() => void>();

export function setStageTone(next: StageTone) {
  tone = next;
  listeners.forEach((l) => l());
}

export function useStageTone(): StageTone {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => tone,
    () => null,
  );
}
