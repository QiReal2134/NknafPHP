import { type ReactNode } from 'react';
import { useTilt3D } from '../hooks/useTilt3D';

interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  glare?: boolean;
  className?: string;
}

export default function TiltCard({
  children,
  maxTilt = 12,
  glare = true,
  className = '',
}: TiltCardProps) {
  const ref = useTilt3D({ maxTilt, glare });

  return (
    <div ref={ref} className={`tilt-card ${className}`}>
      {children}
    </div>
  );
}
