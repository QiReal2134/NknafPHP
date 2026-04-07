import { type ReactNode } from 'react';
import { useMagnetic } from '../hooks/useMagnetic';

interface MagneticWrapProps {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
  as?: 'div' | 'span' | 'a' | 'button';
}

export default function MagneticWrap({
  children,
  strength = 0.35,
  radius = 120,
  className = '',
  as: Tag = 'div',
}: MagneticWrapProps) {
  const ref = useMagnetic({ strength, radius });

  return (
    <Tag ref={ref as any} className={`magnetic-wrap ${className}`}>
      {children}
    </Tag>
  );
}
