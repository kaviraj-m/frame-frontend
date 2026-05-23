import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyThemeToDocument, getStoredTheme, setStoredTheme } from "@/lib/themeStorage";
import { DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemeId {
  const userId =
    typeof localStorage !== "undefined" ? localStorage.getItem("userId") : null;
  const theme = getStoredTheme(userId);
  applyThemeToDocument(theme);
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem("userId") : null,
  );
  const [themeId, setThemeIdState] = useState<ThemeId>(readInitialTheme);

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id);
    const next = getStoredTheme(id);
    setThemeIdState(next);
    applyThemeToDocument(next);
  }, []);

  const setThemeId = useCallback(
    (id: ThemeId) => {
      setThemeIdState(id);
      setStoredTheme(id, userId);
      applyThemeToDocument(id);
    },
    [userId],
  );

  const value = useMemo(
    () => ({ themeId, setThemeId, userId, setUserId }),
    [themeId, setThemeId, userId, setUserId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      themeId: DEFAULT_THEME_ID,
      setThemeId: () => {},
      userId: null,
      setUserId: () => {},
    };
  }
  return ctx;
}
