// lib/store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Section,
  ErrorType,
  TopError,
  DailyBias,
  ChatMessage,
} from "./types";
import * as api from "./api";
import { getLang, setLang, Lang, t } from "./i18n";

function readLang(): Lang {
  if (typeof window === 'undefined') return getLang();
  return (localStorage.getItem('trademind-lang') as Lang) || getLang();
}

function readTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('trademind-theme') as 'dark' | 'light') || 'dark';
}

interface DashboardState {
  selectedSection: Section;
  selectedErrorType: ErrorType | null;
  backendConnected: boolean;
  topErrors: TopError[];
  dailyBias: DailyBias | null;
  suggestedQuestions: string[];
  warningZones: string[];
  chatMessages: ChatMessage[];
  chatDraft: string;
  isSending: boolean;
  rightPanelOpen: boolean;
  language: 'en' | 'ru' | 'uz';
  theme: 'dark' | 'light';

  initDashboard: () => Promise<void>;
  selectSection: (section: Section) => void;
  selectErrorType: (errorType: ErrorType | null) => void;
  setBackendConnected: (val: boolean) => void;
  setLanguage: (l: 'en' | 'ru' | 'uz') => void;
  setTheme: (t: 'dark' | 'light') => void;
  setChatDraft: (text: string) => void;
  insertPrompt: (text: string) => void;
  sendChat: () => Promise<void>;
  openRightPanelDrawer: () => void;
  closeRightPanelDrawer: () => void;
}

export const useDashboardStore = create<DashboardState>()(devtools((set, get) => ({
    selectedSection: "Journal",
    selectedErrorType: null,
    backendConnected: false,
    topErrors: [],
    dailyBias: null,
    suggestedQuestions: [],
    warningZones: [],
    chatMessages: [],
    chatDraft: "",
    isSending: false,
    rightPanelOpen: false,
      language: readLang(),
      theme: readTheme(),

    initDashboard: async () => {
      const [topErrors, dailyBias] = await Promise.all([
        api.getTopErrors(),
        api.getDailyBias(),
      ]);
      set({ topErrors, dailyBias });
      (get() as DashboardState).selectSection((get() as DashboardState).selectedSection);
    },

    selectSection: (section: Section): void => {
      set({ selectedSection: section, selectedErrorType: null });
      api.getSuggestedQuestions(section).then((q: string[]) =>
        set({ suggestedQuestions: q })
      );
      api.getWarningZones(section).then((z: string[]) => set({ warningZones: z }));
    },

    selectErrorType: (errorType: ErrorType | null): void => {
      set({ selectedErrorType: errorType });
    },

    setBackendConnected: (val: boolean): void => set({ backendConnected: val }),

    setChatDraft: (text: string): void => set({ chatDraft: text }),

    insertPrompt: (text: string): void => {
      set({ chatDraft: (get() as DashboardState).chatDraft + ((get() as DashboardState).chatDraft ? "\n" : "") + text });
    },

    sendChat: async () => {
      const state = get() as DashboardState;
      const { chatDraft, selectedSection, selectedErrorType } = state;
      const language = (get() as DashboardState).language;
      if (!chatDraft.trim()) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        text: chatDraft,
        ts: Date.now(),
      };
      const currentState = get() as DashboardState;
      set({ chatMessages: [...currentState.chatMessages, userMsg], chatDraft: "", isSending: true });
      try {
        const res = await api.sendChatMessage({
          section: selectedSection,
          errorType: selectedErrorType,
          message: chatDraft,
          language,
        });
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: res.reply,
          ts: Date.now(),
        };
        const latestState = get() as DashboardState;
        set({ chatMessages: [...latestState.chatMessages, assistantMsg] });
      } catch (error: any) {
        const latestState = get() as DashboardState;
        let text: string;

        if (error?.code === "ai_quota_exceeded") {
          const limit: number = error.limit ?? 3;
          const resetsAt: string | null = error.resets_at ?? null;
          let timeStr = "";
          if (resetsAt) {
            const d = new Date(resetsAt);
            timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
          const title = t("ai_quota_title");
          const body = t("ai_quota_body")
            .replace("{limit}", String(limit))
            .replace("{time}", timeStr || "—");
          text = `${title}\n\n${body}`;
        } else {
          text = t("ai_error");
        }

        const errorMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          text,
          ts: Date.now(),
        };
        set({ chatMessages: [...latestState.chatMessages, errorMsg] });
      } finally {
        set({ isSending: false });
      }
    },

    openRightPanelDrawer: () => set({ rightPanelOpen: true }),
    closeRightPanelDrawer: () => set({ rightPanelOpen: false }),
    setLanguage: (l: 'en' | 'ru' | 'uz') => {
      setLang(l);
      if (typeof window !== 'undefined') localStorage.setItem('trademind-lang', l);
      set({ language: l });
    },

    setTheme: (t: 'dark' | 'light') => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('trademind-theme', t);
        document.documentElement.classList.toggle('light', t === 'light');
      }
      set({ theme: t });
    },
  }))
);
