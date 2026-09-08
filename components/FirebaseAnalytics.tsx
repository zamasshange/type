"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp, hasFirebaseConfig } from "@/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    if (!hasFirebaseConfig()) return;
    void isSupported()
      .then((ok) => {
        if (ok) getAnalytics(getFirebaseApp());
      })
      .catch(() => undefined);
  }, []);
  return null;
}
