"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  symbol: string;
  interval?: string;
  theme?: "dark" | "light";
}

export function TradingViewWidget({ symbol, interval = "60", theme = "dark" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let created = false;
    const win = window as any;
    const render = () => {
      try {
        if (win.TradingView && typeof win.TradingView.widget === "function" && containerRef.current) {
          containerRef.current.innerHTML = "";
          new win.TradingView.widget({
            container_id: containerRef.current.id,
            autosize: true,
            symbol,
            interval,
            timezone: "Etc/UTC",
            theme,
            style: "1",
            locale: "en",
            toolbar_bg: theme === "dark" ? "#1f2937" : "#f1f3f6",
            hide_side_toolbar: false,
            enable_publishing: false,
            allow_symbol_change: true,
          });
          created = true;
          setError(false);
+          setLoaded(true);
        }
      } catch (e) {
        console.warn("TV widget err", e);
        setError(true);
      }
    };

    if (!(window as any).TradingView) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.onload = () => setTimeout(render, 300);
      document.head.appendChild(script);
    } else {
      render();
    }

    const timeout = setTimeout(() => {
      if (!created) setError(true);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [symbol, interval, theme]);

  return (
    <div className="w-full h-full min-h-[400px] relative">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Loading chart...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Unable to load chart.
        </div>
      )}
      <div id={`tv-${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`} ref={containerRef} className="w-full h-full" />
    </div>
  );
}
