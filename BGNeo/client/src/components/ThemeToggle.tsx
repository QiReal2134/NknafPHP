import { memo, useState, useCallback } from 'react'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import Icon from './Icon'

const ThemeToggle = () => {
  const { mode, darkTheme, lightTheme, toggleMode, isTransitioning } = useTheme()
  const { t } = useTranslation()
  const [showHint, setShowHint] = useState(false)
  const isLight = mode === 'light'

  const handleClick = useCallback(() => {
    toggleMode()
    setShowHint(true)
    setTimeout(() => setShowHint(false), 1500)
  }, [toggleMode])

  const nextThemeName = isLight ? darkTheme.nameZh : lightTheme.nameZh

  return (
    <button
      onClick={handleClick}
      className={`theme-toggle ${isTransitioning ? 'transitioning' : ''}`}
      aria-label={isLight ? t('theme.dark') : t('theme.light')}
      title={`${isLight ? t('theme.dark') : t('theme.light')} (${nextThemeName}) (Ctrl+Shift+T)`}
      disabled={isTransitioning}
    >
      <div className={`theme-icon-wrapper ${isLight ? 'sun-icon' : 'moon-icon'}`}>
        <Icon
          name={isLight ? 'moon' : 'sun'}
          size={20}
          strokeWidth={2}
        />
      </div>
      {showHint && (
        <span className="theme-toggle-hint">
          {nextThemeName}
        </span>
      )}
    </button>
  )
}

export default memo(ThemeToggle)
