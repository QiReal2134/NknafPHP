export type ThemeId = string;
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textLink: string;
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  borderColor: string;
  statCategories?: string;
  statTags?: string;
  statViews?: string;
  statLikes?: string;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  nameZh: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

const T = (
  id: string, name: string, nameZh: string, mode: ThemeMode, c: ThemeColors
): ThemeDef => ({ id, name, nameZh, mode, colors: c });

export const THEMES: ThemeDef[] = [
  /* ====== DARK (8) ====== */
  T('midnight', 'Midnight', '暗夜', 'dark', {
    bgPrimary:'#1E1E2E',bgSecondary:'#252526',bgTertiary:'#2D2D30',bgHover:'#37373D',
    textPrimary:'#D4D4D4',textSecondary:'#9CDCFE',textMuted:'#858585',textLink:'#3794FF',
    accentPrimary:'#007ACC',accentSecondary:'#4EC9B0',accentSuccess:'#89D185',
    accentWarning:'#DCDCAA',accentDanger:'#F44747',borderColor:'#3C3C3C'
  }),
  T('one-dark', 'One Dark', '墨夜', 'dark', {
    bgPrimary:'#282c34',bgSecondary:'#21252b',bgTertiary:'#2c313a',bgHover:'#373b47',
    textPrimary:'#abb2bf',textSecondary:'#828997',textMuted:'#5c6370',textLink:'#61afef',
    accentPrimary:'#61afef',accentSecondary:'#98c379',accentSuccess:'#98c379',
    accentWarning:'#e5c07b',accentDanger:'#e06c75',borderColor:'#3e4451'
  }),
  T('tokyo-night', 'Tokyo Night', '东京夜', 'dark', {
    bgPrimary:'#1a1b26',bgSecondary:'#16161e',bgTertiary:'#292e42',bgHover:'#343b58',
    textPrimary:'#c0caf5',textSecondary:'#a9b1d6',textMuted:'#565f89',textLink:'#7aa2f7',
    accentPrimary:'#7aa2f7',accentSecondary:'#9ece6a',accentSuccess:'#9ece6a',
    accentWarning:'#e0af68',accentDanger:'#f7768e',borderColor:'#292e42'
  }),
  T('dracula', 'Dracula', '德古拉', 'dark', {
    bgPrimary:'#282a36',bgSecondary:'#21222c',bgTertiary:'#343746',bgHover:'#44475a',
    textPrimary:'#f8f8f2',textSecondary:'#bd93f9',textMuted:'#6272a4',textLink:'#50fa7b',
    accentPrimary:'#bd93f9',accentSecondary:'#50fa7b',accentSuccess:'#50fa7b',
    accentWarning:'#ffb86c',accentDanger:'#ff5555',borderColor:'#44475a'
  }),
  T('nord', 'Nord', '北极', 'dark', {
    bgPrimary:'#2e3440',bgSecondary:'#272c36',bgTertiary:'#3b4252',bgHover:'#434c5e',
    textPrimary:'#eceff4',textSecondary:'#d8dee9',textMuted:'#7b88a1',textLink:'#88c0d0',
    accentPrimary:'#88c0d0',accentSecondary:'#a3be8c',accentSuccess:'#a3be8c',
    accentWarning:'#ebcb8b',accentDanger:'#bf616a',borderColor:'#3b4252'
  }),
  T('mocha', 'Catppuccin Mocha', '玛奇朵', 'dark', {
    bgPrimary:'#1e1e2e',bgSecondary:'#181825',bgTertiary:'#313244',bgHover:'#45475A',
    textPrimary:'#cdd6f4',textSecondary:'#bac2de',textMuted:'#6c7086',textLink:'#89b4fa',
    accentPrimary:'#cba6f7',accentSecondary:'#94e2d5',accentSuccess:'#a6e3a1',
    accentWarning:'#f9e2af',accentDanger:'#f38ba8',borderColor:'#313244'
  }),
  T('gruvbox-dark', 'Gruvbox Dark', '复古暗', 'dark', {
    bgPrimary:'#282828',bgSecondary:'#1d2021',bgTertiary:'#3c3836',bgHover:'#504945',
    textPrimary:'#ebdbb2',textSecondary:'#d5c4a1',textMuted:'#928374',textLink:'#83a598',
    accentPrimary:'#fe8019',accentSecondary:'#689d6a',accentSuccess:'#689d6a',
    accentWarning:'#fabd2f',accentDanger:'#fb4934',borderColor:'#3c3836'
  }),
  T('solarized-dark', 'Solarized Dark', '日光暗', 'dark', {
    bgPrimary:'#002b36',bgSecondary:'#073642',bgTertiary:'#094854',bgHover:'#003847',
    textPrimary:'#839496',textSecondary:'#657b83',textMuted:'#586e75',textLink:'#268bd2',
    accentPrimary:'#268bd2',accentSecondary:'#2aa198',accentSuccess:'#2aa198',
    accentWarning:'#b58900',accentDanger:'#dc322f',borderColor:'#094854'
  }),

  /* ====== LIGHT (8) ====== */
  T('default-light', 'Default Light', '默认亮', 'light', {
    bgPrimary:'#EFF1F5',bgSecondary:'#CCD0DA',bgTertiary:'#BCC0CC',bgHover:'#ACB0BE',
    textPrimary:'#1E1E2E',textSecondary:'#4C4F69',textMuted:'#6C6F85',textLink:'#1E66F5',
    accentPrimary:'#1E66F5',accentSecondary:'#179299',accentSuccess:'#40A02B',
    accentWarning:'#DF8E1D',accentDanger:'#D20F39',borderColor:'#BCC0CC'
  }),
  T('one-light', 'One Light', '素白', 'light', {
    bgPrimary:'#fafafa',bgSecondary:'#efefef',bgTertiary:'#e5e5e5',bgHover:'#d8d8d8',
    textPrimary:'#202328',textSecondary:'#383a42',textMuted:'#5c6370',textLink:'#4078f2',
    accentPrimary:'#4078f2',accentSecondary:'#50a14f',accentSuccess:'#50a14f',
    accentWarning:'#c18401',accentDanger:'#e45649',borderColor:'#e5e5e5'
  }),
  T('solarized-light', 'Solarized Light', '日光亮', 'light', {
    bgPrimary:'#fdf6e3',bgSecondary:'#eee8d5',bgTertiary:'#ddd6c1',bgHover:'#d0cbb0',
    textPrimary:'#073642',textSecondary:'#586e75',textMuted:'#657b83',textLink:'#268bd2',
    accentPrimary:'#268bd2',accentSecondary:'#2aa198',accentSuccess:'#2aa198',
    accentWarning:'#b58900',accentDanger:'#dc322f',borderColor:'#ddd6c1'
  }),
  T('github-light', 'GitHub Light', 'GitHub白', 'light', {
    bgPrimary:'#ffffff',bgSecondary:'#f6f8fa',bgTertiary:'#eaeef2',bgHover:'#d1d5da',
    textPrimary:'#1f2328',textSecondary:'#24292f',textMuted:'#57606a',textLink:'#0969da',
    accentPrimary:'#0969da',accentSecondary:'#1a7f37',accentSuccess:'#1a7f37',
    accentWarning:'#9a6700',accentDanger:'#cf222e',borderColor:'#d0d7de'
  }),
  T('latte', 'Catppuccin Latte', '拿铁', 'light', {
    bgPrimary:'#eff1f5',bgSecondary:'#e6e9ef',bgTertiary:'#ccd0da',bgHover:'#bcc0cc',
    textPrimary:'#1e1e2e',textSecondary:'#4c4f69',textMuted:'#6c7086',textLink:'#1e66f5',
    accentPrimary:'#8839ef',accentSecondary:'#179299',accentSuccess:'#40a02b',
    accentWarning:'#df8e1d',accentDanger:'#d20f39',borderColor:'#ccd0da'
  }),
  T('nord-light', 'Nord Light', '北极光', 'light', {
    bgPrimary:'#eceff4',bgSecondary:'#e5e9f0',bgTertiary:'#d8dde9',bgHover:'#c8d0dd',
    textPrimary:'#2e3440',textSecondary:'#3b4252',textMuted:'#4c566a',textLink:'#5e81ac',
    accentPrimary:'#5e81ac',accentSecondary:'#8fbcbb',accentSuccess:'#a3be8c',
    accentWarning:'#ebcb8b',accentDanger:'#bf616a',borderColor:'#d8dde9'
  }),
  T('gruvbox-light', 'Gruvbox Light', '复古亮', 'light', {
    bgPrimary:'#fbf1c7',bgSecondary:'#f2e5bc',bgTertiary:'#ebdab2',bgHover:'#d5c6a1',
    textPrimary:'#282828',textSecondary:'#3c3836',textMuted:'#504945',textLink:'#076678',
    accentPrimary:'#af3a03',accentSecondary:'#427b58',accentSuccess:'#427b58',
    accentWarning:'#b57614',accentDanger:'#9d0006',borderColor:'#ebdab2'
  }),
  T('paper', 'Paper', '宣纸', 'light', {
    bgPrimary:'#fefefe',bgSecondary:'#f8f8f5',bgTertiary:'#ededea',bgHover:'#dedcd7',
    textPrimary:'#1a1a1a',textSecondary:'#2c2c2c',textMuted:'#5a5a5a',textLink:'#2563eb',
    accentPrimary:'#2563eb',accentSecondary:'#16a34a',accentSuccess:'#16a34a',
    accentWarning:'#ca8a04',accentDanger:'#dc2626',borderColor:'#ededea'
  }),
];

export const LIGHT_THEMES = THEMES.filter(t => t.mode === 'light');
export const DARK_THEMES = THEMES.filter(t => t.mode === 'dark');

export function getThemeById(id: ThemeId): ThemeDef | undefined {
  return THEMES.find(t => t.id === id);
}

export function applyTheme(theme: ThemeDef): void {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--bg-primary', c.bgPrimary);
  root.style.setProperty('--bg-secondary', c.bgSecondary);
  root.style.setProperty('--bg-tertiary', c.bgTertiary);
  root.style.setProperty('--bg-hover', c.bgHover);
  root.style.setProperty('--text-primary', c.textPrimary);
  root.style.setProperty('--text-secondary', c.textSecondary);
  root.style.setProperty('--text-muted', c.textMuted);
  root.style.setProperty('--text-link', c.textLink);
  root.style.setProperty('--accent-primary', c.accentPrimary);
  root.style.setProperty('--accent-secondary', c.accentSecondary);
  root.style.setProperty('--accent-success', c.accentSuccess);
  root.style.setProperty('--accent-warning', c.accentWarning);
  root.style.setProperty('--accent-danger', c.accentDanger);
  root.style.setProperty('--border-color', c.borderColor);
  root.style.setProperty('--stat-categories', c.statCategories || '#9b59b6');
  root.style.setProperty('--stat-tags', c.statTags || '#e67e22');
  root.style.setProperty('--stat-views', c.statViews || '#1abc9c');
  root.style.setProperty('--stat-likes', c.statLikes || '#e74c3c');
  root.style.setProperty('--text-on-accent', '#fff');
  root.style.setProperty('--text-on-warning', '#1a1a1a');
  const shadowOpacity = theme.mode === 'light' ? 0.08 : 0.25;
  root.style.setProperty('--shadow-sm', `0 2px 8px rgba(0,0,0,${shadowOpacity})`);
  root.style.setProperty('--shadow-md', `0 8px 24px rgba(0,0,0,${shadowOpacity * 1.5})`);
  root.style.setProperty('--shadow-lg', `0 12px 32px rgba(0,0,0,${shadowOpacity * 2})`);
  root.style.setProperty('--shadow-xl', `0 20px 60px rgba(0,0,0,${shadowOpacity * 2.5})`);
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-mode', theme.mode);
}
