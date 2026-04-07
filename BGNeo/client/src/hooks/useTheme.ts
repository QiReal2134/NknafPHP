import { useState, useEffect, useCallback, useRef } from 'react';
import { THEMES, applyTheme, getThemeById, type ThemeDef } from '../themes';

type Lang = 'zh' | 'en';

const DARK_THEME_KEY = 'bgneo_theme_dark';
const LIGHT_THEME_KEY = 'bgneo_theme_light';
const MODE_KEY = 'bgneo_theme_mode';
const LANG_KEY = 'bgneo_lang';

const FALLBACK_DARK = 'midnight';
const FALLBACK_LIGHT = 'default-light';
const TRANSITION_DURATION = 500;

interface DualThemeState {
  dark: ThemeDef;
  light: ThemeDef;
  active: ThemeDef;
  mode: 'dark' | 'light';
}

function resolveInitialTheme(): DualThemeState {
  const savedDarkId = localStorage.getItem(DARK_THEME_KEY);
  const savedLightId = localStorage.getItem(LIGHT_THEME_KEY);
  const savedMode = localStorage.getItem(MODE_KEY) as 'dark' | 'light' | null;

  const darkTheme = savedDarkId
    ? getThemeById(savedDarkId)
    : getThemeById(FALLBACK_DARK) ?? THEMES.find(t => t.mode === 'dark')!;
  const lightTheme = savedLightId
    ? getThemeById(savedLightId)
    : getThemeById(FALLBACK_LIGHT) ?? THEMES.find(t => t.mode === 'light')!;

  let mode: 'dark' | 'light';
  if (savedMode) {
    mode = savedMode;
  } else {
    mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return {
    dark: darkTheme!,
    light: lightTheme!,
    active: mode === 'dark' ? darkTheme! : lightTheme!,
    mode,
  };
}

export function useTheme() {
  const [state, setState] = useState<DualThemeState>(resolveInitialTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef<number | null>(null);
  const transitioningRef = useRef<number | null>(null);

  useEffect(() => {
    applyTheme(state.active);
    localStorage.setItem(DARK_THEME_KEY, state.dark.id);
    localStorage.setItem(LIGHT_THEME_KEY, state.light.id);
    localStorage.setItem(MODE_KEY, state.mode);
    updateMetaThemeColor(state.active);

    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
    }

    document.documentElement.classList.add('theme-transitioning');
    transitionRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, TRANSITION_DURATION);
  }, [state.active]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem(MODE_KEY);
      if (!savedMode) {
        setState(prev => ({
          ...prev,
          mode: e.matches ? 'dark' : 'light',
          active: e.matches ? prev.dark : prev.light,
        }));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const applyWithTransition = useCallback((newStateOrFn: DualThemeState | ((prev: DualThemeState) => DualThemeState)) => {
    if (transitioningRef.current) {
      clearTimeout(transitioningRef.current);
    }
    setIsTransitioning(true);
    if (typeof newStateOrFn === 'function') {
      setState(newStateOrFn);
    } else {
      setState(newStateOrFn);
    }
    transitioningRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, TRANSITION_DURATION);
  }, []);

  const setTheme = useCallback((t: ThemeDef) => {
    applyWithTransition((prev: DualThemeState) => {
      if (t.mode === 'dark') {
        return { ...prev, dark: t, active: prev.mode === 'dark' ? t : prev.active };
      }
      return { ...prev, light: t, active: prev.mode === 'light' ? t : prev.active };
    });
  }, [applyWithTransition]);

  const setDualThemes = useCallback((dark: ThemeDef, light: ThemeDef) => {
    applyWithTransition((prev: DualThemeState) => ({
      ...prev,
      dark,
      light,
      active: prev.mode === 'dark' ? dark : light,
    }));
  }, [applyWithTransition]);

  const toggleMode = useCallback(() => {
    setState(prev => {
      const nextMode = prev.mode === 'dark' ? 'light' : 'dark';
      return {
        ...prev,
        mode: nextMode,
        active: nextMode === 'dark' ? prev.dark : prev.light,
      };
    });
  }, []);

  const setMode = useCallback((mode: 'dark' | 'light') => {
    setState(prev => ({
      ...prev,
      mode,
      active: mode === 'dark' ? prev.dark : prev.light,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
      if (transitioningRef.current) clearTimeout(transitioningRef.current);
    };
  }, []);

  return {
    theme: state.active,
    darkTheme: state.dark,
    lightTheme: state.light,
    mode: state.mode,
    setTheme,
    setDualThemes,
    toggleMode,
    setMode,
    isTransitioning,
  };
}

function updateMetaThemeColor(theme: ThemeDef) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme.colors.bgPrimary);
  }
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'zh') as Lang;
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const switchLang = useCallback((l: Lang) => { setLangState(l); }, []);
  return { lang, switchLang };
}

export { THEMES };
