import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ReadingToolbarProps {
  onFontSizeChange: (size: number) => void;
  onImmersiveToggle: () => void;
  isImmersive: boolean;
}

const MIN_SIZE = 14;
const MAX_SIZE = 20;

export default function ReadingToolbar({ onFontSizeChange, onImmersiveToggle, isImmersive }: ReadingToolbarProps) {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('reading_font_size');
    return saved ? Number(saved) : 16;
  });
  const [showToolbar, setShowToolbar] = useState(false);
  const [showShortcutHint, setShowShortcutHint] = useState(false);

  useEffect(() => {
    localStorage.setItem('reading_font_size', String(fontSize));
    onFontSizeChange(fontSize);
  }, [fontSize, onFontSizeChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFontSize(prev => Math.min(prev + 1, MAX_SIZE));
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFontSize(prev => Math.max(prev - 1, MIN_SIZE));
          }
          break;
        case 'i':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onImmersiveToggle();
          }
          break;
        case '?':
          if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            setShowShortcutHint(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onImmersiveToggle]);

  const handleSizeChange = useCallback((delta: number) => {
    setFontSize(prev => {
      const next = prev + delta;
      return next < MIN_SIZE ? MIN_SIZE : next > MAX_SIZE ? MAX_SIZE : next;
    });
  }, []);

  return (
    <>
      <div className="reading-toolbar">
        <button
          className="toolbar-toggle"
          onClick={() => setShowToolbar(!showToolbar)}
          title={t('article.readingSettings') || '阅读设置'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>

        {showToolbar && (
          <div className="toolbar-panel">
            <div className="toolbar-section">
              <span className="toolbar-label">{t('article.fontSize') || '字号'}</span>
              <div className="font-size-controls">
                <button onClick={() => handleSizeChange(-1)} disabled={fontSize <= MIN_SIZE} title="缩小 (Ctrl+-)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span className="font-size-value">{fontSize}px</span>
                <button onClick={() => handleSizeChange(1)} disabled={fontSize >= MAX_SIZE} title="放大 (Ctrl++)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
              <input
                type="range"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="font-size-slider"
              />
            </div>

            <div className="toolbar-divider" />

            <button
              className={`immersive-btn ${isImmersive ? 'active' : ''}`}
              onClick={onImmersiveToggle}
              title={`${t('article.immersiveMode') || '沉浸模式'} (Ctrl+I)`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isImmersive ? (
                  <><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></>
                ) : (
                  <><path d="M4 14.5A2.5 2.5 0 016.5 12H20"/><path d="M4 5.5A2.5 2.5 0 016.5 3H20v18H6.5A2.5 2.5 0 014 18.5v-13z"/></>
                )}
              </svg>
              <span>{isImmersive ? (t('article.exitImmersive') || '退出沉浸') : (t('article.immersiveMode') || '沉浸模式')}</span>
            </button>

            <button
              className="shortcut-hint-btn"
              onClick={() => setShowShortcutHint(true)}
              title={t('article.shortcuts') || '快捷键'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {showShortcutHint && (
        <div className="shortcut-overlay" onClick={() => setShowShortcutHint(false)}>
          <div className="shortcut-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{t('article.shortcuts') || '键盘快捷键'}</h3>
            <dl className="shortcut-list">
              <dt><kbd>Ctrl</kbd> + <kbd>+</kbd></dt><dd>{t('article.fontSizeUp') || '增大字号'}</dd>
              <dt><kbd>Ctrl</kbd> + <kbd>-</kbd></dt><dd>{t('article.fontSizeDown') || '减小字号'}</dd>
              <dt><kbd>Ctrl</kbd> + <kbd>I</kbd></dt><dd>{t('article.toggleImmersive') || '切换沉浸模式'}</dd>
              <dt><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>?</kbd></dt><dd>{t('article.showShortcuts') || '显示快捷键帮助'}</dd>
            </dl>
            <button onClick={() => setShowShortcutHint(false)}>关闭</button>
          </div>
        </div>
      )}
    </>
  );
}
