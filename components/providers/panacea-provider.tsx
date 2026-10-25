"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Badge,
  Category,
  Claim,
  FeedItem,
  ForumThread,
  GameSession,
  GameProgressSummary,
  Notification,
  Profile,
  Report,
  UserRole,
} from "@/lib/types";

type StoreState = {
  userId: string;
  role: UserRole;
  profile: Profile;
  claims: Claim[];
  reports: Report[];
  feed: FeedItem[];
  threads: ForumThread[];
  notifications: Notification[];
  badges: Badge[];
  gameSessions: GameSession[];
  categories: Category[];
  gameProgress: GameProgressSummary;
};

type PanaceaContextValue = StoreState & {
  hydrated: boolean;
  error: string;
  refresh: () => Promise<StoreState | null>;
  findClaim: (id: string) => Claim | undefined;
  findThread: (id: string) => ForumThread | undefined;
  findFeed: (slug: string) => FeedItem | undefined;
};

const emptyProfile: Profile = {
  fullName: "",
  alias: "",
  email: "",
  xp: 0,
  streak: 0,
  showOnLeaderboard: true,
  uiLanguage: "id",
};

const initialState: StoreState = {
  userId: "",
  role: "user",
  profile: emptyProfile,
  claims: [],
  reports: [],
  feed: [],
  threads: [],
  notifications: [],
  badges: [],
  gameSessions: [],
  categories: [],
  gameProgress: {
    sessionsToday: 0,
    sessionsPerDay: 2,
    questionsPerSession: 10,
    newAvailable: 0,
    dueReviews: 0,
    nextReviewAt: null,
  },
};

const PanaceaContext = createContext<PanaceaContextValue | null>(null);

export function PanaceaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!response.ok) throw new Error(`bootstrap ${response.status}`);
      const data = (await response.json()) as StoreState & { authenticated?: boolean };
      if (data.authenticated === false) {
        setState(initialState);
        setError("");
        return null;
      }
      setState(data);
      setError("");
      return data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "bootstrap_failed");
      return null;
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const value = useMemo<PanaceaContextValue>(
    () => ({
      ...state,
      hydrated,
      error,
      refresh,
      findClaim: (id) => state.claims.find((claim) => claim.id === id),
      findThread: (id) => state.threads.find((thread) => thread.id === id),
      findFeed: (slug) => state.feed.find((item) => item.slug === slug),
    }),
    [state, hydrated, error, refresh],
  );

  return <PanaceaContext.Provider value={value}>{children}</PanaceaContext.Provider>;
}

export function usePanacea() {
  const context = useContext(PanaceaContext);
  if (!context) throw new Error("usePanacea must be used within PanaceaProvider");
  return context;
}
