import { useCallback, useRef } from 'react';

interface RippleOptions {
  color?: string;
  duration?: number;
  maxSize?: number;
}

const defaultRipple: Required<RippleOptions> = {
  color: 'rgba(255,255,255,0.35)',
  duration: 600,
  maxSize: 0,
};

export function useRipple(options: RippleOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { color, duration, maxSize } = { ...defaultRipple, ...options };

  const createRipple = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const size = maxSize || Math.max(rect.width, rect.height) * 2.5;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${x}px;top:${y}px;border-radius:50%;
        background:radial-gradient(circle, ${color} 0%, transparent 70%);
        transform:scale(0);opacity:1;pointer-events:none;
        will-change:transform,opacity;
        animation:rippleExpand ${duration}ms cubic-bezier(.22,1,.36,1) forwards;
      `;

      if (el.style.position !== 'absolute' && el.style.position !== 'relative') {
        el.style.position = 'relative';
      }
      if (el.style.overflow !== 'hidden') {
        el.style.overflow = 'hidden';
      }

      el.appendChild(ripple);

      const handleEnd = () => {
        ripple.removeEventListener('animationend', handleEnd);
        ripple.remove();
      };
      ripple.addEventListener('animationend', handleEnd);
    },
    [color, duration, maxSize]
  );

  return { ref, createRipple };
}
