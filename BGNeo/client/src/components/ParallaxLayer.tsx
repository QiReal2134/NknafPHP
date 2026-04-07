import { type ReactNode } from 'react';
import { useParallax } from '../hooks/useParallax';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
}

export default function ParallaxLayer({
  children,
  speed = 0.5,
  direction = 'up',
  className = '',
}: ParallaxLayerProps) {
  const ref = useParallax({ speed, direction });

  return (
    <div ref={ref} className={`parallax-layer ${className}`}>
      {children}
    </div>
  );
}
