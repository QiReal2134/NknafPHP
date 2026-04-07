import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANG_OPTIONS = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
]

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = LANG_OPTIONS.find(o => o.value === i18n.language) ?? LANG_OPTIONS[0]

  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-trigger" onClick={() => setOpen(!open)} title={t('lang.switchLang')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
        </svg>
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {LANG_OPTIONS.map(opt => (
            <button key={opt.value} className={`lang-option ${opt.value === i18n.language ? 'active' : ''}`}
              onClick={() => { i18n.changeLanguage(opt.value); setOpen(false) }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        .lang-switcher{position:relative;display:inline-block}
        .lang-trigger{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;font-size:.85rem;transition:background .2s}
        .lang-trigger:hover{background:var(--bg-hover)}
        .lang-dropdown{position:absolute;top:calc(100% + 4px);right:0;min-width:110px;background:var(--bg-primary);border-radius:var(--radius-md);border:1px solid var(--border-color);overflow:hidden;z-index:100}
        .lang-option{display:block;width:100%;padding:7px 14px;background:none;border:none;color:var(--text-secondary);text-align:left;font-size:.85rem;cursor:pointer;transition:background .2s}
        .lang-option:hover{background:var(--bg-hover);color:var(--text-primary)}
        .lang-option.active{color:var(--accent-primary);font-weight:600}
      `}</style>
    </div>
  )
}
