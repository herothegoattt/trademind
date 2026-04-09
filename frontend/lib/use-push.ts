"use client";

import { useState, useEffect, useCallback } from "react";

export type PushPermission = "loading" | "unsupported" | "denied" | "default" | "granted";

export interface PushPrefs {
  daily_bias:      boolean;
  trading_signals: boolean;
  price_alerts:    boolean;
  news:            boolean;
}

const DEFAULT_PREFS: PushPrefs = {
  daily_bias:      true,
  trading_signals: true,
  price_alerts:    true,
  news:            false,
};

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const raw    = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const arr    = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export function usePush() {
  const [permission, setPermission]   = useState<PushPermission>("loading");
  const [subscribed, setSubscribed]   = useState(false);
  const [prefs, setPrefs]             = useState<PushPrefs>(DEFAULT_PREFS);
  const [endpoint, setEndpoint]       = useState<string | null>(null);
  const [busy, setBusy]               = useState(false);

  // Detect current state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscribed(true);
          setEndpoint(sub.endpoint);
        }
      });
    }).catch(() => {});
  }, []);

  // Register service worker (idempotent)
  const ensureSW = useCallback(async (): Promise<ServiceWorkerRegistration> => {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  // Subscribe to push
  const subscribe = useCallback(async (token?: string): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") return false;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const reg      = await ensureSW();
      const sub      = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setEndpoint(sub.endpoint);

      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscription: sub.toJSON(), preferences: prefs }),
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, prefs, ensureSW]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setSubscribed(false);
      setEndpoint(null);
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Update preferences
  const updatePrefs = useCallback(async (updates: Partial<PushPrefs>) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    if (endpoint) {
      await fetch("/api/push/subscribe", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint, preferences: next }),
      }).catch(() => {});
    }
  }, [prefs, endpoint]);

  const toggle = useCallback(async (token?: string) => {
    if (subscribed) await unsubscribe();
    else await subscribe(token);
  }, [subscribed, subscribe, unsubscribe]);

  return {
    permission,
    subscribed,
    prefs,
    busy,
    subscribe,
    unsubscribe,
    updatePrefs,
    toggle,
  };
}
