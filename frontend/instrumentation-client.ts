import posthog from "posthog-js";

// Поддерживаем оба варианта имени токена: KEY и TOKEN
const token =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

if (typeof window !== "undefined" && token) {
  posthog.init(token, {
    api_host: host,
    capture_pageview: false,
    person_profiles: "identified_only",
    // можно зафиксировать дату для ретеншна, если нужно:
    // defaults: "2026-01-30",
  });
}
