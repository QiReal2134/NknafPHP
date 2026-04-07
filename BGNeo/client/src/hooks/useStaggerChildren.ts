import { useEffect, useRef, useState } from 'react';

interface StaggerChildrenOptions {
  staggerDelay?: number;
  threshold?: number;
  animationClass?: string;
  rootMargin?: string;
}

const defaultStagger: Required<StaggerChildrenOptions> = {
  staggerDelay: 80,
  threshold: 0.1,
  animationClass: 'stagger-child',
  rootMargin: '0px 0px -40px 0px',
};

export function useStaggerChildren(options: StaggerChildrenOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { staggerDelay, threshold, animationClass, rootMargin } = {
    ...defaultStagger,
    ...options,
  };
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          children.forEach((child, i) => {
            child.style.animationDelay = `${i * staggerDelay}ms`;
            child.classList.add(animationClass);
          });
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [staggerDelay, threshold, animationClass, rootMargin]);

  return { ref, visible };
}
