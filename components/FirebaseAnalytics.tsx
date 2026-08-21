"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp } from "@/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    void isSupported().then((ok) => {
      if (ok) getAnalytics(getFirebaseApp());
    });
  }, []);
  return null;
}
