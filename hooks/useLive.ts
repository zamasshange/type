"use client";

import { useEffect, useState } from "react";
import { subscribeLive, type LiveState } from "@/lib/live";

const empty: LiveState = {
  users: [],
  results: [],
  ready: false,
  error: null,
  backend: null,
};

export function useLive() {
  const [live, setLive] = useState<LiveState>(empty);
  useEffect(() => subscribeLive(setLive), []);
  return live;
}
