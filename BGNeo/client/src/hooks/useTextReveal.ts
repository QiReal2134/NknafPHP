import { useEffect, useRef, useState } from 'react';

interface TextRevealOptions {
  delay?: number;
  stagger?: number;
  mode?: 'chars' | 'words' | 'lines';
  className?: string;
}

const defaultTextOpts: Required<TextRevealOptions> = {
  delay: 0,
  stagger: 40,
  mode: 'chars',
  className: 'text-reveal-item',
};

export function useTextReveal(text: string, options: TextRevealOptions = {}) {
  const { delay, stagger, mode, className } = { ...defaultTextOpts, ...options };
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !text || animatedRef.current) return;

    let segments: string[];
    if (mode === 'chars') {
      segments = text.split('');
    } else if (mode === 'words') {
      segments = text.split(/\s+/).filter(Boolean);
    } else {
      segments = text.split('\n').filter(Boolean);
    }

    el.innerHTML = segments
      .map(
        (seg, i) =>
          `<span class="${className}" style="animation-delay:${delay + i * stagger}ms;will-change:transform,opacity">${seg}${mode === 'chars' ? '' : ' '}</span>`
      )
      .join('');

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          setVisible(true);
          observerRef.current?.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [text, delay, stagger, mode, className]);

  return { containerRef, visible };
}
