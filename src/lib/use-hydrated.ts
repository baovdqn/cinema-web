"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false khi SSR/hydrate, true sau khi client mount — dùng cho state đọc từ localStorage (zustand persist). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
