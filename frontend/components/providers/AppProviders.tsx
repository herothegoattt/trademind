"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  // future providers (theme, auth, etc) could go here
  return <>{children}</>;
}
