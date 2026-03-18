"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Bell, Download, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState(true);

  const handleDownloadData = () => {
    // TODO: Implement data export
    console.log("Download data clicked");
  };

  const handleLogout = () => {
    // TODO: Implement logout
    console.log("Logout clicked");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 transform"
          >
            <div className={cn(
              "relative rounded-2xl border border-cyan-400/40 bg-black/80 backdrop-blur-xl",
              "shadow-2xl overflow-hidden"
            )}>
              {/* Header */}
              <div className="relative border-b border-cyan-400/20 px-6 py-5 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-cyan-400/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cyan-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6 max-h-96 overflow-y-auto">
                {/* Theme Setting */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300">Theme</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all",
                        theme === "dark"
                          ? "border-purple-400 bg-purple-400/10 text-purple-300"
                          : "border-gray-600/50 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                      )}
                    >
                      <Moon className="w-4 h-4" />
                      <span className="text-sm">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all",
                        theme === "light"
                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                          : "border-gray-600/50 bg-gray-900/50 text-gray-400 hover:border-gray-500"
                      )}
                    >
                      <Sun className="w-4 h-4" />
                      <span className="text-sm">Light</span>
                    </button>
                  </div>
                </div>

                {/* Notifications Setting */}
                <div className="space-y-3 pb-4 border-b border-gray-700/50">
                  <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      Push Notifications
                    </span>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        notifications ? "bg-purple-500" : "bg-gray-700"
                      )}
                    >
                      <motion.span
                        layout
                        className="inline-block h-4 w-4 transform rounded-full bg-white"
                        animate={{ x: notifications ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    {notifications
                      ? "Get alerts for news and trading signals"
                      : "All notifications disabled"}
                  </p>
                </div>

                {/* Data Export */}
                <button
                  onClick={handleDownloadData}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                    "border border-cyan-400/20 hover:border-cyan-400/50 hover:bg-cyan-400/5",
                    "text-cyan-300 hover:text-cyan-200 transition-all"
                  )}
                >
                  <Download className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Export Data</div>
                    <div className="text-xs text-cyan-400/60">Download your decisions & history</div>
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                    "border border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-400/5",
                    "text-pink-300 hover:text-pink-200 transition-all"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  <div className="text-left">
                    <div className="text-sm font-medium">Logout</div>
                    <div className="text-xs text-pink-400/60">Sign out of your account</div>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-700/50 px-6 py-4 flex gap-3">
                <button
                  onClick={onClose}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg border border-gray-600/50 text-gray-300",
                    "hover:border-gray-500 hover:bg-gray-900/50 transition-all"
                  )}
                >
                  Close
                </button>
                <button
                  onClick={onClose}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg font-medium",
                    "bg-gradient-to-r from-cyan-500 to-purple-500 text-white",
                    "hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                  )}
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
