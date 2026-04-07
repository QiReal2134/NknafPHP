import { useState, useCallback, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface ColorPickerProps {
  onSelect: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#FF0000','#FF6B6B','#FF8C00','#FFD93D',
  '#6BCB77','#4ECDC4','#45B7D1','#5DADE2',
  '#A569BD','#EBDEF0','#FDFEFE','#D5D8DC',
  '#1A1F35','#FFFFFF','#007ACC','#4EC9B0'
];

function getRecentColors(): string[] {
  try { return JSON.parse(localStorage.getItem('recentColors') || '[]'); }
  catch { return []; }
}
function saveRecentColor(color: string): void {
  const recent = [color, ...getRecentColors()].filter((c, i, arr) => arr.indexOf(c) === i).slice(0, 8);
  localStorage.setItem('recentColors', JSON.stringify(recent));
}

export function ColorPicker({ onSelect, onClose }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState('');
  const recent = getRecentColors();

  const handleSelect = useCallback((color: string) => {
    saveRecentColor(color);
    onSelect(color);
    onClose();
  }, [onSelect, onClose]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.color-picker-panel')) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="color-picker-panel" style={{
      position: 'absolute', zIndex: 1000, top: '100%', left: 0,
      background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)', padding: '12px', minWidth: '220px',
      marginTop: '4px'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: recent.length > 0 ? '10px' : 0 }}>
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => handleSelect(c)} title={c} style={({
            width: '36px', height: '36px', borderRadius: '6px',
            background: c, cursor: 'pointer', transition: 'transform 0.15s' as any,
            border: c === '#FFFFFF' || c === '#FDFEFE' ? '1px solid var(--border-color)' : 'none'
          })}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
      {recent.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>最近使用</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {recent.map((c) => (
              <button key={c} onClick={() => handleSelect(c)} style={{
                width: '24px', height: '24px', borderRadius: '4px', border: 'none',
                background: c, cursor: 'pointer'
              }} />
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input value={customHex} onChange={(e) => setCustomHex(e.target.value)}
          placeholder="#000000" maxLength={7} style={{
            flex: 1, padding: '4px 8px', border: 'none', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '13px',
            outline: 'none', fontFamily: 'monospace'
          }} />
        <button onClick={() => {
          if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) handleSelect(customHex);
        }} style={{
          padding: '4px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-primary)', color: 'var(--text-on-accent)', cursor: 'pointer', fontSize: '12px'
        }}>OK</button>
      </div>
    </div>
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoSave?: boolean;
  articleId?: number;
}

export default function MarkdownEditor({ value, onChange, height = '500px', readOnly = false, autoSave = true, articleId }: MarkdownEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!autoSave || !articleId) return;
    const timer = setTimeout(() => {
      const key = `draft-article-${articleId}`;
      localStorage.setItem(key, value);
      setSaveStatus(`已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    }, 30000);
    return () => clearTimeout(timer);
  }, [value, autoSave, articleId]);

  useEffect(() => {
    if (!articleId || value) return;
    const saved = localStorage.getItem(`draft-article-${articleId}`);
    if (saved) onChange(saved);
  }, [articleId]);

  useEffect(() => {
    if (!isFullscreen) return;
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') setIsFullscreen(false); }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  function insertColor(color: string) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString() || '彩色文字';
    const spanText = `<span style="color: ${color}">${selectedText}</span>`;
    onChange(value + spanText);
  }

  return (
    <div style={{
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto', left: isFullscreen ? 0 : 'auto',
      right: isFullscreen ? 0 : 'auto', bottom: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 1000 : 'auto', background: 'var(--bg-primary)',
      borderRadius: isFullscreen ? 0 : 'var(--radius-lg)'
    }}>
      <div data-color-mode="light" style={{ height }}>
        <MDEditor
          value={value}
          onChange={(v = '') => onChange(v)}
          height={height}
          preview={readOnly ? 'preview' : 'live'}
          visibleDragbar={false}
          extraCommands={[
            {
              name: 'color',
              keyCommand: 'color',
              buttonProps: { 'aria-label': '文字颜色', title: '颜色选择器' },
              icon: (
                <div style={{ position: 'relative' }}>
                  <span style={{
                    display: 'inline-block', width: '16px', height: '16px',
                    background: 'linear-gradient(135deg, #f00,#ff0,#0f0,#00f,#f0f)',
                    borderRadius: '3px', verticalAlign: 'middle'
                  }} />
                  {showColorPicker && <ColorPicker onSelect={insertColor} onClose={() => setShowColorPicker(false)} />}
                </div>
              ),
              execute: () => setShowColorPicker((prev) => !prev)
            },
            {
              name: 'fullscreen',
              keyCommand: 'fullscreen',
              buttonProps: { 'aria-label': '全屏', title: isFullscreen ? '退出全屏' : '全屏' },
              icon: (
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  {isFullscreen
                    ? <path d="M2.5 3.5L6 7H3v2h5V4H6v3L2.5 3.5zm11 9L10 9h3V7H8v5h2v-3l3.5 3.5z"/>
                    : <path d="M1.5 1.5L5 5H2v2h5V2H5v3L1.5 1.5zm13 13L11 11h3V9H9v5h2v-3l3.5 3.5z"/>
                  }
                </svg>
              ),
              execute: () => setIsFullscreen((f) => !f)
            }
          ]}
        />
      </div>
      {saveStatus && (
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right',
          padding: '4px 8px', transition: 'opacity 0.3s'
        }}>{saveStatus}</div>
      )}
    </div>
  );
}
