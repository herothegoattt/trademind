"use client";

import { ReactNode } from "react";
import { PostHogPageView } from "./PostHogPageView";

interface Props {
  children: ReactNode;
}

/** Оборачивает приложение для трекинга PostHog: pageview при смене маршрута. */
export function PostHogProvider({ children }: Props) {
  return (
    <>
      {children}
      <PostHogPageView />
    </>
  );
}
