"use client";

import { StoreProvider } from "./StoreProvider";
import { SessionProvider } from "./SessionProvider";
import { Shell } from "./Shell";
import { FirebaseAnalytics } from "./FirebaseAnalytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <SessionProvider>
        <FirebaseAnalytics />
        <Shell>{children}</Shell>
      </SessionProvider>
    </StoreProvider>
  );
}
