"use client";

import { ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  useEffect(() => {
    const saved = localStorage.getItem('trademind-theme');
    if (saved === 'light') document.documentElement.classList.add('light');
  }, []);

  return <>{children}</>;
}
