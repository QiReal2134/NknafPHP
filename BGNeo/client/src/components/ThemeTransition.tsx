import { memo, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeTransition = memo(() => {
  const { isTransitioning } = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTransitioning && overlayRef.current) {
      overlayRef.current.classList.remove('theme-exiting');
      void overlayRef.current.offsetWidth;
      overlayRef.current.classList.add('theme-entering');
    } else if (overlayRef.current) {
      overlayRef.current.classList.remove('theme-entering');
      overlayRef.current.classList.add('theme-exiting');
    }
  }, [isTransitioning]);

  return (
    <div
      ref={overlayRef}
      className="theme-transition-overlay"
      aria-hidden="true"
    />
  );
});

ThemeTransition.displayName = 'ThemeTransition';

export default ThemeTransition;
